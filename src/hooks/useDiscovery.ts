/**
 * Data-fetching hooks for the Stayscape frontend.
 *
 * These hooks provide a clean interface between the existing Stayscape
 * UI components and the internal API layer. Components should use these
 * hooks instead of fetching from third-party APIs directly.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  enabled?: boolean;
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
  const fetchIdRef = useRef(0);

  const fetchPlaces = useCallback(() => {
    if (options.enabled === false) return;

    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (options.region_id) params.set('region_id', options.region_id);
    if (options.category) params.set('category', options.category);
    if (options.featured_only) params.set('featured', 'true');
    if (options.search) params.set('search', options.search);
    if (options.limit) params.set('limit', String(options.limit));

    apiFetch<DiscoveryPlaceCard[]>(`/api/discovery/places?${params}`)
      .then((data) => {
        if (id === fetchIdRef.current) {
          setPlaces(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (id === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load places');
          setLoading(false);
        }
      });
  }, [options.region_id, options.category, options.featured_only, options.search, options.limit, options.enabled]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading, error, refetch: fetchPlaces };
}

/* ── Place Detail ────────────────────────────────────────── */

interface UsePlaceDetailResult {
  place: DiscoveryPlaceDetail | null;
  loading: boolean;
  error: string | null;
}

export function usePlaceDetail(
  placeId: string | null,
): UsePlaceDetailResult {
  const [place, setPlace] = useState<DiscoveryPlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) {
      setPlace(null);
      return;
    }

    setLoading(true);
    setError(null);

    apiFetch<DiscoveryPlaceDetail>(`/api/discovery/places/${encodeURIComponent(placeId)}`)
      .then((data) => {
        setPlace(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load place');
        setLoading(false);
      });
  }, [placeId]);

  return { place, loading, error };
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
  enabled?: boolean;
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
  const fetchIdRef = useRef(0);

  const fetchEvents = useCallback(() => {
    if (options.enabled === false) return;

    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (options.region_id) params.set('region_id', options.region_id);
    if (options.category) params.set('category', options.category);
    if (options.date_from) params.set('date_from', options.date_from);
    if (options.date_to) params.set('date_to', options.date_to);
    if (options.featured_only) params.set('featured', 'true');
    if (options.search) params.set('search', options.search);
    if (options.limit) params.set('limit', String(options.limit));

    apiFetch<DiscoveryEventCard[]>(`/api/discovery/events?${params}`)
      .then((data) => {
        if (id === fetchIdRef.current) {
          setEvents(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (id === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load events');
          setLoading(false);
        }
      });
  }, [options.region_id, options.category, options.date_from, options.date_to, options.featured_only, options.search, options.limit, options.enabled]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

/* ── Event Detail ────────────────────────────────────────── */

interface UseEventDetailResult {
  event: DiscoveryEventDetail | null;
  loading: boolean;
  error: string | null;
}

export function useEventDetail(
  eventId: string | null,
): UseEventDetailResult {
  const [event, setEvent] = useState<DiscoveryEventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      return;
    }

    setLoading(true);
    setError(null);

    apiFetch<DiscoveryEventDetail>(`/api/discovery/events/${encodeURIComponent(eventId)}`)
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load event');
        setLoading(false);
      });
  }, [eventId]);

  return { event, loading, error };
}

/* ── Search ──────────────────────────────────────────────── */

interface UseSearchOptions {
  query: string;
  type?: 'place' | 'event' | 'all';
  region_id?: string;
  limit?: number;
}

interface SearchResults {
  places: DiscoveryPlaceCard[];
  events: DiscoveryEventCard[];
  total: number;
}

interface UseSearchResult {
  results: SearchResults | null;
  loading: boolean;
  error: string | null;
}

export function useSearch(options: UseSearchOptions): UseSearchResult {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.query || options.query.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ q: options.query });
    if (options.type) params.set('type', options.type);
    if (options.region_id) params.set('region_id', options.region_id);
    if (options.limit) params.set('limit', String(options.limit));

    apiFetch<SearchResults>(`/api/discovery/search?${params}`)
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Search failed');
        setLoading(false);
      });
  }, [options.query, options.type, options.region_id, options.limit]);

  return { results, loading, error };
}
