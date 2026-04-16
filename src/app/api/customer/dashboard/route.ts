import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardBundle,
} from '@/lib/supabase/customer-repository';

/**
 * GET /api/customer/dashboard?userId=<uuid>
 *
 * Returns the dashboard data for a logged-in customer:
 * - profile (from public.users)
 * - currentStays (check-in ≤ today ≤ check-out)
 * - upcomingStays (check-in > today)
 * - pastStays (check-out < today, most recent first)
 * - upcomingStay (first current or upcoming stay, for backward compat)
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
    const dashboard = await getDashboardBundle(userId);
    if (!dashboard) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }
    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    );
  }
}
