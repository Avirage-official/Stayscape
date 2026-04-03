/**
 * POST /api/admin/sync/places
 *
 * Admin endpoint to trigger a places sync from Geoapify.
 * Requires a region_id, latitude, and longitude.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncPlaces, type PlaceSyncOptions } from '@/lib/services/sync/places-sync';

interface SyncPlacesBody {
  region_id: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  categories?: string[];
  limit?: number;
  skip_enrichment?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SyncPlacesBody;

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
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
