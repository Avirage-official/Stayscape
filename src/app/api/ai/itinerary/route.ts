/**
 * POST /api/ai/itinerary
 *
 * Agentic itinerary builder for the standalone Aria experience.
 * Takes a structured 4-question picker answer set (region, duration, vibe,
 * companions), asks Claude to build a day-by-day plan from real places in
 * the region, persists it via the itinerary repository, and returns a
 * structured payload ready for the Aria itinerary panel.
 *
 * Body:  { regionId: string; duration: '2-3' | '4-5' | '7' | '14'; vibe: 'relaxed' | 'adventure' | 'food_culture' | 'mixed'; companions: 'solo' | 'couple' | 'family' | 'friends' }
 * Reply: structured itinerary (see below) | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getAnthropicApiKey } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { createStandaloneItinerary, insertItineraryItem } from '@/lib/supabase/itinerary-repository';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';

type Duration = '2-3' | '4-5' | '7' | '14';
type Vibe = 'relaxed' | 'adventure' | 'food_culture' | 'mixed';
type Companions = 'solo' | 'couple' | 'family' | 'friends';

const DURATION_DAYS: Record<Duration, number> = {
  '2-3': 3,
  '4-5': 5,
  '7': 7,
  '14': 14,
};

const VALID_DURATIONS = Object.keys(DURATION_DAYS) as Duration[];
const VALID_VIBES: Vibe[] = ['relaxed', 'adventure', 'food_culture', 'mixed'];
const VALID_COMPANIONS: Companions[] = ['solo', 'couple', 'family', 'friends'];

interface PlaceRow {
  id: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  rating: number | null;
  address: string | null;
  image_url: string | null;
}

interface ClaudeResponse {
  content: Array<{ type: string; text?: string }>;
  error?: { message: string };
}

interface PlannedItem {
  place_id: string;
  start_time: string;
  duration_hours: number;
  notes: string;
}

interface PlannedDay {
  day: number;
  items: PlannedItem[];
}

interface PlannedItinerary {
  title: string;
  days: PlannedDay[];
}

function isPlannedItinerary(value: unknown): value is PlannedItinerary {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.title !== 'string' || !Array.isArray(v.days)) return false;
  return v.days.every((d) => {
    if (typeof d !== 'object' || d === null) return false;
    const dd = d as Record<string, unknown>;
    if (typeof dd.day !== 'number' || !Array.isArray(dd.items)) return false;
    return dd.items.every((it) => {
      if (typeof it !== 'object' || it === null) return false;
      const ii = it as Record<string, unknown>;
      return (
        typeof ii.place_id === 'string' &&
        typeof ii.start_time === 'string' &&
        typeof ii.duration_hours === 'number'
      );
    });
  });
}

function parseClaudeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown code fences if present
    const stripped = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '');
    return JSON.parse(stripped);
  }
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
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
      { error: "Aria isn't available right now. Please try again later." },
      { status: 503, headers: rateLimit.headers },
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

  const {
    data: { user },
    error: authError,
  } = await getSupabaseAdmin().auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const authenticatedUserId = user.id;

  let body: {
    regionId?: string;
    duration?: Duration;
    vibe?: Vibe;
    companions?: Companions;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const regionId = typeof body.regionId === 'string' ? body.regionId : '';
  const duration = body.duration;
  const vibe = body.vibe;
  const companions = body.companions;

  if (!regionId) {
    return NextResponse.json(
      { error: 'Missing required field: regionId' },
      { status: 400, headers: rateLimit.headers },
    );
  }
  if (!duration || !VALID_DURATIONS.includes(duration)) {
    return NextResponse.json(
      { error: 'Invalid or missing field: duration' },
      { status: 400, headers: rateLimit.headers },
    );
  }
  if (!vibe || !VALID_VIBES.includes(vibe)) {
    return NextResponse.json(
      { error: 'Invalid or missing field: vibe' },
      { status: 400, headers: rateLimit.headers },
    );
  }
  if (!companions || !VALID_COMPANIONS.includes(companions)) {
    return NextResponse.json(
      { error: 'Invalid or missing field: companions' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const supabase = getSupabaseAdmin();

  // Gate on aria_credits (standalone Aria usage)
  const { data: creditRow } = await supabase
    .from('users')
    .select('aria_credits')
    .eq('id', authenticatedUserId)
    .single<{ aria_credits: number }>();

  if (creditRow && creditRow.aria_credits === 0) {
    return NextResponse.json(
      { error: 'Aria is locked. Unlock Aria to continue.' },
      { status: 403, headers: rateLimit.headers },
    );
  }

  // Validate region
  const { data: region } = await supabase
    .from('regions')
    .select('id, name, is_active')
    .eq('id', regionId)
    .maybeSingle<{ id: string; name: string; is_active: boolean }>();

  if (!region || !region.is_active) {
    return NextResponse.json(
      { error: 'Region not found' },
      { status: 404, headers: rateLimit.headers },
    );
  }

  const days = DURATION_DAYS[duration];

  // Fetch places for the region
  const { data: placesData } = await supabase
    .from('places')
    .select('id, name, category, subcategory, description, rating, address, image_url')
    .eq('region_id', regionId)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(40)
    .returns<PlaceRow[]>();

  const places = placesData ?? [];

  if (places.length === 0) {
    return NextResponse.json(
      { error: 'No places found for this region yet. Please try another destination.' },
      { status: 404, headers: rateLimit.headers },
    );
  }

  const validPlaceIds = new Set(places.map((p) => p.id));
  const placesById = new Map<string, PlaceRow>(places.map((p) => [p.id, p]));

  const itemsPerDayGuidance =
    vibe === 'relaxed'
      ? '2-3 items per day'
      : vibe === 'adventure' || vibe === 'food_culture'
        ? '4-5 items per day'
        : '3-4 items per day';

  const systemPrompt =
    `You are an expert travel itinerary planner. Build a day-by-day itinerary for a trip to ${region.name}.\n` +
    `Trip length: ${days} days.\n` +
    `Travel vibe: ${vibe}.\n` +
    `Travelling as: ${companions}.\n\n` +
    `Here is the list of available places (JSON) you may use. ONLY use place_id values from this list — never invent IDs:\n` +
    JSON.stringify(places, null, 2) +
    `\n\nInstructions:\n` +
    `- Return ONLY valid JSON, no markdown, no prose, no code fences.\n` +
    `- Use this exact shape:\n` +
    `{\n` +
    `  "title": "string, e.g. '5 Days in Bali — Food & Culture'",\n` +
    `  "days": [\n` +
    `    {\n` +
    `      "day": 1,\n` +
    `      "items": [\n` +
    `        { "place_id": "uuid-from-the-provided-list", "start_time": "09:00", "duration_hours": 2, "notes": "one short sentence on why" }\n` +
    `      ]\n` +
    `    }\n` +
    `  ]\n` +
    `}\n` +
    `- Aim for ${itemsPerDayGuidance}.\n` +
    `- Use sensible time progression across the day (morning, afternoon, evening) and never overlap times within a day.\n` +
    `- Only reference place_id values that exist in the provided list.\n`;

  let claudeRes: Response;
  try {
    claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Generate the itinerary now.' }],
      }),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: rateLimit.headers },
    );
  }

  if (!claudeRes.ok) {
    const errText = await claudeRes.text().catch(() => claudeRes.statusText);
    return NextResponse.json(
      { error: `Upstream error: ${errText}` },
      { status: 502, headers: rateLimit.headers },
    );
  }

  const claudeJson = (await claudeRes.json()) as ClaudeResponse;
  const textBlock = claudeJson.content?.find((b) => b.type === 'text');
  const rawText = textBlock?.text ?? '';

  let parsed: unknown;
  try {
    parsed = parseClaudeJson(rawText);
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 502, headers: rateLimit.headers },
    );
  }

  if (!isPlannedItinerary(parsed)) {
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 502, headers: rateLimit.headers },
    );
  }

  // Filter out invalid place_ids; drop empty days
  const filteredDays: PlannedDay[] = parsed.days
    .map((d) => ({
      day: d.day,
      items: d.items.filter((it) => validPlaceIds.has(it.place_id)),
    }))
    .filter((d) => d.items.length > 0);

  if (filteredDays.length === 0) {
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 502, headers: rateLimit.headers },
    );
  }

  // Create the itinerary
  const itineraryId = await createStandaloneItinerary(authenticatedUserId, parsed.title);
  if (!itineraryId) {
    return NextResponse.json(
      { error: 'Failed to save itinerary. Please try again.' },
      { status: 502, headers: rateLimit.headers },
    );
  }

  const tomorrow = addDays(formatLocalDate(new Date()), 1);
  const startdate = tomorrow;
  const enddate = addDays(startdate, days - 1);

  await supabase
    .from('itineraries')
    .update({ startdate, enddate })
    .eq('id', itineraryId);

  const responseDays: Array<{
    day: number;
    date: string;
    items: Array<{
      place_id: string;
      name: string;
      category: string;
      image: string | null;
      start_time: string;
      duration_hours: number;
      notes: string;
    }>;
  }> = [];

  for (const d of filteredDays) {
    const scheduledDate = addDays(startdate, d.day - 1);
    const responseItems: Array<{
      place_id: string;
      name: string;
      category: string;
      image: string | null;
      start_time: string;
      duration_hours: number;
      notes: string;
    }> = [];

    for (const item of d.items) {
      const place = placesById.get(item.place_id);
      if (!place) continue;

      const savedId = await insertItineraryItem(itineraryId, {
        place_id: item.place_id,
        titleoverride: null,
        scheduleddate: scheduledDate,
        starttime: item.start_time,
        durationhours: item.duration_hours,
        name: place.name,
        category: place.category,
        image: place.image_url,
      });
      if (!savedId) continue; // skip items that failed to save

      responseItems.push({
        place_id: item.place_id,
        name: place.name,
        category: place.category ?? '',
        image: place.image_url,
        start_time: item.start_time,
        duration_hours: item.duration_hours,
        notes: item.notes ?? '',
      });
    }

    if (responseItems.length > 0) {
      responseDays.push({ day: d.day, date: scheduledDate, items: responseItems });
    }
  }

  if (responseDays.length === 0) {
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 502, headers: rateLimit.headers },
    );
  }

  // Decrement credits only after successful generation (skip if unlimited = -1)
  if (creditRow && creditRow.aria_credits > 0) {
    void supabase
      .from('users')
      .update({ aria_credits: creditRow.aria_credits - 1 })
      .eq('id', authenticatedUserId);
  }

  return NextResponse.json(
    {
      itineraryId,
      title: parsed.title,
      startdate,
      enddate,
      days: responseDays,
    },
    { status: 201, headers: rateLimit.headers },
  );
}
