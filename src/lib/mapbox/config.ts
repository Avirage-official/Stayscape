/**
 * Mapbox Configuration — Presentation Layer Only
 *
 * Mapbox is used exclusively for map rendering and styling.
 * It is NOT a data source — places/events come from Supabase
 * via the internal API layer.
 *
 * Rules:
 * - Dark map styling in BOTH light and dark app modes
 * - Token read from environment variable
 * - Support markers for places and events
 * - Support viewport bounds extraction for nearby queries
 */

import type { ViewportBounds, MapMarker } from '@/types/database';

/* ── Token ───────────────────────────────────────────────── */

/**
 * Returns the Mapbox public token, or empty string if not configured.
 * Safe for client-side use — this is a public token.
 * Read directly from process.env so Next.js inlines the value at build time.
 */
export function getMapboxToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
}

/**
 * Check whether Mapbox is configured and available.
 * Read directly from process.env so Next.js inlines the value at build time.
 */
export function isMapboxAvailable(): boolean {
  return (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '').length > 0;
}

/* ── Dark style (always used — per Stayscape design rules) ─ */

/**
 * Mapbox style URL. Always dark, regardless of app theme.
 * This preserves the Stayscape design rule that the map stays dark
 * in both light and dark mode.
 */
export const MAPBOX_DARK_STYLE = 'mapbox://styles/benobaj/cmnihne6s006s01se1eqtedtm';

/**
 * Fallback dark style from Mapbox's public gallery.
 * Used automatically if the custom style above fails to load.
 */
export const MAPBOX_DARK_STYLE_FALLBACK = 'mapbox://styles/mapbox/dark-v11';

/* ── Viewport bounds ─────────────────────────────────────── */

/**
 * Extract viewport bounds from a Mapbox map instance.
 * Useful for triggering nearby-places queries based on what
 * the user is currently viewing.
 */
export function extractViewportBounds(map: {
  getBounds: () => {
    getNorth: () => number;
    getSouth: () => number;
    getEast: () => number;
    getWest: () => number;
  };
}): ViewportBounds {
  const bounds = map.getBounds();
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

/* ── Marker helpers ──────────────────────────────────────── */

/**
 * Convert internal map markers to GeoJSON FeatureCollection
 * for use with Mapbox sources.
 */
export function markersToGeoJSON(markers: MapMarker[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map((marker) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.longitude, marker.latitude],
      },
      properties: {
        id: marker.id,
        type: marker.type,
        name: marker.name,
        category: marker.category,
        rating: marker.rating,
        is_featured: marker.is_featured,
      },
    })),
  };
}

/**
 * Stayscape gold color for map markers — matches the design system.
 */
export const MARKER_COLOR_GOLD = '#C9A84C';
export const MARKER_COLOR_DEFAULT = '#6B7280';
export const MARKER_COLOR_EVENT = '#8B5CF6';

/**
 * Category-specific marker colors for the premium place markers.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'Restaurants': '#F59E0B',
  'Bars & Drinks': '#8B5CF6',
  'Activities': '#14B8A6',
  'Shopping': '#F43F5E',
};

/**
 * Geolocation constants.
 */
export const GEOLOCATION_ZOOM = 15;
export const GEOLOCATION_FLY_DURATION = 1800;
export const GEOLOCATION_RECENTER_DURATION = 1200;
/** Distance threshold (in degrees ~0.003° ≈ 300 m) above which the re-center button appears. */
export const GEOLOCATION_RECENTER_THRESHOLD = 0.003;
