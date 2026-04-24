/**
 * AI Guest Memory Repository
 *
 * Supabase data-access layer for the ai_guest_memory table.
 * Provides persistent memory and conversation context for the unified
 * guest-facing AI across all touchpoints.
 *
 * All functions use getSupabaseAdmin() — server-side only.
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';

export interface MemoryItem {
  type: string;
  content: string;
  weight?: number;
}

export interface AiGuestMemoryRow {
  id: string;
  stay_id: string;
  user_id: string;
  memories: MemoryItem[];
  conversation_summary: string | null;
  status: 'active' | 'closed';
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch an existing ai_guest_memory row for a stay, or create one if none exists.
 */
export async function getOrCreateMemory(
  stayId: string,
  userId: string,
): Promise<AiGuestMemoryRow> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: selectError } = await supabase
    .from('ai_guest_memory')
    .select('*')
    .eq('stay_id', stayId)
    .maybeSingle<AiGuestMemoryRow>();

  if (selectError) {
    throw new Error(`Failed to fetch ai_guest_memory: ${selectError.message}`);
  }

  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('ai_guest_memory')
    .insert({
      stay_id: stayId,
      user_id: userId,
      memories: [],
      status: 'active',
    })
    .select('*')
    .single<AiGuestMemoryRow>();

  if (insertError || !created) {
    throw new Error(`Failed to create ai_guest_memory: ${insertError?.message ?? 'Unknown error'}`);
  }

  return created;
}

/**
 * Append new memory items to a stay's memory array.
 * Keeps at most 20 items total — oldest are dropped when the limit is exceeded.
 */
export async function appendMemories(
  stayId: string,
  newMemories: MemoryItem[],
): Promise<void> {
  if (newMemories.length === 0) return;

  const supabase = getSupabaseAdmin();

  const { data: row, error: fetchError } = await supabase
    .from('ai_guest_memory')
    .select('memories')
    .eq('stay_id', stayId)
    .maybeSingle<{ memories: MemoryItem[] }>();

  if (fetchError) {
    throw new Error(`Failed to fetch memories for append: ${fetchError.message}`);
  }

  const existing: MemoryItem[] = row?.memories ?? [];
  const merged = [...existing, ...newMemories].slice(-20);

  const { error: updateError } = await supabase
    .from('ai_guest_memory')
    .update({ memories: merged, updated_at: new Date().toISOString() })
    .eq('stay_id', stayId);

  if (updateError) {
    throw new Error(`Failed to update memories: ${updateError.message}`);
  }
}

/**
 * Close the memory record for a stay when the guest checks out.
 */
export async function closeMemory(stayId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('ai_guest_memory')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('stay_id', stayId);

  if (error) {
    throw new Error(`Failed to close ai_guest_memory: ${error.message}`);
  }
}

/**
 * Fetch up to 3 closed memory rows for a user (past stays), ordered by most recent.
 * Used to provide returning-guest context in the AI prompt.
 */
export async function getPastStayMemories(
  userId: string,
): Promise<Array<{ memories: MemoryItem[]; conversation_summary: string | null }>> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('ai_guest_memory')
    .select('memories, conversation_summary')
    .eq('user_id', userId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(3)
    .returns<Array<{ memories: MemoryItem[]; conversation_summary: string | null }>>();

  if (error) {
    throw new Error(`Failed to fetch past stay memories: ${error.message}`);
  }

  return data ?? [];
}
