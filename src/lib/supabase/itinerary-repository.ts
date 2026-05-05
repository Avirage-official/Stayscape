/**
 * Supabase data-access layer for Itinerary operations.
 *
 * Schema notes (source of truth: live Supabase):
 *   itineraries.stayid    — uuid NOT NULL UNIQUE (one itinerary per stay)
 *   itineraries.userid    — uuid NOT NULL
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
  stayid: string;
  userid: string;
  title: string | null;
  status: ItineraryStatus;
  createdat: string;
  updatedat: string;
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
 * stayid is NOT NULL UNIQUE in the schema — one itinerary per stay.
 */
export async function getOrCreateItinerary(
  userId: string,
  stayId?: string,
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  if (!stayId) {
    console.warn(
      '[itinerary] getOrCreateItinerary called without stayId — cannot insert (stayid is NOT NULL).',
    );
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

  // Create a new itinerary
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
 * Fetch all itinerary items for the user's stay, with the joined
 * `places` row inline (coords, image, category).
 *
 * The select uses Supabase's relational embed syntax:
 *   place_id → places(...)
 *
 * The FK fk_itinerary_items_place makes this work directly.
 */
export async function fetchItineraryItems(
  userId: string,
  stayId?: string,
): Promise<DbItineraryItemEnriched[] | null> {
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
    .eq('itineraryid', itin.id)
    .order('scheduleddate', { ascending: true })
    .order('starttime', { ascending: true });

  if (error || !data) return null;

  return data as unknown as DbItineraryItemEnriched[];
}
