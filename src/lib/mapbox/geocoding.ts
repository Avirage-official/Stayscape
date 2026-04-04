/**
 * Mapbox Geocoding API Service
 *
 * Wraps the Mapbox Geocoding v5 API for forward and reverse geocoding.
 * All requests are client-side (public token, safe for browser use).
 *
 * Endpoint: https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json
 */

import { getMapboxToken } from '@/lib/mapbox/config';
import {
  MAPBOX_GEOCODING_URL,
  DEFAULT_SEARCH_LIMIT,
  SEARCH_DEBOUNCE_MS,
} from '@/lib/mapbox/config';
import type { GeocodingFeature, GeocodingResponse, SearchResult } from '@/types/mapbox';

/* ── Hotel coordinates used as proximity bias ─────────────── */
const HOTEL_LAT = 40.7649;
const HOTEL_LNG = -73.9733;

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Compute approximate straight-line distance in metres between two lat/lng points
 * using the Haversine formula.
 */
export function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format a distance in metres to a concise display string.
 * Uses miles (imperial) to match the Stayscape sample data style.
 */
export function formatDistanceDisplay(metres: number): string {
  const miles = metres / 1609.344;
  if (miles < 0.1) return `${Math.round(metres)} m`;
  return `${miles.toFixed(1)} mi`;
}

/**
 * Normalize a raw GeocodingFeature into the UI-friendly SearchResult shape.
 */
export function normalizeFeature(feature: GeocodingFeature): SearchResult {
  const [lng, lat] = feature.center;
  const distanceMetres = haversineMetres(HOTEL_LAT, HOTEL_LNG, lat, lng);

  // Build a short subtitle: prefer properties.category, then first context text, then place_type
  const subtitle =
    feature.properties?.category ||
    feature.context?.[0]?.text ||
    feature.place_type[0] ||
    '';

  return {
    id: feature.id,
    name: feature.text,
    fullAddress: feature.place_name,
    subtitle,
    lat,
    lng,
    distanceMetres,
    distanceDisplay: formatDistanceDisplay(distanceMetres),
  };
}

/* ── Forward Geocoding ────────────────────────────────────── */

export interface SearchPlacesOptions {
  /** Maximum results to return (default: DEFAULT_SEARCH_LIMIT) */
  limit?: number;
  /** Proximity bias — defaults to hotel center */
  proximityLng?: number;
  proximityLat?: number;
  /** Comma-separated Mapbox feature types */
  types?: string;
  /** BCP-47 language tag for results */
  language?: string;
}

/**
 * Forward geocoding: text query → list of place candidates.
 *
 * Biases results toward the hotel location so that nearby places
 * rank higher in the autocomplete dropdown.
 */
export async function searchPlaces(
  query: string,
  options: SearchPlacesOptions = {},
): Promise<SearchResult[]> {
  const token = getMapboxToken();
  if (!token) {
    console.warn('[Stayscape Map] Geocoding skipped — Mapbox token not set');
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const {
    limit = DEFAULT_SEARCH_LIMIT,
    proximityLng = HOTEL_LNG,
    proximityLat = HOTEL_LAT,
    types = 'poi,address,neighborhood',
    language = 'en',
  } = options;

  const encoded = encodeURIComponent(trimmed);
  const params = new URLSearchParams({
    access_token: token,
    proximity: `${proximityLng},${proximityLat}`,
    limit: String(limit),
    types,
    language,
  });

  const url = `${MAPBOX_GEOCODING_URL}/${encoded}.json?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Stayscape Map] Geocoding API returned ${res.status}`);
      return [];
    }
    const data: GeocodingResponse = await res.json();
    return data.features.map(normalizeFeature);
  } catch (err) {
    console.warn('[Stayscape Map] Geocoding request failed:', err);
    return [];
  }
}

/* ── Reverse Geocoding ────────────────────────────────────── */

/**
 * Reverse geocoding: coordinates → place name string.
 *
 * Returns the most relevant place name or null if the request fails.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const token = getMapboxToken();
  if (!token) {
    console.warn('[Stayscape Map] Reverse geocoding skipped — Mapbox token not set');
    return null;
  }

  const params = new URLSearchParams({
    access_token: token,
    types: 'poi,address',
    limit: '1',
    language: 'en',
  });

  const url = `${MAPBOX_GEOCODING_URL}/${lng},${lat}.json?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Stayscape Map] Reverse geocoding API returned ${res.status}`);
      return null;
    }
    const data: GeocodingResponse = await res.json();
    return data.features[0]?.place_name ?? null;
  } catch (err) {
    console.warn('[Stayscape Map] Reverse geocoding request failed:', err);
    return null;
  }
}

/* ── Debounce Helper ──────────────────────────────────────── */

/**
 * Creates a debounced version of `searchPlaces` for search-as-you-type.
 * Default debounce delay matches SEARCH_DEBOUNCE_MS (300 ms).
 */
export function createDebouncedSearch(
  callback: (results: SearchResult[]) => void,
  delay: number = SEARCH_DEBOUNCE_MS,
): (query: string, options?: SearchPlacesOptions) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (query: string, options?: SearchPlacesOptions) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const results = await searchPlaces(query, options);
      callback(results);
    }, delay);
  };
}
