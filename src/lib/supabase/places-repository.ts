/**
 * Places Repository — Supabase data access layer.
 *
 * All database operations for the `places` and `place_tags` tables.
 * The repository returns canonical `InternalPlace` objects and accepts
 * the same shape for upserts so the rest of the codebase never touches
 * raw Supabase query builders.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  InternalPlace,
  PlaceTag,
  PlacesQueryParams,
  DiscoveryPlaceCard,
  DiscoveryPlaceDetail,
} from '@/types/database';

/* ── Helpers ─────────────────────────────────────────────── */

const METERS_PER_DEGREE_LATITUDE = 111000;

const CATEGORY_GRADIENTS: Record<string, string> = {
  dining: 'from-amber-900/80 via-amber-950/60 to-black/80',
  nightlife: 'from-purple-900/80 via-purple-950/60 to-black/80',
  shopping: 'from-rose-900/80 via-rose-950/60 to-black/80',
  nature: 'from-emerald-900/80 via-emerald-950/60 to-black/80',
  historical: 'from-stone-900/80 via-stone-950/60 to-black/80',
  wellness: 'from-teal-900/80 via-teal-950/60 to-black/80',
  family: 'from-blue-900/80 via-blue-950/60 to-black/80',
  events: 'from-red-900/80 via-red-950/60 to-black/80',
  // DB-aligned values (places.category as stored in Supabase)
  localspots: 'from-orange-900/80 via-orange-950/60 to-black/80',
  topplaces: 'from-yellow-900/80 via-yellow-950/60 to-black/80',
  // Legacy aliases (kept until all DB rows / writers are migrated)
  local_spots: 'from-orange-900/80 via-orange-950/60 to-black/80',
  fun_places: 'from-indigo-900/80 via-indigo-950/60 to-black/80',
  top_places: 'from-yellow-900/80 via-yellow-950/60 to-black/80',
};

export function gradientForCategory(category: string): string {
  return (
    CATEGORY_GRADIENTS[category] ??
    'from-gray-900/80 via-gray-950/60 to-black/80'
  );
}

/* ── Read operations ─────────────────────────────────────── */

export async function queryPlaces(
  supabase: SupabaseClient,
  params: PlacesQueryParams = {},
): Promise<InternalPlace[]> {
  let query = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false });

  if (params.region_id) query = query.eq('region_id', params.region_id);
  if (params.category) query = query.eq('category', params.category);
  if (params.featured_only) query = query.eq('is_featured', true);
  if (params.search) query = query.ilike('name', `%${params.search}%`);
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 20);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(`queryPlaces failed: ${error.message}`);
  return (data ?? []) as InternalPlace[];
}

export async function getPlaceById(
  supabase: SupabaseClient,
  id: string,
): Promise<InternalPlace | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') {
    throw new Error(`getPlaceById failed: ${error.message}`);
  }
  return (data as InternalPlace) ?? null;
}

export async function getPlaceTags(
  supabase: SupabaseClient,
  placeId: string,
): Promise<PlaceTag[]> {
  const { data, error } = await supabase
    .from('place_tags')
    .select('*')
    .eq('place_id', placeId);
  if (error) throw new Error(`getPlaceTags failed: ${error.message}`);
  return (data ?? []) as PlaceTag[];
}

/* ── Write operations (admin / sync) ─────────────────────── */

export interface PlaceUpsertInput {
  name: string;
  slug: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country_code: string;
  region_id?: string;
  subcategory?: string | null;
  editorial_summary?: string | null;
  address_line2?: string | null;
  phone?: string | null;
  website?: string | null;
  booking_url?: string | null;
  image_url?: string | null;
  image_urls?: string[];
  rating?: number | null;
  rating_count?: number | null;
  price_level?: number | null;
  opening_hours?: Record<string, unknown> | null;
  is_featured?: boolean;
  external_source: string;
  external_id: string;
}

/**
 * Upsert a place by (external_source, external_id).
 * Returns the upserted record and whether it was created or updated.
 */
export async function upsertPlace(
  supabase: SupabaseClient,
  input: PlaceUpsertInput,
): Promise<{ place: InternalPlace; created: boolean }> {
  // Check if record exists
  const { data: existing } = await supabase
    .from('places')
    .select('id')
    .eq('external_source', input.external_source)
    .eq('external_id', input.external_id)
    .maybeSingle();

  const now = new Date().toISOString();
  const record = {
    ...input,
    image_urls: input.image_urls ?? [],
    is_active: true,
    last_synced_at: now,
    updated_at: now,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('places')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(`upsertPlace update failed: ${error.message}`);
    return { place: data as InternalPlace, created: false };
  }

  const { data, error } = await supabase
    .from('places')
    .insert({ ...record, created_at: now })
    .select()
    .single();
  if (error) throw new Error(`upsertPlace insert failed: ${error.message}`);
  return { place: data as InternalPlace, created: true };
}

