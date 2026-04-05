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

import { useCallback, useState } from 'react';
import {
  fetchCategories,
  fetchItemsByCategory,
  fetchLocalInsights,
} from '@/lib/supabase/discover-repository';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_PLACES_BY_CATEGORY,
  FALLBACK_LOCAL_INSIGHTS,
  type CategoryItem,
  type PlaceCard,
  type InsightCard,
} from '@/lib/data/discover-fallback';

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
  loading: boolean;
  error: string | null;
  refetch: (categoryId: string, categoryLabel: string) => void;
}

export function useDiscoverPlaces(): UseDiscoverPlacesResult {
  const [places, setPlaces] = useState<PlaceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((categoryId: string, categoryLabel: string) => {
    setLoading(true);
    setError(null);
    fetchItemsByCategory(categoryId, categoryLabel)
      .then((result) => {
        if (result && result.length > 0) {
          setPlaces(result);
        } else {
          // Fallback: use hardcoded data for the category
          setPlaces(FALLBACK_PLACES_BY_CATEGORY[categoryId] ?? []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load places');
        setPlaces(FALLBACK_PLACES_BY_CATEGORY[categoryId] ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return { places, loading, error, refetch };
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
