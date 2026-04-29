/**
 * PATCH /api/hotel-admin/rooms/[roomId]
 *
 * Updates the status (and optionally notes) of a room for the authenticated hotel admin's property.
 * Accepts a Supabase JWT via the Authorization: Bearer <token> header.
 *
 * Body: { status: RoomStatus, notes?: string }
 *
 * Returns:
 *   200 { room: PropertyRoom }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 *   403 { error: 'Forbidden' }
 *   404 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = [
  'vacant_clean',
  'vacant_dirty',
  'occupied',
  'maintenance',
  'out_of_order',
] as const;
type RoomStatus = (typeof VALID_STATUSES)[number];

interface PatchBody {
  status: RoomStatus;
  notes?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
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

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { status, notes } = body;

  if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const { roomId } = await params;

  // Verify the room belongs to this admin's property
  const { data: existingRoom, error: fetchError } = await supabase
    .from('property_rooms')
    .select('id, propertyid')
    .eq('id', roomId)
    .maybeSingle();

  if (fetchError || !existingRoom) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const room = existingRoom as { id: string; propertyid: string };

  if (room.propertyid !== property_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updatePayload: Record<string, unknown> = {
    status,
    updatedat: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  const { data: updatedRoom, error: updateError } = await supabase
    .from('property_rooms')
    .update(updatePayload)
    .eq('id', roomId)
    .select(
      'id, propertyid, room_number, floor, room_type, bed_config, max_occupancy, status, notes, createdat, updatedat',
    )
    .maybeSingle();

  if (updateError || !updatedRoom) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update room' },
      { status: 500 },
    );
  }

  return NextResponse.json({ room: updatedRoom });
}
