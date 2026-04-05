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
  editorial_summary?: string;
  booking_url?: string | null;
  website?: string | null;
  vibes?: string[];
  best_for?: string[];
  recommended_duration?: string | null;
  best_time_to_go?: string | null;
  indoor_outdoor?: string | null;
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
  const lines: string[] = [
    `Name: ${place.name}`,
    `Category: ${place.category}`,
    `Address: ${place.address}`,
    `City: ${place.city}`,
    `Country: ${place.country_code}`,
  ];
  if (place.description) lines.push(`Description: ${place.description}`);
  if (place.website) lines.push(`Website: ${place.website}`);
  if (place.phone) lines.push(`Phone: ${place.phone}`);

  return `You are a luxury travel writer for Stayscape, a premium hospitality platform. Generate enrichment data for this place.

Place details:
${lines.join('\n')}

Respond with a single JSON object — no markdown, no extra text — containing exactly these fields:
{
  "editorial_summary": "1-3 sentences in a premium hospitality tone describing the place and what makes it special for discerning travellers",
  "booking_url": "a direct booking URL if applicable (e.g. OpenTable for restaurants, official booking page), or null if unknown",
  "website": "the official website URL if you know it with high confidence, or null",
  "vibes": ["2-5 vibe tags from: romantic, lively, intimate, family-friendly, luxury, casual, cultural, trendy, scenic, peaceful, adventurous, foodie, historic, wellness, instagrammable, late-night"],
  "best_for": ["1-3 labels from: date night, solo traveler, family outing, group dinner, business meeting, romantic dinner, quick bite, sightseeing"],
  "recommended_duration": "e.g. '1-2 hours' or '30 minutes'",
  "best_time_to_go": "e.g. 'evening', 'morning', 'weekends'",
  "indoor_outdoor": "one of: indoor, outdoor, both"
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

function parsePlaceResponse(raw: string): EnrichmentResult {
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
    booking_url: toStringOrNull(parsed.booking_url),
    website: toStringOrNull(parsed.website),
    recommended_duration: toStringOrNull(parsed.recommended_duration),
    best_time_to_go: toStringOrNull(parsed.best_time_to_go),
    indoor_outdoor: toStringOrNull(parsed.indoor_outdoor),
    tags,
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
