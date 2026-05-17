/**
 * GET /api/customer/policies
 *
 * Returns the service availability flags, guest-visible policy text,
 * AND service hours for every service — so the guest UI can block
 * requests made outside configured operating hours.
 *
 * Auth: Supabase JWT via Authorization: Bearer <token>
 * No write access — read-only, guest-safe subset of hotel_policies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// ─── Auth + stay → property_id ───────────────────────────────────────────────

async function resolvePropertyId(
  request: NextRequest,
): Promise<{ propertyId: string } | NextResponse> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: stay, error: stayError } = await supabase
    .from('stays')
    .select('propertyid')
    .eq('userid', user.id)
    .in('status', ['active', 'confirmed', 'checked_in'])
    .order('checkindate', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (stayError || !stay) {
    return NextResponse.json({ error: 'No active stay found' }, { status: 404 });
  }

  return { propertyId: (stay as unknown as { propertyid: string }).propertyid };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const resolved = await resolvePropertyId(request);
  if (resolved instanceof NextResponse) return resolved;
  const { propertyId } = resolved;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('hotel_policies')
    .select(
      [
        // ── Toggles ──
        'housekeeping_enabled',
        'room_service_enabled',
        'laundry_enabled',
        'maintenance_enabled',
        'transport_enabled',
        'luggage_pickup_enabled',
        'late_checkout_enabled',
        'restaurant_enabled',
        'restaurant_reservation_enabled',

        // ── Housekeeping hours ──
        'housekeeping_start',
        'housekeeping_end',
        'turndown_enabled',
        'turndown_start',
        'turndown_end',

        // ── Room service hours ──
        'room_service_start',
        'room_service_end',
        'room_service_last_order',

        // ── Laundry hours ──
        'laundry_pickup_start',
        'laundry_pickup_cutoff',
        'laundry_return_time',
        'laundry_express_enabled',
        'laundry_express_hours',

        // ── Maintenance hours ──
        'maintenance_start',
        'maintenance_end',
        'maintenance_emergency_24hr',

        // ── Transport hours ──
        'transport_hours_start',
        'transport_hours_end',
        'transport_advance_notice_mins',

        // ── Luggage pickup hours ──
        'luggage_pickup_start',
        'luggage_pickup_end',
        'luggage_pickup_fee',

        // ── Late checkout ──
        'late_checkout_max_time',
        'late_checkout_free_if_available',

        // ── Concierge hours ──
        'concierge_enabled',
        'concierge_hours_start',
        'concierge_hours_end',

        // ── Freetext policy fields ──
        'extra_policies',
      ].join(', '),
    )
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── No row yet — return safe defaults ────────────────────────────────────
  if (!data) {
    return NextResponse.json({
      services: {
        housekeeping_enabled:           false,
        room_service_enabled:           false,
        laundry_enabled:                false,
        maintenance_enabled:            false,
        transport_enabled:              false,
        luggage_pickup_enabled:         false,
        late_checkout_enabled:          false,
        restaurant_enabled:             false,
        restaurant_reservation_enabled: false,
        concierge_enabled:              true,
      },
      policy_text: {
        laundry_policy:                 null,
        late_checkout_policy:           null,
        late_checkout_fee:              null,
        late_checkout_max_time:         null,
        late_checkout_free_if_available: false,
        luggage_pickup_fee:             null,
        transport_advance_notice_mins:  null,
      },
      service_hours: {
        housekeeping:    { start: null, end: null },
        turndown:        { enabled: false, start: null, end: null },
        room_service:    { start: null, end: null, last_order: null },
        laundry:         { pickup_start: null, pickup_cutoff: null, return_time: null, express_enabled: false, express_hours: null },
        maintenance:     { start: null, end: null, emergency_24hr: false },
        transport:       { start: null, end: null, advance_notice_mins: null },
        luggage_pickup:  { start: null, end: null },
        concierge:       { start: null, end: null },
      },
    });
  }

  // Double-cast through unknown — Supabase's GenericStringError union doesn't
  // overlap directly with Record<string, unknown> under strict TS checks.
  const p = data as unknown as Record<string, unknown>;
  const extra = (p.extra_policies ?? {}) as Record<string, unknown>;

  const str = (v: unknown) => (v != null ? String(v) : null);

  return NextResponse.json({
    services: {
      housekeeping_enabled:           Boolean(p.housekeeping_enabled),
      room_service_enabled:           Boolean(p.room_service_enabled),
      laundry_enabled:                Boolean(p.laundry_enabled),
      maintenance_enabled:            Boolean(p.maintenance_enabled),
      transport_enabled:              Boolean(p.transport_enabled),
      luggage_pickup_enabled:         Boolean(p.luggage_pickup_enabled),
      late_checkout_enabled:          Boolean(p.late_checkout_enabled),
      restaurant_enabled:             Boolean(p.restaurant_enabled),
      restaurant_reservation_enabled: Boolean(p.restaurant_reservation_enabled),
      concierge_enabled:              Boolean(p.concierge_enabled),
    },
    policy_text: {
      laundry_policy:                 (extra.laundry_policy as string) ?? null,
      late_checkout_policy:           (extra.late_checkout_policy as string) ?? null,
      late_checkout_fee:              (extra.late_checkout_fee as string) ?? null,
      late_checkout_max_time:         str(p.late_checkout_max_time),
      late_checkout_free_if_available: Boolean(p.late_checkout_free_if_available),
      luggage_pickup_fee:             str(p.luggage_pickup_fee),
      transport_advance_notice_mins:  p.transport_advance_notice_mins != null
                                        ? Number(p.transport_advance_notice_mins)
                                        : null,
    },
    // ── Service hours — used by guest UI to block out-of-hours requests ──
    service_hours: {
      housekeeping: {
        start:          str(p.housekeeping_start),
        end:            str(p.housekeeping_end),
      },
      turndown: {
        enabled:        Boolean(p.turndown_enabled),
        start:          str(p.turndown_start),
        end:            str(p.turndown_end),
      },
      room_service: {
        start:          str(p.room_service_start),
        end:            str(p.room_service_end),
        last_order:     str(p.room_service_last_order),
      },
      laundry: {
        pickup_start:   str(p.laundry_pickup_start),
        pickup_cutoff:  str(p.laundry_pickup_cutoff),
        return_time:    str(p.laundry_return_time),
        express_enabled: Boolean(p.laundry_express_enabled),
        express_hours:  p.laundry_express_hours != null ? Number(p.laundry_express_hours) : null,
      },
      maintenance: {
        start:          str(p.maintenance_start),
        end:            str(p.maintenance_end),
        emergency_24hr: Boolean(p.maintenance_emergency_24hr),
      },
      transport: {
        start:              str(p.transport_hours_start),
        end:                str(p.transport_hours_end),
        advance_notice_mins: p.transport_advance_notice_mins != null
                               ? Number(p.transport_advance_notice_mins)
                               : null,
      },
      luggage_pickup: {
        start:          str(p.luggage_pickup_start),
        end:            str(p.luggage_pickup_end),
      },
      concierge: {
        start:          str(p.concierge_hours_start),
        end:            str(p.concierge_hours_end),
      },
    },
  });
}
