import { NextResponse } from 'next/server';
import {
  getDashboardBundle,
} from '@/lib/supabase/customer-repository';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Authenticate via server-side session cookie — no Authorization header required.
  const supabase = await createSupabaseRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    const dashboard = await getDashboardBundle(user.id);
    if (!dashboard) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }
    return NextResponse.json(dashboard);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('DASHBOARD API ERROR:', error, error?.stack || '');
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
