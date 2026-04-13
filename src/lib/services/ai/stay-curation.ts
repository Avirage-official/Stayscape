/**
 * Stay Curation Service
 *
 * Uses Claude AI to generate curated content for a guest's stay:
 * - Default itinerary based on stay duration, location, trip type
 * - Recommended places (food, shopping, safe areas) near the hotel
 * - Regional activities and experiences ("Discover the Region")
 *
 * Called automatically after a PMS webhook creates a stay,
 * or manually via the /api/ai/curate endpoint.
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import { upsertCuration } from '@/lib/supabase/curation-repository';
import type { CurationType, CurationResult, CuratedItem } from '@/types/pms';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';

/* ── Types ───────────────────────────────────────────────────── */

interface StayContext {
  stay_id: string;
  property_name: string;
  property_address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in: string;
  check_out: string;
  guests: number | null;
  trip_type: string | null;
  notes: string | null;
  region_name: string | null;
}

interface CurationContent {
  title: string;
  summary: string;
  items: CuratedItem[];
}

/* ── Main orchestrator ──────────────────────────────────────── */

/**
 * Generate all curations for a stay.
 * Fetches stay context from DB, then calls Claude for each curation type.
 */
export async function curateStay(
  stayId: string,
  force = false,
): Promise<CurationResult> {
  const context = await getStayContext(stayId);
  if (!context) {
    throw new Error(`Stay not found: ${stayId}`);
  }

  const curationTypes: CurationType[] = [
    'default_itinerary',
    'recommended_places',
    'regional_activities',
  ];

  const createdTypes: CurationType[] = [];

  for (const type of curationTypes) {
    try {
      const content = await generateCuration(context, type);
      if (content) {
        await upsertCuration(stayId, type, content);
        createdTypes.push(type);
      }
    } catch (err) {
      // Log but continue with other curation types
      console.error(`Failed to generate ${type} curation for stay ${stayId}:`, err);
    }
  }

  // Void usage of force to indicate it's reserved for future skip-if-exists logic
  void force;

  return {
    stay_id: stayId,
    curations_created: createdTypes.length,
    types: createdTypes,
  };
}

/* ── Stay context loader ────────────────────────────────────── */

async function getStayContext(stayId: string): Promise<StayContext | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('stays')
    .select(
      `id, checkindate, checkoutdate, guestcount, trip_type, notes,
       properties:propertyid ( name, address, city, country, latitude, longitude, region_id,
         regions:region_id ( name ) )`,
    )
    .eq('id', stayId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const property = row.properties as Record<string, unknown> | null;
  const region = property?.regions as Record<string, unknown> | null;

  return {
    stay_id: row.id as string,
    property_name: (property?.name as string) ?? 'Unknown Property',
    property_address: (property?.address as string) ?? null,
    city: (property?.city as string) ?? null,
    country: (property?.country as string) ?? null,
    latitude: (property?.latitude as number) ?? null,
    longitude: (property?.longitude as number) ?? null,
    check_in: row.checkindate as string,
    check_out: row.checkoutdate as string,
    guests: (row.guestcount as number) ?? null,
    trip_type: (row.trip_type as string) ?? null,
    notes: (row.notes as string) ?? null,
    region_name: (region?.name as string) ?? null,
  };
}

/* ── AI curation generators ─────────────────────────────────── */

async function generateCuration(
  context: StayContext,
  type: CurationType,
): Promise<CurationContent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not configured — skipping AI curation');
    return generateFallbackCuration(context, type);
  }

  const prompt = buildCurationPrompt(context, type);
  const raw = await callClaude(apiKey, prompt);
  return parseCurationResponse(raw);
}

