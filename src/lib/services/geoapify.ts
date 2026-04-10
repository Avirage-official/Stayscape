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
  'entertainment.zoo': 'family',
  'entertainment.aquarium': 'family',
  'entertainment.museum': 'historical',
  'entertainment.culture': 'historical',
  'leisure.park': 'nature',
  'natural': 'nature',
  'natural.forest': 'nature',
  'natural.water': 'nature',
  'tourism': 'top_places',
  'tourism.sights': 'top_places',
  'tourism.attraction': 'top_places',
  'tourism.information': 'top_places',
  'heritage': 'historical',
  'heritage.unesco': 'historical',
  'commercial.shopping_mall': 'shopping',
  'commercial': 'shopping',
  'sport.fitness': 'wellness',
  'healthcare.pharmacy': 'wellness',
  'service.beauty': 'wellness',
};

export function mapGeoapifyCategory(categories: string[]): string {
  for (const cat of categories) {
    // Try exact match first, then prefix match
    if (GEOAPIFY_TO_STAYSCAPE_CATEGORY[cat]) {
      return GEOAPIFY_TO_STAYSCAPE_CATEGORY[cat];
    }
    const prefix = cat.split('.')[0];
    if (GEOAPIFY_TO_STAYSCAPE_CATEGORY[prefix]) {
      return GEOAPIFY_TO_STAYSCAPE_CATEGORY[prefix];
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
}

/**
 * Search places by radius around a point.
 * Returns normalized PlaceUpsertInput objects ready for Supabase.
 */
export async function searchPlaces(
  params: GeoapifySearchParams,
): Promise<PlaceUpsertInput[]> {
  const apiKey = getGeoapifyApiKey();
  const {
    latitude,
    longitude,
    radius_meters = 5000,
    categories = ['catering', 'tourism', 'entertainment', 'leisure', 'commercial'],
    limit = 50,
  } = params;

  const url = new URL(`${GEOAPIFY_BASE}/places`);
  url.searchParams.set('categories', categories.join(','));
  url.searchParams.set('filter', `circle:${longitude},${latitude},${radius_meters}`);
  url.searchParams.set('bias', `proximity:${longitude},${latitude}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Geoapify API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GeoapifyResponse;
  return json.features
    .filter((f) => f.properties.name)
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
    categories = ['catering', 'tourism', 'entertainment', 'leisure', 'commercial'],
    limit = 50,
  } = params;

  const url = new URL(`${GEOAPIFY_BASE}/places`);
  url.searchParams.set('categories', categories.join(','));
  url.searchParams.set('filter', `rect:${west},${south},${east},${north}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Geoapify API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GeoapifyResponse;
  return json.features
    .filter((f) => f.properties.name)
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
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = (await res.json()) as { features: GeoapifyFeature[] };
  const feature = json.features?.[0];
  if (!feature?.properties?.name) return null;

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
