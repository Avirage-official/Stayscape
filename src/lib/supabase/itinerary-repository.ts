/**
 * Supabase data-access layer for Itinerary operations.
 *
 * Schema notes (source of truth: live Supabase):
 *   itineraries.stayid    — uuid UNIQUE, NULLABLE (null = standalone itinerary)
 *   itineraries.userid    — uuid NOT NULL (always the owner)
 *   itineraries.title     — varchar (nullable)
 *   itineraries.status    — itinerarystatus enum, default 'active'
 *
 *   itineraryitems.place_id      — uuid → places(id)  ← CORRECT column name
 *   itineraryitems.titleoverride — optional name override
 *   itineraryitems.name          — varchar (display)
 *   itineraryitems.category      — varchar (display)
 *   itineraryitems.image         — text (display)
 *   itineraryitems.notes         — text
 *   itineraryitems.status        — itineraryitemstatus enum, default 'planned'
 *   itineraryitems.source        — itemsource enum, default 'discover'
 *
 * Two modes:
 *   Hotel guest   — stayid is set (UNIQUE per stay), one itinerary per stay
 *   Standalone    — stayid is NULL, userid identifies ownership, multiple allowed
 *
 * Previous code used `discoveritemid` which DOES NOT EXIST in the live
 * schema — it was a leftover from a prior migration. All references now
 * use `place_id`.
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
  /** null for standalone itineraries (no hotel booking). */
  stayid: string | null;
  userid: string;
  title: string | null;
  status: ItineraryStatus;
  createdat: string;
  updatedat: string;
}

/** Itinerary row enriched with stay + property context (for listing). */
export interface DbItineraryListed extends DbItinerary {
  stays: {
    checkindate: string;
    checkoutdate: string;
    properties: { name: string } | null;
  } | null;
}

/** Matches the real Supabase `itineraryitems` table. */
export interface DbItineraryItem {
  id: string;
  itineraryid: string;
  /** UUID of the places row — maps to places.id. */
  place_id: string | null;
  scheduleddate: string;
  starttime: string | null;
  durationhours: number | null;
  endtime: string | null;
  titleoverride: string | null;
  notes: string | null;
  status: ItineraryItemStatus;
  source: ItemSource;
  createdat: string;
  updatedat: string;
  /** Display columns directly on itineraryitems. */
  name: string | null;
  category: string | null;
  image: string | null;
}

/**
 * Enriched row returned by fetchItineraryItems — includes the joined
 * place data so the UI can render coords/category/image without a
 * second round-trip.
 */
export interface DbItineraryItemEnriched extends DbItineraryItem {
  places: {
    id: string;
    name: string;
    category: string | null;
    latitude: number;
    longitude: number;
    image_url: string | null;
  } | null;
}

/* ── Itinerary helpers ──────────────────────────────────── */

/**
 * Get or create the itinerary for the authenticated user's stay.
 * One itinerary per stay (UNIQUE on stayid when non-null).
 * For standalone itineraries use createStandaloneItinerary() instead.
 */
export async function getOrCreateItinerary(
  userId: string,
  stayId: string,
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data: existing, error: findErr } = await sb
    .from('itineraries')
    .select('id')
    .eq('stayid', stayId)
    .limit(1)
    .maybeSingle();

  if (findErr) return null;
  if (existing) return existing.id as string;

  const { data: created, error: createErr } = await sb
    .from('itineraries')
    .insert({ stayid: stayId, userid: userId })
    .select('id')
    .single();

  if (createErr || !created) return null;
  return created.id as string;
}

/**
 * Create a standalone itinerary (stayid = NULL) for a non-hotel user.
 * Returns the new itinerary id, or null on failure.
 */
export async function createStandaloneItinerary(
  userId: string,
  title?: string,
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('itineraries')
    .insert({ userid: userId, stayid: null, title: title ?? null })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[itinerary] createStandaloneItinerary failed:', error?.message);
    return null;
  }
  return data.id as string;
}

/**
 * List all itineraries for a user — both stay-linked and standalone.
 * Returns lightweight rows with stay context for the listing UI.
 * Ordered by most recently updated first.
 */
export async function listUserItineraries(
  userId: string,
): Promise<DbItineraryListed[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('itineraries')
    .select(`
      id, stayid, userid, title, status, createdat, updatedat,
      stays ( checkindate, checkoutdate, properties ( name ) )
    `)
    .eq('userid', userId)
    .order('updatedat', { ascending: false });

  if (error) {
    console.error('[itinerary] listUserItineraries failed:', error.message);
    return null;
  }

  return data as unknown as DbItineraryListed[];
}

/**
 * Get a single itinerary by id, verifying it belongs to the user.
 */
