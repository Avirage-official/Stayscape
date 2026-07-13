/**
 * POST /api/stays/[stayId]/services/request
 *
 * Direct guest-initiated service request endpoint.
 * Inserts a row into `service_tasks` for hotel staff to action.
 *
 * Auth: requires Bearer token (Supabase session).
 * The authenticated user must own the stay.
 *
 * Body: { task_type, title, description? }
 * Reply: { ok: true, task_id } | { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const VALID_TASK_TYPES = [
  'housekeeping',
  'room_service',
  'maintenance',
  'concierge',
  'breakfast',
  'transport',
  'other',
] as const;
type ValidTaskType = (typeof VALID_TASK_TYPES)[number];

const isValidTaskType = (v: unknown): v is ValidTaskType =>
  typeof v === 'string' && (VALID_TASK_TYPES as readonly string[]).includes(v);

interface RequestBody {
  task_type?: unknown;
  title?: unknown;
  description?: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  // Auth — Bearer token (Supabase session)
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const { stayId } = await params;

  // Validate body
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  if (!isValidTaskType(body.task_type)) {
    return NextResponse.json(
      { error: 'Invalid task_type' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  if (typeof body.title !== 'string' || body.title.trim().length === 0) {
    return NextResponse.json(
      { error: 'title is required' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const description =
    typeof body.description === 'string' ? body.description.trim() : null;

  // Verify the stay exists and is owned by this user — and grab propertyid
  const { data: stay, error: stayError } = await supabase
    .from('stays')
    .select('id, userid, propertyid')
    .eq('id', stayId)
    .maybeSingle();

  if (stayError || !stay) {
    return NextResponse.json(
      { error: 'Stay not found' },
      { status: 404, headers: rateLimit.headers },
    );
  }

  const stayRow = stay as { id: string; userid: string | null; propertyid: string | null };

  if (stayRow.userid !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403, headers: rateLimit.headers },
    );
  }

  if (stayRow.propertyid === null) {
    return NextResponse.json(
      { error: 'Service requests are not available for self-serve trips' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  // Insert the task
  const { data: inserted, error: insertError } = await supabase
    .from('service_tasks')
    .insert({
      propertyid: stayRow.propertyid,
      stayid: stayRow.id,
      task_type: body.task_type,
      title: body.title.trim(),
      description,
      status: 'pending',
      priority: 0,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('[stays/services/request] insert error:', insertError?.message);
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500, headers: rateLimit.headers },
    );
  }

  return NextResponse.json(
    { ok: true, task_id: (inserted as { id: string }).id },
    { headers: rateLimit.headers },
  );
}
