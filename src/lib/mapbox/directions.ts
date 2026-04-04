/**
 * Mapbox Directions API Service
 *
 * Wraps the Mapbox Directions v5 API for routing between two points.
 * All requests are client-side (public token, safe for browser use).
 *
 * Endpoint: https://api.mapbox.com/directions/v5/mapbox/{profile}/{coordinates}
 */

import { getMapboxToken } from '@/lib/mapbox/config';
import {
  MAPBOX_DIRECTIONS_URL,
  DEFAULT_DIRECTIONS_PROFILE,
  ROUTE_LINE_COLOR,
  ROUTE_LINE_OPACITY,
  ROUTE_LINE_WIDTH,
  ROUTE_LINE_DASH,
} from '@/lib/mapbox/config';
import type { DirectionsResponse, DirectionsRoute, DirectionsProfile } from '@/types/mapbox';

/* ── Hotel coordinates used as default origin ─────────────── */
const HOTEL_LAT = 40.7649;
const HOTEL_LNG = -73.9733;

/* ── Coordinate helper ────────────────────────────────────── */

export interface LatLng {
  lat: number;
  lng: number;
}

/* ── Core Directions fetch ────────────────────────────────── */

/**
 * Fetch a route from the Mapbox Directions API.
 *
 * Returns the first route (best match) or null if the request fails / no route found.
 */
export async function getDirections(
  origin: LatLng,
  destination: LatLng,
  profile: DirectionsProfile = DEFAULT_DIRECTIONS_PROFILE,
): Promise<DirectionsRoute | null> {
  const token = getMapboxToken();
  if (!token) {
    console.warn('[Stayscape Map] Directions skipped — Mapbox token not set');
    return null;
  }

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const params = new URLSearchParams({
    access_token: token,
    geometries: 'geojson',
    overview: 'full',
    steps: 'false',
    language: 'en',
  });

  const url = `${MAPBOX_DIRECTIONS_URL}/${profile}/${coordinates}?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Stayscape Map] Directions API returned ${res.status}`);
      return null;
    }
    const data: DirectionsResponse = await res.json();
    if (data.code !== 'Ok' || data.routes.length === 0) {
      console.warn('[Stayscape Map] Directions API: no route found (code:', data.code, ')');
      return null;
    }
    return data.routes[0];
  } catch (err) {
    console.warn('[Stayscape Map] Directions request failed:', err);
    return null;
  }
}

/* ── Convenience wrappers ─────────────────────────────────── */

/**
 * Returns a human-readable walking duration string, e.g. "5 min walk".
 * Returns null if the route cannot be computed.
 */
export async function getWalkingTime(from: LatLng, to: LatLng): Promise<string | null> {
  const route = await getDirections(from, to, 'walking');
  if (!route) return null;
  return formatDuration(route.duration);
}

/**
 * Returns walking time from the hotel to the given destination.
 * Convenience wrapper using the hotel as the default origin.
 */
export async function getDistanceFromHotel(destination: LatLng): Promise<string | null> {
  return getWalkingTime({ lat: HOTEL_LAT, lng: HOTEL_LNG }, destination);
}

/* ── Duration formatting ──────────────────────────────────── */

/**
 * Format a duration in seconds to a concise human-readable string.
 * e.g. 300 → "5 min walk", 3900 → "1 hr 5 min walk"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return '< 1 min walk';
  if (mins < 60) return `${mins} min walk`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min walk` : `${hrs} hr walk`;
}

/* ── Mapbox GL source/layer helpers ───────────────────────── */

export const ROUTE_SOURCE_ID = 'stayscape-route';
export const ROUTE_LAYER_ID = 'stayscape-route-line';

/**
 * Build the Mapbox GL GeoJSON source data for a route geometry.
 */
export function buildRouteGeoJSON(route: DirectionsRoute): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    geometry: route.geometry,
    properties: {},
  };
}

/**
 * Add (or update) the route line on a Mapbox GL map instance.
 * Idempotent — safe to call multiple times; updates source data if layer already exists.
 */
export function addRouteToMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  route: DirectionsRoute,
): void {
  const geojson = buildRouteGeoJSON(route);

  if (map.getSource(ROUTE_SOURCE_ID)) {
    // Update existing source
    map.getSource(ROUTE_SOURCE_ID).setData(geojson);
  } else {
    map.addSource(ROUTE_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
    });

    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ROUTE_LINE_COLOR,
        'line-width': ROUTE_LINE_WIDTH,
        'line-opacity': ROUTE_LINE_OPACITY,
        'line-dasharray': ROUTE_LINE_DASH,
      },
    });
  }
}

/**
 * Remove the route source and layer from the map if they exist.
 */
export function removeRouteFromMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
): void {
  try {
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
  } catch (err) {
    console.warn('[Stayscape Map] Error removing route layer:', err);
  }
}
