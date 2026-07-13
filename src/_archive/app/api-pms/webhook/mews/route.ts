/**
 * POST /api/pms/webhook/mews
 *
 * Real Mews Connector API webhook receiver.
 *
 * Mews calls this URL in real-time whenever a reservation is created,
 * updated, cancelled, or a guest checks in / out. This replaces the
 * need to poll — Stayscape reacts within seconds of any PMS change.
 *
 * Flow:
 *   1. Read raw body as text (required for HMAC signature verification)
 *   2. Verify X-Mews-Signature header using the property's webhook secret
 *   3. Parse the event type from the payload
 *   4. For stay events → pull the latest reservation state from Mews
 *   5. Upsert into the stays table
 *   6. Trigger downstream effects (Aria active session, task creation)
 *
 * Authentication: HMAC-SHA256 signature in X-Mews-Signature header.
 * No admin key — Mews signs every payload with a shared secret.
 *
 * Registration: When a hotel connects, register this URL with Mews:
 *   POST /api/connector/v1/webhooks/add
 *   { "Url": "https://stayscape-kohl.vercel.app/api/pms/webhook/mews", ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getAdapterForProperty, PmsRouterError } from '@/lib/pms/router';
import { applyRateLimit } from '@/lib/rate-limit';
import type { MewsAdapter } from '@/lib/pms/adapters/mews';

/* ─────────────────────────────────────────────────────────────────
   IMPORTANT — raw body required for signature verification
   Next.js must NOT parse the body before we read it.
   ───────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request, 'default');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  // 1. Read the raw body text — needed for signature verification
  const rawBody = await request.text();

  // 2. Get the signature Mews sent
  const signature = request.headers.get('x-mews-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing X-Mews-Signature header' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  // 3. Parse the payload to extract the EnterpriseId (= Mews property ID)
  //    We need this to look up which Stayscape property this belongs to
  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  // Extract EnterpriseId from the Mews payload envelope
  const enterpriseId = extractEnterpriseId(parsedPayload);
  if (!enterpriseId) {
    return NextResponse.json(
      { error: 'Could not determine EnterpriseId from payload' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  // 4. Look up the Stayscape property by Mews EnterpriseId
  const supabase = getSupabaseAdmin();
  const { data: pmsConfig, error: configError } = await supabase
    .from('pms_config')
    .select('property_id')
    .eq('provider', 'mews')
    .eq('mews_enterprise_id', enterpriseId)
    .eq('is_active', true)
    .single();

  if (configError || !pmsConfig) {
    // Return 200 to prevent Mews from retrying — we just don't know this property
    console.warn(`[mews-webhook] Unknown EnterpriseId: ${enterpriseId}`);
    return NextResponse.json(
      { received: true, skipped: 'Unknown enterprise' },
      { headers: rateLimit.headers },
    );
  }

  const propertyId = pmsConfig.property_id as string;

  // 5. Load the adapter for this property
  let adapter: MewsAdapter;
  try {
    const maybeAdapter = await getAdapterForProperty(propertyId);
    if (!maybeAdapter) {
      console.warn(`[mews-webhook] No adapter for property ${propertyId} (manual?)`);
      return NextResponse.json({ received: true, skipped: 'No adapter' });
    }
    adapter = maybeAdapter as MewsAdapter;
  } catch (err) {
    const message = err instanceof PmsRouterError ? err.message : String(err);
    console.error(`[mews-webhook] Adapter load failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 6. Verify the HMAC-SHA256 signature — AFTER we have the adapter
  //    (the adapter holds the per-property webhook secret)
  const signatureValid = adapter.verifyWebhookSignature(rawBody, signature);
  if (!signatureValid) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  // 7. Parse events from the payload
  const events = adapter.parseWebhookEvent(parsedPayload);

  if (events.length === 0) {
    // Valid payload but no events we care about — ack and move on
    return NextResponse.json(
      { received: true, processed: 0 },
      { headers: rateLimit.headers },
    );
  }

  // 8. Process each event
  const results = await Promise.allSettled(
    events.map((event) => processEvent(event, propertyId, adapter)),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[mews-webhook] Event ${i} failed:`, r.reason);
      }
    });
  }

  // Always return 200 to Mews — retries cause duplicate processing
  return NextResponse.json(
    { received: true, processed: succeeded, failed },
    { headers: rateLimit.headers },
  );
}

/* ─────────────────────────────────────────────────────────────────
   PROCESS A SINGLE EVENT
   ───────────────────────────────────────────────────────────────── */

