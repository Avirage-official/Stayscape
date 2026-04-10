import { CATEGORY_COLORS } from '@/lib/mapbox/config';

/* ─── Default center coordinates (Singapore Central) ─── */
export const DEFAULT_CENTER = { lat: 1.2897, lng: 103.8501 };
export const DEFAULT_ITINERARY_TIME = '10:00';
export const DEFAULT_ITINERARY_DURATION_HOURS = 2;

/* ─── Map source / layer identifiers ─── */
export const SOURCE_ID = 'stayscape-places';
export const CLUSTER_LAYER = 'stayscape-clusters';
export const CLUSTER_COUNT_LAYER = 'stayscape-cluster-count';
export const UNCLUSTERED_LAYER = 'stayscape-unclustered';
export const LABEL_LAYER = 'stayscape-labels';

/* ─── Dot / marker colors ─── */
export const MARKER_COLOR_GREEN = '#22C55E'; /* bright green — individual place dots */
export const MARKER_COLOR_PINK = CATEGORY_COLORS['events']; /* #EC4899 — event dots */
export const SELECTED_DOT_COLOR = '#FFFFFF'; /* selected dot — white with glow */
export const ANIMATION_GREEN = '#4ADE80'; /* bright green used in sonar ping and itinerary fly animation */

/* ─── Viewport fetch settings ─── */
export const VIEWPORT_FETCH_LIMIT = 500; /* max places fetched per viewport query */

/* ─── 3D buildings layer styling ─── */
export const BUILDINGS_3D_COLOR = '#1a1a2e'; /* dark blue-black to match Stayscape aesthetic */
export const BUILDINGS_3D_OPACITY = 0.7;
export const BUILDINGS_3D_MINZOOM = 13;

/* ─── Itinerary fly animation ─── */
export const ITINERARY_CORNER_OFFSET = 28; /* px from bottom-right edge of container */

/* ─── Filter panel positioning ─── */
export const FILTER_PANEL_TOP = '33%'; /* left-side toggle button vertical position */

/* ─── Category filter options ─── */
export const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'dining', label: 'Dining' },
  { key: 'top_places', label: 'Top Places' },
  { key: 'nightlife', label: 'Nightlife' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'fun_places', label: 'Fun Places' },
  { key: 'nature', label: 'Nature' },
  { key: 'historical', label: 'Historical' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'events', label: 'Events' },
];
