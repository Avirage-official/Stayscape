/**
 * GET /api/hotel-admin/rooms
 *
 * Lists all rooms for the authenticated hotel admin's property.
 * Accepts a Supabase JWT via the Authorization: Bearer <token> header.
 *
 * Returns:
 *   200 { rooms: PropertyRoom[] }
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'No hotel admin account found' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: adminData, error: adminError } = await supabase
    .from('hotel_admins')
    .select('property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (adminError || !adminData) {
    return NextResponse.json({ error: 'No hotel admin account found' }, { status: 404 });
  }

  const { property_id } = adminData as { property_id: string };

  const { data: rooms, error: roomsError } = await supabase
    .from('property_rooms')
    .select(
      'id, propertyid, room_number, floor, room_type, bed_config, max_occupancy, status, notes, createdat, updatedat',
    )
    .eq('propertyid', property_id)
    .order('room_number', { ascending: true });

  if (roomsError) {
    return NextResponse.json({ error: roomsError.message }, { status: 500 });
  }

  return NextResponse.json({ rooms: rooms ?? [] });
}
