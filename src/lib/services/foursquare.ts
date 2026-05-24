/**
 * Foursquare Places Service — backend-only.
 *
 * Fetches places from the Foursquare Places API (new places-api.foursquare.com host),
 * normalizes them into our internal schema, and returns PlaceUpsertInput objects
 * ready for Supabase. The Foursquare API key is never exposed to the client.
 *
 * Migration notes (old api.foursquare.com/v3 → new places-api.foursquare.com):
 *  - Host changed to places-api.foursquare.com (no /v3 path prefix)
 *  - Auth changed from bare API key to Bearer <SERVICE_KEY>
 *  - X-Places-Api-Version header required
 *  - fsq_id renamed to fsq_place_id
 *  - geocodes.main.lat/lng flattened to top-level latitude / longitude
 */

import { getFoursquareApiKey } from '@/lib/env';
import type { PlaceUpsertInput } from '@/lib/supabase/places-repository';

const FOURSQUARE_BASE = 'https://places-api.foursquare.com';
const FOURSQUARE_API_VERSION = '2025-06-17';

export interface FoursquareSearchParams {
  latitude: number;
  longitude: number;
  radius_meters?: number;
  limit?: number;
}

interface FoursquarePlace {
  fsq_place_id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  location?: {
    formatted_address?: string;
    locality?: string;
    country?: string;
  };
  categories?: { fsq_category_id: string; name: string }[];
  price?: number;
  rating?: number;
}

interface FoursquareSearchResponse {
  results: FoursquarePlace[];
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'X-Places-Api-Version': FOURSQUARE_API_VERSION,
  };
}

export async function searchPlaces(
  params: FoursquareSearchParams,
): Promise<PlaceUpsertInput[]> {
  const apiKey = getFoursquareApiKey();
  const {
    latitude,
    longitude,
    radius_meters = 5000,
    limit = 100,
  } = params;

  const url = new URL(`${FOURSQUARE_BASE}/places/search`);
  url.searchParams.set('ll', `${latitude},${longitude}`);
  url.searchParams.set('radius', String(radius_meters));
  url.searchParams.set('limit', String(Math.min(limit, 100)));

  const res = await fetch(url.toString(), {
    headers: buildHeaders(apiKey),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Foursquare API error: ${res.status} ${res.statusText} — ${body}`);
  }

  const json = (await res.json()) as FoursquareSearchResponse;
  return (json.results ?? [])
    .filter((p) => p.name && p.latitude != null && p.longitude != null)
    .map(normalizePlace);
}

export async function getPlaceDetails(fsqPlaceId: string): Promise<PlaceUpsertInput | null> {
  const apiKey = getFoursquareApiKey();
  const url = new URL(`${FOURSQUARE_BASE}/places/${fsqPlaceId}`);

  const res = await fetch(url.toString(), {
    headers: buildHeaders(apiKey),
  });

  if (!res.ok) return null;

  const place = (await res.json()) as FoursquarePlace;
  if (!place.name || place.latitude == null || place.longitude == null) return null;

  return normalizePlace(place);
}

// Maps Foursquare category names to Stayscape internal categories.
// The new API uses BSON category IDs (strings) instead of integers,
// so we map by name patterns instead of numeric ranges.
function mapFoursquareCategory(categories: { fsq_category_id: string; name: string }[] | undefined): string {
  if (!categories || categories.length === 0) return 'local_spots';

  const nameLower = categories[0].name.toLowerCase();

  if (/museum|histor|heritage|monument|memorial|gallery|\bart\b|temple|shrine|castle|ruin/.test(nameLower)) {
    return 'historical';
  }
  if (/\bbar\b|pub|nightclub|lounge|\bclub\b|brewery|winery|distiller/.test(nameLower)) {
    return 'nightlife';
  }
  if (/restaurant|cafe|caf\u00e9|dining|bistro|eatery|food/.test(nameLower)) {
    return 'dining';
  }
  if (/spa|yoga|wellness|fitness|gym|massage|pilates|beauty/.test(nameLower)) {
    return 'wellness';
  }
  if (/park|garden|nature|forest|beach|mountain|lake|river|waterfall|outdoor/.test(nameLower)) {
    return 'nature';
  }
  if (/shop|mall|market|retail|store|boutique/.test(nameLower)) {
    return 'shopping';
  }
  if (/landmark|attraction|sight|tour/.test(nameLower)) {
    return 'top_places';
  }
  if (/theater|theatre|cinema|entertainment|amusement|theme park|escape|bowling/.test(nameLower)) {
    return 'fun_places';
  }

  return 'local_spots';
}

function normalizePlace(place: FoursquarePlace): PlaceUpsertInput {
  const loc = place.location ?? {};

  return {
    name: place.name ?? 'Unknown Place',
    slug: place.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    category: mapFoursquareCategory(place.categories),
    description: '',
    latitude: place.latitude ?? 0,
    longitude: place.longitude ?? 0,
    address: loc.formatted_address ?? '',
    address_line2: null,
    city: loc.locality ?? '',
    country_code: (loc.country ?? 'US').toUpperCase(),
    phone: null,
    website: null,
    image_url: null,
    external_source: 'foursquare',
    external_id: place.fsq_place_id,
  };
}
