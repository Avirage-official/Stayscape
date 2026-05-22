import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { verifyAdminSession } from '@/lib/auth/admin-session';

function guardAdmin(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get('sa_session')?.value ?? '';
  if (!verifyAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const guard = guardAdmin(request);
  if (guard) return guard;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
