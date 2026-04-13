/**
 * Curation Repository
 *
 * Supabase data-access layer for AI-generated stay curations.
 * Stores and retrieves curated content (itineraries, recommended places,
 * regional activities) generated for each guest stay.
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { StayCuration, CurationType } from '@/types/pms';

/**
 * Get all curations for a stay.
 */
export async function getCurationsForStay(
  stayId: string,
): Promise<StayCuration[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('stay_curations')
    .select('*')
    .eq('stay_id', stayId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data as StayCuration[];
}

/**
 * Get a specific curation type for a stay.
 */
export async function getCuration(
  stayId: string,
  curationType: CurationType,
): Promise<StayCuration | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('stay_curations')
    .select('*')
    .eq('stay_id', stayId)
    .eq('curation_type', curationType)
    .maybeSingle();

  if (error || !data) return null;

  return data as StayCuration;
}

/**
 * Upsert a curation for a stay.
 * If a curation of the same type already exists, it is replaced.
 */
export async function upsertCuration(
  stayId: string,
  curationType: CurationType,
  content: StayCuration['content'],
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Check if curation exists
  const { data: existing } = await supabase
    .from('stay_curations')
    .select('id')
    .eq('stay_id', stayId)
    .eq('curation_type', curationType)
    .maybeSingle();

  if (existing) {
    // Update existing
    await supabase
      .from('stay_curations')
      .update({ content, updated_at: now })
      .eq('id', existing.id);

    return existing.id as string;
  }

  // Insert new
  const { data: created, error } = await supabase
    .from('stay_curations')
    .insert({
      stay_id: stayId,
      curation_type: curationType,
      content,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create curation: ${error?.message ?? 'Unknown error'}`);
  }

  return created.id as string;
}

/**
 * Delete all curations for a stay (used before re-curation).
 */
export async function deleteCurationsForStay(
  stayId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('stay_curations')
    .delete()
    .eq('stay_id', stayId);
}

/**
 * Check if a stay has any curations.
 */
export async function hasCurations(
  stayId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from('stay_curations')
    .select('id', { count: 'exact', head: true })
    .eq('stay_id', stayId);

  if (error) return false;
  return (count ?? 0) > 0;
}
