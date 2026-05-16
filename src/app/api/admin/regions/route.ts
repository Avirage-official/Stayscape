/**
 * GET /api/admin/regions
 *
 * Returns active regions for dropdown use.
 * Auth: requires `sa_session` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { verifyAdminSession } from '@/lib/auth/admin-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const saSession = request.cookies.get('sa_session');
  if (!saSession?.value || !verifyAdminSession(saSession.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('regions')
      .select('id, name, country_code')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[admin/regions] Failed to fetch regions:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const regions = (data ?? []) as Array<{ id: string; name: string; country_code: string }>;
    return NextResponse.json({ regions });
  } catch (error) {
    console.error('[admin/regions] Unexpected error fetching regions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
