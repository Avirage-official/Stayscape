/**
 * Claude (Anthropic) AI Provider
 *
 * Implements the AIEnrichmentProvider interface using the Anthropic
 * Messages API directly via fetch (no SDK dependency).
 *
 * API: https://api.anthropic.com/v1/messages
 * Model: claude-sonnet-4-6
 *
 * Prompt caching: the large system-prompt (instructions) is sent with
 * cache_control so it is stored server-side after the first call.
 * Subsequent calls reuse the cache, cutting cost by ~90% and latency
 * by ~2× for every enrichment after the first.
 */

import type { InternalPlace, InternalEvent, TagType } from '@/types/database';
import type { AIEnrichmentProvider, EnrichmentResult } from './enrichment';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_BETA = 'prompt-caching-2024-07-31';

/* ── Claude API types ───────────────────────────────────────── */

interface CacheControl {
  type: 'ephemeral';
}

interface ContentBlock {
  type: 'text';
  text: string;
  cache_control?: CacheControl;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system: ContentBlock[];
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  error?: { message: string };
}

/* ── Expected JSON shape from Claude ───────────────────────── */

interface ClaudePlaceEnrichment {
  quality_score?: number;
  rejection_reason?: string;
  category?: string;
  editorial_summary?: string;
  recommended_duration?: string | null;
  best_time_to_go?: string | null;
  vibes?: string[];
  best_for?: string[];
  rating?: number | null;
}

/* ── Cached system prompts ──────────────────────────────────── */

const PLACE_SYSTEM_PROMPT = `You are a researcher and city insider working for Stayscape — a travel platform built around curated, story-driven recommendations. Your job is to dig into this place, understand what makes it genuinely worth visiting, and write about it the way a well-travelled friend would — honest, specific, and direct. Not a brochure. Not a listing. A recommendation from someone who actually knows.

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

If the rating supplied says "Not available", estimate the place's real-world rating based on your knowledge.
- Use a float between 1.0 and 5.0 (e.g. 4.3)
- Base it on reputation, reviews you've seen in training data, and general standing
- If you genuinely have no knowledge of this specific place, return null
- Do NOT inflate — be honest. A decent local kopitiam is a 4.0, not a 4.8.
- Only return null if you truly cannot estimate — an unknown place in a known area can still get a conservative 3.8–4.2

---

PART 4 — CATEGORY CORRECTION

The "Current category" field is derived from map data and is sometimes wrong. Correct it using your knowledge of what the place actually is.

Valid Stayscape categories:
- dining       — restaurants, cafés, hawker stalls, food markets, any place primarily for eating
- nightlife    — bars, pubs, clubs, cocktail lounges
- shopping     — markets, malls, boutiques, retail streets
- nature       — parks, beaches, forests, nature reserves, gardens, waterfalls
- historical   — temples, shrines, monuments, heritage sites, museums of history, ruins, war memorials
- wellness     — spas, gyms, yoga studios, retreat centres
- family       — zoos, aquariums, theme parks, activity parks, child-friendly attractions
- fun_places   — cinemas, escape rooms, bowling, entertainment venues not covered above
- top_places   — landmark attractions, iconic viewpoints, major tourist sights
- local_spots  — neighbourhood icons, community spots, hard-to-categorise but genuinely local

Rules:
- A shrine, memorial, or war site → historical (not dining, even if it has a café on-site)
- A park with a restaurant inside → nature (the restaurant is not the place)
- A hawker centre or food court → dining
- A heritage shophouse that is now a restaurant → dining
- Return the same category if it is already correct

---

Respond with a single JSON object only — no markdown fences, no explanation, no extra text:
{
  "quality_score": <integer 1–10>,
  "rejection_reason": "<one sentence if score < 4, otherwise empty string>",
  "category": "<corrected Stayscape category — one of: dining, nightlife, shopping, nature, historical, wellness, family, fun_places, top_places, local_spots>",
  "editorial_summary": "<the story — 2–4 sentences — required if score >= 4>",
  "recommended_duration": "<honest estimate, e.g. '20–30 minutes', '1–2 hours', 'Half a day' — required if score >= 4>",
  "best_time_to_go": "<specific and useful, e.g. 'Weekend mornings before 10am', 'Friday evenings' — required if score >= 4>",
  "vibes": [<3–6 single words or short phrases that capture the atmosphere — required if score >= 4>],
  "best_for": [<2–5 specific visitor types or occasions, e.g. 'date night', 'solo lunch', 'families with young kids' — required if score >= 4>],
  "rating": <float 1.0–5.0 if you can estimate, or null if the place already has a rating or you have no knowledge>
}`;

