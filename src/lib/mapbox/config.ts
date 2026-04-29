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

/* ── Token ───────────────────────────────────────────────── */

/**
 * Returns the Mapbox public token, or empty string if not configured.
 * Safe for client-side use — this is a public token.
 * Read directly from process.env so Next.js inlines the value at build time.
 */
const _MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export function getMapboxToken(): string {
  return _MAPBOX_TOKEN;
}

export function isMapboxAvailable(): boolean {
  return _MAPBOX_TOKEN.length > 0;
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

/**
 * Stayscape gold color for map markers — matches the design system.
 */
export const MARKER_COLOR_GOLD = '#C9A84C';

/**
 * Category-specific marker colors for the premium place markers.
 * Covers all database categories (PlaceCategory in src/types/database.ts).
 */
export const CATEGORY_COLORS: Record<string, string> = {
  /* Database categories */
  dining: '#F59E0B',
  nightlife: '#8B5CF6',
  shopping: '#F43F5E',
  nature: '#10B981',
  historical: '#F97316',
  wellness: '#06B6D4',
  family: '#3B82F6',
  events: '#EC4899',
  local_spots: '#84CC16',
  fun_places: '#14B8A6',
  top_places: '#C9A84C',
  /* Legacy display-name categories (kept for backwards compatibility) */
  'Restaurants': '#F59E0B',
  'Bars & Drinks': '#8B5CF6',
  'Activities': '#14B8A6',
  'Shopping': '#F43F5E',
};

/* ── Geocoding API ───────────────────────────────────────── */

export const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_SEARCH_LIMIT = 5;

/* ── Geolocation constants ───────────────────────────────── */

/**
 * Geolocation constants.
 */
export const GEOLOCATION_ZOOM = 15;
export const GEOLOCATION_FLY_DURATION = 1800;
export const GEOLOCATION_RECENTER_DURATION = 1200;
/** Distance threshold (in degrees ~0.003° ≈ 300 m) above which the re-center button appears. */
export const GEOLOCATION_RECENTER_THRESHOLD = 0.003;
/** Delay (ms) before auto-requesting geolocation on map load, so the map renders first. */
export const GEOLOCATION_AUTO_REQUEST_DELAY = 1000;
