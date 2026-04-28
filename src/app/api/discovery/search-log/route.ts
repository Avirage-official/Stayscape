/**
 * POST /api/discovery/search-log
 *
 * Logs a search result tap for analytics.
 * Fire-and-forget — UI does not wait for this.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';

interface SearchLogBody {
  query: string;
  place_name: string;
  source: 'database' | 'mapbox';
  place_id?: string | null;
  region_id?: string | null;
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = (await request.json()) as SearchLogBody;

    if (!body.query || !body.place_name || !body.source) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    // NOTE: If this insert silently errors with a "relation does not exist" /
    // missing-table message, the `place_searches` table migration has not been
    // run on the live database. See `src/lib/supabase/schema.ts` for the
    // canonical table definition.
    const { error: insertError } = await supabase.from('place_searches').insert({
      query: body.query.slice(0, 200),
      place_name: body.place_name.slice(0, 200),
      source: body.source,
      place_id: body.place_id ?? null,
      region_id: body.region_id ?? null,
    });

    if (insertError) {
      console.error('[search-log] Insert failed:', insertError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Never surface analytics errors to the client, but log for debugging
    console.error('[search-log] Unexpected error:', err);
    return NextResponse.json({ ok: true });
  }
}
