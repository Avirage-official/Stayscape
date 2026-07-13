/**
 * POST /api/admin/sync/pms
 *
 * Triggers a full PMS reservation pull for one or all active properties,
 * upserts the normalised stays into Supabase, and writes a sync_run record.
 *
 * Authentication: x-admin-key header (same as all /api/admin/* routes).
 *
 * Body (all optional except propertyId in single mode):
 *   mode?         'single_property' | 'all_active_properties'  (default: 'single_property')
 *   propertyId?   string   — required when mode = 'single_property'
 *   fromDate?     string   — ISO 8601, defaults to 90 days ago
 *   toDate?       string   — ISO 8601, defaults to 90 days from now
 *
 * Response:
 *   { data: { mode, properties_processed, results: SyncResult[] } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getAdapterForProperty, PmsRouterError } from '@/lib/pms/router';
import type { InternalStay } from '@/lib/pms/types';
import { requireAdminKey } from '@/lib/auth/require-admin-key';
import { applyRateLimit } from '@/lib/rate-limit';

/* ─────────────────────────────────────────────────────────────────
   REQUEST / RESPONSE TYPES
   ───────────────────────────────────────────────────────────────── */

interface SyncPmsBody {
  mode?: 'single_property' | 'all_active_properties';
  propertyId?: string;
  fromDate?: string;
  toDate?: string;
}

interface SyncResult {
  property_id: string;
  status: 'ok' | 'skipped' | 'error';
  stays_synced: number;
  stays_skipped: number;
  error?: string;
  sync_run_id?: string;
}

/* ─────────────────────────────────────────────────────────────────
   ROUTE HANDLER
   ───────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as SyncPmsBody;
    const mode = body.mode ?? 'single_property';

    // Resolve the date window — default: 90 days back → 90 days forward
    const now = new Date();
    const fromDate = body.fromDate
      ? new Date(body.fromDate)
      : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const toDate = body.toDate
      ? new Date(body.toDate)
      : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 (e.g. 2026-05-01T00:00:00Z).' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // ── SINGLE PROPERTY ──────────────────────────────────────────
    if (mode === 'single_property') {
      if (!body.propertyId) {
        return NextResponse.json(
          { error: 'propertyId is required when mode is single_property' },
          { status: 400, headers: rateLimit.headers },
        );
      }

      const result = await syncProperty(body.propertyId, fromDate, toDate);
      return NextResponse.json(
        { data: { mode, properties_processed: 1, results: [result] } },
        { headers: rateLimit.headers },
      );
    }

    // ── ALL ACTIVE PROPERTIES ─────────────────────────────────────
    const supabase = getSupabaseAdmin();
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id')
      .eq('is_active', true)
      .order('name');

    if (propertiesError) {
      throw new Error(`Failed to load active properties: ${propertiesError.message}`);
    }

    const activeProperties = (properties ?? []) as Array<{ id: string }>;

    if (activeProperties.length === 0) {
      return NextResponse.json(
        { data: { mode, properties_processed: 0, results: [] } },
        { headers: rateLimit.headers },
      );
    }

    const results: SyncResult[] = [];
    for (const property of activeProperties) {
      const result = await syncProperty(property.id, fromDate, toDate);
      results.push(result);
    }

    return NextResponse.json(
      { data: { mode, properties_processed: results.length, results } },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────────────
   CORE SYNC LOGIC — one property at a time
   ───────────────────────────────────────────────────────────────── */

