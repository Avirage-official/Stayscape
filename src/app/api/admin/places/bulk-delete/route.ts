import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { verifyAdminSession } from '@/lib/auth/admin-session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get('sa_session')?.value ?? '';
  if (!verifyAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { ids?: string[] } | null;
  if (!body?.ids?.length) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('places').delete().in('id', body.ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, deleted: body.ids.length });
}
