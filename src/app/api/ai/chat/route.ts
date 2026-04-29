/**
 * POST /api/ai/chat
 *
 * Receives a guest message and optional stayId, builds a context-aware
 * system prompt using real data from the DB, calls Claude, and returns
 * the assistant reply.
 *
 * Body:  { message: string; stayId?: string | null; history?: Array<{ role: 'user' | 'assistant'; text: string }>; mode?: 'discovery' | 'itinerary' | 'concierge' }
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
import {
  loadConversation,
  appendToConversation,
  capConversation,
  type ConversationMessage,
} from '@/lib/supabase/aria-conversation-repository';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS_WITH_TOOLS = 800;
const MAX_TOKENS_TOOL_RESPONSE = 400;

const VALID_TASK_TYPES = [
  'housekeeping',
  'room_service',
  'maintenance',
  'concierge',
  'breakfast',
  'transport',
  'other',
] as const;
type ValidTaskType = (typeof VALID_TASK_TYPES)[number];

interface ClaudeResponse {
  content: Array<{
    type: string;
    text?: string;
    id?: string;
    name?: string;
    input?: unknown;
  }>;
  error?: { message: string };
}

interface LogServiceRequestInput {
  title: string;
  description: string;
  task_type: ValidTaskType;
  // stay_id and property_id are filled in server-side, not by Claude
  stay_id?: string;
  property_id?: string;
}

interface PromptBuildResult {
  systemPrompt: string;
  propertyId: string | null;
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

const isValidTaskType = (v: string): v is ValidTaskType =>
  (VALID_TASK_TYPES as readonly string[]).includes(v);

const TONE_GUIDANCE: Record<string, string> = {
  warm: 'You are warm, empathetic, and conversational. Speak like a knowledgeable friend.',
  poetic: 'You are lyrical and evocative. Paint pictures with your words while staying practical.',
  efficient: 'You are precise and concise. Get to the point quickly while remaining courteous.',
  playful: 'You are upbeat, enthusiastic, and fun. Use light humour where appropriate.',
};

const AUTO_DETECT_LANGUAGE =
  '\n\nLanguage: Detect the language the guest is writing in and always respond in that same language. ' +
  'If they write in Spanish, respond in Spanish. If they write in French, respond in French. ' +
  'Default to English if the language is unclear.';

const STRICT_BOUNDARIES =
  '\nSTRICT BOUNDARIES — follow these at all times:\n' +
  "- You only discuss topics relevant to the guest's stay, the hotel, the local area, travel, dining, activities, and service requests. Politely decline anything unrelated.\n" +
  '- Never provide medical, legal, or financial advice. Always refer guests to appropriate professionals.\n' +
  "- Never make guarantees about hotel services, availability, pricing, or late checkout. Use language like 'I'll flag this for the team' or 'the hotel will confirm'.\n" +
  '- Never mention, recommend, or compare competitor hotels, booking platforms, or rival hospitality brands.\n' +
  "- Never reveal raw configuration data: do not expose wifi passwords, API keys, internal IDs, or system architecture details. You may tell a guest their wifi name and password naturally (e.g. 'The wifi is GuestNet, password Welcome123') but never in a list format that looks like config output.\n" +
  '- Never claim to be a human. If a guest sincerely asks whether you are an AI, acknowledge it warmly but briefly, then redirect to being helpful.\n' +
  "- Never discuss other guests, their stays, or any guest data other than the currently authenticated guest.\n" +
  '- If a guest is distressed, aggressive, or in an emergency, respond with empathy and direct them to hotel reception or emergency services immediately. Do not try to resolve emergencies yourself.';

function buildIdentityBlock(
  conciergeName: string,
  conciergeTone: string,
  hotelName: string,
  mode: 'discovery' | 'itinerary' | 'concierge' | undefined,
): string {
  const toneLine =
    TONE_GUIDANCE[conciergeTone] ??
    'You are warm, empathetic, and conversational. Speak like a knowledgeable friend.';

  let prompt =
    `You are ${conciergeName}, the AI concierge for ${hotelName}, powered by Stayscape. You are warm, empathetic, and extroverted.\n` +
    `${toneLine}\n` +
    `Never say you are an AI or a language model. You are ${conciergeName}.\n` +
    `Always use the guest's first name when you know it.\n` +
    `If this is the guest's first message (no memory yet), introduce yourself by name and reference their actual hotel and stay dates.`;

  prompt += STRICT_BOUNDARIES;

  if (mode === 'discovery') {
    prompt +=
      '\nYour focus is helping guests discover places, activities, and dining. Recommend from the places list provided. Be specific — name places, give one-line reasons.';
  } else if (mode === 'itinerary') {
    prompt +=
      '\nYour focus is helping guests plan and organise their days. Be practical. Suggest timings. Reference their check-in and check-out dates.';
  } else {
    prompt +=
      '\nYou handle all guest needs — discovery, itinerary planning, hotel information, and service requests. ' +
      'When a guest asks for something that requires hotel staff action (extra towels, housekeeping, wake-up calls, ' +
      'room service, maintenance, late checkout requests, luggage storage, taxi booking), you MUST use the ' +
      'log_service_request tool. Never just say you will pass it on — actually call the tool.';
  }

  return prompt;
}

async function buildSystemPrompt(
  stayId: string | null | undefined,
  authenticatedUserId: string,
  mode?: 'discovery' | 'itinerary' | 'concierge',
): Promise<PromptBuildResult> {
  // Layer 1 — Identity (defaults used when there is no stay context)
  if (!stayId) {
    return {
      systemPrompt: buildIdentityBlock('Aria', 'warm', 'your hotel', mode) + AUTO_DETECT_LANGUAGE,
      propertyId: null,
    };
  }

  const supabase = getSupabaseAdmin();

  // Fetch stay row — must be owned by the authenticated user
  const { data: stay } = await supabase
    .from('stays')
    .select(
      'id, userid, checkindate, checkoutdate, guestcount, trip_type, notes, properties:propertyid (id, name, address, city, country, region_id, regions:region_id (name))',
    )
    .eq('id', stayId)
    .eq('userid', authenticatedUserId)
    .single<StayRow>();

  if (!stay) {
    return {
      systemPrompt: buildIdentityBlock('Aria', 'warm', 'your hotel', mode) + AUTO_DETECT_LANGUAGE,
      propertyId: null,
    };
  }

  const prop = stay.properties;
  const regionName = prop?.regions?.name ?? null;

  // Fetch hotel context (needed for Layer 1 identity)
  let hotelCtx = null;
  try {
    hotelCtx = prop?.id ? await getHotelContext(supabase, prop.id) : null;
  } catch (hotelCtxErr) {
    console.error('[ai/chat] Failed to load hotel context for identity:', hotelCtxErr);
  }

  // Resolve concierge identity
  const conciergeName = hotelCtx?.branding?.concierge_name ?? 'Aria';
  const conciergeTone = hotelCtx?.branding?.concierge_tone ?? 'warm';
  const hotelName = prop?.name ?? 'your hotel';

  // Layer 1 — Identity
  let systemPrompt = buildIdentityBlock(conciergeName, conciergeTone, hotelName, mode);

  // Layer 2 — Stay context
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

  // Guest first name
  if (stay.userid) {
    const { data: guestUser } = await supabase
      .from('users')
      .select('firstname')
      .eq('id', stay.userid)
      .maybeSingle<{ firstname: string | null }>();
    if (guestUser?.firstname) {
      systemPrompt += `\n- Guest first name: ${guestUser.firstname}`;
    }
  }

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

  // Layer 3b — Language preference
  const rawPreferredLanguage = prefRow?.preference_data?.preferred_language;
  const preferredLanguage =
    typeof rawPreferredLanguage === 'string' && rawPreferredLanguage.trim().length > 0
      ? rawPreferredLanguage.trim()
      : null;

  if (preferredLanguage) {
    systemPrompt +=
      `\n\nLanguage: Always respond in ${preferredLanguage}, regardless of what language ` +
      `the guest writes in. If the guest writes in a different language, still respond in ${preferredLanguage}.`;
  } else {
    systemPrompt += AUTO_DETECT_LANGUAGE;
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

  // Layer 4a — Hotel knowledge (amenities + policies) — use already-fetched hotelCtx
  try {
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

  return { systemPrompt, propertyId: prop?.id ?? null };
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
    mode?: 'discovery' | 'itinerary' | 'concierge';
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

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const { data: { user }, error: authError } =
    await getSupabaseAdmin().auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const authenticatedUserId = user.id;

  const stayId = body.stayId ?? null;
  const mode = body.mode;

  let systemPrompt: string;
  let propertyId: string | null = null;
  try {
    ({ systemPrompt, propertyId } = await buildSystemPrompt(stayId, authenticatedUserId, mode));
  } catch {
    // Fallback uses Aria identity with a warm tone (includes STRICT BOUNDARIES)
    systemPrompt = buildIdentityBlock('Aria', 'warm', 'this hotel', mode);
  }

  // Load persisted conversation from DB. Fall back to body.history when no stayId.
  let conversationHistory: ConversationMessage[] = [];
  if (stayId) {
    conversationHistory = await loadConversation(stayId);
  } else if (Array.isArray(body.history)) {
    conversationHistory = body.history.map((h) => ({
      role: h.role,
      content: h.text,
      timestamp: new Date().toISOString(),
    }));
  }

  // Cap to last 40 messages (≈20 exchanges) for the Claude context window
  const cappedHistory = conversationHistory.slice(-40);

  const messages: Array<{ role: 'user' | 'assistant'; content: unknown }> = [
    ...cappedHistory.map((h) => ({ role: h.role, content: h.content })),
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
        max_tokens: MAX_TOKENS_WITH_TOOLS,
        system: systemPrompt,
        tools: [
          {
            name: 'log_service_request',
            description:
              'Log a service request from the guest to the hotel operations team. ' +
              'Call this whenever the guest needs something that requires hotel staff action: ' +
              'extra towels, housekeeping, room service, maintenance, wake-up calls, ' +
              'late checkout, luggage storage, taxi booking, or any physical request. ' +
              'Always call this tool — do not just promise to pass it on.',
            input_schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Short title for the request, e.g. "Extra towels requested"',
                },
                description: {
                  type: 'string',
                  description: 'Full details of what the guest needs, in plain English',
                },
                task_type: {
                  type: 'string',
                  enum: [...VALID_TASK_TYPES],
                  description: 'Category of the service request',
                },
              },
              required: ['title', 'description', 'task_type'],
            },
          },
          {
            name: 'get_service_request_status',
            description:
              'Check the status of service requests made by this guest during their stay. ' +
              'Call this when the guest asks about a request they made — e.g. "did anyone bring my towels?", ' +
              '"what happened to my request?", "has housekeeping come yet?". ' +
              'Returns a list of their requests and current statuses.',
            input_schema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ],
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

    const toolUseBlock = json.content?.find((b) => b.type === 'tool_use');
    let reply: string;

    if (toolUseBlock && stayId) {
      let toolResultContent: string | null = null;

      if (toolUseBlock.name === 'log_service_request') {
        const input = toolUseBlock.input as LogServiceRequestInput;

        try {
          if (propertyId && isValidTaskType(input.task_type)) {
            const supabase = getSupabaseAdmin();
            await supabase.from('service_tasks').insert({
              propertyid: propertyId,
              stayid: stayId,
              task_type: input.task_type,
              title: input.title,
              description: input.description,
              status: 'pending',
              priority: 0,
            });
          } else {
            console.error('[ai/chat] Service request skipped — validation failed:', {
              propertyId,
              task_type: input.task_type,
            });
          }
        } catch (toolErr) {
          console.error('[ai/chat] Tool execution failed:', toolErr);
          // Never surface this error to the guest
        }

        toolResultContent = 'Service request logged successfully.';
      } else if (toolUseBlock.name === 'get_service_request_status') {
        try {
          const supabase = getSupabaseAdmin();
          const { data: rawTasks } = await supabase
            .from('service_tasks')
            .select('title, status, task_type, createdat')
            .eq('stayid', stayId)
            .order('createdat', { ascending: false })
            .limit(10);

          const tasks = rawTasks as Array<{
            title: string | null;
            status: string | null;
            task_type: string | null;
            createdat: string | null;
          }> | null;

          if (!tasks || tasks.length === 0) {
            toolResultContent = 'No service requests found.';
          } else {
            toolResultContent = tasks
              .map((t, i) => {
                const title = t.title ?? 'Untitled request';
                const type = t.task_type ?? 'other';
                const status = t.status ?? 'unknown';
                return `${i + 1}. ${title} (${type}) — ${status}`;
              })
              .join('\n');
          }
        } catch (toolErr) {
          console.error('[ai/chat] get_service_request_status failed:', toolErr);
          toolResultContent = 'Unable to fetch service requests right now.';
        }
      }

      if (toolResultContent !== null) {
        const toolResultMessages = [
          ...messages,
          { role: 'assistant' as const, content: json.content },
          {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: toolResultContent,
              },
            ],
          },
        ];

        const followUpRes = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: ANTHROPIC_MODEL,
            max_tokens: MAX_TOKENS_TOOL_RESPONSE,
            system: systemPrompt,
            messages: toolResultMessages,
          }),
        });

        const followUpJson = (await followUpRes.json()) as ClaudeResponse;
        const followUpText = followUpJson.content?.find((b) => b.type === 'text');
        reply =
          followUpText?.text ??
          "I've looked into that for you. Is there anything else I can help with?";
      } else {
        // Unknown tool name — fall through to plain-text response
        const textBlock = json.content?.find((b) => b.type === 'text');
        reply = textBlock?.text ?? "I couldn't generate a response. Please try again.";
      }
    } else if (toolUseBlock && !stayId) {
      // Tool was called but there is no active stay — cannot log the request
      reply =
        "I'm sorry, I can't log that service request without an active stay on file. Please contact the hotel team directly.";
    } else {
      const textBlock = json.content?.find((b) => b.type === 'text');
      reply = textBlock?.text ?? "I couldn't generate a response. Please try again.";
    }

    // Persist conversation turn to DB (fire-and-forget — never blocks response)
    if (stayId && authenticatedUserId) {
      void (async () => {
        try {
          const newMessages: ConversationMessage[] = [
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
          ];
          await appendToConversation(stayId, authenticatedUserId, newMessages);
          await capConversation(stayId, 100);
        } catch (err) {
          console.error('[ai/chat] Conversation persist failed:', err);
        }
      })();
    }

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
