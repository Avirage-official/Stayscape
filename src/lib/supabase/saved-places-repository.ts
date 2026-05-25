/**
 * Supabase data-access layer for saved_places.
 *
 * saved_places is a simple wishlist — users bookmark places they want to
 * visit without committing to a scheduled date. When ready to plan, they
 * move items from here into an itinerary.
 *
 * Schema (live Supabase after migration 20260525000001):
 *   saved_places(id, user_id, place_id, created_at)
 *   UNIQUE(user_id, place_id)
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';

/* ── Types ───────────────────────────────────────────────────── */

export interface DbSavedPlace {
  id: string;
  user_id: string;
  place_id: string;
  created_at: string;
}

export interface DbSavedPlaceEnriched extends DbSavedPlace {
  places: {
    id: string;
    name: string;
    category: string | null;
    latitude: number;
    longitude: number;
    image_url: string | null;
    address: string;
    city: string;
    editorial_summary: string | null;
    price_level: number | null;
    rating: number | null;
    recommended_duration: string | null;
  } | null;
}

/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * List all saved places for a user, with joined place data.
 * Ordered newest first.
 */
export async function getSavedPlaces(
  userId: string,
): Promise<DbSavedPlaceEnriched[] | null> {
  const sb = getSupabaseAdmin();

  const { data, error } = await sb
    .from('saved_places')
    .select(`
      id, user_id, place_id, created_at,
      places (
        id, name, category, latitude, longitude,
        image_url, address, city, editorial_summary,
        price_level, rating, recommended_duration
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[saved-places] getSavedPlaces failed:', error.message);
    return null;
  }

  return data as unknown as DbSavedPlaceEnriched[];
}

/**
 * Save a place for a user.
 * Returns the new row id, or null if it already exists / on failure.
 * Callers should handle the duplicate case gracefully (treat as success).
 */
export async function savePlace(
  userId: string,
  placeId: string,
): Promise<string | null> {
  const sb = getSupabaseAdmin();

  const { data, error } = await sb
    .from('saved_places')
    .insert({ user_id: userId, place_id: placeId })
    .select('id')
    .single();

  if (error) {
    // 23505 = unique_violation — already saved, not an error
    if (error.code === '23505') {
      const { data: existing } = await sb
        .from('saved_places')
        .select('id')
        .eq('user_id', userId)
        .eq('place_id', placeId)
        .single();
      return existing ? (existing.id as string) : null;
    }
    console.error('[saved-places] savePlace failed:', error.message);
    return null;
  }

  return data.id as string;
}

/**
 * Remove a saved place for a user.
 * Returns true on success (including if it didn't exist).
 */
export async function unsavePlace(
  userId: string,
  placeId: string,
): Promise<boolean> {
  const sb = getSupabaseAdmin();

  const { error } = await sb
    .from('saved_places')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId);

  if (error) {
    console.error('[saved-places] unsavePlace failed:', error.message);
    return false;
  }
  return true;
}

/**
 * Check whether a specific place is saved by the user.
 */
export async function isPlaceSaved(
  userId: string,
  placeId: string,
): Promise<boolean> {
  const sb = getSupabaseAdmin();

  const { data } = await sb
    .from('saved_places')
    .select('id')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .maybeSingle();

  return !!data;
}