function buildCurationPrompt(context: StayContext, type: CurationType): string {
  const stayDays = Math.max(
    1,
    Math.ceil(
      (new Date(context.check_out).getTime() - new Date(context.check_in).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const locationInfo = [
    context.property_name,
    context.property_address,
    context.city,
    context.country,
    context.region_name ? `Region: ${context.region_name}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const guestInfo = [
    context.guests ? `${context.guests} guests` : null,
    context.trip_type ? `Trip type: ${context.trip_type}` : null,
    context.notes ? `Guest notes: ${context.notes}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  const baseContext = `You are the AI concierge for Stayscape, a premium hospitality platform.
A guest is staying at ${locationInfo} for ${stayDays} nights (${context.check_in} to ${context.check_out}).
${guestInfo ? `Guest details: ${guestInfo}` : ''}`;

  switch (type) {
    case 'default_itinerary':
      return `${baseContext}

Generate a suggested day-by-day itinerary for this ${stayDays}-night stay. Include common activities that most travellers enjoy in this area — morning, afternoon, and evening suggestions for each day.

Respond with a single JSON object (no markdown, no extra text):
{
  "title": "Your ${stayDays}-Night ${context.city ?? 'Getaway'} Itinerary",
  "summary": "A brief 1-2 sentence overview of the itinerary",
  "items": [
    {
      "name": "Activity name",
      "category": "one of: dining, sightseeing, shopping, wellness, nightlife, nature, cultural, adventure",
      "description": "1-2 sentence description",
      "reason": "Why this is recommended",
      "time_of_day": "morning/afternoon/evening",
      "duration": "e.g. 2 hours"
    }
  ]
}

Generate ${Math.min(stayDays * 3, 15)} items covering the full stay.`;

    case 'recommended_places':
      return `${baseContext}

Recommend the top places near the hotel that guests commonly need — focus on:
- **Food & Dining**: Best-reviewed restaurants, cafes, local food
- **Shopping**: Popular shopping areas, markets, boutiques
- **Safe & Popular Areas**: Well-known, safe, walkable areas around the hotel

Respond with a single JSON object (no markdown, no extra text):
{
  "title": "Top Picks Near ${context.property_name}",
  "summary": "Curated recommendations for dining, shopping, and safe areas around your hotel",
  "items": [
    {
      "name": "Place name",
      "category": "one of: dining, shopping, safe_area, cafe, market, nightlife",
      "description": "1-2 sentence description of why this place is great",
      "reason": "What makes it stand out"
    }
  ]
}

Generate 8-12 items with a good mix of food, shopping, and safe areas.`;

    case 'regional_activities':
      return `${baseContext}

Curate a "Discover the Region" guide with activities and experiences common to ${context.region_name ?? context.city ?? 'this area'}. Focus on:
- Cultural experiences unique to the region
- Must-see attractions and landmarks
- Seasonal/local events and festivals
- Outdoor and nature activities
- Local food and wine experiences

Respond with a single JSON object (no markdown, no extra text):
{
  "title": "Discover ${context.region_name ?? context.city ?? 'the Region'}",
  "summary": "Unique experiences and activities that define this region",
  "items": [
    {
      "name": "Activity/Experience name",
      "category": "one of: cultural, nature, food_wine, landmark, festival, adventure, wellness",
      "description": "2-3 sentence description of the experience",
      "reason": "Why it's special to this region",
      "duration": "e.g. half day, 2 hours"
    }
  ]
}

Generate 8-12 regional activities.`;

    case 'safety_tips':
      return `${baseContext}

Provide safety and practical tips for staying in ${context.city ?? 'this area'}. Include safe neighbourhoods, areas to be cautious about, transportation tips, and emergency info.

Respond with a single JSON object (no markdown, no extra text):
{
  "title": "Safety & Practical Tips",
  "summary": "Essential tips for a safe and enjoyable stay",
  "items": [
    {
      "name": "Tip title",
      "category": "one of: safety, transport, emergency, neighbourhood, general",
      "description": "Detailed practical advice"
    }
  ]
}

Generate 6-10 tips.`;
  }
}

async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const textBlock = json.content?.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Claude returned no text content');
  return textBlock.text;
}

/* ── Response parser ────────────────────────────────────────── */

function parseCurationResponse(raw: string): CurationContent | null {
  // Strip markdown code fences if present
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(stripped) as CurationContent;
    if (!parsed.title || !parsed.items || !Array.isArray(parsed.items)) {
      return null;
    }
    return {
      title: parsed.title,
      summary: parsed.summary ?? '',
      items: parsed.items.map((item) => ({
        name: item.name ?? '',
        category: item.category ?? 'general',
        description: item.description ?? '',
        reason: item.reason,
        time_of_day: item.time_of_day,
        duration: item.duration,
        place_id: null,
      })),
    };
  } catch {
    return null;
  }
}

/* ── Fallback curations (when AI is unavailable) ────────────── */

function generateFallbackCuration(
  context: StayContext,
  type: CurationType,
): CurationContent {
  const city = context.city ?? 'your destination';

  switch (type) {
    case 'default_itinerary':
      return {
        title: `Your ${city} Itinerary`,
        summary: `A curated itinerary will be generated once AI services are configured.`,
        items: [
          {
            name: 'Explore the neighbourhood',
            category: 'sightseeing',
            description: `Take a walk around ${context.property_name} and discover the local area.`,
            time_of_day: 'morning',
            duration: '2 hours',
          },
          {
            name: 'Local dining experience',
            category: 'dining',
            description: `Try the highly-rated restaurants near your hotel.`,
            time_of_day: 'evening',
            duration: '2 hours',
          },
        ],
      };

    case 'recommended_places':
      return {
        title: `Top Picks Near ${context.property_name}`,
        summary: `Recommended places will be curated once AI services are configured.`,
        items: [],
      };

    case 'regional_activities':
      return {
        title: `Discover ${city}`,
        summary: `Regional activities will be curated once AI services are configured.`,
        items: [],
      };

    case 'safety_tips':
      return {
        title: 'Safety & Practical Tips',
        summary: 'Safety information will be curated once AI services are configured.',
        items: [],
      };
  }
}
