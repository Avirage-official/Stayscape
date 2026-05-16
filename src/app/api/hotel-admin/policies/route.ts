/**
 * GET  /api/hotel-admin/policies  -- fetch hotel_policies row for this admin's property
 * PATCH /api/hotel-admin/policies  -- upsert hotel_policies row
 *
 * Extra advisory fields (laundry_policy, late_checkout_policy, late_checkout_fee)
 * are stored in the existing extra_policies jsonb column so we avoid a migration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// --- auth helper ---

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

// --- GET ---

export async function GET(request: NextRequest) {
  const resolved = await resolvePropertyId(request);
  if (resolved instanceof NextResponse) return resolved;
  const { propertyId } = resolved;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('hotel_policies')
    .select(
      'checkin_time, checkout_time, wifi_name, wifi_password, cancellation_policy, pet_policy, smoking_policy, extra_policies',
    )
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ policies: data ?? {} });
}

// --- PATCH ---

export async function PATCH(request: NextRequest) {
  const resolved = await resolvePropertyId(request);
  if (resolved instanceof NextResponse) return resolved;
  const { propertyId } = resolved;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const columnFields = [
    'checkin_time',
    'checkout_time',
    'wifi_name',
    'wifi_password',
    'cancellation_policy',
    'pet_policy',
    'smoking_policy',
  ] as const;

  const columnUpdates: Record<string, unknown> = { property_id: propertyId };
  for (const field of columnFields) {
    if (field in body) columnUpdates[field] = body[field] ?? null;
  }

  const extraKeys = ['laundry_policy', 'late_checkout_policy', 'late_checkout_fee'] as const;
  const hasExtra = extraKeys.some((k) => k in body);

  const supabase = getSupabaseAdmin();

  if (hasExtra) {
    const { data: existing } = await supabase
      .from('hotel_policies')
      .select('extra_policies')
      .eq('property_id', propertyId)
      .maybeSingle();

    const currentExtra =
      (existing?.extra_policies as Record<string, unknown> | null) ?? {};

    const mergedExtra = { ...currentExtra };
    for (const k of extraKeys) {
      if (k in body) mergedExtra[k] = body[k] ?? null;
    }
    columnUpdates['extra_policies'] = mergedExtra;
  }

  const { error } = await supabase
    .from('hotel_policies')
    .upsert(columnUpdates, { onConflict: 'property_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
