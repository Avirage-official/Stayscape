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
  category?: string;
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
      max_tokens: 1024,
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
  return `You are a luxury travel editor for Stayscape, a premium hospitality platform. Your job has two parts:

PART 1 — QUALITY GATE
Decide if this place should be hidden from guests. The default answer is YES, this place should be shown. Only reject when you have ACTIVE EVIDENCE that the place is unsuitable.

REJECT (score 1-3) ONLY when at least one of these is clearly true:
- The place is permanently closed, defunct, or demolished (you have specific knowledge of this)
- It is a generic global fast-food chain (McDonald's, Burger King, KFC, Subway, Starbucks, 7-Eleven, Pizza Hut, Domino's, Dunkin')
- It is clearly NOT a hospitality-relevant venue (e.g. dental clinic, hardware store, government office, car dealership, post office, bank)
- It has well-documented major safety, legal, or reputational issues

ACCEPT (score 4-10) — this is the DEFAULT. Use this when:
- The place is named, located, and looks like a normal operating venue, even if you have never heard of it
- It is an independent, local, or boutique establishment (most hidden gems fall here — UNFAMILIARITY IS NOT A REJECTION REASON)
- It is a legitimate tourist site, restaurant, bar, café, museum, park, or shop

Within ACCEPT, scale the score by how confidently premium-worthy you find it:
- 4-5: Likely legitimate but limited information — write a careful, generic-but-accurate summary
- 6-7: Solid, recognisable, decent reputation
- 8-10: Iconic, highly-rated, must-visit — these are the standouts

CRITICAL RULE: If you do not recognise the place, score it 4-5 and write a SAFE editorial summary based on its name, category, address, and the surrounding city/neighbourhood context. DO NOT reject it just because you have no detailed knowledge.

PART 2 — ENRICHMENT (always required if score >= 4)
Write a luxury editorial entry. If you have specific knowledge of the place from Google Maps, TripAdvisor, Yelp, or its website, use it. If you don't, write a SAFE summary that:
- Describes its category and neighbourhood truthfully
- Avoids inventing specific details (no fake awards, no fake quotes, no fake history)
- Captures the likely vibe based on the area and category
- Sounds genuinely editorial, not generic

Example of a SAFE summary for an unfamiliar place:
"This intimate neighbourhood spot in [actual neighbourhood] offers [category-appropriate experience] in one of [city]'s [authentic / atmospheric / lively] historic quarters. A solid choice for travellers wanting to step away from the main tourist circuit."

Place details:
Name: ${place.name}
Category: ${place.category}
Address: ${place.address}
City: ${place.city}
Country: ${place.country_code}
Description: ${place.description ?? 'N/A'}
Website: ${place.website ?? 'N/A'}
Rating: ${place.rating ?? 'N/A'}

PART 4 — CATEGORY CORRECTION
The place was auto-classified by a mapping algorithm. Check if the category is correct given the actual nature of the place.

Valid Stayscape categories: dining, nightlife, shopping, nature, historical, wellness, family, fun_places, top_places, local_spots

Rules:
- A shrine, memorial, war site, temple, mosque, church, or monument → historical
- A park, forest, beach, mountain, lake, or nature reserve → nature (even if it has a café on-site)
- A museum, gallery, or cultural institution → historical
- A restaurant, café, or food court → dining
- A bar, pub, or nightclub → nightlife
- A zoo, aquarium, or theme park → family
- An escape room, bowling alley, or activity park → fun_places
- A spa, gym, or beauty salon → wellness
- A shopping mall or market → shopping
- An iconic landmark or tourist attraction → top_places
- If the current category is correct, return it unchanged.

Respond with a single JSON object only — no markdown, no extra text:
{
  "quality_score": <number 1-10>,
  "rejection_reason": "<short reason if score < 4, otherwise empty string>",
  "editorial_summary": "<2-3 sentences in a premium hospitality tone, required if score >= 4>",
  "recommended_duration": "<e.g. 1-2 hours, Half day, Full day, 30 minutes — required if score >= 4>",
  "best_time_to_go": "<e.g. Evening, Morning, Weekday afternoons, Sunset — required if score >= 4>",
  "vibes": [<3-5 atmosphere words if score >= 4, otherwise empty array>],
  "best_for": [<3-5 visitor types if score >= 4, otherwise empty array>],
  "category": "<the correct Stayscape category from the valid list above>"
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
  if (event.description) lines.push(`Description: ${event.description}`);

  return `You are a luxury travel writer for Stayscape, a premium hospitality platform. Generate enrichment data for this event.

Event details:
${lines.join('\n')}

Respond with a single JSON object — no markdown, no extra text — containing exactly these fields:
{
  "editorial_summary": "1-3 sentences in a premium hospitality tone describing the event and its appeal",
  "vibes": ["2-5 vibe tags from: romantic, lively, intimate, family-friendly, luxury, casual, cultural, trendy, scenic, peaceful, adventurous, foodie, historic, wellness, instagrammable, late-night"],
  "best_for": ["1-3 labels from: date night, solo traveler, family outing, group dinner, business meeting, romantic dinner, quick bite, sightseeing"]
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

  /* ── Quality gate: reject only when AI is actively confident the place is unsuitable ── */
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

  const rawCategory = toStringOrNull(parsed.category);
  const category = rawCategory && VALID_CATEGORIES.has(rawCategory) ? rawCategory : undefined;

  return {
    editorial_summary: toStringOrNull(parsed.editorial_summary) ?? '',
    recommended_duration: toStringOrNull(parsed.recommended_duration),
    best_time_to_go: toStringOrNull(parsed.best_time_to_go),
    vibes: vibes.length > 0 ? vibes : null,
    best_for: bestFor.length > 0 ? bestFor : null,
    tags,
    quality_score: qualityScore ?? undefined,
    category,
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
