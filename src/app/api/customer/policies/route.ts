/**
 * GET /api/customer/policies
 *
 * Returns service toggles, guest-safe policy text, service hours,
 * AND the hotel's IANA timezone — so the guest app can evaluate
 * time-gates in the hotel's local time, not the guest's device clock.
 *
 * Auth: Supabase JWT via Authorization: Bearer <token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

async function resolvePropertyId(
  request: NextRequest,
): Promise<{ propertyId: string; timezone: string } | NextResponse> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: stay, error: stayError } = await supabase
    .from('stays')
    .select('propertyid, properties(timezone)')
    .eq('userid', user.id)
    .in('status', ['active', 'confirmed', 'checked_in'])
    .order('checkindate', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (stayError || !stay) {
    return NextResponse.json({ error: 'No active stay found' }, { status: 404 });
  }

  const raw = stay as unknown as { propertyid: string; properties?: { timezone?: string } | null };
  return {
    propertyId: raw.propertyid,
    timezone:   raw.properties?.timezone ?? 'Asia/Singapore',
  };
}

export async function GET(request: NextRequest) {
  const resolved = await resolvePropertyId(request);
  if (resolved instanceof NextResponse) return resolved;
  const { propertyId, timezone } = resolved;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('hotel_policies')
    .select(
      [
        'housekeeping_enabled', 'room_service_enabled', 'laundry_enabled',
        'maintenance_enabled', 'transport_enabled', 'luggage_pickup_enabled',
        'late_checkout_enabled', 'restaurant_enabled', 'restaurant_reservation_enabled',
        'concierge_enabled', 'late_checkout_max_time', 'late_checkout_free_if_available',
        'transport_advance_notice_mins', 'extra_policies',
      ].join(', '),
    )
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const EMPTY_HOURS = {
    housekeeping:   { start: null, end: null },
    turndown:       { enabled: false, start: null, end: null },
    room_service:   { start: null, end: null, last_order: null },
    laundry:        { pickup_start: null, pickup_cutoff: null },
    maintenance:    { start: null, end: null, emergency_24hr: false },
    transport:      { start: null, end: null },
    luggage_pickup: { start: null, end: null },
    concierge:      { start: null, end: null },
  };

  if (!data) {
    return NextResponse.json({
      property_timezone: timezone,
      services: {
        housekeeping_enabled: false, room_service_enabled: false, laundry_enabled: false,
        maintenance_enabled: false, transport_enabled: false, luggage_pickup_enabled: false,
        late_checkout_enabled: false, restaurant_enabled: false,
        restaurant_reservation_enabled: false, concierge_enabled: true,
      },
      policy_text: {
        laundry_policy: null, late_checkout_policy: null, late_checkout_fee: null,
        late_checkout_max_time: null, late_checkout_free_if_available: false,
        luggage_pickup_fee: null, transport_advance_notice_mins: null,
      },
      service_hours: EMPTY_HOURS,
    });
  }

  const p = data as unknown as Record<string, unknown>;
  const extra = (p.extra_policies ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (v != null ? String(v) : null);

  let hours: Record<string, unknown> = {};
  try {
    const { data: hData } = await supabase
      .from('hotel_policies')
      .select([
        'housekeeping_start', 'housekeeping_end',
        'turndown_enabled', 'turndown_start', 'turndown_end',
        'room_service_start', 'room_service_end', 'room_service_last_order',
        'laundry_pickup_start', 'laundry_pickup_cutoff',
        'maintenance_start', 'maintenance_end', 'maintenance_emergency_24hr',
        'transport_hours_start', 'transport_hours_end',
        'luggage_pickup_start', 'luggage_pickup_end', 'luggage_pickup_fee',
        'concierge_hours_start', 'concierge_hours_end',
      ].join(', '))
      .eq('property_id', propertyId)
      .maybeSingle();
    if (hData) hours = hData as unknown as Record<string, unknown>;
  } catch { /* migration not applied — hours default null */ }

  return NextResponse.json({
    property_timezone: timezone,
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
      luggage_pickup_fee:             str(hours.luggage_pickup_fee),
      transport_advance_notice_mins:  p.transport_advance_notice_mins != null ? Number(p.transport_advance_notice_mins) : null,
    },
    service_hours: {
      housekeeping:   { start: str(hours.housekeeping_start),     end: str(hours.housekeeping_end) },
      turndown:       { enabled: Boolean(hours.turndown_enabled), start: str(hours.turndown_start), end: str(hours.turndown_end) },
      room_service:   { start: str(hours.room_service_start),     end: str(hours.room_service_end), last_order: str(hours.room_service_last_order) },
      laundry:        { pickup_start: str(hours.laundry_pickup_start), pickup_cutoff: str(hours.laundry_pickup_cutoff) },
      maintenance:    { start: str(hours.maintenance_start),      end: str(hours.maintenance_end), emergency_24hr: Boolean(hours.maintenance_emergency_24hr) },
      transport:      { start: str(hours.transport_hours_start),  end: str(hours.transport_hours_end) },
      luggage_pickup: { start: str(hours.luggage_pickup_start),   end: str(hours.luggage_pickup_end) },
      concierge:      { start: str(hours.concierge_hours_start),  end: str(hours.concierge_hours_end) },
    },
  });
}
