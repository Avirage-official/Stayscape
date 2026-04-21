/**
 * Hook for loading Discover data with DB-first / dummy-fallback strategy.
 *
 * Tries to fetch from Supabase first. If the relevant table is empty
 * or returns no rows, falls back to the local dummy data so the UI
 * still works.
 *
 * Uses the explicit refetch() callback pattern required by the project's
 * strict eslint rules (no setState inside useEffect).
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StayCuration } from '@/types/pms';

export type { StayCuration };
import {
  fetchCategories,
  fetchItemsByCategory,
  fetchLocalInsights,
  fetchPlacesAsDiscoverItems,
} from '@/lib/supabase/discover-repository';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_PLACES_BY_CATEGORY,
  FALLBACK_LOCAL_INSIGHTS,
  CATEGORY_SLUG_TO_PLACES_CATEGORY,
  type CategoryItem,
  type PlaceCard,
  type InsightCard,
} from '@/lib/data/discover-fallback';

const MAX_DISCOVER_PLACES = 20;

/* ── Categories ─────────────────────────────────────────── */

interface UseDiscoverCategoriesResult {
  categories: CategoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDiscoverCategories(): UseDiscoverCategoriesResult {
  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCategories()
      .then((result) => {
        setCategories(result && result.length > 0 ? result : FALLBACK_CATEGORIES);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
        setCategories(FALLBACK_CATEGORIES);
      })
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error, refetch };
}

/* ── Places by category ─────────────────────────────────── */

interface UseDiscoverPlacesResult {
  places: PlaceCard[];
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  refetch: (
    categoryId: string,
    categoryLabel: string,
    options?: { offset?: number; limit?: number; append?: boolean; regionId?: string },
  ) => void;
}

