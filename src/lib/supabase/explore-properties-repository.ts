/**
 * Explore Properties Repository — Supabase data access layer.
 *
 * explore_properties is a manually seeded table of hotel/stay cards
 * for the Explore discovery feed. It is intentionally separate from
 * the onboarded `properties` table (paying clients).
 *
 * Follows the exact same pattern as places-repository.ts.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/* ── Types ──────────────────────────────────────────────── */

export interface ExploreProperty {
  id: string;
  name: string;
  slug: string;
  region_id: string | null;
  city: string | null;
  country_code: string | null;
  description: string | null;
  editorial_summary: string | null;
  image_url: string | null;
  image_urls: string[];
  booking_url: string | null;
  price_from: number | null;
  currency: string | null;
  star_rating: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExplorePropertyTag {
  id: string;
  property_id: string;
  tag_type: 'vibe' | 'general';
  tag: string;
  created_at: string;
}

export interface ExplorePropertyCard {
  id: string;
  name: string;
  slug: string;
  region_id: string | null;
  city: string | null;
  country_code: string | null;
  description: string | null;
  editorial_summary: string | null;
  image_url: string | null;
  booking_url: string | null;
  price_from: number | null;
  currency: string | null;
  star_rating: number | null;
  tags: string[];
  vibes: string[];
  is_featured: boolean;
  gradient: string;
}

export interface ExplorePropertiesQueryParams {
  region_id?: string;
  featured_only?: boolean;
  limit?: number;
  offset?: number;
}

/* ── Helpers ─────────────────────────────────────────────── */

const PROPERTY_GRADIENT_DEFAULT = 'from-stone-900/80 via-stone-950/60 to-black/80';

/* ── Read operations ─────────────────────────────────────── */

export async function queryExploreProperties(
  supabase: SupabaseClient,
  params: ExplorePropertiesQueryParams = {},
): Promise<ExploreProperty[]> {
  let query = supabase
    .from('explore_properties')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (params.region_id) query = query.eq('region_id', params.region_id);
  if (params.featured_only) query = query.eq('is_featured', true);

  const limit = Math.min(Math.max(params.limit ?? 6, 1), 20);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(`queryExploreProperties failed: ${error.message}`);
  return (data ?? []) as ExploreProperty[];
}

export async function getExplorePropertyTags(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<ExplorePropertyTag[]> {
  const { data, error } = await supabase
    .from('explore_property_tags')
    .select('*')
    .eq('property_id', propertyId);
  if (error) throw new Error(`getExplorePropertyTags failed: ${error.message}`);
  return (data ?? []) as ExplorePropertyTag[];
}

/* ── Shape for frontend consumption ─────────────────────── */

export function toDiscoveryPropertyCard(
  property: ExploreProperty,
  tags: ExplorePropertyTag[] = [],
): ExplorePropertyCard {
  return {
    id: property.id,
    name: property.name,
    slug: property.slug,
    region_id: property.region_id,
    city: property.city,
    country_code: property.country_code,
    description: property.description,
    editorial_summary: property.editorial_summary,
    image_url: property.image_url,
    booking_url: property.booking_url,
    price_from: property.price_from,
    currency: property.currency,
    star_rating: property.star_rating,
    tags: tags.filter((t) => t.tag_type === 'general').map((t) => t.tag),
    vibes: tags.filter((t) => t.tag_type === 'vibe').map((t) => t.tag),
    is_featured: property.is_featured,
    gradient: PROPERTY_GRADIENT_DEFAULT,
  };
}
