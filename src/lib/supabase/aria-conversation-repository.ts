import { getSupabaseAdmin } from '@/lib/supabase/client';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AriaConversationRow {
  messages: ConversationMessage[];
}

/**
 * Load existing conversation for a stay.
 * Returns [] if none exists or on any error (never throws).
 */
export async function loadConversation(stayId: string): Promise<ConversationMessage[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('aria_conversations')
      .select('messages')
      .eq('stay_id', stayId)
      .maybeSingle<AriaConversationRow>();
    if (error || !data) return [];
    return Array.isArray(data.messages) ? data.messages : [];
  } catch (err) {
    console.error('[aria-conversation] loadConversation failed:', err);
    return [];
  }
}

/**
 * Append new messages to the conversation. Upserts on stay_id.
 */
export async function appendToConversation(
  stayId: string,
  userId: string,
  newMessages: ConversationMessage[],
): Promise<void> {
  try {
    const existing = await loadConversation(stayId);
    const merged = [...existing, ...newMessages];
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('aria_conversations')
      .upsert(
        {
          stay_id: stayId,
          user_id: userId,
          messages: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stay_id' },
      );
    if (error) console.error('[aria-conversation] upsert failed:', error);
  } catch (err) {
    console.error('[aria-conversation] appendToConversation failed:', err);
  }
}

/**
 * Cap conversation to last `maxMessages` messages.
 */
export async function capConversation(stayId: string, maxMessages: number = 100): Promise<void> {
  try {
    const existing = await loadConversation(stayId);
    if (existing.length <= maxMessages) return;
    const trimmed = existing.slice(-maxMessages);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('aria_conversations')
      .update({ messages: trimmed, updated_at: new Date().toISOString() })
      .eq('stay_id', stayId);
    if (error) console.error('[aria-conversation] capConversation update failed:', error);
  } catch (err) {
    console.error('[aria-conversation] capConversation failed:', err);
  }
}
