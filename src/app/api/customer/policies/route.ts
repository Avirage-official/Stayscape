/**
 * GET /api/customer/policies
 *
 * Returns the service availability flags and guest-visible policy text
 * for the property of the caller's active stay.
 *
 * Auth: Supabase JWT via Authorization: Bearer <token>
 * No write access — read-only, guest-safe subset of hotel_policies.
 *
 * Response shape:
 * {
 *   services: {
 *     housekeeping_enabled: boolean
 *     room_service_enabled: boolean
 *     laundry_enabled:      boolean
 *     maintenance_enabled:  boolean
 *     transport_enabled:    boolean
 *     luggage_pickup_enabled: boolean
 *     late_checkout_enabled: boolean
 *     restaurant_enabled:   boolean
 *     restaurant_reservation_enabled: boolean
 *   }
 *   policy_text: {
 *     laundry_policy:        string | null   // free-text notes shown before submit
 *     late_checkout_policy:  string | null
 *     late_checkout_fee:     string | null
 *     late_checkout_max_time: string | null  // HH:MM — cap on desired time picker
 *     late_checkout_free_if_available: boolean
 *     luggage_pickup_fee:    string | null
 *     transport_advance_notice_mins: number | null
 *   }
 * }
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

  // Resolve the guest's active stay → propertyid
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

  return { propertyId: (stay as { propertyid: string }).propertyid };
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
        // Service toggles
        'housekeeping_enabled',
        'room_service_enabled',
        'laundry_enabled',
        'maintenance_enabled',
        'transport_enabled',
        'luggage_pickup_enabled',
        'late_checkout_enabled',
        'restaurant_enabled',
        'restaurant_reservation_enabled',
        // Guest-visible time/policy fields
        'late_checkout_max_time',
        'late_checkout_free_if_available',
        'luggage_pickup_fee',
        'transport_advance_notice_mins',
        // Free-text notes live in extra_policies JSONB
        'extra_policies',
      ].join(', '),
    )
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If no policy row exists yet, return safe defaults (all services off)
  if (!data) {
    return NextResponse.json({
      services: {
        housekeeping_enabled: false,
        room_service_enabled: false,
        laundry_enabled: false,
        maintenance_enabled: false,
        transport_enabled: false,
        luggage_pickup_enabled: false,
        late_checkout_enabled: false,
        restaurant_enabled: false,
        restaurant_reservation_enabled: false,
      },
      policy_text: {
        laundry_policy: null,
        late_checkout_policy: null,
        late_checkout_fee: null,
        late_checkout_max_time: null,
        late_checkout_free_if_available: false,
        luggage_pickup_fee: null,
        transport_advance_notice_mins: null,
      },
    });
  }

  const p = data as Record<string, unknown>;
  const extra = (p.extra_policies ?? {}) as Record<string, unknown>;

  return NextResponse.json({
    services: {
      housekeeping_enabled:            Boolean(p.housekeeping_enabled),
      room_service_enabled:            Boolean(p.room_service_enabled),
      laundry_enabled:                 Boolean(p.laundry_enabled),
      maintenance_enabled:             Boolean(p.maintenance_enabled),
      transport_enabled:               Boolean(p.transport_enabled),
      luggage_pickup_enabled:          Boolean(p.luggage_pickup_enabled),
      late_checkout_enabled:           Boolean(p.late_checkout_enabled),
      restaurant_enabled:              Boolean(p.restaurant_enabled),
      restaurant_reservation_enabled:  Boolean(p.restaurant_reservation_enabled),
    },
    policy_text: {
      laundry_policy:                  (extra.laundry_policy as string) ?? null,
      late_checkout_policy:            (extra.late_checkout_policy as string) ?? null,
      late_checkout_fee:               (extra.late_checkout_fee as string) ?? null,
      late_checkout_max_time:          (p.late_checkout_max_time as string) ?? null,
      late_checkout_free_if_available: Boolean(p.late_checkout_free_if_available),
      luggage_pickup_fee:              (p.luggage_pickup_fee as string) ?? null,
      transport_advance_notice_mins:   p.transport_advance_notice_mins != null
                                         ? Number(p.transport_advance_notice_mins)
                                         : null,
    },
  });
}
