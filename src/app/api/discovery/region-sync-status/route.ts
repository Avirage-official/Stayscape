import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const regionId = request.nextUrl.searchParams.get('regionId');
  if (!regionId) {
    return NextResponse.json(
      { error: 'regionId query parameter is required' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503, headers: rateLimit.headers },
    );
  }

  const { data, error } = await supabase
    .from('places')
    .select('last_synced_at')
    .eq('region_id', regionId)
    .eq('is_active', true)
    .not('last_synced_at', 'is', null)
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `Failed to load sync status: ${error.message}` },
      { status: 500, headers: rateLimit.headers },
    );
  }

  return NextResponse.json(
    { last_synced_at: (data?.last_synced_at as string | null) ?? null },
    { headers: rateLimit.headers },
  );
}
