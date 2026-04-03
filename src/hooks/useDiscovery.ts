/**
 * Data-fetching hooks for the Stayscape frontend.
 *
 * These hooks provide a clean interface between the existing Stayscape
 * UI components and the internal API layer. Components should use these
 * hooks instead of fetching from third-party APIs directly.
 *
 * The hooks expose a `refetch()` callback that consumers call explicitly
 * to trigger data loading. This avoids setState-inside-useEffect and
 * ref-access-during-render patterns that the project's strict eslint
 * rules prohibit.
 */

'use client';

import { useCallback, useState } from 'react';
import type {
  DiscoveryPlaceCard,
  DiscoveryPlaceDetail,
  DiscoveryEventCard,
  DiscoveryEventDetail,
  PlaceCategory,
} from '@/types/database';

/* ── Generic fetch helper ────────────────────────────────── */

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `API error: ${res.status}`,
    );
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

/* ── Places ──────────────────────────────────────────────── */

interface UsePlacesOptions {
  region_id?: string;
  category?: PlaceCategory;
  featured_only?: boolean;
  search?: string;
  limit?: number;
}

interface UsePlacesResult {
  places: DiscoveryPlaceCard[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePlaces(options: UsePlacesOptions = {}): UsePlacesResult {
  const [places, setPlaces] = useState<DiscoveryPlaceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    const params = new URLSearchParams();
    if (options.region_id) params.set('region_id', options.region_id);
    if (options.category) params.set('category', options.category);
    if (options.featured_only) params.set('featured', 'true');
    if (options.search) params.set('search', options.search);
    if (options.limit) params.set('limit', String(options.limit));

    setLoading(true);
    setError(null);
    apiFetch<DiscoveryPlaceCard[]>(`/api/discovery/places?${params}`)
      .then(setPlaces)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load places'))
      .finally(() => setLoading(false));
  }, [options.region_id, options.category, options.featured_only, options.search, options.limit]);

  return { places, loading, error, refetch };
}

/* ── Place Detail ────────────────────────────────────────── */

interface UsePlaceDetailResult {
  place: DiscoveryPlaceDetail | null;
  loading: boolean;
  error: string | null;
  refetch: (id: string) => void;
}

export function usePlaceDetail(): UsePlaceDetailResult {
  const [place, setPlace] = useState<DiscoveryPlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((id: string) => {
    setLoading(true);
    setError(null);
    apiFetch<DiscoveryPlaceDetail>(`/api/discovery/places/${encodeURIComponent(id)}`)
      .then(setPlace)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load place'))
      .finally(() => setLoading(false));
  }, []);

  return { place, loading, error, refetch };
}

/* ── Events ──────────────────────────────────────────────── */

interface UseEventsOptions {
  region_id?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  featured_only?: boolean;
  search?: string;
  limit?: number;
}

interface UseEventsResult {
  events: DiscoveryEventCard[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEvents(options: UseEventsOptions = {}): UseEventsResult {
  const [events, setEvents] = useState<DiscoveryEventCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    const params = new URLSearchParams();
    if (options.region_id) params.set('region_id', options.region_id);
    if (options.category) params.set('category', options.category);
    if (options.date_from) params.set('date_from', options.date_from);
    if (options.date_to) params.set('date_to', options.date_to);
    if (options.featured_only) params.set('featured', 'true');
    if (options.search) params.set('search', options.search);
    if (options.limit) params.set('limit', String(options.limit));

    setLoading(true);
    setError(null);
    apiFetch<DiscoveryEventCard[]>(`/api/discovery/events?${params}`)
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load events'))
      .finally(() => setLoading(false));
  }, [options.region_id, options.category, options.date_from, options.date_to, options.featured_only, options.search, options.limit]);

  return { events, loading, error, refetch };
}

/* ── Event Detail ────────────────────────────────────────── */

interface UseEventDetailResult {
  event: DiscoveryEventDetail | null;
  loading: boolean;
  error: string | null;
  refetch: (id: string) => void;
}

export function useEventDetail(): UseEventDetailResult {
  const [event, setEvent] = useState<DiscoveryEventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((id: string) => {
    setLoading(true);
    setError(null);
    apiFetch<DiscoveryEventDetail>(`/api/discovery/events/${encodeURIComponent(id)}`)
      .then(setEvent)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load event'))
      .finally(() => setLoading(false));
  }, []);

  return { event, loading, error, refetch };
}

/* ── Search ──────────────────────────────────────────────── */

interface SearchResults {
  places: DiscoveryPlaceCard[];
  events: DiscoveryEventCard[];
  total: number;
}

interface UseSearchResult {
  results: SearchResults | null;
  loading: boolean;
  error: string | null;
  search: (query: string, options?: { type?: 'place' | 'event' | 'all'; region_id?: string; limit?: number }) => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback((query: string, opts?: { type?: 'place' | 'event' | 'all'; region_id?: string; limit?: number }) => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const params = new URLSearchParams({ q: query });
    if (opts?.type) params.set('type', opts.type);
    if (opts?.region_id) params.set('region_id', opts.region_id);
    if (opts?.limit) params.set('limit', String(opts.limit));

    setLoading(true);
    setError(null);
    apiFetch<SearchResults>(`/api/discovery/search?${params}`)
      .then(setResults)
      .catch((err) => setError(err instanceof Error ? err.message : 'Search failed'))
      .finally(() => setLoading(false));
  }, []);

  return { results, loading, error, search };
}
