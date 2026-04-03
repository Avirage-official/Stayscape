/**
 * Sync Orchestrator — Places
 *
 * Coordinates the full sync pipeline:
 * 1. Create a sync_run record
 * 2. Fetch places from Geoapify
 * 3. Upsert into Supabase
 * 4. Deactivate stale records
 * 5. Queue AI enrichment for new records
 * 6. Complete the sync_run
 *
 * Designed to support:
 * - region-based sync
 * - category-based sync
 * - selective refresh for stale records
 * - on-demand admin sync
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  upsertPlace,
  deactivateStalePlaces,
  createSyncRun,
  completeSyncRun,
  failSyncRun,
} from '@/lib/supabase';
import { searchPlaces, type GeoapifySearchParams } from '@/lib/services/geoapify';
import { enrichNewPlaces } from '@/lib/services/ai/enrichment';

export interface PlaceSyncOptions {
  region_id: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  categories?: string[];
  limit?: number;
  skip_enrichment?: boolean;
}

export interface PlaceSyncResult {
  sync_run_id: string;
  records_fetched: number;
  records_created: number;
  records_updated: number;
  records_deactivated: number;
  enrichment?: { enriched: number; failed: number };
}

export async function syncPlaces(
  options: PlaceSyncOptions,
): Promise<PlaceSyncResult> {
  const supabase = getSupabaseAdmin();
  const syncStartedAt = new Date().toISOString();

  // 1. Create sync_run
  const syncRun = await createSyncRun(supabase, {
    sync_type: 'places',
    provider: 'geoapify',
    region_id: options.region_id,
  });

  try {
    // 2. Fetch from Geoapify
    const searchParams: GeoapifySearchParams = {
      latitude: options.latitude,
      longitude: options.longitude,
      radius_meters: options.radius_meters ?? 5000,
      categories: options.categories,
      limit: options.limit ?? 50,
    };

    const rawPlaces = await searchPlaces(searchParams);

    // 3. Upsert into Supabase
    let created = 0;
    let updated = 0;
    const newPlaceIds: string[] = [];

    for (const placeInput of rawPlaces) {
      const result = await upsertPlace(supabase, {
        ...placeInput,
        region_id: options.region_id,
      });
      if (result.created) {
        created++;
        newPlaceIds.push(result.place.id);
      } else {
        updated++;
      }
    }

    // 4. Deactivate stale records
    const deactivated = await deactivateStalePlaces(
      supabase,
      'geoapify',
      options.region_id,
      syncStartedAt,
    );

    // 5. AI enrichment for new records
    let enrichment: { enriched: number; failed: number } | undefined;
    if (!options.skip_enrichment && newPlaceIds.length > 0) {
      enrichment = await enrichNewPlaces(supabase, newPlaceIds);
    }

    // 6. Complete sync_run
    const syncResult = {
      records_fetched: rawPlaces.length,
      records_created: created,
      records_updated: updated,
      records_deactivated: deactivated,
    };
    await completeSyncRun(supabase, syncRun.id, syncResult);

    return {
      sync_run_id: syncRun.id,
      ...syncResult,
      enrichment,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await failSyncRun(supabase, syncRun.id, message);
    throw error;
  }
}