async function processEvent(
  event: { type: string; externalId?: string; roomNumber?: string; status?: string },
  propertyId: string,
  adapter: MewsAdapter,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // room.status_changed — update room status in Supabase, no stay needed
  if (event.type === 'room.status_changed') {
    if (!event.roomNumber) return;

    await supabase
      .from('rooms')
      .update({
        pms_status: event.status ?? 'unknown',
        pms_status_updated_at: new Date().toISOString(),
      })
      .eq('property_id', propertyId)
      .eq('room_number', event.roomNumber);

    return;
  }

  // All stay events need an externalId to fetch the latest state
  if (!event.externalId) return;

  // Pull the freshest reservation data from Mews
  const stay = await adapter.pullReservationById(event.externalId);

  if (!stay) {
    console.warn(`[mews-webhook] pullReservationById returned null for ${event.externalId}`);
    return;
  }

  // Upsert the stay into Supabase
  const { error: upsertError } = await supabase.from('stays').upsert(
    {
      external_id: stay.external_id,
      booking_reference: stay.confirmation_number,
      propertyid: propertyId,
      status: stay.status,
      checkindate: stay.check_in,
      checkoutdate: stay.check_out,
      actual_check_in: stay.actual_check_in,
      actual_check_out: stay.actual_check_out,
      external_guest_id: stay.external_guest_id,
      guestcount: stay.guest_count,
      external_room_id: stay.external_room_id,
      requested_category_id: stay.requested_category_id,
      booking_source: stay.booking_source,
      ota_confirmation_number: stay.ota_confirmation_number,
      trip_type: stay.trip_purpose,
      external_created_at: stay.external_created_at,
      external_updated_at: stay.external_updated_at,
      cancelled_at: stay.cancelled_at,
      cancellation_reason: stay.cancellation_reason,
      checkin_flags: stay.checkin_flags,
      last_synced_at: new Date().toISOString(),
    },
    {
      onConflict: 'external_id',
      ignoreDuplicates: false,
    },
  );

  if (upsertError) {
    throw new Error(`upsertStay failed for ${stay.external_id}: ${upsertError.message}`);
  }

  // Downstream effects based on event type
  if (event.type === 'stay.checked_in') {
    await handleCheckIn(propertyId, stay.external_id, supabase);
  } else if (event.type === 'stay.checked_out') {
    await handleCheckOut(propertyId, stay.external_id, supabase);
  }
}

/* ─────────────────────────────────────────────────────────────────
   DOWNSTREAM EFFECTS
   ───────────────────────────────────────────────────────────────── */

async function handleCheckIn(
  propertyId: string,
  externalStayId: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<void> {
  // Look up the internal stay ID for this external stay
  const { data: stayRow } = await supabase
    .from('stays')
    .select('id, guest_id')
    .eq('external_id', externalStayId)
    .eq('propertyid', propertyId)
    .single();

  if (!stayRow) return;

  console.log(
    `[mews-webhook] Check-in detected — stay ${stayRow.id}, guest ${stayRow.guest_id}. ` +
    `Aria active session trigger goes here (Phase 2).`,
  );

  // Phase 2: trigger Aria active session initialisation
  // await initAriaSession({ stayId: stayRow.id, guestId: stayRow.guest_id });
}

async function handleCheckOut(
  propertyId: string,
  externalStayId: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<void> {
  const { data: stayRow } = await supabase
    .from('stays')
    .select('id, guest_id')
    .eq('external_id', externalStayId)
    .eq('propertyid', propertyId)
    .single();

  if (!stayRow) return;

  console.log(
    `[mews-webhook] Check-out detected — stay ${stayRow.id}, guest ${stayRow.guest_id}. ` +
    `closeMemory() trigger goes here (Phase 2).`,
  );

  // Phase 2: trigger Aria memory close + post-stay flow
  // await closeAriaSession({ stayId: stayRow.id, guestId: stayRow.guest_id });
}

/* ─────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────── */

function extractEnterpriseId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  // Mews wraps events in an envelope with EnterpriseId at the top level
  const obj = payload as Record<string, unknown>;

  if (typeof obj['EnterpriseId'] === 'string') return obj['EnterpriseId'];

  // Some Mews webhook versions nest it inside Events[0]
  const events = obj['Events'];
  if (Array.isArray(events) && events.length > 0) {
    const first = events[0] as Record<string, unknown>;
    if (typeof first['EnterpriseId'] === 'string') return first['EnterpriseId'];
  }

  return null;
}
