/**
 * Mapbox API Types — Geocoding & Directions
 *
 * Type definitions for Mapbox Geocoding and Directions API responses,
 * plus the normalized SearchResult shape used in the UI.
 */

/* ════════════════════════════════════════════════════════════
   Geocoding API
   ════════════════════════════════════════════════════════════ */

export interface GeocodingContext {
  id: string;
  text: string;
  short_code?: string;
  wikidata?: string;
}

export interface GeocodingFeature {
  id: string;
  type: 'Feature';
  place_type: string[];
  relevance: number;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  context?: GeocodingContext[];
  properties?: {
    category?: string;
    maki?: string;
    landmark?: boolean;
    address?: string;
    foursquare?: string;
  };
}

export interface GeocodingResponse {
  type: 'FeatureCollection';
  query: string[];
  features: GeocodingFeature[];
  attribution: string;
}

/* ════════════════════════════════════════════════════════════
   UI Search Result (normalized shape used in MapSearch)
   ════════════════════════════════════════════════════════════ */

export interface SearchResult {
  /** Mapbox feature id or supabase-{uuid} */
  id: string;
  /** Short display name (e.g. "Nobu Restaurant") */
  name: string;
  /** Full formatted address / place name */
  fullAddress: string;
  /** Short secondary line shown in the dropdown (category or address excerpt) */
  subtitle: string;
  /** Coordinates */
  lat: number;
  lng: number;
  /** Straight-line distance from region center in metres (computed client-side) */
  distanceMetres: number;
  /** Pre-formatted display string, e.g. "2.3 km" */
  distanceDisplay: string;
  /** Origin of this result — 'supabase' for local places, 'mapbox' for geocoding */
  source?: 'supabase' | 'mapbox';
}
