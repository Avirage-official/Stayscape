/**
 * Stayscape Data Architecture — Canonical Types
 *
 * These types define the owned data model that sits between
 * third-party providers (Geoapify, etc.) and the
 * existing Stayscape frontend. No provider-specific shapes leak
 * into the frontend — everything is normalized here first.
 */

import type { UserRole, StayStatus } from '@/types/enums';

/* ═══════════════════════════════════════════════════════════════
   Region
   ═══════════════════════════════════════════════════════════════ */

export interface Region {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  timezone: string;
  country_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   User (public.users)
   ═══════════════════════════════════════════════════════════════ */

export interface DbUser {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  /** userrole enum — DB default 'guest'. */
  role: UserRole;
  createdat: string;
  updatedat: string;
}

/* ═══════════════════════════════════════════════════════════════
   Property (public.properties)
   ═══════════════════════════════════════════════════════════════ */

export interface Property {
  id: string;
  name: string;
  /** DB-generated default (gen_random_uuid()::text). */
  slug: string;
  city: string;
  country: string;
  /** DB default 'UTC'. */
  timezone: string;
  address: string | null;
  createdat: string;
  updatedat: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  region_id: string | null;
  /** External PMS property identifier, used for upsert matching. */
  pms_property_id: string | null;
}

/* ═══════════════════════════════════════════════════════════════
   Stay (public.stays)
   ═══════════════════════════════════════════════════════════════ */

export interface DbStay {
  id: string;
  userid: string;
  propertyid: string;
  /**
   * Legacy VARCHAR column — exists in schema but is NOT used by the
   * application. See `booking_reference` (TEXT) for the active column.
   */
  bookingreference: string | null;
  checkindate: string;
  checkoutdate: string;
  roomlabel: string | null;
  guestcount: number;
  /** staystatus enum — DB default 'upcoming'. */
  status: StayStatus;
  createdat: string;
  updatedat: string;
  /** Active booking reference column (TEXT). Used by all runtime code. */
  booking_reference: string | null;
  trip_type: string | null;
  notes: string | null;
  pms_callback_url: string | null;
}

/* ═══════════════════════════════════════════════════════════════
   Place
   ═══════════════════════════════════════════════════════════════ */

export type PlaceCategory =
  | 'dining'
  | 'nightlife'
  | 'shopping'
  | 'nature'
  | 'historical'
  | 'wellness'
  | 'family'
  | 'events'
  | 'localspots'
  | 'topplaces'
  /**
   * Backward-compatibility for legacy persisted rows and unmigrated producers.
   * Remove once all data and integrations are normalized to the new values.
   */
  | 'local_spots'
  | 'fun_places'
  | 'top_places';

export interface InternalPlace {
  id: string;
  region_id: string;
  name: string;
  slug: string;
  category: PlaceCategory;
  subcategory: string | null;
  description: string;
  editorial_summary: string | null;
  latitude: number;
  longitude: number;
  address: string;
  address_line2: string | null;
  city: string;
  country_code: string;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  image_url: string | null;
  image_urls: string[];
  rating: number | null;
  rating_count: number | null;
  price_level: number | null; // 1-4
  opening_hours: OpeningHours | null;
  is_featured: boolean;
  is_active: boolean;
  external_source: ExternalSource;
  external_id: string | null;
  last_synced_at: string | null;
  search_count?: number;
  recommended_duration?: string | null;
  best_time_to_go?: string | null;
  vibes?: string[] | null;
  best_for?: string[] | null;
  ai_enriched_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "22:00"
  is_closed?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   Place Tags (AI-enriched or manual)
   ═══════════════════════════════════════════════════════════════ */

export type TagSource = 'ai' | 'manual' | 'provider';

export interface PlaceTag {
  id: string;
  place_id: string;
  tag: string;
  tag_type: TagType;
  source: TagSource;
  confidence: number | null; // 0.0 – 1.0
  created_at: string;
}

export type TagType = 'vibe' | 'best_for' | 'cuisine' | 'amenity' | 'general';

/* ═══════════════════════════════════════════════════════════════
   Event
   ═══════════════════════════════════════════════════════════════ */

export interface InternalEvent {
  id: string;
  region_id: string;
  name: string;
  slug: string;
  description: string;
  editorial_summary: string | null;
  category: string;
  subcategory: string | null;
  venue_name: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  country_code: string | null;
  image_url: string | null;
  image_urls: string[];
  ticket_url: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  start_date: string; // ISO 8601
  end_date: string | null;
  start_time: string | null; // "19:00"
  end_time: string | null;
  is_featured: boolean;
  is_active: boolean;
  external_source: ExternalSource;
  external_id: string | null;
  last_synced_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   Event Tags
   ═══════════════════════════════════════════════════════════════ */

export interface EventTag {
  id: string;
  event_id: string;
  tag: string;
  tag_type: TagType;
  source: TagSource;
  confidence: number | null;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   ⚠️  NOT-IN-SCHEMA / PLACEHOLDER TYPES
   ─────────────────────────────────────────────────────────────
   The following types do NOT correspond to real tables in the
   current Supabase database. They were defined speculatively
   during early planning. They are retained here as future
   placeholders but MUST NOT be treated as active data models.
   ═══════════════════════════════════════════════════════════════ */

/** @deprecated NOT IN SCHEMA — no `saved_items` table exists in Supabase. Placeholder only. */
export type SavedItemType = 'place' | 'event';

/** @deprecated NOT IN SCHEMA — no `saved_items` table exists in Supabase. Placeholder only. */
export interface SavedItem {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_id: string; // place_id or event_id
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   User Preferences
   ═══════════════════════════════════════════════════════════════ */

/** @deprecated NOT IN SCHEMA — no `user_preferences` table exists in Supabase. See `guest_preferences` for the real table. Placeholder only. */
export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_categories: PlaceCategory[];
  preferred_vibes: string[];
  preferred_price_levels: number[];
  dietary_restrictions: string[];
  accessibility_needs: string[];
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   Sync Runs
   ═══════════════════════════════════════════════════════════════ */

export type SyncType = 'places' | 'events';
export type SyncStatus = 'running' | 'completed' | 'failed';

export interface SyncRun {
  id: string;
  sync_type: SyncType;
  provider: ExternalSource;
  region_id: string | null;
  category: string | null;
  status: SyncStatus;
  records_fetched: number;
  records_created: number;
  records_updated: number;
  records_deactivated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

/* ═══════════════════════════════════════════════════════════════
   Itinerary Item Snapshot (public.itineraryitemsnapshots)
   ─────────────────────────────────────────────────────────────
   @deprecated The itineraryitemsnapshots table has been retired.
   itineraryitems.place_id now references places directly.
   This interface is retained only for reference.
   ═══════════════════════════════════════════════════════════════ */

/** @deprecated itineraryitemsnapshots table is retired; use itineraryitems.place_id → places instead. */
export interface ItineraryItemSnapshot {
  id: string;
  itineraryitemid: string;
  title: string;
  shortdescription: string | null;
  imageurl: string | null;
  locationname: string | null;
  websiteurl: string | null;
  recommendeddurationhours: number | null;
  createdat: string;
}

/* ═══════════════════════════════════════════════════════════════
   Provider Raw Payloads (optional audit / debug table)
   ═══════════════════════════════════════════════════════════════ */

/** @deprecated NOT IN SCHEMA — no `provider_raw_payloads` table exists in Supabase. Placeholder only. */
export interface ProviderRawPayload {
  id: string;
  provider: ExternalSource;
  external_id: string;
  entity_type: 'place' | 'event';
  raw_data: Record<string, unknown>;
  fetched_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   Curated Collections (optional editorial grouping)
   ═══════════════════════════════════════════════════════════════ */

/** @deprecated NOT IN SCHEMA — no `curated_collections` table exists in Supabase. See `stay_curations` for the real curation table. Placeholder only. */
export interface CuratedCollection {
  id: string;
  region_id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** @deprecated NOT IN SCHEMA — no `curated_collection_items` table exists in Supabase. Placeholder only. */
export interface CuratedCollectionItem {
  id: string;
  collection_id: string;
  item_type: SavedItemType;
  item_id: string;
  sort_order: number;
}

/* ═══════════════════════════════════════════════════════════════
   Shared Enums / Helpers
   ═══════════════════════════════════════════════════════════════ */

export type ExternalSource =
  | 'geoapify'
  | 'ticketmaster'
  | 'eventbrite'
  | 'manual'
  | 'editorial';

/** Vibe / best-for labels used by the AI enrichment layer. */
export const VIBE_LABELS = [
  'date night',
  'solo traveler',
  'family outing',
  'romantic dinner',
  'rainy day',
  'late-night',
  'quiet morning',
  'luxury',
  'casual',
  'cultural',
  'scenic',
  'adventurous',
  'wellness',
  'foodie',
  'historic',
  'pet-friendly',
  'instagrammable',
] as const;

export type VibeLabel = (typeof VIBE_LABELS)[number];

export const BEST_FOR_LABELS = [
  'date night',
  'solo traveler',
  'family outing',
  'romantic dinner',
  'rainy day',
  'late-night',
  'quiet morning',
  'luxury',
  'casual',
  'cultural',
  'scenic',
] as const;

export type BestForLabel = (typeof BEST_FOR_LABELS)[number];

/* ═══════════════════════════════════════════════════════════════
   Stayscape API Response Shapes
   (What the existing frontend consumes — shaped for the premium
    discovery experience, NOT generic marketplace responses.)
   ═══════════════════════════════════════════════════════════════ */

/** Place card data shaped for Discover image-led cards. */
export interface DiscoveryPlaceCard {
  id: string;
  name: string;
  category: PlaceCategory;
  description: string;
  editorial_summary: string | null;
  rating: number | null;
  distance: string | null; // "0.5 mi" — computed relative to hotel
  image_url: string | null;
  gradient: string; // CSS gradient for card overlay
  booking_url: string | null;
  price_level: number | null;
  tags: string[];
  vibes: string[];
  best_for: string[];
  is_featured: boolean;
}

/** Full place detail for the detail-view dialog. */
export interface DiscoveryPlaceDetail extends DiscoveryPlaceCard {
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  opening_hours: OpeningHours | null;
  image_urls: string[];
  things_to_do: string[];
  what_to_look_out_for: string[];
  what_to_bring: string[];
  recommended_duration: string | null;
  best_time_to_go: string | null;
}

/** Event card shaped for the Stayscape discovery rail. */
export interface DiscoveryEventCard {
  id: string;
  name: string;
  category: string;
  description: string;
  editorial_summary: string | null;
  venue_name: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  ticket_url: string | null;
  tags: string[];
  vibes: string[];
  is_featured: boolean;
}

/** Event detail view. */
export interface DiscoveryEventDetail extends DiscoveryEventCard {
  address: string | null;
  end_time: string | null;
  image_urls: string[];
}

/* ═══════════════════════════════════════════════════════════════
   API Query Params
   ═══════════════════════════════════════════════════════════════ */

export interface PlacesQueryParams {
  region_id?: string;
  category?: PlaceCategory;
  tags?: string[];
  featured_only?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface EventsQueryParams {
  region_id?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  featured_only?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SearchQueryParams {
  q: string;
  region_id?: string;
  type?: 'place' | 'event' | 'all';
  limit?: number;
}
