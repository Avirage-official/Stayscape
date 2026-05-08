/**
 * Manual PMS Adapter
 *
 * For hotels with no third-party PMS. Stayscape itself is the source
 * of truth — hotel staff enter reservations directly through the
 * admin UI, and Aria reads them from the stays table like any other.
 *
 * pullReservations / pullReservationById  → read from Supabase stays
 * pushServiceRequest                      → write to service_requests table
 * pushGuestPreferences                    → write to guest_preferences table
 * verifyWebhookSignature                  → always true (no external signer)
 * parseWebhookEvent                       → always [] (no external webhooks)
 * testConnection                          → ping Supabase
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type {
  PmsAdapter,
  PmsAdapterConfig,
  InternalStay,
  GuestPreference,
  PmsWebhookEvent,
} from '../types';

export class ManualAdapter implements PmsAdapter {
  readonly providerName = 'Manual';

  private readonly propertyId: string;

  constructor(config: PmsAdapterConfig) {
    this.propertyId = config.propertyId;
  }

  /* ────────────────────────────────────────────────────────────────
     CONNECTION TEST
     ──────────────────────────────────────────────────────────────── */

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('stays')
        .select('id')
        .eq('propertyid', this.propertyId)
        .limit(1);

      if (error) throw new Error(error.message);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /* ────────────────────────────────────────────────────────────────
     PULL RESERVATIONS
     Reads directly from the stays table — no external API call.
     ──────────────────────────────────────────────────────────────── */

  async pullReservations(params: {
    fromDate: Date;
    toDate: Date;
  }): Promise<InternalStay[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('stays')
      .select('*')
      .eq('propertyid', this.propertyId)
      .gte('external_updated_at', params.fromDate.toISOString())
      .lte('external_updated_at', params.toDate.toISOString());

    if (error) {
      throw new Error(`ManualAdapter.pullReservations failed: ${error.message}`);
    }

    return (data ?? []).map(rowToInternalStay);
  }

  async pullReservationById(externalId: string): Promise<InternalStay | null> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('stays')
      .select('*')
      .eq('propertyid', this.propertyId)
      .eq('external_id', externalId)
      .maybeSingle();

    if (error) {
      throw new Error(`ManualAdapter.pullReservationById failed: ${error.message}`);
    }

    return data ? rowToInternalStay(data) : null;
  }

  /* ────────────────────────────────────────────────────────────────
     PUSH SERVICE REQUEST
     Writes to service_requests table — staff see it in the admin UI.
     ──────────────────────────────────────────────────────────────── */

  async pushServiceRequest(task: {
    externalReservationId: string;
    description: string;
  }): Promise<{ externalId: string }> {
    const supabase = getSupabaseAdmin();

    // Look up the internal stay ID
    const { data: stayRow, error: stayError } = await supabase
      .from('stays')
      .select('id')
      .eq('propertyid', this.propertyId)
      .eq('external_id', task.externalReservationId)
      .maybeSingle();

    if (stayError || !stayRow) {
      throw new Error(
        `ManualAdapter: stay not found for external_id ${task.externalReservationId}`,
      );
    }

    const { data: requestRow, error: insertError } = await supabase
      .from('service_requests')
      .insert({
        stay_id: stayRow.id,
        property_id: this.propertyId,
        description: task.description,
        source: 'aria',
        status: 'open',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !requestRow) {
      throw new Error(
        `ManualAdapter.pushServiceRequest insert failed: ${insertError?.message}`,
      );
    }

    return { externalId: requestRow.id };
  }

  /* ────────────────────────────────────────────────────────────────
     PUSH GUEST PREFERENCES
     Writes directly to guest_preferences — no PMS to forward to.
     ──────────────────────────────────────────────────────────────── */

  async pushGuestPreferences(preferences: GuestPreference[]): Promise<void> {
    if (preferences.length === 0) return;

    const supabase = getSupabaseAdmin();

    const rows = preferences.map((p) => ({
      property_id: this.propertyId,
      category: p.category,
      value: p.value,
      notes: p.notes ?? null,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('guest_preferences')
      .insert(rows);

    if (error) {
      throw new Error(
        `ManualAdapter.pushGuestPreferences failed: ${error.message}`,
      );
    }
  }

  /* ────────────────────────────────────────────────────────────────
     WEBHOOK — no-ops for manual hotels
     There is no external PMS sending webhooks. Admin UI writes
     directly to the DB — those changes are immediately live.
     ──────────────────────────────────────────────────────────────── */

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // No external signer — always valid
    return true;
  }

  parseWebhookEvent(_payload: unknown): PmsWebhookEvent[] {
    // Manual hotels have no external webhook source
    return [];
  }
}

/* ──────────────────────────────────────────────────────────────────
   TRANSLATION — Supabase stays row → InternalStay
   ──────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInternalStay(row: Record<string, any>): InternalStay {
  return {
    external_id: row.external_id ?? row.id,
    confirmation_number: row.booking_reference ?? row.external_id ?? row.id,
    status: row.status,
    check_in: row.checkindate,
    check_out: row.checkoutdate,
    actual_check_in: row.actual_check_in ?? null,
    actual_check_out: row.actual_check_out ?? null,
    external_guest_id: row.external_guest_id ?? row.guest_id ?? '',
    guest_count: row.guestcount ?? 1,
    external_room_id: row.external_room_id ?? null,
    requested_category_id: row.requested_category_id ?? null,
    booking_source: row.booking_source ?? 'manual',
    ota_confirmation_number: row.ota_confirmation_number ?? null,
    trip_purpose: row.trip_type ?? null,
    external_created_at: row.external_created_at ?? row.created_at,
    external_updated_at: row.external_updated_at ?? row.updated_at,
    cancelled_at: row.cancelled_at ?? null,
    cancellation_reason: row.cancellation_reason ?? null,
    checkin_flags: row.checkin_flags ?? {
      owner_checked_in: false,
      all_companions_checked_in: false,
      any_companion_checked_in: false,
      connector_check_in: false,
    },
  };
}