export async function getItineraryById(
  itineraryId: string,
  userId: string,
): Promise<DbItineraryListed | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('itineraries')
    .select(`
      id, stayid, userid, title, status, createdat, updatedat,
      stays ( checkindate, checkoutdate, properties ( name ) )
    `)
    .eq('id', itineraryId)
    .eq('userid', userId)
    .maybeSingle();

  if (error) {
    console.error('[itinerary] getItineraryById failed:', error.message);
    return null;
  }

  return data as unknown as DbItineraryListed | null;
}

/**
 * Update the title of an itinerary.
 * Ownership check via userid ensures users can only edit their own.
 */
export async function updateItineraryTitle(
  itineraryId: string,
  userId: string,
  title: string,
): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;

  const { error } = await sb
    .from('itineraries')
    .update({ title, updatedat: new Date().toISOString() })
    .eq('id', itineraryId)
    .eq('userid', userId);

  if (error) {
    console.error('[itinerary] updateItineraryTitle failed:', error.message);
    return false;
  }
  return true;
}

/**
 * Delete a standalone itinerary and all its items.
 * Refuses to delete stay-linked itineraries — those are managed by the stay lifecycle.
 * Returns 'deleted' | 'not_found' | 'stay_linked' | 'error'.
 */
export async function deleteStandaloneItinerary(
  itineraryId: string,
  userId: string,
): Promise<'deleted' | 'not_found' | 'stay_linked' | 'error'> {
  const sb = getSupabaseBrowser();
  if (!sb) return 'error';

  const { data: itin, error: findErr } = await sb
    .from('itineraries')
    .select('id, stayid')
    .eq('id', itineraryId)
    .eq('userid', userId)
    .maybeSingle();

  if (findErr) return 'error';
  if (!itin) return 'not_found';
  if (itin.stayid !== null) return 'stay_linked';

  // Delete items first (FK constraint), then the itinerary
  await sb.from('itineraryitems').delete().eq('itineraryid', itineraryId);

  const { error: delErr } = await sb
    .from('itineraries')
    .delete()
    .eq('id', itineraryId);

  if (delErr) {
    console.error('[itinerary] deleteStandaloneItinerary failed:', delErr.message);
    return 'error';
  }
  return 'deleted';
}

/**
 * Insert a new item into the itinerary.
 * Returns the created row id, or null on failure.
 */
export async function insertItineraryItem(
  itineraryId: string,
  item: {
    /** itineraryitems.place_id — UUID of the place. */
    place_id: string | null;
    /** itineraryitems.titleoverride — optional display override. */
    titleoverride: string | null;
    scheduleddate: string; // 'YYYY-MM-DD'
    starttime: string;     // 'HH:mm'
    durationhours: number;
    /** Display fields cached on the item itself. */
    name?: string | null;
    category?: string | null;
    image?: string | null;
  },
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('itineraryitems')
    .insert({
      itineraryid: itineraryId,
      place_id: item.place_id,
      titleoverride: item.titleoverride,
      scheduleddate: item.scheduleddate,
      starttime: item.starttime,
      durationhours: item.durationhours,
      name: item.name ?? null,
      category: item.category ?? null,
      image: item.image ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.warn('[itinerary] insertItineraryItem failed:', error?.message);
    return null;
  }
  return data.id as string;
}

/**
 * Update an existing itinerary item.
 */
export async function updateItineraryItem(
  itemId: string,
  updates: {
    scheduleddate?: string;
    starttime?: string;
    durationhours?: number;
    notes?: string;
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
 * Fetch all itinerary items for a hotel-guest stay, with joined place data.
 * Resolves the itinerary via stayId (UNIQUE). For standalone itineraries
 * use fetchItineraryItemsById() instead.
 */
export async function fetchItineraryItems(
  userId: string,
  stayId: string,
): Promise<DbItineraryItemEnriched[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data: itin, error: itinErr } = await sb
    .from('itineraries')
    .select('id')
    .eq('stayid', stayId)
    .eq('userid', userId)
    .limit(1)
    .maybeSingle();

  if (itinErr || !itin) return null;

  return fetchItineraryItemsByItineraryId(itin.id as string);
}

/**
 * Fetch all items for a known itinerary id, with joined place data.
 * Works for both stay-linked and standalone itineraries.
 */
export async function fetchItineraryItemsByItineraryId(
  itineraryId: string,
): Promise<DbItineraryItemEnriched[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('itineraryitems')
    .select(`
      *,
      places (
        id,
        name,
        category,
        latitude,
        longitude,
        image_url
      )
    `)
    .eq('itineraryid', itineraryId)
    .order('scheduleddate', { ascending: true })
    .order('starttime', { ascending: true });

  if (error || !data) return null;

  return data as unknown as DbItineraryItemEnriched[];
}
