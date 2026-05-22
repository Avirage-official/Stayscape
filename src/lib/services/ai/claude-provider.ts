/**
 * Claude (Anthropic) AI Provider
 *
 * Implements the AIEnrichmentProvider interface using the Anthropic
 * Messages API directly via fetch (no SDK dependency).
 *
 * API: https://api.anthropic.com/v1/messages
 * Model: claude-sonnet-4-20250514
 */

import type { InternalPlace, InternalEvent, TagType } from '@/types/database';
import type { AIEnrichmentProvider, EnrichmentResult } from './enrichment';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';

/* ── Claude API types ───────────────────────────────────────── */

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  error?: { message: string };
}

/* ── Expected JSON shape from Claude ───────────────────────── */

interface ClaudePlaceEnrichment {
  quality_score?: number;
  rejection_reason?: string;
  editorial_summary?: string;
  recommended_duration?: string | null;
  best_time_to_go?: string | null;
  vibes?: string[];
  best_for?: string[];
  rating?: number | null;
}

/* ── Provider implementation ────────────────────────────────── */

export class ClaudeProvider implements AIEnrichmentProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enrichPlace(place: InternalPlace): Promise<EnrichmentResult> {
    const prompt = buildPlacePrompt(place);
    const raw = await this.callClaude(prompt);
    return parsePlaceResponse(raw);
  }

  async enrichEvent(event: InternalEvent): Promise<EnrichmentResult> {
    const prompt = buildEventPrompt(event);
    const raw = await this.callClaude(prompt);
    return parseEventResponse(raw);
  }

  private async callClaude(userMessage: string): Promise<string> {
    const body: ClaudeRequest = {
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: userMessage }],
    };

    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Claude API error ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as ClaudeResponse;
    const textBlock = json.content?.find((b) => b.type === 'text');
    if (!textBlock) throw new Error('Claude returned no text content');
    return textBlock.text;
  }
}

/* ── Prompt builders ────────────────────────────────────────── */

