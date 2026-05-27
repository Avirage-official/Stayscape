import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const saSession = request.cookies.get('sa_session')?.value ?? '';
  if (!verifyAdminSession(saSession)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const body = await request.json() as { credits?: number };
    const { credits } = body;

    if (typeof credits !== 'number' || !Number.isInteger(credits) || credits < 0 || credits > 100) {
      return NextResponse.json({ error: 'Credits must be an integer between 0 and 100' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('users')
      .update({ aria_credits: credits })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, credits });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
