import { NextRequest, NextResponse } from 'next/server';
import { getStayById } from '@/lib/supabase/customer-repository';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/customer/stays/[stayId]
 *
 * Returns a single stay by ID for the authenticated user.
 * Auth: requires Bearer token (Supabase session).
 * Ownership is validated — users can only fetch their own stays.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> },
) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { stayId } = await params;

  try {
    const stay = await getStayById(user.id, stayId);

    if (!stay) {
      return NextResponse.json({ error: 'Stay not found' }, { status: 404 });
    }

    return NextResponse.json({ stay });
  } catch (error) {
    console.error('[customer/stays] GET error:', error);
    return NextResponse.json({ error: 'Failed to load stay' }, { status: 500 });
  }
}