function buildPlacePrompt(place: InternalPlace): string {
  const ratingLine = place.rating
    ? `Rating: ${place.rating}/5 (${place.rating_count ?? 'unknown'} reviews)`
    : 'Rating: Not available';

  const websiteLine = place.website ? `Website: ${place.website}` : 'Website: Not listed';
  const phoneLine = place.phone ? `Phone: ${place.phone}` : '';
  const descLine = place.description?.trim() ? `Raw description: ${place.description}` : '';

  const contextLines = [ratingLine, websiteLine, phoneLine, descLine]
    .filter(Boolean)
    .join('\n');

  return `You are a researcher and city insider working for Stayscape — a travel platform built around curated, story-driven recommendations. Your job is to dig into this place, understand what makes it genuinely worth visiting, and write about it the way a well-travelled friend would — honest, specific, and direct. Not a brochure. Not a listing. A recommendation from someone who actually knows.

You have access to your training knowledge of this place — use it. Draw on everything you know: the neighbourhood, the reputation, the kind of people who go there, the time of day it comes alive, the thing that makes it different. If you know a signature dish, a piece of history, a quirk of the space — include it. Specificity is everything.

---

PART 1 — QUALITY GATE

Your first job is to decide whether this place belongs in a curated travel guide at all.

REJECT (quality_score 1–3) only when you have real evidence of one of the following:
- The place is permanently closed, demolished, or no longer operating
- It is a global chain with no local character: McDonald's, KFC, Burger King, Subway, Starbucks, 7-Eleven, Pizza Hut, Domino's, Dunkin', Tim Hortons, or similar
- It is not a hospitality venue — dental clinic, hardware store, petrol station, government office, car workshop, bank branch, post office
- It has documented serious issues: safety concerns, legal trouble, persistent hygiene failures

ACCEPT (quality_score 4–10) in all other cases — independent restaurants, local cafés, bars, museums, markets, parks, temples, galleries, boutique shops, wellness studios, nature spots. Unfamiliarity is not a reason to reject.

Score within the ACCEPT range by how compelling the place is:
- 4–5: Real place, operating, but limited character or information — write a grounded, honest summary
- 6–7: Solid, worth visiting, has a clear identity
- 8–10: Exceptional — the kind of place that ends up on someone's list for years

If you don't recognise the place: default to 4–5, write from what you know about the neighbourhood and category. Do not invent facts. Do not reject.

---

PART 2 — THE STORY (required for quality_score >= 4)

Write the editorial_summary as if you are telling a well-travelled friend about this place. This should feel like a message from someone who knows the city well — not a listing, not a press release.

Rules for the story:
- 2–4 sentences. Tight. Every sentence earns its place.
- Open with what the place *is* — not with its name, not with "this is a..."
- Use specific details when you know them: a signature item, a neighbourhood fact, a time of day, a crowd, an atmosphere
- Avoid: "nestled", "boasts", "vibrant", "gem", "hidden", "premium", "luxury", "curated", "perfect for", "a must-visit", "world-class", "stunning", "delightful", "beautiful experience"
- Write in present tense
- Do not start with the name of the place
- Tone: informed, warm, direct. Like a text message from a knowledgeable friend, not a hotel concierge script

Good example:
"The char kway teow here has regulars who've been coming since the 1980s — the hawker still does it the old way, lard and all, in a wok that hasn't been replaced since then. Go before 1pm or you'll miss out. It's inside the old Tiong Bahru market, downstairs, look for the longest queue."

Bad example:
"This vibrant establishment nestled in the heart of the city offers a premium dining experience that is perfect for both locals and travellers seeking authentic flavours in a stunning setting."

---

PART 3 — RATING ESTIMATE

If the rating above says "Not available", estimate the place's real-world rating based on your knowledge.
- Use a float between 1.0 and 5.0 (e.g. 4.3)
- Base it on reputation, reviews you've seen in training data, and general standing
- If you genuinely have no knowledge of this specific place, return null
- Do NOT inflate — be honest. A decent local kopitiam is a 4.0, not a 4.8.
- Only return null if you truly cannot estimate — an unknown place in a known area can still get a conservative 3.8–4.2

---

Place details:
Name: ${place.name}
Category: ${place.category}
Address: ${place.address}
City: ${place.city}
Country: ${place.country_code}
${contextLines}

---

Respond with a single JSON object only — no markdown fences, no explanation, no extra text:
{
  "quality_score": <integer 1–10>,
  "rejection_reason": "<one sentence if score < 4, otherwise leave as empty string>",
  "editorial_summary": "<the story — 2–4 sentences, written as described above — required if score >= 4>",
  "recommended_duration": "<honest estimate, e.g. '20–30 minutes', '1–2 hours', 'Half a day' — required if score >= 4>",
  "best_time_to_go": "<specific and useful, e.g. 'Weekend mornings before 10am', 'Friday evenings', 'Weekday lunch' — required if score >= 4>",
  "vibes": [<3–6 single words or short phrases that capture the atmosphere — required if score >= 4, empty array if not>],
  "best_for": [<2–5 specific visitor types or occasions, e.g. 'date night', 'solo lunch', 'families with young kids', 'early risers', 'after-work drinks' — required if score >= 4, empty array if not>],
  "rating": <float 1.0–5.0 if you can estimate, or null if the place already has a rating or you have no knowledge>
}`;
}

