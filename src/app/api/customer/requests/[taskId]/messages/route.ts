/**
 * GET  /api/customer/requests/[taskId]/messages  — fetch thread for a task
 * POST /api/customer/requests/[taskId]/messages  — guest sends a message
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

async function resolveUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { user, supabase };
}

async function verifyTaskBelongsToGuest(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  taskId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('service_tasks')
    .select('id, stayid, stays!inner(userid)')
    .eq('id', taskId)
    .maybeSingle();

  if (error || !data) return false;
  const raw = data.stays as unknown;
  const stay = (Array.isArray(raw) ? raw[0] : raw) as { userid: string } | null;
  return stay?.userid === userId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const auth = await resolveUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user, supabase } = auth;
  const { taskId } = await params;

  const allowed = await verifyTaskBelongsToGuest(supabase, taskId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: messages, error } = await supabase
    .from('service_task_messages')
    .select('id, sender_role, message, createdat')
    .eq('task_id', taskId)
    .order('createdat', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const auth = await resolveUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user, supabase } = auth;
  const { taskId } = await params;

  const allowed = await verifyTaskBelongsToGuest(supabase, taskId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { message?: string };
  try { body = (await request.json()) as { message?: string }; }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const text = body.message?.trim();
  if (!text) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  const { data: msg, error } = await supabase
    .from('service_task_messages')
    .insert({ task_id: taskId, sender_role: 'guest', message: text })
    .select('id, sender_role, message, createdat')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: msg }, { status: 201 });
}
