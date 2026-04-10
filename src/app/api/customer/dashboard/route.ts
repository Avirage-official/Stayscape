import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerProfile,
  getUpcomingStay,
} from '@/lib/supabase/customer-repository';

/**
 * GET /api/customer/dashboard?userId=<uuid>
 *
 * Returns the dashboard data for a logged-in customer:
 * - profile (from public.users)
 * - upcoming stay (from public.stays + public.properties), or null
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
    const [profile, upcomingStay] = await Promise.all([
      getCustomerProfile(userId),
      getUpcomingStay(userId),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile, upcomingStay });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    );
  }
}