function buildEventPrompt(event: InternalEvent): string {
  const lines: string[] = [
    `Name: ${event.name}`,
    `Category: ${event.category}`,
  ];
  if (event.venue_name) lines.push(`Venue: ${event.venue_name}`);
  if (event.city) lines.push(`City: ${event.city}`);
  if (event.country_code) lines.push(`Country: ${event.country_code}`);
  if (event.description?.trim()) lines.push(`Description: ${event.description}`);
  if (event.start_date) lines.push(`Date: ${event.start_date}`);
  if (event.start_time) lines.push(`Time: ${event.start_time}`);

  return `You are a city insider writing for Stayscape — a travel platform that recommends experiences worth clearing your schedule for. Your job is to write about this event the way a knowledgeable local would describe it to a friend visiting for the week: honest, specific, and useful.

Event details:
${lines.join('\n')}

Write the editorial_summary in 2–3 sentences. Be direct about what the event actually is and why it's worth attending. Use specific details if you know them. Avoid filler phrases like "not to be missed", "a must-attend", "vibrant", "stunning", or "world-class". Write in present tense. Don't open with the event name.

Respond with a single JSON object only — no markdown fences, no extra text:
{
  "editorial_summary": "<2–3 sentences, written as a knowledgeable local would — honest, specific, direct>",
  "vibes": ["2–5 words or short phrases from this list: romantic, lively, intimate, family-friendly, casual, cultural, trendy, scenic, peaceful, adventurous, foodie, historic, wellness, late-night, immersive, community, high-energy"],
  "best_for": ["1–4 specific occasions or visitor types, e.g. 'date night', 'solo traveler', 'families with young kids', 'group outing', 'culture lovers', 'foodies', 'first-time visitors'"]
}`;
}

/* ── Response parsers ───────────────────────────────────────── */

function safeParseJSON(text: string): Record<string, unknown> | null {
  // Strip markdown code fences if present
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === 'string') as string[];
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

const QUALITY_THRESHOLD = 4;

function parsePlaceResponse(raw: string): EnrichmentResult {
  const parsed = safeParseJSON(raw) as ClaudePlaceEnrichment | null;
  if (!parsed) {
    return { editorial_summary: '', tags: [] };
  }

  const qualityScore = toNumberOrNull(parsed.quality_score);

  /* ── Quality gate ── */
  if (qualityScore !== null && qualityScore < QUALITY_THRESHOLD) {
    return {
      editorial_summary: '',
      tags: [],
      quality_score: qualityScore,
      rejection_reason: toStringOrNull(parsed.rejection_reason) ?? 'Below quality threshold',
    };
  }

  const vibes = toStringArray(parsed.vibes);
  const bestFor = toStringArray(parsed.best_for);

  const tags: EnrichmentResult['tags'] = [];

  for (const vibe of vibes) {
    tags.push({ tag: vibe, tag_type: 'vibe' as TagType, confidence: 0.9 });
  }
  for (const label of bestFor) {
    tags.push({ tag: label, tag_type: 'best_for' as TagType, confidence: 0.9 });
  }

  // Parse Claude's rating estimate — clamp to 1.0–5.0 range
  let ratingEstimate: number | null = null;
  const rawRating = toNumberOrNull(parsed.rating ?? null);
  if (rawRating !== null) {
    ratingEstimate = Math.min(5.0, Math.max(1.0, Math.round(rawRating * 10) / 10));
  }

  return {
    editorial_summary: toStringOrNull(parsed.editorial_summary) ?? '',
    recommended_duration: toStringOrNull(parsed.recommended_duration),
    best_time_to_go: toStringOrNull(parsed.best_time_to_go),
    vibes: vibes.length > 0 ? vibes : null,
    best_for: bestFor.length > 0 ? bestFor : null,
    tags,
    quality_score: qualityScore ?? undefined,
    rating: ratingEstimate,
  };
}

function parseEventResponse(raw: string): EnrichmentResult {
  const parsed = safeParseJSON(raw) as ClaudePlaceEnrichment | null;
  if (!parsed) {
    return { editorial_summary: '', tags: [] };
  }

  const tags: EnrichmentResult['tags'] = [];

  for (const vibe of toStringArray(parsed.vibes)) {
    tags.push({ tag: vibe, tag_type: 'vibe' as TagType, confidence: 0.9 });
  }
  for (const label of toStringArray(parsed.best_for)) {
    tags.push({ tag: label, tag_type: 'best_for' as TagType, confidence: 0.9 });
  }

  return {
    editorial_summary: toStringOrNull(parsed.editorial_summary) ?? '',
    tags,
  };
}
