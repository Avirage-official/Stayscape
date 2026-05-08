/**
 * Hotel Admin — Stays API
 * 
 * Scoped strictly to the authenticated hotel admin's own property.
 * Used by manual hotels only — PMS-connected hotels have stays
 * managed automatically via the Mews webhook / sync route.
 *
 * GET  /api/hotel-admin/stays        — list stays for the property
 * POST /api/hotel-admin/stays        — create a new stay
 * PUT  /api/hotel-admin/stays        — update an existing stay
 * DELETE /api/hotel-admin/stays      — cancel a stay
 *
 * Auth: Supabase Bearer token → verified → property_id resolved
 *       from hotel_admins table. Staff can only touch their own
 *       property — enforced here AND by Supabase RLS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/* ─────────────────────────────────────────────────────────────────
   AUTH HELPER — resolves token → property_id
   ───────────────────────────────────────────────────────────────── */

async function resolvePropertyId(
  request: NextRequest,
): Promise<{ propertyId: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Verify the JWT and get the user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up which property this hotel admin manages
  const { data: adminRow, error: adminError } = await supabase
    .from('hotel_admins')
    .select('property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (adminError || !adminRow) {
    return NextResponse.json({ error: 'No hotel admin profile found' }, { status: 403 });
  }

  return { propertyId: adminRow.property_id as string };
}

function isNextResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}

/* ─────────────────────────────────────────────────────────────────
   GET — list stays for this property
   ───────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const auth = await resolvePropertyId(request);
  if (isNextResponse(auth)) return auth;
  const { propertyId } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');         // e.g. confirmed, checked_in
  const from   = searchParams.get('from');           // ISO date string
  const to     = searchParams.get('to');             // ISO date string
  const page   = parseInt(searchParams.get('page') ?? '1', 10);
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('stays')
    .select('*', { count: 'exact' })
    .eq('propertyid', propertyId)
    .order('checkindate', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (from)   query = query.gte('checkindate', from);
  if (to)     query = query.lte('checkoutdate', to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, limit },
  });
}

/* ─────────────────────────────────────────────────────────────────
   POST — create a new stay (manual entry by hotel staff)
   ───────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const auth = await resolvePropertyId(request);
  if (isNextResponse(auth)) return auth;
  const { propertyId } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate required fields
  const required = ['guest_name', 'checkindate', 'checkoutdate'];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 },
      );
    }
  }

  // Validate date logic
  const checkIn  = new Date(body.checkindate as string);
  const checkOut = new Date(body.checkoutdate as string);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: 'checkoutdate must be after checkindate' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Generate a human-readable confirmation number for manual stays
  const confirmationNumber = `MAN-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from('stays')
    .insert({
      propertyid:             propertyId,
      external_id:            confirmationNumber,   // manual stays use confirmation as external_id
      booking_reference:      confirmationNumber,
      status:                 (body.status as string) ?? 'confirmed',
      checkindate:            body.checkindate,
      checkoutdate:           body.checkoutdate,
      guestcount:             (body.guestcount as number) ?? 1,
      guest_name:             body.guest_name,
      room_number:            body.room_number ?? null,
      booking_source:         'manual',
      trip_type:              body.trip_type ?? null,
      notes:                  body.notes ?? null,
      external_created_at:    now,
      external_updated_at:    now,
      last_synced_at:         now,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

/* ─────────────────────────────────────────────────────────────────
   PUT — update an existing stay
   ───────────────────────────────────────────────────────────────── */

export async function PUT(request: NextRequest) {
  const auth = await resolvePropertyId(request);
  if (isNextResponse(auth)) return auth;
  const { propertyId } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing stay id' }, { status: 400 });
  }

  // Prevent hotel admin from changing the property this stay belongs to
  delete updates.propertyid;
  delete updates.external_id;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('stays')
    .update({
      ...updates,
      external_updated_at: new Date().toISOString(),
    })
    .eq('id', id as string)
    .eq('propertyid', propertyId)   // ownership check
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Stay not found or not yours' },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

/* ─────────────────────────────────────────────────────────────────
   DELETE — cancel a stay (soft delete via status)
   We never hard-delete stays — cancelled stays are kept for history.
   ───────────────────────────────────────────────────────────────── */

export async function DELETE(request: NextRequest) {
  const auth = await resolvePropertyId(request);
  if (isNextResponse(auth)) return auth;
  const { propertyId } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing stay id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('stays')
    .update({
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      external_updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('propertyid', propertyId)   // ownership check
    .select('id, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Stay not found or not yours' },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}
