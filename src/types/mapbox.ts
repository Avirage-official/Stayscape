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
   Directions API
   ════════════════════════════════════════════════════════════ */

export interface RouteStep {
  maneuver: {
    instruction: string;
    type: string;
    modifier?: string;
    bearing_after: number;
    bearing_before: number;
    location: [number, number];
  };
  distance: number; // metres
  duration: number; // seconds
  name: string;
  mode: string;
}

export interface RouteLeg {
  distance: number; // metres
  duration: number; // seconds
  steps: RouteStep[];
  summary: string;
}

export interface DirectionsRoute {
  distance: number; // metres
  duration: number; // seconds
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat] pairs
  };
  legs: RouteLeg[];
  weight: number;
  weight_name: string;
}

export interface DirectionsWaypoint {
  name: string;
  location: [number, number];
}

export interface DirectionsResponse {
  code: string; // 'Ok' | 'NoRoute' | 'NoSegment' | ...
  routes: DirectionsRoute[];
  waypoints: DirectionsWaypoint[];
  uuid: string;
}

/* ════════════════════════════════════════════════════════════
   UI Search Result (normalized shape used in MapSearch)
   ════════════════════════════════════════════════════════════ */

export interface SearchResult {
  /** Mapbox feature id */
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
  /** Straight-line distance from hotel in metres (computed client-side) */
  distanceMetres: number;
  /** Pre-formatted display string, e.g. "0.3 mi" */
  distanceDisplay: string;
}

export type DirectionsProfile = 'walking' | 'driving' | 'cycling';
