/**
 * Geoapify Places Service — backend-only.
 *
 * Fetches places from the Geoapify Places API, normalizes them into
 * our internal schema, and upserts into Supabase. The Geoapify API key
 * is never exposed to the client.
 */

import { getGeoapifyApiKey } from '@/lib/env';
import type { PlaceUpsertInput } from '@/lib/supabase/places-repository';

const GEOAPIFY_BASE = 'https://api.geoapify.com/v2';

/* ── Default categories ──────────────────────────────────── */

/**
 * Curated list of Geoapify sub-categories to fetch.
 * Restaurants and cafes are included — the chain blocklist below and
 * Claude's quality gate together filter out generic chains, leaving only
 * independent dining worth featuring.
 * 'catering.fast_food' remains excluded as it is almost entirely chains.
 */
const DEFAULT_CATEGORIES = [
  /* Dining */
  'catering.restaurant',
  'catering.cafe',
  /* Nightlife */
  'catering.bar',
  'catering.pub',
  /* Tourism & sights */
  'tourism.sights',
  'tourism.attraction',
  'tourism.information',
  /* Heritage */
  'heritage',
  /* Entertainment */
  'entertainment.cinema',
  'entertainment.museum',
  'entertainment.theme_park',
  'entertainment.activity_park',
  'entertainment.water_park',
  'entertainment.escape_game',
  'entertainment.bowling_alley',
  'entertainment.culture',
  'entertainment.zoo',
  'entertainment.aquarium',
  /* Nature & outdoor */
  'leisure.park',
  'leisure.spa',
  'natural.water',
  'natural.forest',
  'natural.mountain.peak',
  'beach',
  /* Shopping */
  'commercial.shopping_mall',
  /* Wellness */
  'sport.fitness',
  'service.beauty',
  /* Religion */
  'religion.place_of_worship',
];

/* ── Chain / generic dining blocklist ───────────────────── */

/**
 * Case-insensitive blocklist of known chains, franchises, and generic
 * brands that should never appear in Stayscape regardless of category.
 * Checked as a substring match against the place name (lowercased).
 */
const CHAIN_BLOCKLIST = [
  /* Fast food */
  "mcdonald's", 'mcdonalds', 'kfc', 'burger king', 'subway', 'wendy\'s',
  'wendys', 'taco bell', 'popeyes', 'five guys', 'shake shack', 'jollibee',
  'carl\'s jr', 'carls jr', 'hardee\'s', 'hardees', 'jack in the box',
  'domino\'s', 'dominos', 'pizza hut', 'little caesars', 'papa john\'s',
  'papa johns',
  /* Casual dining chains */
  'swensen\'s', 'swensens', 'the manhattan fish market', 'fish & co',
  'fish and co', 'sizzler', 'tony roma\'s', 'tony romas', 'applebee\'s',
  'applebees', 'chili\'s', 'chilis', 'friday\'s', 'fridays', 'denny\'s',
  'dennys', 'ihop', 'olive garden', 'red lobster', 'outback steakhouse',
  'nando\'s', 'nandos',
  /* Café chains */
  'starbucks', 'costa coffee', 'coffee bean', 'gloria jean\'s', 'gloria jeans',
  'old town white coffee', 'ya kun', 'toast box', 'toastbox', 'mr bean',
  'gong cha', 'koi', 'liho', 'each a cup', 'tiger sugar', 'playmade',
  'the alley', 'ten ren',
  /* Sushi / Japanese chains */
  'sushiro', 'sushi express', 'genki sushi', 'itacho sushi', 'sakae sushi',
  'sushi tei', 'ichiban boshi',
  /* Asian casual chains */
  'yoshinoya', 'sukiya', 'mekong', 'imperial treasure', 'paradise dynasty',
  'din tai fung',  // popular chain — add only if desired to filter
  'ajisen', 'ramen nagi', 'ippudo', 'butcher boy', 'putien',
  /* Western chains */
  'ikura', 'nyonya memories',  // specific to current bad data
  'bengawan solo', 'bengawan',
  /* Convenience / grab & go */
  '7-eleven', '7 eleven', 'cheers', 'fairprice', 'cold storage', 'giant',
  'watsons', 'guardian',
  /* Hotel chain restaurants (generic) */
  'marriott', 'hilton', 'sheraton', 'hyatt', 'westin', 'novotel',
  'courtyard by marriott',
];

/**
 * Returns true if the place name matches a known chain / blocklisted brand.
 */
function isBlocklisted(name: string): boolean {
  const lower = name.toLowerCase();
  return CHAIN_BLOCKLIST.some((entry) => lower.includes(entry));
}

/* ── Category mapping ────────────────────────────────────── */

const GEOAPIFY_TO_STAYSCAPE_CATEGORY: Record<string, string> = {
  'catering.restaurant': 'dining',
  'catering.cafe': 'dining',
  'catering.fast_food': 'dining',
  'catering.bar': 'nightlife',
  'catering.pub': 'nightlife',
  'entertainment': 'fun_places',
  'entertainment.cinema': 'fun_places',
  'entertainment.theme_park': 'fun_places',
  'entertainment.activity_park': 'fun_places',
  'entertainment.water_park': 'fun_places',
  'entertainment.escape_game': 'fun_places',
  'entertainment.bowling_alley': 'fun_places',
  'entertainment.zoo': 'family',
  'entertainment.aquarium': 'family',
  'entertainment.museum': 'historical',
  'entertainment.culture': 'historical',
  'leisure.park': 'nature',
  'leisure.spa': 'wellness',
  'natural': 'nature',
  'natural.forest': 'nature',
  'natural.water': 'nature',
  'tourism.sights': 'top_places',
  'tourism.attraction': 'top_places',
  'tourism.information': 'top_places',
  'tourism': 'top_places',
  'heritage': 'historical',
  'heritage.unesco': 'historical',
  'religion': 'historical',
  'religion.place_of_worship': 'historical',
  'commercial.shopping_mall': 'shopping',
  'commercial': 'shopping',
  'sport.fitness': 'wellness',
  'healthcare.pharmacy': 'wellness',
  'service.beauty': 'wellness',
  'beach': 'nature',
};

