/**
 * Event Provider — Abstraction Layer
 *
 * Provider-agnostic interface for event ingestion. Each provider
 * implements `EventProvider` and normalizes its response into
 * `EventUpsertInput` objects. The sync orchestrator doesn't care
 * which provider it's talking to.
 *
 * To add a new provider:
 * 1. Create a file in ./providers/ that implements EventProvider
 * 2. Register it in the PROVIDERS map below
 */

import type { EventUpsertInput } from '@/lib/supabase/events-repository';
import type { ExternalSource } from '@/types/database';

/* ── Provider interface ──────────────────────────────────── */

export interface EventSearchParams {
  latitude: number;
  longitude: number;
  radius_km?: number;
  category?: string;
  date_from?: string; // ISO 8601
  date_to?: string;
  limit?: number;
}

export interface EventProvider {
  /** Unique key matching ExternalSource. */
  readonly source: ExternalSource;

  /** Human-readable name. */
  readonly displayName: string;

  /** Search events near a location. */
  searchEvents(params: EventSearchParams): Promise<EventUpsertInput[]>;

  /** Get event details by provider-specific ID. Returns null if not found. */
  getEventDetails?(externalId: string): Promise<EventUpsertInput | null>;
}

/* ── Provider registry ───────────────────────────────────── */

import { TicketmasterProvider } from './providers/ticketmaster';

const PROVIDERS = new Map<ExternalSource, EventProvider>();

// Register built-in providers
PROVIDERS.set('ticketmaster', new TicketmasterProvider());

/**
 * Get a registered event provider by source key.
 */
export function getEventProvider(source: ExternalSource): EventProvider {
  const provider = PROVIDERS.get(source);
  if (!provider) {
    throw new Error(`Unknown event provider: ${source}`);
  }
  return provider;
}

/**
 * Get all registered event provider keys.
 */
export function getAvailableProviders(): ExternalSource[] {
  return Array.from(PROVIDERS.keys());
}

/**
 * Register a custom event provider at runtime.
 */
export function registerEventProvider(provider: EventProvider): void {
  PROVIDERS.set(provider.source, provider);
}
