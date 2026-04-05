/**
 * GET /api/places
 *
 * Returns places from the Supabase `places` table filtered by region.
 * Used by the map to load markers for the active region.
 *
 * Query params:
 *   region_id  — UUID of the active region (required)
 *   limit      — max results (default 300)
 *
 * Note: The `places` table requires an RLS policy for public reads:
 *   CREATE POLICY "Allow public read access on places"
 *     ON places FOR SELECT USING (true);
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const regionId = searchParams.get('region_id') ?? '';
  const parsedLimit = parseInt(searchParams.get('limit') ?? '300', 10);
  const limit = Math.min(Number.isNaN(parsedLimit) ? 300 : parsedLimit, 500);

  if (!regionId) {
    return NextResponse.json({ error: 'region_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('places')
      .select(
        'id, name, category, description, editorial_summary, latitude, longitude, address, rating, booking_url, website, image_url',
      )
      .eq('region_id', regionId)
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
