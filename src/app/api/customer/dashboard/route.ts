import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerProfile,
  getUpcomingStays,
} from '@/lib/supabase/customer-repository';

/**
 * GET /api/customer/dashboard?userId=<uuid>
 *
 * Returns the dashboard data for a logged-in customer:
 * - profile (from public.users)
 * - upcomingStay (first upcoming stay, for backward compat), or null
 * - upcomingStays (all upcoming stays ordered by check-in)
 *
 * In production, derive userId from a verified session cookie.
 * For now, accept it as a query param (thin auth layer).
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 },
    );
  }

  try {
    const [profile, upcomingStays] = await Promise.all([
      getCustomerProfile(userId),
      getUpcomingStays(userId),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    // upcomingStay is the first stay for backward compatibility
    const upcomingStay = upcomingStays[0] ?? null;

    return NextResponse.json({ profile, upcomingStay, upcomingStays });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    );
  }
}
