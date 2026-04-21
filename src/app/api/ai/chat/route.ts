/**
 * POST /api/ai/chat
 *
 * Receives a guest message and optional stayId, builds a context-aware
 * system prompt using real data from the DB, calls Claude, and returns
 * the assistant reply.
 *
 * Body:  { message: string; stayId?: string | null }
 * Reply: { reply: string } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getAnthropicApiKey } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/client';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';

const BASE_SYSTEM_PROMPT =
  'You are a luxury travel concierge assistant for Stayscape, a premium hospitality platform. ' +
  'You help guests discover places, plan activities, and make the most of their stay. ' +
  'Be concise, warm, and helpful. ' +
  'You do not have memory of previous messages in this conversation — if the guest references ' +
  'something said earlier, politely let them know and ask them to repeat the relevant detail.';

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  error?: { message: string };
}

interface StayRow {
  id: string;
  checkindate: string | null;
  checkoutdate: string | null;
  guestcount: number | null;
  trip_type: string | null;
  notes: string | null;
  properties: {
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

async function buildSystemPrompt(stayId: string | null | undefined): Promise<string> {
  let systemPrompt = BASE_SYSTEM_PROMPT;

  if (!stayId) return systemPrompt;

  const supabase = getSupabaseAdmin();

  // Fetch stay + property + region
  const { data: stay } = await supabase
    .from('stays')
    .select(
      'id, checkindate, checkoutdate, guestcount, trip_type, notes, properties:propertyid (name, address, city, country, region_id, regions:region_id (name))',
    )
    .eq('id', stayId)
    .single<StayRow>();

  if (stay) {
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

    // Fetch places for the region
    const regionId = (prop as (typeof prop & { region_id?: string | null }))?.region_id ?? null;
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

  let body: { message?: string; stayId?: string | null };
  try {
    body = (await request.json()) as { message?: string; stayId?: string | null };
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

  let systemPrompt: string;
  try {
    systemPrompt = await buildSystemPrompt(stayId);
  } catch {
    systemPrompt = BASE_SYSTEM_PROMPT;
  }

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
        messages: [{ role: 'user', content: message }],
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

    return NextResponse.json({ reply }, { headers: rateLimit.headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
