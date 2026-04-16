import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardBundle,
} from '@/lib/supabase/customer-repository';

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
  } catch (err: unknown) {
    const error = err as Error;
    console.error("DASHBOARD API ERROR:", error, error?.stack || "");
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
