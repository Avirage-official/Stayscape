/**
 * Supabase data-access layer for Itinerary operations.
 *
 * Handles real database reads/writes to the itineraries and
 * itineraryitems tables. Falls back gracefully when the tables
 * are missing or the Supabase client is unavailable.
 *
 * Schema notes (source of truth: Supabase):
 *   itineraries.stayid  — uuid NOT NULL UNIQUE (one itinerary per stay)
 *   itineraries.userid  — uuid NOT NULL
 *   itineraries.title   — varchar (nullable)
 *   itineraries.status  — itinerarystatus enum, default 'active'
 *
 *   itineraryitems.status — itineraryitemstatus enum, default 'planned'
 *   itineraryitems.source — itemsource enum, default 'discover'
 *
 *   itineraryitemsnapshots — related table (1:1 with itineraryitems via
 *     UNIQUE FK). Stores a denormalized copy of discover-item data at
 *     the time the itinerary item was created. Not currently written or
 *     read by this repository — see ItineraryItemSnapshot in
 *     types/database for the schema shape.
 */

import { getSupabaseBrowser } from '@/lib/supabase/client';
import type {
  ItineraryStatus,
  ItineraryItemStatus,
  ItemSource,
} from '@/types/enums';

/* ── Raw DB row types ────────────────────────────────────── */

/** Matches the real Supabase `itineraries` table. */
export interface DbItinerary {
  id: string;
  /** NOT NULL UNIQUE — every itinerary belongs to exactly one stay. */
  stayid: string;
  /** NOT NULL — the owning user. */
  userid: string;
  title: string | null;
  /** itinerarystatus enum — default 'active'. */
  status: ItineraryStatus;
  createdat: string;
  updatedat: string;
}

/** Matches the real Supabase `itineraryitems` table. */
export interface DbItineraryItem {
  id: string;
  itineraryid: string;
  discoveritemid: string | null;
  scheduleddate: string;
  starttime: string | null;
  durationhours: number | null;
  endtime: string | null;
  titleoverride: string | null;
  notes: string | null;
  /** itineraryitemstatus enum, default 'planned'. */
  status: ItineraryItemStatus;
  /** itemsource enum, default 'discover'. */
  source: ItemSource;
  createdat: string;
  updatedat: string;
  name: string | null;
  category: string | null;
  image: string | null;
}

/* ── Itinerary helpers ──────────────────────────────────── */

/**
 * Get or create the itinerary for the authenticated user's stay.
 *
 * The real Supabase schema requires `itineraries.stayid` to be NOT NULL
 * and UNIQUE (one itinerary per stay). Both userId and stayId are mandatory.
 *
 * Returns the itinerary id, or null if:
 *  - Supabase is unavailable, or
 *  - the insert/lookup fails.
 */
export async function getOrCreateItinerary(
  userId: string,
  stayId?: string,
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  // Guard: the real schema enforces stayid NOT NULL.
  // If callers don't have a stayId yet we cannot safely create an itinerary.
  if (!stayId) {
    console.warn('[itinerary] getOrCreateItinerary called without stayId — cannot insert (stayid is NOT NULL in schema).');
    // Still attempt to find an existing itinerary for this user as a read-only fallback
    const { data: fallback } = await sb
      .from('itineraries')
      .select('id')
      .eq('userid', userId)
      .limit(1)
      .maybeSingle();
    return fallback ? (fallback.id as string) : null;
  }

  // Try to find existing itinerary for this stay (UNIQUE constraint)
  const { data: existing, error: findErr } = await sb
    .from('itineraries')
    .select('id')
    .eq('stayid', stayId)
    .limit(1)
    .maybeSingle();

  if (findErr) return null;
  if (existing) return existing.id as string;

  // Create a new itinerary — stayid is always provided here
  const { data: created, error: createErr } = await sb
    .from('itineraries')
    .insert({
      stayid: stayId,
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
 *
 * When stayId is provided, lookup is via the UNIQUE stayid constraint
 * (preferred). Falls back to userid-only lookup for read paths where
 * stayId may not yet be available.
 */
export async function fetchItineraryItems(
  userId: string,
  stayId?: string,
): Promise<DbItineraryItem[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  // First get the itinerary id — prefer by stayId (UNIQUE), fallback to userId
  let itinQuery;
  if (stayId) {
    itinQuery = sb
      .from('itineraries')
      .select('id')
      .eq('stayid', stayId)
      .limit(1)
      .maybeSingle();
  } else {
    itinQuery = sb
      .from('itineraries')
      .select('id')
      .eq('userid', userId)
      .limit(1)
      .maybeSingle();
  }

  const { data: itin, error: itinErr } = await itinQuery;

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
