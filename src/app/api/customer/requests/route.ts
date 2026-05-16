/**
 * GET  /api/customer/requests
 * POST /api/customer/requests
 *
 * Guest-facing service requests for their active stay.
 * Accepts a Supabase JWT via the Authorization: Bearer <token> header.
 *
 * GET returns all service tasks for the guest's active stay.
 * POST creates a new service task for the guest's active stay.
 *
 * GET Returns:
 *   200 { tasks: ServiceTask[] }
 *   401 { error: 'Unauthorized' }
 *   404 { error: string }
 *
 * POST Body: { task_type: string, title: string, description?: string, priority?: number }
 * POST Returns:
 *   201 { task: ServiceTask }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 *   404 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// service_tasks has roomid (UUID FK → property_rooms), NOT roomlabel.
// We join stays(roomlabel) to surface the human-readable room label to the frontend.
const TASK_SELECT =
  'id, title, description, task_type, status, priority, createdat, updatedat, roomid, stayid, stays(roomlabel)';

// ─── Shared auth + active stay lookup ───────────────────────────────────────

async function getGuestStay(token: string) {
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) return { error: 'Unauthorized', status: 401 as const, supabase, user: null, stay: null };

  // Find the guest's active or confirmed stay
  const { data: stay, error: stayError } = await supabase
    .from('stays')
    .select('id, propertyid, roomlabel')
    .eq('userid', user.id)
    .in('status', ['active', 'confirmed', 'checked_in'])
    .order('checkindate', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (stayError || !stay) {
    return { error: 'No active stay found', status: 404 as const, supabase, user, stay: null };
  }

  return { error: null, status: null, supabase, user, stay };
}

// ─── GET /api/customer/requests ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error, status, supabase, stay } = await getGuestStay(token);

  if (error || !stay) {
    return NextResponse.json({ error }, { status: status ?? 500 });
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('service_tasks')
    .select(TASK_SELECT)
    .eq('stayid', stay.id)
    .order('createdat', { ascending: false });

  if (tasksError) {
    console.error('[customer/requests] Failed to fetch tasks:', tasksError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks ?? [] });
}

// ─── POST /api/customer/requests ─────────────────────────────────────────────

interface PostBody {
  task_type: string;
  title: string;
  description?: string;
  priority?: number;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error, status, supabase, stay } = await getGuestStay(token);

  if (error || !stay) {
    return NextResponse.json({ error }, { status: status ?? 500 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { task_type, title, description, priority } = body;

  if (!task_type || !title) {
    return NextResponse.json({ error: 'task_type and title are required' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // roomid is intentionally omitted — stays only carry roomlabel (text), not a
  // property_rooms UUID. The admin sees the room via stays(roomlabel) in their GET.
  const { data: task, error: insertError } = await supabase
    .from('service_tasks')
    .insert({
      propertyid: stay.propertyid,
      stayid: stay.id,
      task_type,
      title,
      description: description ?? null,
      priority: priority ?? 0,
      status: 'pending',
      createdat: now,
      updatedat: now,
    })
    .select(TASK_SELECT)
    .maybeSingle();

  if (insertError || !task) {
    console.error('[customer/requests] Failed to create task:', insertError);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }

  return NextResponse.json({ task }, { status: 201 });
}