export interface GeoBounds {
  latitude: number;
  longitude: number;
  radius_meters: number;
}

/**
 * Deactivate places from a given source that weren't seen in the
 * latest sync (i.e., their `last_synced_at` is older than `since`).
 *
 * When `bounds` is provided the deactivation is scoped to the bounding box
 * of the synced area so that places in other geographic areas are not
 * incorrectly deactivated.
 */
export async function deactivateStalePlaces(
  supabase: SupabaseClient,
  source: string,
  regionId: string,
  since: string,
  bounds?: GeoBounds,
): Promise<number> {
  let query = supabase
    .from('places')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('external_source', source)
    .eq('region_id', regionId)
    .eq('is_active', true)
    .lt('last_synced_at', since);

  if (bounds) {
    const { latitude, longitude, radius_meters } = bounds;
    const latDelta = radius_meters / METERS_PER_DEGREE_LATITUDE;
    const lngDelta =
      radius_meters /
      (METERS_PER_DEGREE_LATITUDE * Math.cos((latitude * Math.PI) / 180));

    const south = latitude - latDelta;
    const north = latitude + latDelta;
    const west = longitude - lngDelta;
    const east = longitude + lngDelta;

    query = query
      .gte('latitude', south)
      .lte('latitude', north)
      .gte('longitude', west)
      .lte('longitude', east);
  }

  const { data, error } = await query.select('id');
  if (error) throw new Error(`deactivateStalePlaces failed: ${error.message}`);
  return data?.length ?? 0;
}

/* ── Shape for frontend consumption ──────────────────────── */

export function toDiscoveryCard(
  place: InternalPlace,
  tags: PlaceTag[] = [],
): DiscoveryPlaceCard {
  return {
    id: place.id,
    name: place.name,
    category: place.category as DiscoveryPlaceCard['category'],
    description: place.description,
    editorial_summary: place.editorial_summary,
    rating: place.rating,
    distance: null, // computed by the API layer relative to hotel
    image_url: place.image_url,
    gradient: gradientForCategory(place.category),
    booking_url: place.booking_url,
    price_level: place.price_level,
    tags: tags.filter((t) => t.tag_type === 'general').map((t) => t.tag),
    vibes: tags.filter((t) => t.tag_type === 'vibe').map((t) => t.tag),
    best_for: tags.filter((t) => t.tag_type === 'best_for').map((t) => t.tag),
    is_featured: place.is_featured,
  };
}

export function toDiscoveryDetail(
  place: InternalPlace,
  tags: PlaceTag[] = [],
): DiscoveryPlaceDetail {
  return {
    ...toDiscoveryCard(place, tags),
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    phone: place.phone,
    website: place.website,
    opening_hours: place.opening_hours,
    image_urls: place.image_urls,
    // These fields will be populated by AI enrichment later
    things_to_do: [],
    what_to_look_out_for: [],
    what_to_bring: [],
    recommended_duration: null,
    best_time_to_go: null,
  };
}

/**
 * Fetch places that need AI enrichment.
 * Priority order:
 *   1. Never enriched (ai_enriched_at IS NULL) first
 *   2. Within that group, most searched first
 *      (search_count DESC)
 *   3. Then stale (ai_enriched_at older than 30 days),
 *      again most searched first
 */
export async function getUnenrichedPlaces(
  supabase: SupabaseClient,
  options: { region_id?: string; limit?: number } = {},
): Promise<InternalPlace[]> {
  const limit = options.limit ?? 50;
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Query 1: Never enriched (ai_enriched_at IS NULL), most searched first
  let q1 = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .is('ai_enriched_at', null)
    .order('search_count', { ascending: false })
    .limit(limit);

  if (options.region_id) q1 = q1.eq('region_id', options.region_id);

  const { data: neverEnriched, error: e1 } = await q1;
  if (e1) throw new Error(`getUnenrichedPlaces failed: ${e1.message}`);

  const results = (neverEnriched ?? []) as InternalPlace[];
  if (results.length >= limit) return results.slice(0, limit);

  // Query 2: Stale (ai_enriched_at older than 30 days), most searched first
  const remaining = limit - results.length;
  let q2 = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .lt('ai_enriched_at', thirtyDaysAgo)
    .order('search_count', { ascending: false })
    .limit(remaining);

  if (options.region_id) q2 = q2.eq('region_id', options.region_id);

  const { data: stale, error: e2 } = await q2;
  if (e2) throw new Error(`getUnenrichedPlaces failed: ${e2.message}`);

  return [...results, ...((stale ?? []) as InternalPlace[])];
}
