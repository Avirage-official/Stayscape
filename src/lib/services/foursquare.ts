/**
 * Foursquare Places Service — backend-only.
 *
 * Fetches places from the Foursquare Places API, normalizes them into
 * our internal schema, and returns PlaceUpsertInput objects ready for
 * Supabase. The Foursquare API key is never exposed to the client.
 */

import { getFoursquareApiKey } from '@/lib/env';
import type { PlaceUpsertInput } from '@/lib/supabase/places-repository';

const FOURSQUARE_BASE = 'https://api.foursquare.com/v3';

export interface FoursquareSearchParams {
  latitude: number;
  longitude: number;
  radius_meters?: number;
  limit?: number;
}

interface FoursquarePlace {
  fsq_id: string;
  name: string;
  geocodes?: { main?: { latitude: number; longitude: number } };
  location?: {
    formatted_address?: string;
    locality?: string;
    country?: string;
  };
  categories?: { id: number; name: string }[];
  price?: number;
  rating?: number;
}

interface FoursquareSearchResponse {
  results: FoursquarePlace[];
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
    headers: {
      Accept: 'application/json',
      Authorization: apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Foursquare API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as FoursquareSearchResponse;
  return (json.results ?? [])
    .filter((p) => p.name && p.geocodes?.main)
    .map(normalizePlace);
}

export async function getPlaceDetails(fsqId: string): Promise<PlaceUpsertInput | null> {
  const apiKey = getFoursquareApiKey();
  const url = new URL(`${FOURSQUARE_BASE}/places/${fsqId}`);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      Authorization: apiKey,
    },
  });

  if (!res.ok) return null;

  const place = (await res.json()) as FoursquarePlace;
  if (!place.name || !place.geocodes?.main) return null;

  return normalizePlace(place);
}

function mapFoursquareCategory(_categories: { id: number; name: string }[] | undefined): string {
  // v1: keep it simple — everything goes to local_spots until we design
  // a proper mapping to Stayscape categories.
  return 'local_spots';
}

function normalizePlace(place: FoursquarePlace): PlaceUpsertInput {
  const coords = place.geocodes?.main;
  const loc = place.location ?? {};

  return {
    name: place.name ?? 'Unknown Place',
    slug: place.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    category: mapFoursquareCategory(place.categories),
    description: '',
    latitude: coords?.latitude ?? 0,
    longitude: coords?.longitude ?? 0,
    address: loc.formatted_address ?? '',
    address_line2: null,
    city: loc.locality ?? '',
    country_code: (loc.country ?? 'US').toUpperCase(),
    phone: null,
    website: null,
    image_url: null,
    external_source: 'foursquare',
    external_id: place.fsq_id,
  };
}
