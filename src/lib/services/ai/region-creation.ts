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

/* ── Haversine helpers ───────────────────────────────────────── */

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
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

  const name = property.name as string;
  const city = property.city as string | null;
  const country = property.country as string | null;
  const latitude = property.latitude as number | null;
  const longitude = property.longitude as number | null;

  if (!city || !country) {
    console.warn('[region-creation] Property missing city/country — cannot create region:', propertyId);
    return null;
  }

  // ── Check for an existing region before calling Claude ────────

  const { data: existingRegions } = await supabase
    .from('regions')
    .select('id, name, slug, latitude, longitude, radius_km')
    .eq('is_active', true);

  if (existingRegions && existingRegions.length > 0) {
    let matchedRegionId: string | null = null;
    let matchedRegionName: string | null = null;

    // Proximity check (takes priority over name match)
    if (latitude !== null && longitude !== null) {
      let closestDistance = Infinity;
      for (const region of existingRegions) {
        const regLat = region.latitude as number | null;
        const regLon = region.longitude as number | null;
        const regRadius = region.radius_km as number | null;
        if (regLat === null || regLon === null || regRadius === null) continue;
        const dist = haversineDistance(latitude, longitude, regLat, regLon);
        if (dist <= regRadius && dist < closestDistance) {
          closestDistance = dist;
          matchedRegionId = region.id as string;
          matchedRegionName = region.name as string;
        }
      }
    }

    // Name match (only when proximity check found nothing)
    // Use word-boundary checks to avoid false positives (e.g. "paris" in "comparison")
    if (!matchedRegionId) {
      const cityLower = city.toLowerCase();
      const escapedCity = cityLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cityInName = new RegExp(`\\b${escapedCity}\\b`);
      for (const region of existingRegions) {
        const regionNameLower = (region.name as string).toLowerCase();
        const escapedRegion = regionNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameInCity = new RegExp(`\\b${escapedRegion}\\b`);
        if (cityInName.test(regionNameLower) || nameInCity.test(cityLower)) {
          matchedRegionId = region.id as string;
          matchedRegionName = region.name as string;
          break;
        }
      }
    }

    if (matchedRegionId) {
      await supabase
        .from('properties')
        .update({ region_id: matchedRegionId })
        .eq('id', propertyId);
      console.log(
        `[region-creation] Found existing region "${matchedRegionName}" for city ${city} — linking property ${propertyId} instead of creating new`,
      );
      return matchedRegionId;
    }
  }

  // Step 3 — No existing region found; ask Claude to define a new one
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

  // Ensure slug uniqueness — append -2, -3, … if needed (max 10 attempts)
  const baseSlug = suggestion.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  let slug = baseSlug;
  let attempt = 1;
  const MAX_SLUG_ATTEMPTS = 10;
  while (attempt <= MAX_SLUG_ATTEMPTS) {
    const { data: existing } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
  if (attempt > MAX_SLUG_ATTEMPTS) {
    console.error('[region-creation] Could not find a unique slug after', MAX_SLUG_ATTEMPTS, 'attempts for base:', baseSlug);
    return null;
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
