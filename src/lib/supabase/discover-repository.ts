/**
 * Supabase data-access layer for Discover content.
 *
 * Queries the expected tables (discovercategories, localinsights, places)
 * and returns data in the shapes consumed by the existing Discover UI.
 *
 * If the Supabase client is unavailable or a table returns no rows,
 * callers should fall back to the local dummy data.
 *
 * Enum-backed columns (values are DB-controlled, not exhaustive in TS):
 *   discovercategories.categorytype  → CategoryType
 *   localinsights.insighttype        → InsightType
 *   localinsights.status             → ContentStatus
 */

import { getSupabaseBrowser } from '@/lib/supabase/client';
import { gradientForCategory } from '@/lib/supabase/places-repository';
import type {
  CategoryItem,
  PlaceCard,
  InsightCard,
} from '@/lib/data/discover-fallback';

import type {
  ContentStatus,
  CategoryType,
  InsightType,
} from '@/types/enums';

/* ── Raw DB row types (match expected table columns) ──── */

interface DbDiscoverCategory {
  id: string;
  propertyid: string | null;
  slug: string;
  name: string;
  categorytype: CategoryType;
  iconname: string | null;
  imageurl: string | null;
  sortorder: number;
  isactive: boolean;
  createdat: string;
  updatedat: string;
  subtitle: string;
  /** Maps this UI category to a places.category value for DB filtering. */
  places_category: string | null;
}

interface DbLocalInsight {
  id: string;
  propertyid: string | null;
  categoryid: string | null;
  title: string;
  insighttype: InsightType;
  summary: string;
  body: string;
  iconname: string | null;
  imageurl: string | null;
  sortorder: number;
  status: ContentStatus;
  createdat: string;
  updatedat: string;
}

/* ── Shape transformers ─────────────────────────────────── */

function toCategory(row: DbDiscoverCategory): CategoryItem {
  return {
    // Use slug as the id so client-side lookups and CATEGORY_SLUG_TO_PLACES_CATEGORY
    // work correctly. The schema defines slug as NOT NULL, but fall back to id
    // defensively in case of unexpected null.
    id: row.slug ?? row.id,
    label: row.name,
    icon: row.iconname ?? '',
    image: row.imageurl ?? '',
    subtitle: row.subtitle,
    placesCategory: row.places_category ?? null,
  };
}

function toInsight(row: DbLocalInsight): InsightCard {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.summary,
    icon: row.iconname ?? '',
    content: row.body,
  };
}

/* ── Public query functions ─────────────────────────────── */

/**
 * Fetch all active discover categories.
 * Returns null if the table is missing or the client is unavailable.
 */
export async function fetchCategories(): Promise<CategoryItem[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('discovercategories')
    .select('*')
    .order('sortorder', { ascending: true });

  if (error || !data || data.length === 0) return null;

  return (data as DbDiscoverCategory[])
    .filter((r) => r.isactive !== false)
    .map(toCategory);
}

/**
 * Fetch local insights.
 * Returns null if the table is missing or empty.
 */
export async function fetchLocalInsights(): Promise<InsightCard[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('localinsights')
    .select('*')
    .eq('status', 'published')
    .order('sortorder', { ascending: true });

  if (error || !data || data.length === 0) return null;

  return (data as DbLocalInsight[]).map(toInsight);
}

/**
 * Fetch places from the `places` table and transform them into the
 * same `PlaceCard` shape used by the Discover panel.
 *
 * @param regionId  Optional region filter — pass to scope results to a
 *                  specific region; omit for all active places.
 * @param limit     Maximum number of items to return (default 10, max 21).
 * @param offset    Result offset for pagination (default 0).
 * @param category  Optional places.category filter.
 */
export async function fetchPlacesAsDiscoverItems(
  regionId?: string,
  limit = 10,
  offset = 0,
  category?: string,
): Promise<PlaceCard[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const safeLimit = Math.min(Math.max(limit, 1), 21);
  const safeOffset = Math.max(offset, 0);

  let query = sb
    .from('places')
    .select('id, name, category, description, rating, image_url, booking_url')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (regionId) query = query.eq('region_id', regionId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  return (data as Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    rating: number | null;
    image_url: string | null;
    booking_url: string | null;
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    rating: row.rating ?? 0,
    distance: '',
    gradient: gradientForCategory(row.category),
    image: row.image_url ?? '',
    bookingUrl: row.booking_url ?? '#',
  }));
}
