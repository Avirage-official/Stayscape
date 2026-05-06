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

PART 1 — QUALITY ASSESSMENT
First, score this place from 1 to 10 based on whether it deserves a spot in a premium hotel guest's recommendations.

Score 1-4 (REJECT — set quality_score and provide rejection_reason, leave other fields empty):
- The place is closed, defunct, or you have no reliable knowledge of it
- It's a generic chain (e.g. McDonald's, 7-Eleven, generic phone shop)
- It's irrelevant to travellers (e.g. dental clinic, hardware store, government office)
- It's poorly rated or has a bad reputation
- It's a duplicate or low-effort listing

Score 5-7 (ACCEPT but standard):
- Legitimate, operating, decent quality
- Worth knowing about but not exceptional

Score 8-10 (ACCEPT — premium-worthy):
- Well-known, highly-rated, or genuinely interesting
- The kind of place a premium guest would be glad to discover
- Iconic landmarks, top restaurants, must-visit attractions

PART 2 — ENRICHMENT (only if score >= 5)
If the place passes the quality bar, write a luxury editorial entry. Use your training knowledge of how this place is documented on Google Maps, TripAdvisor, Yelp, Booking.com, and the official website.

Write specific, premium content — never generic. Mention what makes this place actually unique.

Place details:
Name: ${place.name}
Category: ${place.category}
Address: ${place.address}
City: ${place.city}
Country: ${place.country_code}
Description: ${place.description ?? 'N/A'}
Website: ${place.website ?? 'N/A'}
Rating: ${place.rating ?? 'N/A'}

Respond with a single JSON object only — no markdown, no extra text:
{
  "quality_score": <number 1-10>,
  "rejection_reason": "<short reason if score < 5, otherwise empty string>",
  "editorial_summary": "<2-3 sentences in a premium hospitality tone, only if score >= 5, otherwise empty string>",
  "recommended_duration": "<e.g. 1-2 hours, Half day, Full day, 30 minutes — only if score >= 5>",
  "best_time_to_go": "<e.g. Evening, Morning, Weekday afternoons, Sunset — only if score >= 5>",
  "vibes": [<3-5 atmosphere words if score >= 5, otherwise empty array>],
  "best_for": [<3-5 visitor types if score >= 5, otherwise empty array>]
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

const QUALITY_THRESHOLD = 5;

function parsePlaceResponse(raw: string): EnrichmentResult {
  const parsed = safeParseJSON(raw) as ClaudePlaceEnrichment | null;
  if (!parsed) {
    return { editorial_summary: '', tags: [] };
  }

  const qualityScore = toNumberOrNull(parsed.quality_score);

  /* ── Quality gate: reject if score below threshold ── */
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

  return {
    editorial_summary: toStringOrNull(parsed.editorial_summary) ?? '',
    recommended_duration: toStringOrNull(parsed.recommended_duration),
    best_time_to_go: toStringOrNull(parsed.best_time_to_go),
    vibes: vibes.length > 0 ? vibes : null,
    best_for: bestFor.length > 0 ? bestFor : null,
    tags,
    quality_score: qualityScore ?? undefined,
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
