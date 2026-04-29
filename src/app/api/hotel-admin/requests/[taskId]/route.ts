/**
 * PATCH /api/hotel-admin/requests/[taskId]
 *
 * Updates the status of a service task for the authenticated hotel admin's property.
 * Accepts a Supabase JWT via the Authorization: Bearer <token> header.
 *
 * Body: { status: 'pending' | 'in_progress' | 'completed' | 'cancelled', cancel_reason?: string }
 *
 * Returns:
 *   200 { task: ServiceTask }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 *   403 { error: 'Forbidden' }
 *   404 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
type TaskStatus = (typeof VALID_STATUSES)[number];

interface PatchBody {
  status: TaskStatus;
  cancel_reason?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
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

  const { status, cancel_reason } = body;

  if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const { taskId } = await params;

  // Verify the task belongs to this admin's property
  const { data: existingTask, error: fetchError } = await supabase
    .from('service_tasks')
    .select('id, propertyid')
    .eq('id', taskId)
    .maybeSingle();

  if (fetchError || !existingTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = existingTask as { id: string; propertyid: string };

  if (task.propertyid !== property_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status,
    updatedat: now,
  };

  if (status === 'in_progress') {
    updatePayload.started_at = now;
  } else if (status === 'completed') {
    updatePayload.completed_at = now;
  } else if (status === 'cancelled') {
    updatePayload.cancelled_at = now;
    if (cancel_reason) {
      updatePayload.cancel_reason = cancel_reason;
    }
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from('service_tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .select(
      'id, title, description, task_type, status, priority, createdat, updatedat, roomid, stayid, property_rooms(room_number, room_type), stays(guest_email, roomlabel)',
    )
    .maybeSingle();

  if (updateError || !updatedTask) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update task' },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: updatedTask });
}
