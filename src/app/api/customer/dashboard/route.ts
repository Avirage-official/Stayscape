import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardBundle,
} from '@/lib/supabase/customer-repository';
import { getSupabaseBrowser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 },
    );
  }

  // Auth guard: verify the caller's Supabase session and ensure it
  // belongs to the userId being requested.
  const authHeader =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  const accessToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Auth service unavailable' },
      { status: 500 },
    );
  }

  const { data: userData, error: authError } =
    await supabase.auth.getUser(accessToken);
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  if (userData.user.id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 },
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
