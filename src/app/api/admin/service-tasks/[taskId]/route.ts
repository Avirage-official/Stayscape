/**
 * PATCH /api/admin/service-tasks/[taskId]
 *
 * Updates the status of a service task.
 * Auth: requires `sa_session` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
type TaskStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const saSession = request.cookies.get('sa_session');
  if (!saSession?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = await params;
  const supabase = getSupabaseAdmin();

  try {
    const body = (await request.json()) as { status?: unknown };
    const { status } = body;

    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, in_progress, completed, cancelled' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('service_tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
