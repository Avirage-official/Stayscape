/**
 * Google Places Service — backend-only.
 *
 * Fetches places from the Google Places API (legacy), normalises them into
 * our internal schema, and returns PlaceUpsertInput objects ready for Supabase.
 * The API key is never exposed to the client.
 *
 * Endpoints used:
 *   Nearby Search  — /nearbysearch/json  (up to 60 results / 3 pages)
 *   Place Details  — /details/json       (website, phone, city during enrichment)
 *
 * Photo storage is handled separately by google-places-image.ts.
 */

import { getGooglePlacesApiKey } from '@/lib/env';
import type { PlaceUpsertInput } from '@/lib/supabase/places-repository';

const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const PER_CATEGORY_LIMIT = 12;

// Google type keywords to search per category
const CATEGORY_TYPE_MAP: Record<string, string> = {
  dining:     'restaurant',
  nightlife:  'night_club',
  shopping:   'shopping_mall',
  nature:     'park',
  historical: 'museum',
  wellness:   'spa',
  family:     'zoo',
  fun_places: 'amusement_park',
  top_places: 'tourist_attraction',
  local_spots: 'point_of_interest',
};

export interface GooglePlacesSearchParams {
  latitude: number;
  longitude: number;
  radius_meters?: number;
  limit?: number;
  country_code?: string;
}

interface GooglePlaceBasic {
  place_id: string;
  name: string;
  vicinity?: string;
  geometry?: { location: { lat: number; lng: number } };
  types?: string[];
  price_level?: number;
  rating?: number;
}

interface GoogleNearbyResponse {
  status: string;
  results: GooglePlaceBasic[];
  next_page_token?: string;
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry?: { location: { lat: number; lng: number } };
  types?: string[];
  price_level?: number;
  rating?: number;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  address_components?: GoogleAddressComponent[];
}

interface GoogleDetailsResponse {
  status: string;
  result: GooglePlaceDetails;
}

export async function searchPlaces(
  params: GooglePlacesSearchParams,
): Promise<PlaceUpsertInput[]> {
  const key = getGooglePlacesApiKey();
  const { latitude, longitude, radius_meters = 5000, country_code = '' } = params;

  const seen = new Map<string, PlaceUpsertInput>(); // dedup by place_id

  for (const [, googleType] of Object.entries(CATEGORY_TYPE_MAP)) {
    const results = await fetchCategoryPlaces({
      key, latitude, longitude, radius_meters, country_code,
      googleType, limit: PER_CATEGORY_LIMIT,
    });
    for (const p of results) {
      if (!seen.has(p.external_id!)) seen.set(p.external_id!, p);
    }
  }

  return Array.from(seen.values());
}

async function fetchCategoryPlaces({
  key, latitude, longitude, radius_meters, country_code, googleType, limit,
}: {
  key: string; latitude: number; longitude: number; radius_meters: number;
  country_code: string; googleType: string; limit: number;
}): Promise<PlaceUpsertInput[]> {
  const baseUrl = new URL(`${GOOGLE_PLACES_BASE}/nearbysearch/json`);
  baseUrl.searchParams.set('location', `${latitude},${longitude}`);
  baseUrl.searchParams.set('radius', String(radius_meters));
  baseUrl.searchParams.set('type', googleType);
  baseUrl.searchParams.set('key', key);

  const places: PlaceUpsertInput[] = [];
  let pageToken: string | undefined;

  while (places.length < limit) {
    const pageUrl = new URL(baseUrl.toString());
    if (pageToken) pageUrl.searchParams.set('pagetoken', pageToken);

    const res = await fetch(pageUrl.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) break; // skip category on error, don't abort whole sync

    const json = (await res.json()) as GoogleNearbyResponse;
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') break;

    for (const p of json.results ?? []) {
      if (p.name && p.geometry?.location && places.length < limit) {
        places.push(normalizePlaceBasic(p, country_code));
      }
    }

    pageToken = json.next_page_token;
    if (!pageToken || places.length >= limit) break;

    // Google requires a short delay before next_page_token becomes valid
    await new Promise(r => setTimeout(r, 2000));
  }

  return places;
}

export async function getPlaceDetails(googlePlaceId: string): Promise<PlaceUpsertInput | null> {
  const key = getGooglePlacesApiKey();
  const url = new URL(`${GOOGLE_PLACES_BASE}/details/json`);
  url.searchParams.set('place_id', googlePlaceId);
  url.searchParams.set(
    'fields',
    'place_id,name,formatted_address,vicinity,geometry,types,price_level,rating,formatted_phone_number,international_phone_number,website,address_components',
  );
  url.searchParams.set('key', key);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;

  const json = (await res.json()) as GoogleDetailsResponse;
  if (json.status !== 'OK' || !json.result?.name) return null;

  const d = json.result;
  const city = d.address_components?.find(c => c.types.includes('locality'))?.long_name ?? '';
  const country = d.address_components?.find(c => c.types.includes('country'))?.short_name ?? '';

  return {
    name: d.name,
    slug: slugify(d.name),
    category: mapGoogleCategory(d.types ?? []),
    description: '',
    latitude: d.geometry?.location.lat ?? 0,
    longitude: d.geometry?.location.lng ?? 0,
    address: d.formatted_address ?? d.vicinity ?? '',
    address_line2: null,
    city,
    country_code: country.toUpperCase(),
    phone: d.formatted_phone_number ?? d.international_phone_number ?? null,
    website: d.website ?? null,
    image_url: null,
    external_source: 'google_places',
    external_id: d.place_id,
  };
}

// Google photo references expire — images are persisted by google-places-image.ts instead.
export async function getPlacePhotoUrls(_googlePlaceId: string, _limit = 3): Promise<string[]> {
  return [];
}

function mapGoogleCategory(types: string[]): string {
  for (const t of types) {
    if (/museum|art_gallery|historic|cemetery|place_of_worship|church|temple|shrine/.test(t)) {
      return 'historical';
    }
    if (/bar|night_club|brewery|winery/.test(t)) return 'nightlife';
    if (/restaurant|cafe|food|bakery|meal_delivery|meal_takeaway/.test(t)) return 'dining';
    if (/gym|spa|beauty_salon|hair_care/.test(t)) return 'wellness';
    if (/park|natural_feature|campground|zoo|aquarium|rv_park/.test(t)) return 'nature';
    if (/shopping_mall|store|clothing_store|department_store/.test(t)) return 'shopping';
    if (/tourist_attraction/.test(t)) return 'top_places';
    if (/amusement_park|bowling_alley|casino|movie_theater|stadium/.test(t)) return 'fun_places';
  }
  return 'local_spots';
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizePlaceBasic(place: GooglePlaceBasic, countryCode: string): PlaceUpsertInput {
  return {
    name: place.name,
    slug: slugify(place.name),
    category: mapGoogleCategory(place.types ?? []),
    description: '',
    latitude: place.geometry!.location.lat,
    longitude: place.geometry!.location.lng,
    address: place.vicinity ?? '',
    address_line2: null,
    city: '',
    country_code: countryCode.toUpperCase(),
    phone: null,
    website: null,
    image_url: null,
    price_level: place.price_level ?? null,
    rating: place.rating ?? null,
    external_source: 'google_places',
    external_id: place.place_id,
  };
}
