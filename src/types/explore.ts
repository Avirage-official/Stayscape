/**
 * explore.ts
 * -----------
 * Types for the explore drill-in navigation system.
 * Levels 0–4 map directly to the UX hierarchy:
 *   0 → section list (Yours / Nearby / Tonight / Aria)
 *   1 → region or activity list
 *   2 → categories within region/section
 *   3 → items within category (top 6, rating ≥ 7 for places)
 *   4 → detail sheet
 */

import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';

// ─── Unified item type (used at L0 section level) ─────────────────────────────

export type ExploreItem =
  | DiscoveryPlaceCard
  | DiscoveryEventCard
  | ExplorePropertyCard
  | RegionOption;

// ─── View state machine ───────────────────────────────────────────────────────

export type ExploreView =
  | { level: 0 }
  | { level: 1; sectionId: string }
  | { level: 2; sectionId: string; region: RegionOption; category: string }
  | { level: 3; sectionId: string; region: RegionOption; category: string }
  | { level: 4; sectionId: string; item: ExploreItem; contentType: DrillContentType };

// ─── Content types for drill-in ──────────────────────────────────────────────

export type DrillContentType = 'places' | 'events' | 'properties' | 'regions';

// ─── Drill data cache ─────────────────────────────────────────────────────────

/**
 * Cached result for a region+category combo so we don't re-fetch on back nav.
 * items is always DrillPlaceCard | DrillEventCard — never RegionOption or
 * ExplorePropertyCard, which only appear at L0 section level.
 */
export interface DrillData {
  /** Places or events returned from the drill-in fetch. */
  items: (DrillPlaceCard | DrillEventCard)[];
  /** Unique categories derived from items. */
  categories: string[];
  /** ISO timestamp of when this was fetched — used for staleness checks later. */
  fetchedAt: string;
}

/** Cache key format: `${sectionId}:${regionId}:${category | 'all'}` */
export type DrillCacheKey = string;

// ─── Slim card shapes for drill-in lists (L2–L3) ─────────────────────────────

export interface DrillPlaceCard {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  image_url: string | null;
  image_urls: string[];
  rating: number | null;
  vibes: string[] | null;
  address: string | null;
  city: string | null;
  price_level: number | null;
  booking_url: string | null;
  editorial_summary: string | null;
}

export interface DrillEventCard {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  image_url: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  ticket_url: string | null;
  is_featured: boolean;
  editorial_summary: string | null;
}

// ─── Animation phase ──────────────────────────────────────────────────────────

/**
 * Controls the two-phase transition when drilling in or out:
 *   idle     → no animation in progress
 *   exiting  → old content fading out (160ms)
 *   entering → new content fading in (440ms + 60ms delay)
 */
export type AnimPhase = 'idle' | 'exiting' | 'entering';
