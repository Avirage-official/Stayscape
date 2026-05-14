/**
 * GET  /api/hotel-admin/requests/[taskId]/messages  — fetch thread
 * POST /api/hotel-admin/requests/[taskId]/messages  — hotel sends a message
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
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
  if (adminError || !adminData) return NextResponse.json({ error: 'No hotel admin account' }, { status: 404 });

  const { taskId } = await params;
  const { property_id } = adminData as { property_id: string };

  // Verify task belongs to this property
  const { data: task, error: taskError } = await supabase
    .from('service_tasks')
    .select('id, propertyid')
    .eq('id', taskId)
    .maybeSingle();
  if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  const t = task as { id: string; propertyid: string };
  if (t.propertyid !== property_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
  if (adminError || !adminData) return NextResponse.json({ error: 'No hotel admin account' }, { status: 404 });

  const { taskId } = await params;
  const { property_id } = adminData as { property_id: string };

  const { data: task, error: taskError } = await supabase
    .from('service_tasks')
    .select('id, propertyid')
    .eq('id', taskId)
    .maybeSingle();
  if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  const t = task as { id: string; propertyid: string };
  if (t.propertyid !== property_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { message?: string };
  try { body = (await request.json()) as { message?: string }; }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const text = body.message?.trim();
  if (!text) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  const { data: msg, error } = await supabase
    .from('service_task_messages')
    .insert({ task_id: taskId, sender_role: 'hotel', message: text })
    .select('id, sender_role, message, createdat')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: msg }, { status: 201 });
}