export function mapGeoapifyCategory(categories: string[]): string {
  // Two-pass priority: non-catering first so that a shrine tagged with both
  // catering.restaurant and tourism.sights resolves to historical, not dining.
  const passes = [
    categories.filter((c) => !c.startsWith('catering')),
    categories.filter((c) => c.startsWith('catering')),
  ];

  for (const pass of passes) {
    for (const cat of pass) {
      if (GEOAPIFY_TO_STAYSCAPE_CATEGORY[cat]) return GEOAPIFY_TO_STAYSCAPE_CATEGORY[cat];
      const prefix = cat.split('.')[0];
      if (GEOAPIFY_TO_STAYSCAPE_CATEGORY[prefix]) return GEOAPIFY_TO_STAYSCAPE_CATEGORY[prefix];
    }
  }
  return 'local_spots';
}

/* ── Geoapify response types (internal) ──────────────────── */

interface GeoapifyFeature {
  type: 'Feature';
  properties: {
    place_id: string;
    name?: string;
    categories: string[];
    datasource?: { sourcename?: string; raw?: Record<string, unknown> };
    lat: number;
    lon: number;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    country_code?: string;
    contact?: { phone?: string; website?: string };
    opening_hours?: string;
    wiki_and_media?: { image?: string };
    description?: string;
  };
}

interface GeoapifyResponse {
  type: 'FeatureCollection';
  features: GeoapifyFeature[];
}

/* ── Public API ──────────────────────────────────────────── */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export interface GeoapifySearchParams {
  latitude: number;
  longitude: number;
  radius_meters?: number;
  categories?: string[];
  limit?: number;
  countryCode?: string;
}

/**
 * Search places by radius around a point.
 * Returns normalized PlaceUpsertInput objects ready for Supabase.
 * Blocklisted chains are silently dropped before returning.
 */
export async function searchPlaces(
  params: GeoapifySearchParams,
): Promise<PlaceUpsertInput[]> {
  const apiKey = getGeoapifyApiKey();
  const {
    latitude,
    longitude,
    radius_meters = 5000,
    categories = DEFAULT_CATEGORIES,
    limit = 100,
    countryCode,
  } = params;

  const url = new URL(`${GEOAPIFY_BASE}/places`);
  url.searchParams.set('categories', categories.join(','));
  url.searchParams.set('filter', `circle:${longitude},${latitude},${radius_meters}`);
  url.searchParams.set('bias', `proximity:${longitude},${latitude}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('lang', 'en');
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Geoapify API error: ${res.status} ${res.statusText}`);
  }

  const expectedCountry = countryCode?.toUpperCase();
  const json = (await res.json()) as GeoapifyResponse;
  return json.features
    .filter((f) => f.properties.name && !isBlocklisted(f.properties.name))
    .filter((f) =>
      !expectedCountry ||
      (f.properties.country_code?.toUpperCase() === expectedCountry),
    )
    .map((f) => normalizeFeature(f));
}

/**
 * Search places within a bounding box.
 */
export async function searchPlacesByBounds(params: {
  north: number;
  south: number;
  east: number;
  west: number;
  categories?: string[];
  limit?: number;
}): Promise<PlaceUpsertInput[]> {
  const apiKey = getGeoapifyApiKey();
  const {
    north, south, east, west,
    categories = DEFAULT_CATEGORIES,
    limit = 100,
  } = params;

  const url = new URL(`${GEOAPIFY_BASE}/places`);
  url.searchParams.set('categories', categories.join(','));
  url.searchParams.set('filter', `rect:${west},${south},${east},${north}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('lang', 'en');
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Geoapify API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GeoapifyResponse;
  return json.features
    .filter((f) => f.properties.name && !isBlocklisted(f.properties.name))
    .map((f) => normalizeFeature(f));
}

/**
 * Get details for a specific place by Geoapify place_id.
 */
export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceUpsertInput | null> {
  const apiKey = getGeoapifyApiKey();
  const url = new URL(`${GEOAPIFY_BASE}/place-details`);
  url.searchParams.set('id', placeId);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = (await res.json()) as { features: GeoapifyFeature[] };
  const feature = json.features?.[0];
  if (!feature?.properties?.name) return null;
  if (isBlocklisted(feature.properties.name)) return null;

  return normalizeFeature(feature);
}

/* ── Normalizer ──────────────────────────────────────────── */

function normalizeFeature(feature: GeoapifyFeature): PlaceUpsertInput {
  const p = feature.properties;
  return {
    name: p.name ?? 'Unknown Place',
    slug: slugify(p.name ?? 'unknown'),
    category: mapGeoapifyCategory(p.categories ?? []),
    description: p.description ?? '',
    latitude: p.lat,
    longitude: p.lon,
    address: p.formatted ?? p.address_line1 ?? '',
    address_line2: p.address_line2 ?? null,
    city: p.city ?? '',
    country_code: (p.country_code ?? 'US').toUpperCase(),
    phone: p.contact?.phone ?? null,
    website: p.contact?.website ?? null,
    image_url: p.wiki_and_media?.image ?? null,
    external_source: 'geoapify',
    external_id: p.place_id,
  };
}
