/**
 * Client-side helper for the /api/ai/chat backend route.
 *
 * All Claude calls flow through the backend — the Anthropic API key
 * is never exposed in client-side code.
 */

import { getSupabaseBrowser } from '@/lib/supabase/client';

export async function sendChatMessage(
  message: string,
  stayId?: string | null,
  history?: Array<{ role: 'user' | 'assistant'; text: string }>,
  mode?: 'discovery' | 'itinerary' | 'concierge',
): Promise<string> {
  const supabase = getSupabaseBrowser();
  let token: string | null = null;
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token ?? null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      stayId: stayId ?? null,
      history,
      mode,
    }),
  });
  if (!res.ok) {
    return "I'm having trouble responding right now. Please try again.";
  }
  const data = (await res.json()) as { reply?: string; error?: string };
  return data.reply ?? "I couldn't generate a response. Please try again.";
}
