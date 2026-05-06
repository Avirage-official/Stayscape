/**
 * Mapbox Configuration — Presentation Layer Only
 *
 * Mapbox is used exclusively for map rendering and styling.
 * It is NOT a data source — places/events come from Supabase
 * via the internal API layer.
 *
 * Rules:
 * - Custom illustrated map style ("Sage & Stone") used in BOTH light/dark app modes
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
// Read at module level so Next.js/Turbopack inlines the value at build time
const _TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export function getMapboxToken(): string {
  return _TOKEN;
}

export function isMapboxAvailable(): boolean {
  return _TOKEN.length > 0;
}

/* ── Map style ───────────────────────────────────────────── */

/**
 * Stayscape's custom Mapbox style URL.
 *
 * "Sage & Stone" — illustrated, complementary palette to the espresso UI.
 * Warm taupe land, muted sage parks, soft slate water, cream roads,
 * dark-warm-brown italic city labels.
 *
 * Style was uploaded as JSON to Mapbox Studio and published.
 * Source JSON lives in /public/mapbox-styles/stayscape-sage-stone.style.json.
 *
 * The constant name `MAPBOX_DARK_STYLE` is kept for backwards-compatibility —
 * everywhere in the codebase that imports it now resolves to the new style
 * with no further changes needed.
 */
export const MAPBOX_DARK_STYLE = 'mapbox://styles/benobaj/cmotgvak6008201r83sb92yw9';

/**
 * Fallback style if the custom style above fails to load.
 * Stock Mapbox Light — closest visual match to "Sage & Stone" out of the box.
 */
export const MAPBOX_DARK_STYLE_FALLBACK = 'mapbox://styles/mapbox/light-v11';

/**
 * Stayscape gold color for map markers — matches the design system.
 */
export const MARKER_COLOR_GOLD = '#C9A875';

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
  top_places: '#C9A875',
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
