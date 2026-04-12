/**
 * Supabase data-access layer for Itinerary operations.
 *
 * Handles real database reads/writes to the itineraries and
 * itineraryitems tables. Falls back gracefully when the tables
 * are missing or the Supabase client is unavailable.
 */

import { getSupabaseBrowser } from '@/lib/supabase/client';

/* ── Raw DB row types ────────────────────────────────────── */

export interface DbItinerary {
  id: string;
  stayid?: string;
  userid?: string;
  createdat: string;
  updatedat?: string;
}

export interface DbItineraryItem {
  id: string;
  itineraryid: string;
  discoveritemid: string;
  name: string;
  category: string;
  image: string;
  scheduleddate: string;
  starttime: string;
  durationhours: number;
  createdat?: string;
  updatedat?: string;
}

/* ── Itinerary helpers ──────────────────────────────────── */

/**
 * Get or create the itinerary for the authenticated user's stay.
 * When `stayId` is omitted the lookup falls back to `userid` only,
 * so the itinerary still works without an active stay record.
 * Returns the itinerary id, or null if Supabase is unavailable.
 */
export async function getOrCreateItinerary(
  userId: string,
  stayId?: string,
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  // Try to find existing itinerary for this user (+ stay if provided)
  const findQuery = sb
    .from('itineraries')
    .select('id')
    .eq('userid', userId);

  if (stayId) {
    findQuery.eq('stayid', stayId);
  }

  const { data: existing, error: findErr } = await findQuery.limit(1).maybeSingle();

  if (findErr) return null;
  if (existing) return existing.id as string;

  // Create a new itinerary
  const insertPayload: Record<string, string> = { userid: userId };
  if (stayId) insertPayload.stayid = stayId;

  const { data: created, error: createErr } = await sb
    .from('itineraries')
    .insert({
      stayid: stayId ?? null,
      userid: userId,
    })
    .select('id')
    .single();

  if (createErr || !created) return null;
  return created.id as string;
}

/**
 * Insert a new item into the itinerary.
 * Returns the created row id, or null on failure.
 */
export async function insertItineraryItem(
  itineraryId: string,
  item: {
    discoveritemid: string;
    name: string;
    category: string;
    image: string;
    scheduleddate: string; // 'YYYY-MM-DD'
    starttime: string;     // 'HH:mm'
    durationhours: number;
  },
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('itineraryitems')
    .insert({
      itineraryid: itineraryId,
      discoveritemid: item.discoveritemid,
      name: item.name,
      category: item.category,
      image: item.image,
      scheduleddate: item.scheduleddate,
      starttime: item.starttime,
      durationhours: item.durationhours,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id as string;
}

/**
 * Update an existing itinerary item.
 * Returns true on success, false on failure.
 */
export async function updateItineraryItem(
  itemId: string,
  updates: {
    scheduleddate?: string;
    starttime?: string;
    durationhours?: number;
  },
): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;

  const { error } = await sb
    .from('itineraryitems')
    .update(updates)
    .eq('id', itemId);

  return !error;
}

/**
 * Remove an itinerary item.
 * Returns true on success, false on failure.
 */
export async function removeItineraryItem(itemId: string): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;

  const { error } = await sb
    .from('itineraryitems')
    .delete()
    .eq('id', itemId);

  return !error;
}

/**
 * Fetch all itinerary items for the authenticated user's (optional) stay.
 * Returns null if Supabase is unavailable or the table is missing.
 */
export async function fetchItineraryItems(
  userId: string,
  stayId?: string,
): Promise<DbItineraryItem[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  // First get the itinerary id
  const itinQuery = sb
    .from('itineraries')
    .select('id')
    .eq('userid', userId);

  if (stayId) {
    itinQuery.eq('stayid', stayId);
  }

  const { data: itin, error: itinErr } = await itinQuery.limit(1).maybeSingle();

  if (itinErr || !itin) return null;

  const { data, error } = await sb
    .from('itineraryitems')
    .select('*')
    .eq('itineraryid', itin.id)
    .order('scheduleddate', { ascending: true })
    .order('starttime', { ascending: true });

  if (error || !data) return null;

  return data as DbItineraryItem[];
}
