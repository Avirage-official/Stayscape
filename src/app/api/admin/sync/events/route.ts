/**
 * POST /api/admin/sync/events
 *
 * Admin endpoint to trigger an events sync from the configured
 * event provider.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncEvents, type EventSyncOptions } from '@/lib/services/sync/events-sync';
import type { ExternalSource } from '@/types/database';
import { applyRateLimit } from '@/lib/rate-limit';
import { requireAdminKey } from '@/lib/auth/require-admin-key';

interface SyncEventsBody {
  region_id: string;
  latitude: number;
  longitude: number;
  radius_km?: number;
  provider?: ExternalSource;
  category?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  skip_enrichment?: boolean;
}

export async function POST(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as SyncEventsBody;

    if (!body.region_id || body.latitude == null || body.longitude == null) {
      return NextResponse.json(
        { error: 'Missing required fields: region_id, latitude, longitude' },
        { status: 400 },
      );
    }

    const options: EventSyncOptions = {
      region_id: body.region_id,
      latitude: body.latitude,
      longitude: body.longitude,
      radius_km: body.radius_km,
      provider: body.provider,
      category: body.category,
      date_from: body.date_from,
      date_to: body.date_to,
      limit: body.limit,
      skip_enrichment: body.skip_enrichment,
    };

    const result = await syncEvents(options);
    return NextResponse.json({ data: result }, { headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
