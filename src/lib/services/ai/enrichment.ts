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

/* ── Types ───────────────────────────────────────────────── */

export interface EnrichmentResult {
  editorial_summary: string;
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

/* ── Default / placeholder provider ──────────────────────── */

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

/* ── Enrichment orchestrator ─────────────────────────────── */

let _provider: AIEnrichmentProvider = new PlaceholderAIProvider();

export function setAIProvider(provider: AIEnrichmentProvider): void {
  _provider = provider;
}

/**
 * Enrich a place with AI-generated metadata.
 * Writes editorial_summary back to the place record and inserts
 * tags into the place_tags table.
 */
export async function enrichPlace(
  supabase: SupabaseClient,
  place: InternalPlace,
): Promise<void> {
  const result = await _provider.enrichPlace(place);
  if (!result.editorial_summary && result.tags.length === 0) return;

  // Update editorial summary if generated
  if (result.editorial_summary) {
    await supabase
      .from('places')
      .update({
        editorial_summary: result.editorial_summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', place.id);
  }

  // Upsert AI-generated tags
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
  const result = await _provider.enrichEvent(event);
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
  }

  return { enriched, failed };
}
