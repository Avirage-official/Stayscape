/**
 * GET /api/hotel-admin/requests
 *
 * Lists service tasks for the authenticated hotel admin's property.
 * Accepts a Supabase JWT via the Authorization: Bearer <token> header.
 *
 * Query params:
 *   ?status=pending|in_progress|completed|cancelled  (optional filter)
 *
 * Returns:
 *   200 { tasks: ServiceTask[] }
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'No hotel admin account found' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
type TaskStatus = (typeof VALID_STATUSES)[number];

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

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const statusFilter =
    statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as TaskStatus)
      : null;

  let query = supabase
    .from('service_tasks')
    .select(
      'id, title, description, task_type, status, priority, createdat, updatedat, roomid, stayid, property_rooms(room_number, room_type), stays(guest_email, roomlabel)',
    )
    .eq('propertyid', property_id)
    .order('createdat', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: tasks, error: tasksError } = await query;

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks ?? [] });
}
