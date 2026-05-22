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
 * - Quality gate: AI scores each place 1-10, low-quality places are
 *   marked is_active=false and never shown to guests
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
  /* Quality gate fields — populated by Claude provider */
  quality_score?: number;
  rejection_reason?: string;
  /* Rating estimate — only set when Claude estimates from knowledge */
  rating?: number | null;
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
 * 1b. Fetch a high-quality image via Google Places → Unsplash if none exists
 * 2. Update the place record with Geoapify + image data
 * 3. Call the AI provider — which returns a quality_score (1-10)
 * 4. If score < 5 → mark place as is_active=false (hidden from guests)
 * 5. Otherwise: write editorial_summary, vibes, rating estimate (if no real rating), etc. back to the place
 * 6. Upsert vibe/best_for tags into place_tags
 */
export async function enrichPlace(
  supabase: SupabaseClient,
  place: InternalPlace,
): Promise<void> {
  // Step 1 – Fetch Geoapify Place Details + better image
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

  // Step 1b – Fetch a high-quality image if the place has none or only a
  // Wikipedia-sourced one (which tends to be low-res or off-topic).
  const needsBetterImage =
    !place.image_url ||
    place.image_url.includes('wikimedia') ||
    place.image_url.includes('wikipedia');

  if (needsBetterImage) {
    try {
      const betterImage = await fetchPlaceImage(place.name, place.city ?? '', place.country_code ?? '');
      if (betterImage) {
        await supabase
          .from('places')
          .update({ image_url: betterImage, updated_at: new Date().toISOString() })
          .eq('id', place.id);
        enrichedPlace = { ...enrichedPlace, image_url: betterImage };
      }
    } catch {
      // Non-fatal
    }
  }

  // Step 2 – Call AI provider
  const result = await getActiveProvider().enrichPlace(enrichedPlace);

  // Step 3 – Quality gate: reject low-quality places
  const QUALITY_THRESHOLD = 5;
  if (
    typeof result.quality_score === 'number' &&
    result.quality_score < QUALITY_THRESHOLD
  ) {
    await supabase
      .from('places')
      .update({
        is_active: false,
        ai_enriched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', place.id);

    console.log(
      `[enrichPlace] Rejected "${place.name}" — score ${result.quality_score} — ${result.rejection_reason ?? 'no reason given'}`,
    );
    return;
  }

  // Step 4 – Bail out if AI returned nothing useful
  if (!result.editorial_summary && result.tags.length === 0) return;

  // Step 5 – Write AI results back to the place record
  // Only write Claude's rating estimate if the place has no real rating yet
  const placeUpdates: Record<string, unknown> = {
    editorial_summary: result.editorial_summary ?? null,
    recommended_duration: result.recommended_duration ?? null,
    best_time_to_go: result.best_time_to_go ?? null,
    vibes: result.vibes ?? null,
    best_for: result.best_for ?? null,
    ai_enriched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (result.rating != null && !place.rating) {
    placeUpdates.rating = result.rating;
  }

  const { error } = await supabase
    .from('places')
    .update(placeUpdates)
    .eq('id', place.id);

  if (error) {
    throw new Error(`enrichPlace update failed: ${error.message}`);
  }

  // Step 6 – Upsert AI-generated tags
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

/**
 * Fetch a high-quality image for a place.
 * Strategy: Google Places Photos (1200px) → Unsplash (landscape, relevant).
 * Both keys are optional — whichever is configured will be tried.
 */
async function fetchPlaceImage(
  name: string,
  city: string,
  countryCode: string,
): Promise<string | null> {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  if (googleKey) {
    try {
      const query = city ? `${name} ${city}` : `${name} ${countryCode}`;
      const searchUrl =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(query)}&key=${googleKey}`;

      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as {
          results?: Array<{ photos?: Array<{ photo_reference: string }> }>;
        };
        const photoRef = searchData.results?.[0]?.photos?.[0]?.photo_reference;
        if (photoRef) {
          const photoUrl =
            `https://maps.googleapis.com/maps/api/place/photo` +
            `?maxwidth=1600&photoreference=${encodeURIComponent(photoRef)}&key=${googleKey}`;
          const photoRes = await fetch(photoUrl, {
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
          });
          if (photoRes.ok && photoRes.url) return photoRes.url;
        }
      }
    } catch {
      // Try Unsplash
    }
  }

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    const queries = [
      city ? `${name} ${city}` : name,
      city ? `${city} ${name}` : null,
    ].filter(Boolean) as string[];

    for (const query of queries) {
      try {
        const url =
          `https://api.unsplash.com/search/photos` +
          `?query=${encodeURIComponent(query)}&orientation=landscape&per_page=3&order_by=relevant`;
        const res = await fetch(url, {
          headers: { Authorization: `Client-ID ${unsplashKey}` },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            results?: Array<{ urls?: { regular?: string } }>;
          };
          const imageUrl = data.results?.[0]?.urls?.regular;
          if (imageUrl) return imageUrl;
        }
      } catch {
        // Try next query
      }
    }
  }

  return null;
}
