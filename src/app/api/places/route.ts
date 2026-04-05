/**
 * GET /api/places
 *
 * Returns places from the Supabase `places` table filtered by region.
 * Used by the map to load markers for the active region.
 *
 * Query params:
 *   region_id  — UUID of the active region (required)
 *   limit      — max results (default 500, max 2000)
 *   north      — viewport north bound (latitude)
 *   south      — viewport south bound (latitude)
 *   east       — viewport east bound (longitude)
 *   west       — viewport west bound (longitude)
 *
 * Note: The `places` table requires an RLS policy for public reads:
 *   CREATE POLICY "Allow public read access on places"
 *     ON places FOR SELECT USING (true);
 *
 * Performance note: add this index for viewport queries:
 *   CREATE INDEX IF NOT EXISTS idx_places_lat_lng
 *     ON places (latitude, longitude) WHERE is_active = true;
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const regionId = searchParams.get('region_id') ?? '';
  const parsedLimit = parseInt(searchParams.get('limit') ?? '500', 10);
  const limit = Math.min(Number.isNaN(parsedLimit) ? 500 : parsedLimit, 2000);

  const north = parseFloat(searchParams.get('north') ?? '');
  const south = parseFloat(searchParams.get('south') ?? '');
  const east = parseFloat(searchParams.get('east') ?? '');
  const west = parseFloat(searchParams.get('west') ?? '');

  if (!regionId) {
    return NextResponse.json({ error: 'region_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('places')
      .select(
        'id, name, category, description, editorial_summary, latitude, longitude, address, rating, booking_url, website, image_url',
      )
      .eq('region_id', regionId)
      .eq('is_active', true);

    /* If bounds are provided, filter by viewport */
    if (!isNaN(north) && !isNaN(south) && !isNaN(east) && !isNaN(west)) {
      query = query
        .gte('latitude', south)
        .lte('latitude', north)
        .gte('longitude', west)
        .lte('longitude', east);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