export function useDiscoverPlaces(): UseDiscoverPlacesResult {
  const [places, setPlaces] = useState<PlaceCard[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((
    categoryId: string,
    categoryLabel: string,
    options?: { offset?: number; limit?: number; append?: boolean; regionId?: string },
  ) => {
    const limit = Math.min(Math.max(options?.limit ?? 10, 1), 20);
    const offset = Math.max(options?.offset ?? 0, 0);
    const append = options?.append === true;
    // Fetch one extra item so we can determine whether another page exists.
    const fetchLimit = Math.min(limit + 1, MAX_DISCOVER_PLACES);
    setLoading(true);
    setError(null);
    // Derive the places.category filter from the slug (categoryId in fallback
    // data is the slug; in DB data it is a UUID which will simply not match,
    // producing undefined → treated the same as null = no filter).
    const placesCategory = CATEGORY_SLUG_TO_PLACES_CATEGORY[categoryId] ?? null;
    fetchPlacesAsDiscoverItems(options?.regionId, fetchLimit, offset, placesCategory ?? undefined)
      .then(async (placesResult) => {
        const mergePlaces = (nextBatch: PlaceCard[]) => {
          if (append) {
            setPlaces((prev) => [...prev, ...nextBatch].slice(0, MAX_DISCOVER_PLACES));
          } else {
            setPlaces(nextBatch.slice(0, MAX_DISCOVER_PLACES));
          }
        };

        // Use places as the primary source.
        if (placesResult && placesResult.length > 0) {
          const nextBatch = placesResult.slice(0, limit);
          mergePlaces(nextBatch);
          setHasMore(placesResult.length > limit && offset + nextBatch.length < MAX_DISCOVER_PLACES);
          return;
        }

        // Silent fallback: try discoveritems when places returns nothing.
        const discoverResult = await fetchItemsByCategory(categoryId, categoryLabel, fetchLimit, offset);
        const discoverItems = discoverResult ?? [];

        if (discoverItems.length > 0) {
          const nextBatch = discoverItems.slice(0, limit);
          mergePlaces(nextBatch);
          setHasMore(discoverItems.length > limit && offset + nextBatch.length < MAX_DISCOVER_PLACES);
          return;
        }

        // Final fallback: use hardcoded data for the category
        const fallbackAll = FALLBACK_PLACES_BY_CATEGORY[categoryId] ?? [];
        const fallback = fallbackAll.slice(offset, offset + limit);
        mergePlaces(fallback);
        setHasMore(offset + fallback.length < Math.min(fallbackAll.length, MAX_DISCOVER_PLACES));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load places');
        const fallbackAll = FALLBACK_PLACES_BY_CATEGORY[categoryId] ?? [];
        const fallback = fallbackAll.slice(offset, offset + limit);
        if (append) {
          setPlaces((prev) => [...prev, ...fallback].slice(0, MAX_DISCOVER_PLACES));
        } else {
          setPlaces(fallback.slice(0, MAX_DISCOVER_PLACES));
        }
        setHasMore(offset + fallback.length < Math.min(fallbackAll.length, MAX_DISCOVER_PLACES));
      })
      .finally(() => setLoading(false));
  }, []);

  return { places, hasMore, loading, error, refetch };
}

/* ── Local insights ─────────────────────────────────────── */

interface UseLocalInsightsResult {
  insights: InsightCard[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLocalInsights(): UseLocalInsightsResult {
  const [insights, setInsights] = useState<InsightCard[]>(FALLBACK_LOCAL_INSIGHTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchLocalInsights()
      .then((result) => {
        setInsights(result && result.length > 0 ? result : FALLBACK_LOCAL_INSIGHTS);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load insights');
        setInsights(FALLBACK_LOCAL_INSIGHTS);
      })
      .finally(() => setLoading(false));
  }, []);

  return { insights, loading, error, refetch };
}

/* ── Upcoming Events ─────────────────────────────────────── */

export interface EventCard {
  id: string;
  name: string;
  category: string;
  description: string;
  editorial_summary: string | null;
  venue_name: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  ticket_url: string | null;
  is_featured: boolean;
}

interface UseDiscoverEventsResult {
  events: EventCard[];
  loading: boolean;
  error: string | null;
  refetch: (regionId: string) => void;
}

export function useDiscoverEvents(): UseDiscoverEventsResult {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((regionId: string) => {
    if (!regionId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/discovery/events?region_id=${encodeURIComponent(regionId)}&limit=10`)
      .then((res) => res.json())
      .then((body: { data?: EventCard[]; error?: string }) => {
        if (body.error) {
          setEvents([]);
        } else {
          setEvents(body.data ?? []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { events, loading, error, refetch };
}

/* ── AI Curations ─────────────────────────────────────────── */

export interface CurationsData {
  recommended_places: StayCuration | null;
  regional_activities: StayCuration | null;
}

interface UseCurationsResult {
  curations: CurationsData;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const EMPTY_CURATIONS: CurationsData = {
  recommended_places: null,
  regional_activities: null,
};

export function useCurations(stayId: string | null | undefined): UseCurationsResult {
  const [curations, setCurations] = useState<CurationsData>(EMPTY_CURATIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Internal async-only fetch — no synchronous setState calls.
   * All state updates happen inside .then() / .catch() callbacks. */
  const performFetch = useCallback((id: string) => {
    fetch(`/api/curations?stay_id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((body: { data?: StayCuration[]; error?: string }) => {
        if (body.error) {
          setCurations(EMPTY_CURATIONS);
        } else {
          const data = body.data ?? [];
          setCurations({
            recommended_places: data.find((c) => c.curation_type === 'recommended_places') ?? null,
            regional_activities: data.find((c) => c.curation_type === 'regional_activities') ?? null,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load curations');
        setCurations(EMPTY_CURATIONS);
        setLoading(false);
      });
  }, []);

  /* Public refetch: sets loading synchronously (safe when called from event handlers) */
  const refetch = useCallback(() => {
    if (!stayId) {
      setCurations(EMPTY_CURATIONS);
      return;
    }
    setLoading(true);
    setError(null);
    performFetch(stayId);
  }, [stayId, performFetch]);

  /* Auto-fetch when stayId first becomes available (no synchronous setState in effect) */
  useEffect(() => {
    if (stayId) performFetch(stayId);
  }, [stayId, performFetch]);

  return { curations, loading, error, refetch };
}
