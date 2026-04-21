/**
 * Client-side helper for the /api/ai/chat backend route.
 *
 * All Claude calls flow through the backend — the Anthropic API key
 * is never exposed in client-side code.
 */

export async function sendChatMessage(
  message: string,
  stayId?: string | null,
): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, stayId: stayId ?? null }),
  });
  if (!res.ok) {
    return "I'm having trouble responding right now. Please try again.";
  }
  const data = (await res.json()) as { reply?: string; error?: string };
  return data.reply ?? "I couldn't generate a response. Please try again.";
}
