/**
 * AI Enrichment Service — scaffold.
 *
 * Runs asynchronously after places/events are synced to generate:
 * - premium editorial summaries
 * - vibe / best-for labels
 * - curated tags
 * - planning metadata
 *
 * Design principles:
 * - AI is an enrichment layer, NOT the source of truth
 * - Raw provider data is always preserved
 * - AI output is stored in tags tables and editorial_summary fields
 * - AI output is editable/overridable (source = 'ai')
 * - Does NOT run on every user request — batched after sync
 * - Confidence scores are tracked for each generated tag
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  InternalPlace,
  InternalEvent,
  TagType,
  PlaceTag,
  EventTag,
} from '@/types/database';
import { getPlaceDetails } from '@/lib/services/geoapify';
import { ClaudeProvider } from './claude-provider';

/* ── Types ───────────────────────────────────────────────────── */

export interface EnrichmentResult {
  editorial_summary: string;
  booking_url?: string | null;
  website?: string | null;
  recommended_duration?: string | null;
  best_time_to_go?: string | null;
  indoor_outdoor?: string | null;
  vibes?: string[] | null;
  best_for?: string[] | null;
  tags: Array<{
    tag: string;
    tag_type: TagType;
    confidence: number;
  }>;
}

export interface AIEnrichmentProvider {
  enrichPlace(place: InternalPlace): Promise<EnrichmentResult>;
  enrichEvent(event: InternalEvent): Promise<EnrichmentResult>;
}

/* ── Default / placeholder provider ──────────────────────────── */

/**
 * Placeholder AI provider that returns empty enrichments.
 * Replace with a real OpenAI / Anthropic implementation once
 * the API key is configured.
 */
class PlaceholderAIProvider implements AIEnrichmentProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enrichPlace(_place: InternalPlace): Promise<EnrichmentResult> {
    return { editorial_summary: '', tags: [] };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enrichEvent(_event: InternalEvent): Promise<EnrichmentResult> {
    return { editorial_summary: '', tags: [] };
  }
}

/* ── Provider resolution ─────────────────────────────────────── */

let _provider: AIEnrichmentProvider | null = null;

/**
 * Returns the active AI provider.
 * Auto-detects Claude if ANTHROPIC_API_KEY is set; otherwise falls
 * back to the placeholder. Call setAIProvider() to override.
 */
function getActiveProvider(): AIEnrichmentProvider {
  if (_provider) return _provider;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    _provider = new ClaudeProvider(anthropicKey);
  } else {
    _provider = new PlaceholderAIProvider();
  }

  return _provider;
}

export function setAIProvider(provider: AIEnrichmentProvider): void {
  _provider = provider;
}

/* ── Enrichment orchestrator ─────────────────────────────────── */

/**
 * Enrich a place with AI-generated metadata.
 *
 * Pipeline:
 * 1. Fetch fresh structured data from Geoapify Place Details (website, phone)
 * 2. Update the place record with Geoapify data
 * 3. Call the AI provider with the enriched place context
 * 4. Write editorial_summary, booking_url, website back to the place record
 * 5. Upsert vibe/best_for tags into place_tags
 */
export async function enrichPlace(
  supabase: SupabaseClient,
  place: InternalPlace,
): Promise<void> {
  // Step 1 – Fetch Geoapify Place Details for structured data
  let enrichedPlace = place;
  if (place.external_source === 'geoapify' && place.external_id) {
    try {
      const details = await getPlaceDetails(place.external_id);
      if (details) {
        const geoapifyUpdates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (details.website && !place.website) {
          geoapifyUpdates.website = details.website;
        }
        if (details.phone && !place.phone) {
          geoapifyUpdates.phone = details.phone;
        }

        if (Object.keys(geoapifyUpdates).length > 1) {
          await supabase
            .from('places')
            .update(geoapifyUpdates)
            .eq('id', place.id);

          enrichedPlace = {
            ...place,
            website: (geoapifyUpdates.website as string | null) ?? place.website,
            phone: (geoapifyUpdates.phone as string | null) ?? place.phone,
          };
        }
      }
    } catch {
      // Non-fatal — continue with existing place data
    }
  }

  // Step 2 – Call AI provider
  const result = await getActiveProvider().enrichPlace(enrichedPlace);
  if (!result.editorial_summary && result.tags.length === 0) return;

  // Step 3 – Write AI results back to the place record
  const { error } = await supabase
    .from('places')
    .update({
      editorial_summary: result.editorial_summary ?? null,
      recommended_duration: result.recommended_duration ?? null,
      best_time_to_go: result.best_time_to_go ?? null,
      vibes: result.vibes ?? null,
      best_for: result.best_for ?? null,
      ai_enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', place.id);

  if (error) {
    throw new Error(`enrichPlace update failed: ${error.message}`);
  }

  // Step 4 – Upsert AI-generated tags
  if (result.tags.length > 0) {
    const tagRows: Omit<PlaceTag, 'id' | 'created_at'>[] = result.tags.map(
      (t) => ({
        place_id: place.id,
        tag: t.tag,
        tag_type: t.tag_type,
        source: 'ai' as const,
        confidence: t.confidence,
      }),
    );

    // Delete existing AI tags first, then insert fresh ones
    await supabase
      .from('place_tags')
      .delete()
      .eq('place_id', place.id)
      .eq('source', 'ai');

    await supabase.from('place_tags').insert(tagRows);
  }
}

/**
 * Enrich an event with AI-generated metadata.
 */
export async function enrichEvent(
  supabase: SupabaseClient,
  event: InternalEvent,
): Promise<void> {
  const result = await getActiveProvider().enrichEvent(event);
  if (!result.editorial_summary && result.tags.length === 0) return;

  if (result.editorial_summary) {
    await supabase
      .from('events')
      .update({
        editorial_summary: result.editorial_summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id);
  }

  if (result.tags.length > 0) {
    const tagRows: Omit<EventTag, 'id' | 'created_at'>[] = result.tags.map(
      (t) => ({
        event_id: event.id,
        tag: t.tag,
        tag_type: t.tag_type,
        source: 'ai' as const,
        confidence: t.confidence,
      }),
    );

    await supabase
      .from('event_tags')
      .delete()
      .eq('event_id', event.id)
      .eq('source', 'ai');

    await supabase.from('event_tags').insert(tagRows);
  }
}

/**
 * Batch-enrich newly synced places.
 * Call this after a sync run completes.
 */
export async function enrichNewPlaces(
  supabase: SupabaseClient,
  placeIds: string[],
): Promise<{ enriched: number; failed: number }> {
  let enriched = 0;
  let failed = 0;

  for (const id of placeIds) {
    try {
      const { data } = await supabase
        .from('places')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        await enrichPlace(supabase, data as InternalPlace);
        enriched++;
      }
    } catch {
      failed++;
    }

    // Small delay to avoid hitting API rate limits
    await delay(500);
  }

  return { enriched, failed };
}

/**
 * Batch-enrich newly synced events.
 */
export async function enrichNewEvents(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<{ enriched: number; failed: number }> {
  let enriched = 0;
  let failed = 0;

  for (const id of eventIds) {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        await enrichEvent(supabase, data as InternalEvent);
        enriched++;
      }
    } catch {
      failed++;
    }

    await delay(500);
  }

  return { enriched, failed };
}

/* ── Helpers ─────────────────────────────────────────────────── */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
