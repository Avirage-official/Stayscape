import { NextRequest, NextResponse } from 'next/server';
import { getStayById } from '@/lib/supabase/customer-repository';

/**
 * GET /api/customer/stays/[stayId]?userId=<uuid>
 *
 * Returns a single stay by ID for the authenticated user.
 * Validates ownership so users can only fetch their own stays.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> },
) {
  const userId = request.nextUrl.searchParams.get('userId');
  const { stayId } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 },
    );
  }

  if (!stayId) {
    return NextResponse.json(
      { error: 'stayId is required' },
      { status: 400 },
    );
  }

  try {
    const stay = await getStayById(userId, stayId);

    if (!stay) {
      return NextResponse.json(
        { error: 'Stay not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ stay });
  } catch (error) {
    console.error('[customer/stays] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load stay' },
      { status: 500 },
    );
  }
}