const EVENT_SYSTEM_PROMPT = `You are a city insider writing for Stayscape — a travel platform that recommends experiences worth clearing your schedule for. Your job is to write about events the way a knowledgeable local would describe them to a friend visiting for the week: honest, specific, and useful.

Write the editorial_summary in 2–3 sentences. Be direct about what the event actually is and why it's worth attending. Use specific details if you know them. Avoid filler phrases like "not to be missed", "a must-attend", "vibrant", "stunning", or "world-class". Write in present tense. Don't open with the event name.

Respond with a single JSON object only — no markdown fences, no extra text:
{
  "editorial_summary": "<2–3 sentences, written as a knowledgeable local would>",
  "vibes": ["2–5 words or short phrases: romantic, lively, intimate, family-friendly, casual, cultural, trendy, scenic, peaceful, adventurous, foodie, historic, wellness, late-night, immersive, community, high-energy"],
  "best_for": ["1–4 specific occasions or visitor types, e.g. 'date night', 'solo traveler', 'families with young kids', 'group outing'"]
}`;

/* ── Provider implementation ────────────────────────────────── */

export class ClaudeProvider implements AIEnrichmentProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enrichPlace(place: InternalPlace): Promise<EnrichmentResult> {
    const userMessage = buildPlaceUserMessage(place);
    const raw = await this.callClaude(PLACE_SYSTEM_PROMPT, userMessage);
    return parsePlaceResponse(raw);
  }

  async enrichEvent(event: InternalEvent): Promise<EnrichmentResult> {
    const userMessage = buildEventUserMessage(event);
    const raw = await this.callClaude(EVENT_SYSTEM_PROMPT, userMessage);
    return parseEventResponse(raw);
  }

  private async callClaude(systemPrompt: string, userMessage: string): Promise<string> {
    const body: ClaudeRequest = {
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    };

    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': ANTHROPIC_BETA,
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

/* ── User message builders (place-specific data only) ───────── */

function buildPlaceUserMessage(place: InternalPlace): string {
  const ratingLine = place.rating
    ? `Rating: ${place.rating}/5 (${place.rating_count ?? 'unknown'} reviews)`
    : 'Rating: Not available';

  const lines = [
    `Name: ${place.name}`,
    `Category: ${place.category}`,
    `Address: ${place.address}`,
    `City: ${place.city}`,
    `Country: ${place.country_code}`,
    ratingLine,
  ];

  if (place.website) lines.push(`Website: ${place.website}`);
  if (place.phone) lines.push(`Phone: ${place.phone}`);
  if (place.description?.trim()) lines.push(`Raw description: ${place.description}`);

  return lines.join('\n');
}

function buildEventUserMessage(event: InternalEvent): string {
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
  return lines.join('\n');
}

/* ── Response parsers ───────────────────────────────────────── */

function safeParseJSON(text: string): Record<string, unknown> | null {
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

const VALID_CATEGORIES = new Set([
  'dining', 'nightlife', 'shopping', 'nature', 'historical',
  'wellness', 'family', 'fun_places', 'top_places', 'local_spots',
]);

function parsePlaceResponse(raw: string): EnrichmentResult {
  const parsed = safeParseJSON(raw) as ClaudePlaceEnrichment | null;
  if (!parsed) {
    return { editorial_summary: '', tags: [] };
  }

  const qualityScore = toNumberOrNull(parsed.quality_score);

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

  let ratingEstimate: number | null = null;
  const rawRating = toNumberOrNull(parsed.rating ?? null);
  if (rawRating !== null) {
    ratingEstimate = Math.min(5.0, Math.max(1.0, Math.round(rawRating * 10) / 10));
  }

  const VALID_CATEGORIES = new Set([
    'dining', 'nightlife', 'shopping', 'nature', 'historical',
    'wellness', 'family', 'fun_places', 'top_places', 'local_spots', 'events',
  ]);
  const correctedCategory = toStringOrNull(parsed.category);

  return {
    editorial_summary: toStringOrNull(parsed.editorial_summary) ?? '',
    category: correctedCategory && VALID_CATEGORIES.has(correctedCategory) ? correctedCategory : null,
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
