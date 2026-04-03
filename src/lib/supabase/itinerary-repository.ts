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
  stay_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface DbItineraryItem {
  id: string;
  itinerary_id: string;
  discoveritemid: string;
  name: string;
  category: string;
  image: string;
  scheduleddate: string;
  starttime: string;
  durationhours: number;
  created_at?: string;
  updated_at?: string;
}

/* ── Placeholder stay / user IDs (no auth yet) ──────────── */

const PLACEHOLDER_STAY_ID = 'default-stay';
const PLACEHOLDER_USER_ID = 'default-user';

/* ── Itinerary helpers ──────────────────────────────────── */

/**
 * Get or create the itinerary for the current stay.
 * Returns the itinerary id, or null if Supabase is unavailable.
 */
export async function getOrCreateItinerary(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  // Try to find existing itinerary for the current stay
  const { data: existing, error: findErr } = await sb
    .from('itineraries')
    .select('id')
    .eq('stay_id', PLACEHOLDER_STAY_ID)
    .limit(1)
    .maybeSingle();

  if (findErr) return null;
  if (existing) return existing.id as string;

  // Create a new itinerary
  const { data: created, error: createErr } = await sb
    .from('itineraries')
    .insert({
      stay_id: PLACEHOLDER_STAY_ID,
      user_id: PLACEHOLDER_USER_ID,
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
      itinerary_id: itineraryId,
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
 * Fetch all itinerary items for the current stay.
 * Returns null if Supabase is unavailable or the table is missing.
 */
export async function fetchItineraryItems(): Promise<DbItineraryItem[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  // First get the itinerary id
  const { data: itin, error: itinErr } = await sb
    .from('itineraries')
    .select('id')
    .eq('stay_id', PLACEHOLDER_STAY_ID)
    .limit(1)
    .maybeSingle();

  if (itinErr || !itin) return null;

  const { data, error } = await sb
    .from('itineraryitems')
    .select('*')
    .eq('itinerary_id', itin.id)
    .order('scheduleddate', { ascending: true })
    .order('starttime', { ascending: true });

  if (error || !data) return null;

  return data as DbItineraryItem[];
}
