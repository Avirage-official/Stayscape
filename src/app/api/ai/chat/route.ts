/**
 * POST /api/ai/chat
 *
 * Receives a guest message and optional stayId, builds a context-aware
 * system prompt using real data from the DB, calls Claude, and returns
 * the assistant reply.
 *
 * Body:  { message: string; stayId?: string | null; history?: Array<{ role: 'user' | 'assistant'; text: string }>; mode?: 'discovery' | 'itinerary' }
 * Reply: { reply: string } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getAnthropicApiKey } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  getOrCreateMemory,
  appendMemories,
  getPastStayMemories,
} from '@/lib/supabase/ai-memory-repository';
import type { MemoryItem } from '@/lib/supabase/ai-memory-repository';
import { getHotelContext } from '@/lib/supabase/hotel-repository';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
const ANTHROPIC_VERSION = '2023-06-01';

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  error?: { message: string };
}

interface StayRow {
  id: string;
  userid: string | null;
  checkindate: string | null;
  checkoutdate: string | null;
  guestcount: number | null;
  trip_type: string | null;
  notes: string | null;
  properties: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
    regions: { name: string } | null;
    region_id?: string | null;
  } | null;
}

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  editorial_summary: string | null;
  rating: number | null;
  address: string | null;
  booking_url: string | null;
}

interface OnboardingPreferences {
  interests?: unknown;
  pace?: unknown;
  food_preferences?: unknown;
  [key: string]: unknown;
}

async function buildSystemPrompt(
  stayId: string | null | undefined,
  mode?: 'discovery' | 'itinerary',
): Promise<string> {
  // Layer 1 — Base persona
  let systemPrompt: string;
  if (mode === 'discovery') {
    systemPrompt =
      'You are a warm, knowledgeable luxury travel concierge for Stayscape. ' +
      'You help guests discover places, plan activities, and make the most ' +
      'of their stay. Be concise, specific, and helpful. You have memory of ' +
      "this guest's stay and preferences — use them naturally.";
  } else {
    systemPrompt =
      'You are a personal trip planning assistant for Stayscape. You help ' +
      'guests organise their days, suggest what to do and when, and refine ' +
      'their itinerary. Be practical and warm.';
  }

  if (!stayId) return systemPrompt;

  const supabase = getSupabaseAdmin();

  // Layer 2 — Stay context
  const { data: stay } = await supabase
    .from('stays')
    .select(
      'id, userid, checkindate, checkoutdate, guestcount, trip_type, notes, properties:propertyid (id, name, address, city, country, region_id, regions:region_id (name))',
    )
    .eq('id', stayId)
    .single<StayRow>();

  if (!stay) return systemPrompt;

  const prop = stay.properties;
  const regionName = prop?.regions?.name ?? null;

  const contextLines: string[] = [
    '\n\nCurrent stay context:',
    `- Hotel: ${prop?.name ?? 'Unknown'}`,
    `- Location: ${prop?.city ?? ''}, ${prop?.country ?? ''}`,
  ];
  if (regionName) contextLines.push(`- Region: ${regionName}`);
  if (stay.checkindate) contextLines.push(`- Check-in: ${stay.checkindate}`);
  if (stay.checkoutdate) contextLines.push(`- Check-out: ${stay.checkoutdate}`);
  if (stay.guestcount != null) contextLines.push(`- Guests: ${stay.guestcount}`);
  if (stay.trip_type) contextLines.push(`- Trip type: ${stay.trip_type}`);

  systemPrompt += contextLines.join('\n');

  // Layer 3 — Onboarding preferences
  const { data: prefRow } = await supabase
    .from('guest_preferences')
    .select('preference_data')
    .eq('stay_id', stayId)
    .eq('preference_type', 'stay_onboarding')
    .limit(1)
    .maybeSingle<{ preference_data: OnboardingPreferences }>();

  if (prefRow?.preference_data) {
    const pd = prefRow.preference_data;
    const prefLines: string[] = ['\n\nGuest onboarding preferences:'];
    if (pd.interests != null) prefLines.push(`- Interests: ${JSON.stringify(pd.interests)}`);
    if (pd.pace != null) prefLines.push(`- Pace: ${JSON.stringify(pd.pace)}`);
    if (pd.food_preferences != null) prefLines.push(`- Food preferences: ${JSON.stringify(pd.food_preferences)}`);
    if (prefLines.length > 1) systemPrompt += prefLines.join('\n');
  }

  // Layer 4 — Region places
  const regionId = prop?.region_id ?? null;
  if (regionId) {
    const { data: places } = await supabase
      .from('places')
      .select('id, name, category, description, editorial_summary, rating, address, booking_url')
      .eq('region_id', regionId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })
      .limit(30)
      .returns<PlaceRow[]>();

    if (places && places.length > 0) {
      systemPrompt +=
        '\n\nPlaces available in this region that you can recommend' +
        ' (use these when relevant, reference them by name):\n' +
        JSON.stringify(places, null, 2);
    }
  }

  // Layer 4a — Hotel knowledge (amenities + policies)
  try {
    const propertyId = stay.properties?.id ?? null;
    if (propertyId) {
      const hotelCtx = await getHotelContext(supabase, propertyId);

      if (hotelCtx?.policies) {
        const p = hotelCtx.policies;
        const policyLines: string[] = ['\n\nHotel Policies:'];
        if (p.checkin_time) policyLines.push(`- Check-in time: ${p.checkin_time}`);
        if (p.checkout_time) policyLines.push(`- Check-out time: ${p.checkout_time}`);
        if (p.wifi_name) {
          policyLines.push(
            `- WiFi: ${p.wifi_name}${p.wifi_password ? ` / Password: ${p.wifi_password}` : ''}`,
          );
        }
        if (p.cancellation_policy) policyLines.push(`- Cancellation: ${p.cancellation_policy}`);
        if (p.pet_policy) policyLines.push(`- Pets: ${p.pet_policy}`);
        if (p.smoking_policy) policyLines.push(`- Smoking: ${p.smoking_policy}`);
        if (policyLines.length > 1) systemPrompt += policyLines.join('\n');
      }

      if (hotelCtx?.amenities && hotelCtx.amenities.length > 0) {
        const amenityLines = hotelCtx.amenities.map((a) => {
          let line = `- ${a.name} (${a.category})`;
          if (a.availability_hours) line += `: ${a.availability_hours}`;
          if (a.location_hint) line += ` — ${a.location_hint}`;
          if (a.description) line += `. ${a.description}`;
          return line;
        });
        systemPrompt += '\n\nHotel Amenities:\n' + amenityLines.join('\n');
      }
    }
  } catch (hotelErr) {
    console.error('[ai/chat] Failed to load hotel context:', hotelErr);
    // Never fail — continue without hotel context
  }

  // Layer 5 — Memory context
  const userId = stay.userid ?? null;
  if (userId) {
    try {
      const memory = await getOrCreateMemory(stayId, userId);

      if (memory.memories.length > 0) {
        const memoryLines = memory.memories
          .map((m) => `- ${m.content}`)
          .join('\n');
        systemPrompt += `\n\nWhat I know about this guest from our conversations:\n${memoryLines}`;
      }

      if (memory.conversation_summary) {
        systemPrompt += `\n\nSummary of previous conversations: ${memory.conversation_summary}`;
      }

      const pastStays = await getPastStayMemories(userId);
      if (pastStays.length > 0 && pastStays[0].conversation_summary) {
        systemPrompt += `\n\nThis guest has stayed before. Previous stay notes: ${pastStays[0].conversation_summary}`;
      }
    } catch (memErr) {
      console.error('[ai/chat] Failed to load memory context:', memErr);
    }
  }

  return systemPrompt;
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  let apiKey: string;
  try {
    apiKey = getAnthropicApiKey();
  } catch {
    return NextResponse.json(
      { reply: "I'm not available right now. Please ask hotel staff for assistance." },
      { headers: rateLimit.headers },
    );
  }

  let body: {
    message?: string;
    stayId?: string | null;
    history?: Array<{ role: 'user' | 'assistant'; text: string }>;
    mode?: 'discovery' | 'itinerary';
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json(
      { error: 'Missing required field: message' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const stayId = body.stayId ?? null;
  const mode = body.mode;
  const rawHistory = Array.isArray(body.history) ? body.history : [];

  let systemPrompt: string;
  try {
    systemPrompt = await buildSystemPrompt(stayId, mode);
  } catch {
    // Fallback respects the requested mode
    systemPrompt =
      mode === 'discovery'
        ? 'You are a warm, knowledgeable luxury travel concierge for Stayscape. ' +
          'You help guests discover places, plan activities, and make the most of their stay. ' +
          'Be concise, specific, and helpful.'
        : 'You are a personal trip planning assistant for Stayscape. You help ' +
          'guests organise their days, suggest what to do and when, and refine ' +
          'their itinerary. Be practical and warm.';
  }

  // Cap history at last 10 exchanges (20 messages)
  const cappedHistory = rawHistory.slice(-20);

  const messages = [
    ...cappedHistory.map((h) => ({ role: h.role, content: h.text })),
    { role: 'user' as const, content: message },
  ];

  try {
    const claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text().catch(() => claudeRes.statusText);
      return NextResponse.json(
        { error: `Upstream error: ${errText}` },
        { status: 502, headers: rateLimit.headers },
      );
    }

    const json = (await claudeRes.json()) as ClaudeResponse;
    const textBlock = json.content?.find((b) => b.type === 'text');
    const reply = textBlock?.text ?? "I couldn't generate a response. Please try again.";

    // Fire-and-forget memory extraction — never blocks the response
    if (stayId) {
      void (async () => {
        try {
          const extractionPrompt =
            `From this guest interaction, extract any memorable facts about ` +
            `the guest's preferences, interests, dislikes, or specific requests.\n` +
            `Return ONLY a JSON array, no markdown:\n` +
            `[{ "type": "interest|preference|dislike|request", "content": "one concise sentence", "weight": 1 }]\n` +
            `If nothing memorable was said, return an empty array [].\n\n` +
            `Guest said: ${message}\n` +
            `Assistant replied: ${reply}`;

          const extractRes = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': ANTHROPIC_VERSION,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: ANTHROPIC_MODEL,
              max_tokens: 300,
              messages: [{ role: 'user', content: extractionPrompt }],
            }),
          });

          if (!extractRes.ok) return;

          const extractJson = (await extractRes.json()) as ClaudeResponse;
          const extractText = extractJson.content?.find((b) => b.type === 'text')?.text ?? '[]';

          let items: MemoryItem[];
          try {
            const parsed = JSON.parse(extractText) as unknown;
            if (!Array.isArray(parsed)) return;
            // Validate each item conforms to MemoryItem schema
            items = parsed.filter(
              (item): item is MemoryItem =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as Record<string, unknown>).type === 'string' &&
                typeof (item as Record<string, unknown>).content === 'string',
            );
          } catch {
            return;
          }

          if (Array.isArray(items) && items.length > 0) {
            await appendMemories(stayId, items);
          }
        } catch (err) {
          console.error('[ai/chat] Memory extraction failed:', err);
        }
      })();
    }

    return NextResponse.json({ reply }, { headers: rateLimit.headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
