/**
 * Stay Curation Service
 *
 * Uses Claude AI to generate curated content for a guest's stay:
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
  region_id: string | null;
  region_name: string | null;
}

interface CurationContent {
  title: string;
  summary: string;
  items: CuratedItem[];
  gap_categories?: string[];
}

interface ExistingRegionPlace {
  id: string;
  name: string;
  category: string;
  description: string | null;
  editorial_summary: string | null;
  booking_url: string | null;
  website: string | null;
  rating: number | null;
  address: string | null;
}

/* ── Main orchestrator ──────────────────────────────────────── */

/**
 * Generate all curations for a stay.
 * Fetches stay context from DB, then calls Claude for each curation type.
 */
export async function curateStay(
  stayId: string,
): Promise<CurationResult> {
  const context = await getStayContext(stayId);
  if (!context) {
    throw new Error(`Stay not found: ${stayId}`);
  }

  const curationTypes: CurationType[] = [
    'recommended_places',
    'regional_activities',
  ];
  const existingPlaces = await getExistingRegionPlaces(context.region_id);

  const createdTypes: CurationType[] = [];

  for (const type of curationTypes) {
    try {
      const content = await generateCuration(context, type, existingPlaces);
      if (content) {
        await upsertCuration(stayId, type, content);
        createdTypes.push(type);
      }
    } catch (err) {
      // Log but continue with other curation types
      console.error('Failed to generate curation:', type, err);
    }
  }

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
    region_id: (property?.region_id as string) ?? null,
    region_name: (region?.name as string) ?? null,
  };
}

async function getExistingRegionPlaces(regionId: string | null): Promise<ExistingRegionPlace[]> {
  if (!regionId) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('places')
    .select('id, name, category, description, editorial_summary, booking_url, website, rating, address')
    .eq('region_id', regionId)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(40);

  if (error || !data) return [];
  return data as ExistingRegionPlace[];
}

/* ── AI curation generators ─────────────────────────────────── */

async function generateCuration(
  context: StayContext,
  type: CurationType,
  existingPlaces: ExistingRegionPlace[],
): Promise<CurationContent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not configured — skipping AI curation');
    return generateFallbackCuration(context, type);
  }

  const prompt = buildCurationPrompt(context, type, existingPlaces);
  const raw = await callClaude(apiKey, prompt);
  return parseCurationResponse(raw);
}

function buildCurationPrompt(
  context: StayContext,
  type: CurationType,
  existingPlaces: ExistingRegionPlace[],
): string {
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
${guestInfo ? `Guest details: ${guestInfo}` : ''}

Existing places from our database for this region (use these first whenever possible and reference their exact ids):
${JSON.stringify(existingPlaces, null, 2)}
`;

  switch (type) {
    case 'recommended_places':
      return `${baseContext}

Select the top places near the hotel that guests commonly need.
Prioritize places from the provided database list and set "place_id" to the matching id when selected.
Only use general regional knowledge when there is a clear coverage gap in the database.

Focus on:
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
      "place_id": "existing place id when selected from DB, else null",
      "description": "1-2 sentence description of why this place is great",
      "reason": "What makes it stand out"
    }
  ],
  "gap_categories": ["categories missing or weak in DB coverage for this stay"]
}

Generate 8-12 items with a good mix of food, shopping, and safe areas.`;

    case 'regional_activities':
      return `${baseContext}

Curate a "Discover the Region" guide with activities and experiences common to ${context.region_name ?? context.city ?? 'this area'}.
Select from the provided database places first and set "place_id" when a match exists.
Supplement with general regional knowledge only when DB coverage is missing for a category.

Focus on:
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
      "place_id": "existing place id when selected from DB, else null",
      "description": "2-3 sentence description of the experience",
      "reason": "Why it's special to this region",
      "duration": "e.g. half day, 2 hours"
    }
  ],
  "gap_categories": ["categories missing or weak in DB coverage for this region"]
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

    default:
      throw new Error(`Unsupported curation type: ${type}`);
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
          place_id: typeof item.place_id === 'string' && item.place_id.trim().length > 0
            ? item.place_id
            : null,
        })),
        gap_categories: Array.isArray(parsed.gap_categories)
          ? parsed.gap_categories.filter((gap): gap is string => typeof gap === 'string')
          : [],
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
    case 'recommended_places':
      return {
        title: `Top Picks Near ${context.property_name}`,
        summary: `Recommended places will be curated once AI services are configured.`,
        items: [],
        gap_categories: [],
      };

    case 'regional_activities':
      return {
        title: `Discover ${city}`,
        summary: `Regional activities will be curated once AI services are configured.`,
        items: [],
        gap_categories: [],
      };

    case 'safety_tips':
      return {
        title: 'Safety & Practical Tips',
        summary: 'Safety information will be curated once AI services are configured.',
        items: [],
      };

    default:
      return {
        title: `Discover ${city}`,
        summary: 'Curation is temporarily unavailable.',
        items: [],
      };
  }
}
