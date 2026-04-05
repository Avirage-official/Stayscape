/**
 * GET /api/places/search
 *
 * Searches the Supabase `places` table by name (case-insensitive fuzzy
 * match) filtered to the active region. Results are returned in the
 * same `SearchResult` shape used by the Mapbox geocoding layer so the
 * UI can merge them seamlessly.
 *
 * Query params:
 *   q          — search string (min 2 chars)
 *   region_id  — UUID of the active region
 *   limit      — max results (default 5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { haversineMetres, formatDistanceDisplay } from '@/lib/mapbox/geocoding';
import type { SearchResult } from '@/types/mapbox';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const regionId = searchParams.get('region_id') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '5', 10);

  if (q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const supabase = getSupabaseAdmin();

  try {
    let query = supabase
      .from('places')
      .select('id, name, category, address, latitude, longitude, region_id')
      .eq('is_active', true)
      .ilike('name', `%${q}%`)
      .limit(limit);

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    /* Fetch region center for distance calculation */
    let regionCenter: { latitude: number; longitude: number } | null = null;
    if (regionId) {
      const { data: region } = await supabase
        .from('regions')
        .select('latitude, longitude')
        .eq('id', regionId)
        .single();
      if (region) {
        regionCenter = region;
      }
    }

    const results: (SearchResult & { source: 'supabase' })[] = (data ?? []).map((place) => {
      const distanceMetres = regionCenter
        ? haversineMetres(regionCenter.latitude, regionCenter.longitude, place.latitude, place.longitude)
        : 0;
      return {
        id: `supabase-${place.id}`,
        name: place.name,
        fullAddress: place.address ?? '',
        subtitle: place.category ?? '',
        lat: place.latitude,
        lng: place.longitude,
        distanceMetres,
        distanceDisplay: regionCenter ? formatDistanceDisplay(distanceMetres) : '',
        source: 'supabase' as const,
      };
    });

    return NextResponse.json({ data: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