async function syncProperty(
  propertyId: string,
  fromDate: Date,
  toDate: Date,
): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const startedAt = new Date().toISOString();

  try {
    // 1. Get adapter (returns null for manual properties — nothing to sync)
    const adapter = await getAdapterForProperty(propertyId);

    if (adapter === null) {
      return {
        property_id: propertyId,
        status: 'skipped',
        stays_synced: 0,
        stays_skipped: 0,
      };
    }

    // 2. Pull reservations from PMS
    const reservations = await adapter.pullReservations({ fromDate, toDate });

    // 3. Upsert each reservation into the stays table
    let synced = 0;
    let skipped = 0;

    for (const stay of reservations) {
      const upsertResult = await upsertStay(propertyId, stay);
      if (upsertResult) {
        synced++;
      } else {
        skipped++;
      }
    }

    // 4. Write sync_run record
    const syncRunId = await writeSyncRun({
      property_id: propertyId,
      status: 'success',
      stays_synced: synced,
      started_at: startedAt,
    });

    return {
      property_id: propertyId,
      status: 'ok',
      stays_synced: synced,
      stays_skipped: skipped,
      sync_run_id: syncRunId ?? undefined,
    };
  } catch (error) {
    const message =
      error instanceof PmsRouterError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    console.error(`[pms-sync] Failed for property ${propertyId}:`, message);

    // Write a failed sync_run so the admin UI shows the error
    const syncRunId = await writeSyncRun({
      property_id: propertyId,
      status: 'error',
      stays_synced: 0,
      error_message: message,
      started_at: startedAt,
    });

    return {
      property_id: propertyId,
      status: 'error',
      stays_synced: 0,
      stays_skipped: 0,
      error: message,
      sync_run_id: syncRunId ?? undefined,
    };
  }
}

/* ─────────────────────────────────────────────────────────────────
   UPSERT STAY
   Conflict target: external_id — idempotent on re-runs.
   Maps InternalStay fields onto the stays table columns.
   ───────────────────────────────────────────────────────────────── */

async function upsertStay(
  propertyId: string,
  stay: InternalStay,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('stays').upsert(
    {
      // Identity
      external_id: stay.external_id,
      booking_reference: stay.confirmation_number,
      propertyid: propertyId,

      // Status
      status: stay.status,

      // Schedule
      checkindate: stay.check_in,
      checkoutdate: stay.check_out,
      actual_check_in: stay.actual_check_in,
      actual_check_out: stay.actual_check_out,

      // People
      external_guest_id: stay.external_guest_id,
      guestcount: stay.guest_count,

      // Room
      external_room_id: stay.external_room_id,
      requested_category_id: stay.requested_category_id,

      // Provenance
      booking_source: stay.booking_source,
      ota_confirmation_number: stay.ota_confirmation_number,
      trip_type: stay.trip_purpose,

      // Lifecycle timestamps
      external_created_at: stay.external_created_at,
      external_updated_at: stay.external_updated_at,
      cancelled_at: stay.cancelled_at,
      cancellation_reason: stay.cancellation_reason,

      // Live state
      checkin_flags: stay.checkin_flags,

      // Sync metadata
      last_synced_at: new Date().toISOString(),

      // Defaults — only applied on INSERT, ignored on UPDATE
      stay_confirmation_status: 'pending',
      onboarding_completed: false,
      curation_status: 'pending',
    },
    {
      onConflict: 'external_id',
      ignoreDuplicates: false, // always update on conflict
    },
  );

  if (error) {
    // Log but don't throw — one bad record shouldn't abort the whole sync
    console.error(`[pms-sync] upsertStay failed for external_id ${stay.external_id}:`, error.message);
    return false;
  }

  return true;
}

/* ─────────────────────────────────────────────────────────────────
   WRITE SYNC RUN
   Logs every sync attempt to sync_runs for the admin UI.
   ───────────────────────────────────────────────────────────────── */

async function writeSyncRun(params: {
  property_id: string;
  status: 'success' | 'error';
  stays_synced: number;
  error_message?: string;
  started_at: string;
}): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('sync_runs')
    .insert({
      property_id: params.property_id,
      status: params.status,
      stays_synced: params.stays_synced,
      error_message: params.error_message ?? null,
      started_at: params.started_at,
      completed_at: new Date().toISOString(),
      trigger: 'manual',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[pms-sync] Failed to write sync_run:', error.message);
    return null;
  }

  return data?.id as string ?? null;
}
