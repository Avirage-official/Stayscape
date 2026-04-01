/**
 * Sync Orchestrator — Events
 *
 * Coordinates the full event sync pipeline:
 * 1. Create sync_run record
 * 2. Fetch events from the specified provider
 * 3. Upsert into Supabase
 * 4. Deactivate expired events
 * 5. Deactivate stale records
 * 6. Queue AI enrichment for new records
 * 7. Complete the sync_run
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  upsertEvent,
  deactivateExpiredEvents,
  deactivateStaleEvents,
  createSyncRun,
  completeSyncRun,
  failSyncRun,
} from '@/lib/supabase';
import { getEventProvider, type EventSearchParams } from '@/lib/services/events';
import { enrichNewEvents } from '@/lib/services/ai/enrichment';
import type { ExternalSource } from '@/types/database';

export interface EventSyncOptions {
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

export interface EventSyncResult {
  sync_run_id: string;
  records_fetched: number;
  records_created: number;
  records_updated: number;
  records_deactivated: number;
  records_expired: number;
  enrichment?: { enriched: number; failed: number };
}

export async function syncEvents(
  options: EventSyncOptions,
): Promise<EventSyncResult> {
  const supabase = getSupabaseAdmin();
  const providerKey = options.provider ?? 'ticketmaster';
  const provider = getEventProvider(providerKey);
  const syncStartedAt = new Date().toISOString();

  const syncRun = await createSyncRun(supabase, {
    sync_type: 'events',
    provider: providerKey,
    region_id: options.region_id,
    category: options.category,
  });

  try {
    // Fetch from provider
    const searchParams: EventSearchParams = {
      latitude: options.latitude,
      longitude: options.longitude,
      radius_km: options.radius_km ?? 25,
      category: options.category,
      date_from: options.date_from,
      date_to: options.date_to,
      limit: options.limit ?? 50,
    };

    const rawEvents = await provider.searchEvents(searchParams);

    // Upsert into Supabase
    let created = 0;
    let updated = 0;
    const newEventIds: string[] = [];

    for (const eventInput of rawEvents) {
      const result = await upsertEvent(supabase, {
        ...eventInput,
        region_id: options.region_id,
      });
      if (result.created) {
        created++;
        newEventIds.push(result.event.id);
      } else {
        updated++;
      }
    }

    // Deactivate expired events (global)
    const expired = await deactivateExpiredEvents(supabase);

    // Deactivate stale records from this provider/region
    const deactivated = await deactivateStaleEvents(
      supabase,
      providerKey,
      options.region_id,
      syncStartedAt,
    );

    // AI enrichment for new records
    let enrichment: { enriched: number; failed: number } | undefined;
    if (!options.skip_enrichment && newEventIds.length > 0) {
      enrichment = await enrichNewEvents(supabase, newEventIds);
    }

    // Complete sync_run
    const syncResult = {
      records_fetched: rawEvents.length,
      records_created: created,
      records_updated: updated,
      records_deactivated: deactivated,
    };
    await completeSyncRun(supabase, syncRun.id, syncResult);

    return {
      sync_run_id: syncRun.id,
      ...syncResult,
      records_expired: expired,
      enrichment,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await failSyncRun(supabase, syncRun.id, message);
    throw error;
  }
}
