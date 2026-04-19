/**
 * POST /api/admin/sync/places
 *
 * Admin endpoint to trigger a places sync from Geoapify.
 * Requires a region_id, latitude, and longitude.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncPlaces, type PlaceSyncOptions } from '@/lib/services/sync/places-sync';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';

interface SyncPlacesBody {
  mode?: 'single_region' | 'all_active_regions';
  region_id: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  categories?: string[];
  limit?: number;
  skip_enrichment?: boolean;
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as SyncPlacesBody;
    const mode = body.mode ?? 'single_region';

    if (mode === 'all_active_regions') {
      const supabase = getSupabaseAdmin();
      const { data: regions, error } = await supabase
        .from('regions')
        .select('id, latitude, longitude, radius_km')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to load active regions: ${error.message}`);
      }

      const activeRegions = (regions ?? []) as Array<{
        id: string;
        latitude: number;
        longitude: number;
        radius_km: number;
      }>;

      if (activeRegions.length === 0) {
        return NextResponse.json(
          { data: { mode, regions_processed: 0, results: [] } },
          { headers: rateLimit.headers },
        );
      }

      const results = [];
      for (const region of activeRegions) {
        const options: PlaceSyncOptions = {
          region_id: region.id,
          latitude: region.latitude,
          longitude: region.longitude,
          radius_meters: body.radius_meters ?? Math.round(region.radius_km * 1000),
          categories: body.categories,
          limit: body.limit,
          skip_enrichment: body.skip_enrichment,
        };
        const result = await syncPlaces(options);
        results.push({ region_id: region.id, ...result });
      }

      return NextResponse.json(
        { data: { mode, regions_processed: results.length, results } },
        { headers: rateLimit.headers },
      );
    }

    if (!body.region_id || body.latitude == null || body.longitude == null) {
      return NextResponse.json(
        { error: 'Missing required fields: region_id, latitude, longitude' },
        { status: 400 },
      );
    }

    const options: PlaceSyncOptions = {
      region_id: body.region_id,
      latitude: body.latitude,
      longitude: body.longitude,
      radius_meters: body.radius_meters,
      categories: body.categories,
      limit: body.limit,
      skip_enrichment: body.skip_enrichment,
    };

    const result = await syncPlaces(options);
    return NextResponse.json(
      { data: { mode, ...result } },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
