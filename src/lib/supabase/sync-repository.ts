/**
 * Sync Runs Repository — tracks sync job execution.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { SyncRun, SyncType, ExternalSource } from '@/types/database';

export interface CreateSyncRunInput {
  sync_type: SyncType;
  provider: ExternalSource;
  region_id?: string | null;
  category?: string | null;
}

export async function createSyncRun(
  supabase: SupabaseClient,
  input: CreateSyncRunInput,
): Promise<SyncRun> {
  const { data, error } = await supabase
    .from('sync_runs')
    .insert({
      sync_type: input.sync_type,
      provider: input.provider,
      region_id: input.region_id ?? null,
      category: input.category ?? null,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`createSyncRun failed: ${error.message}`);
  return data as SyncRun;
}

export async function completeSyncRun(
  supabase: SupabaseClient,
  id: string,
  result: {
    records_fetched: number;
    records_created: number;
    records_updated: number;
    records_deactivated: number;
  },
): Promise<void> {
  const { error } = await supabase
    .from('sync_runs')
    .update({
      status: 'completed',
      ...result,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(`completeSyncRun failed: ${error.message}`);
}

export async function failSyncRun(
  supabase: SupabaseClient,
  id: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from('sync_runs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(`failSyncRun failed: ${error.message}`);
}

export async function getLatestSyncRun(
  supabase: SupabaseClient,
  syncType: SyncType,
  provider: ExternalSource,
  regionId?: string,
): Promise<SyncRun | null> {
  let query = supabase
    .from('sync_runs')
    .select('*')
    .eq('sync_type', syncType)
    .eq('provider', provider)
    .order('started_at', { ascending: false })
    .limit(1);

  if (regionId) query = query.eq('region_id', regionId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`getLatestSyncRun failed: ${error.message}`);
  return (data as SyncRun) ?? null;
}
