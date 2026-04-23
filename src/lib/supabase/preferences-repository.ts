/**
 * Guest Preferences Repository
 *
 * Supabase data-access layer for guest preferences captured from
 * the concierge/map interface. These preferences are synced back
 * to the hotel PMS via the callback URL stored on the stay.
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type {
  GuestPreference,
  PreferenceType,
  PmsPreferencesPushPayload,
} from '@/types/pms';

/**
 * Save a guest preference from the concierge/map.
 */
export async function savePreference(
  stayId: string,
  preferenceType: PreferenceType,
  preferenceData: Record<string, unknown>,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('guest_preferences')
    .insert({
      stay_id: stayId,
      preference_type: preferenceType,
      preference_data: preferenceData,
      synced_to_pms: false,
      synced_at: null,
      created_at: now,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save preference: ${error?.message ?? 'Unknown error'}`);
  }

  return data.id as string;
}

/**
 * Upsert a single preference row for a stay + preference_type.
 * Keeps one canonical row per preference type for onboarding flows.
 */
export async function upsertStayPreference(
  stayId: string,
  preferenceType: PreferenceType,
  preferenceData: Record<string, unknown>,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existingRows } = await supabase
    .from('guest_preferences')
    .select('id')
    .eq('stay_id', stayId)
    .eq('preference_type', preferenceType)
    .order('created_at', { ascending: false });

  const newest = (existingRows?.[0]?.id as string | undefined) ?? null;

  /** Remove any extra duplicate rows, keeping only the row with `keepId`. */
  async function purgeDuplicates(keepId: string): Promise<void> {
    const duplicateIds = (existingRows ?? [])
      .map((row) => row.id as string)
      .filter((id) => id && id !== keepId);

    if (duplicateIds.length > 0) {
      console.warn(
        '[preferences] Cleaning duplicate stay preference rows',
        { stayId, preferenceType, removed_count: duplicateIds.length },
      );
      const { error: purgeErr } = await supabase
        .from('guest_preferences')
        .delete()
        .in('id', duplicateIds);

      if (purgeErr) {
        console.error(
          '[preferences] Failed to purge duplicate rows',
          { stayId, preferenceType, error: purgeErr.message },
        );
        throw new Error(`Failed to purge duplicate preferences: ${purgeErr.message}`);
      }
    }
  }

  if (newest) {
    try {
      const { error } = await supabase
        .from('guest_preferences')
        .update({
          preference_data: preferenceData,
          synced_to_pms: false,
          synced_at: null,
          updated_at: now,
        })
        .eq('id', newest);

      if (error) {
        throw new Error(error.message);
      }
    } catch (updateError) {
      // Fallback: INSERT a fresh row then delete old rows.
      // This handles Supabase schema cache lag where the update column list
      // may temporarily be stale.
      console.warn(
        '[preferences] update failed, falling back to insert+delete',
        { stayId, preferenceType, error: updateError instanceof Error ? updateError.message : updateError },
      );
      const { data: fallbackCreated, error: insertErr } = await supabase
        .from('guest_preferences')
        .insert({
          stay_id: stayId,
          preference_type: preferenceType,
          preference_data: preferenceData,
          synced_to_pms: false,
          synced_at: null,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (insertErr || !fallbackCreated) {
        throw new Error(`Failed to re-insert preference: ${insertErr?.message ?? 'Unknown error'}`);
      }

      const { error: deleteErr } = await supabase
        .from('guest_preferences')
        .delete()
        .eq('id', newest);

      if (deleteErr) {
        console.error(
          '[preferences] Failed to delete old preference row after re-insert',
          { stayId, preferenceType, error: deleteErr.message },
        );
      }

      // Clean up any remaining duplicates (excluding the newly inserted row).
      await purgeDuplicates(fallbackCreated.id as string);
      return fallbackCreated.id as string;
    }

    await purgeDuplicates(newest);
    return newest;
  }

  const { data: created, error } = await supabase
    .from('guest_preferences')
    .insert({
      stay_id: stayId,
      preference_type: preferenceType,
      preference_data: preferenceData,
      synced_to_pms: false,
      synced_at: null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to upsert preference: ${error?.message ?? 'Unknown error'}`);
  }

  return created.id as string;
}

/**
 * Get all preferences for a stay.
 */
export async function getPreferencesForStay(
  stayId: string,
): Promise<GuestPreference[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('guest_preferences')
    .select('*')
    .eq('stay_id', stayId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data as GuestPreference[];
}

/**
 * Get unsynced preferences for a stay (not yet pushed to PMS).
 */
export async function getUnsyncedPreferences(
  stayId: string,
): Promise<GuestPreference[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('guest_preferences')
    .select('*')
    .eq('stay_id', stayId)
    .eq('synced_to_pms', false)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data as GuestPreference[];
}

/**
 * Mark preferences as synced to PMS.
 */
export async function markPreferencesSynced(
  preferenceIds: string[],
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  await supabase
    .from('guest_preferences')
    .update({ synced_to_pms: true, synced_at: now })
    .in('id', preferenceIds);
}

/**
 * Get the stay details needed for PMS push-back,
 * including the callback URL and booking reference.
 */
export async function getStayForPmsPush(
  stayId: string,
): Promise<{
  booking_reference: string;
  pms_callback_url: string | null;
  guest_email: string;
} | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('stays')
    .select(
      `booking_reference, pms_callback_url,
       users:userid ( email )`,
    )
    .eq('id', stayId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const user = row.users as Record<string, unknown> | null;

  return {
    booking_reference: row.booking_reference as string,
    pms_callback_url: (row.pms_callback_url as string) ?? null,
    guest_email: (user?.email as string) ?? '',
  };
}

/**
 * Push unsynced preferences back to the PMS via the callback URL.
 * Returns the number of preferences synced, or null if no callback URL.
 */
export async function pushPreferencesToPms(
  stayId: string,
): Promise<{ synced: number; callback_url: string } | null> {
  const stayInfo = await getStayForPmsPush(stayId);
  if (!stayInfo || !stayInfo.pms_callback_url) return null;

  const unsyncedPrefs = await getUnsyncedPreferences(stayId);
  if (unsyncedPrefs.length === 0) return { synced: 0, callback_url: stayInfo.pms_callback_url };

  const pushPayload: PmsPreferencesPushPayload = {
    booking_reference: stayInfo.booking_reference,
    guest_email: stayInfo.guest_email,
    preferences: unsyncedPrefs.map((p) => ({
      type: p.preference_type,
      data: p.preference_data,
      created_at: p.created_at,
    })),
  };

  // Push to PMS callback URL with a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(stayInfo.pms_callback_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushPayload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`PMS push-back failed: ${response.status} ${response.statusText}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Mark as synced
  await markPreferencesSynced(unsyncedPrefs.map((p) => p.id));

  return { synced: unsyncedPrefs.length, callback_url: stayInfo.pms_callback_url };
}
