/**
 * AI Region Creation & Place Seeding
 *
 * When a property has no matching region, these functions:
 * 1. Ask Claude to define a logical travel region for the city/area.
 * 2. Insert the new region into Supabase and link the property to it.
 * 3. Ask Claude to generate 20 real tourist places for the region and
 *    seed them into the places table.
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';

/* ── Claude helper ──────────────────────────────────────────── */

async function callClaude(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
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

function stripMarkdown(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/* ── Types ───────────────────────────────────────────────────── */

interface RegionSuggestion {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  country_code: string;
}

interface PlaceSuggestion {
  name: string;
  category: string;
  description: string;
  editorial_summary: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  price_level: number;
  website: string | null;
  is_active: boolean;
}

/* ── createRegionForProperty ─────────────────────────────────── */

/**
 * Ask Claude to define a travel region for the given property, insert it
 * into the `regions` table, and link the property to the new region.
 *
 * Returns the new region's UUID, or null when the property lacks enough
 * location data (no city / country).
 */
export async function createRegionForProperty(
  propertyId: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  // Fetch property details
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('name, city, country, latitude, longitude')
    .eq('id', propertyId)
    .maybeSingle();

  if (propError || !property) {
    console.error('[region-creation] Failed to fetch property:', propError?.message);
    return null;
  }

  const { name, city, country, latitude, longitude } = property as {
    name: string;
    city: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
  };

  if (!city || !country) {
    console.warn('[region-creation] Property missing city/country — cannot create region:', propertyId);
    return null;
  }

  // Ask Claude to define the region
  const prompt = `You are a travel data expert. Given this hotel property, define a logical travel region covering the city and surrounding area a tourist would explore.
Return ONLY a JSON object, no markdown:
{
  "name": "e.g. Barcelona City",
  "slug": "e.g. barcelona-city (lowercase, hyphens only, no spaces)",
  "latitude": <number — centre of region>,
  "longitude": <number — centre of region>,
  "radius_km": <number 10-25 for cities>,
  "country_code": "ISO 3166-1 alpha-2 e.g. ES"
}
Property: ${name}, ${city}, ${country}${latitude != null ? `, lat: ${latitude}` : ''}${longitude != null ? `, lng: ${longitude}` : ''}`;

  let suggestion: RegionSuggestion;
  try {
    const raw = await callClaude(prompt);
    suggestion = JSON.parse(stripMarkdown(raw)) as RegionSuggestion;
  } catch (err) {
    console.error('[region-creation] Failed to parse Claude region response:', err);
    return null;
  }

  if (
    !suggestion.name ||
    !suggestion.slug ||
    suggestion.latitude == null ||
    suggestion.longitude == null ||
    !suggestion.country_code
  ) {
    console.error('[region-creation] Claude returned incomplete region data:', suggestion);
    return null;
  }

  // Ensure slug uniqueness — append -2, -3, … if needed
  const baseSlug = suggestion.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  // Insert the new region
  const { data: newRegion, error: insertError } = await supabase
    .from('regions')
    .insert({
      name: suggestion.name,
      slug,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      radius_km: suggestion.radius_km ?? 15,
      country_code: suggestion.country_code,
      is_active: true,
    })
    .select('id')
    .single();

  if (insertError || !newRegion) {
    console.error('[region-creation] Failed to insert region:', insertError?.message);
    return null;
  }

  const newRegionId = newRegion.id as string;

  // Link property to the new region
  await supabase
    .from('properties')
    .update({ region_id: newRegionId })
    .eq('id', propertyId);

  console.log(`[region-creation] Created region "${suggestion.name}" (${newRegionId}) for property ${propertyId}`);
  return newRegionId;
}

/* ── seedPlacesForRegion ─────────────────────────────────────── */

/**
 * Ask Claude to generate 20 real tourist places for `city, country` and
 * insert them into the `places` table linked to `regionId`.
 */
export async function seedPlacesForRegion(
  regionId: string,
  city: string,
  country: string,
): Promise<void> {
  const prompt = `You are a travel data expert. Generate 20 real, well-known places for tourists visiting ${city}, ${country}. Cover a good mix of: dining, cafe, shopping, landmark, nature, nightlife, wellness, cultural.
Return ONLY a JSON array, no markdown:
[
  {
    "name": "<real place name>",
    "category": "<one of: dining, cafe, shopping, landmark, nature, nightlife, wellness, cultural>",
    "description": "<2-3 sentences about the place>",
    "editorial_summary": "<1 sentence highlight>",
    "address": "<real address in the city>",
    "latitude": <number>,
    "longitude": <number>,
    "rating": <number 3.5-5.0>,
    "price_level": <number 1-4>,
    "website": "<url or null>",
    "is_active": true
  }
]`;

  let places: PlaceSuggestion[];
  try {
    const raw = await callClaude(prompt, 4096);
    places = JSON.parse(stripMarkdown(raw)) as PlaceSuggestion[];
  } catch (err) {
    console.error('[region-creation] Failed to parse Claude places response:', err);
    return;
  }

  if (!Array.isArray(places) || places.length === 0) {
    console.warn('[region-creation] Claude returned no places for region:', regionId);
    return;
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const rows = places.map((p) => ({
    region_id: regionId,
    name: p.name,
    category: p.category,
    description: p.description ?? null,
    editorial_summary: p.editorial_summary ?? null,
    address: p.address ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    rating: typeof p.rating === 'number' ? p.rating : null,
    price_level: typeof p.price_level === 'number' ? p.price_level : null,
    website: p.website ?? null,
    is_active: true,
    last_synced_at: now,
  }));

  const { error } = await supabase.from('places').insert(rows);

  if (error) {
    console.error('[region-creation] Failed to insert places:', error.message);
    return;
  }

  console.log(`[region-creation] Seeded ${rows.length} places for region ${regionId} (${city}, ${country})`);
}
