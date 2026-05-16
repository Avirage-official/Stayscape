/**
 * GET  /api/hotel-admin/policies
 * PATCH /api/hotel-admin/policies
 *
 * Reads and writes all hotel_policies columns including
 * the new service toggle + time boundary fields from migration 20260516000002.
 * Legacy extra_policies JSONB is preserved for laundry_policy, late_checkout_policy,
 * and late_checkout_fee (free-text notes).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function resolvePropertyId(
  request: NextRequest,
): Promise<{ propertyId: string } | NextResponse> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminData, error: adminError } = await supabase
    .from('hotel_admins')
    .select('property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (adminError || !adminData)
    return NextResponse.json({ error: 'No hotel admin account found' }, { status: 404 });

  return { propertyId: (adminData as { property_id: string }).property_id };
}

// ─── Column fields (direct DB columns) ───────────────────────────────────────

const COLUMN_FIELDS = [
  // Stay info
  'checkin_time',
  'checkout_time',
  'wifi_name',
  'wifi_password',
  // General policies
  'cancellation_policy',
  'pet_policy',
  'smoking_policy',
  // Concierge
  'concierge_enabled',
  'concierge_hours_start',
  'concierge_hours_end',
  // Housekeeping
  'housekeeping_enabled',
  'housekeeping_start',
  'housekeeping_end',
  'turndown_enabled',
  'turndown_start',
  'turndown_end',
  // Room service
  'room_service_enabled',
  'room_service_start',
  'room_service_end',
  'room_service_last_order',
  // Laundry
  'laundry_enabled',
  'laundry_pickup_start',
  'laundry_pickup_cutoff',
  'laundry_return_time',
  'laundry_express_enabled',
  'laundry_express_hours',
  // Maintenance
  'maintenance_enabled',
  'maintenance_start',
  'maintenance_end',
  'maintenance_emergency_24hr',
  // Transport
  'transport_enabled',
  'transport_hours_start',
  'transport_hours_end',
  'transport_advance_notice_mins',
  // Luggage pickup
  'luggage_pickup_enabled',
  'luggage_pickup_start',
  'luggage_pickup_end',
  'luggage_pickup_fee',
  // Late checkout
  'late_checkout_enabled',
  'late_checkout_max_time',
  'late_checkout_free_if_available',
  // Restaurants
  'restaurant_enabled',
  'restaurant_reservation_enabled',
] as const;

// Free-text notes still stored in extra_policies JSONB
const EXTRA_FIELDS = [
  'laundry_policy',
  'late_checkout_policy',
  'late_checkout_fee',
] as const;

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const resolved = await resolvePropertyId(request);
  if (resolved instanceof NextResponse) return resolved;
  const { propertyId } = resolved;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('hotel_policies')
    .select([...COLUMN_FIELDS, 'extra_policies'].join(', '))
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ policies: data ?? {} });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const resolved = await resolvePropertyId(request);
  if (resolved instanceof NextResponse) return resolved;
  const { propertyId } = resolved;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Build column updates
  const updates: Record<string, unknown> = { property_id: propertyId };
  for (const field of COLUMN_FIELDS) {
    if (field in body) {
      const val = body[field];
      // Coerce empty strings on time/numeric fields to null
      if (val === '' || val === null || val === undefined) {
        updates[field] = null;
      } else {
        updates[field] = val;
      }
    }
  }

  // Merge extra_policies JSONB for free-text notes
  const hasExtra = EXTRA_FIELDS.some((k) => k in body);
  if (hasExtra) {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('hotel_policies')
      .select('extra_policies')
      .eq('property_id', propertyId)
      .maybeSingle();

    const currentExtra = (existing?.extra_policies as Record<string, unknown> | null) ?? {};
    const mergedExtra = { ...currentExtra };
    for (const k of EXTRA_FIELDS) {
      if (k in body) mergedExtra[k] = body[k] ?? null;
    }
    updates['extra_policies'] = mergedExtra;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('hotel_policies')
    .upsert(updates, { onConflict: 'property_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
