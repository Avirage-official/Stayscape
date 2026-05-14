/**
 * Supabase Database Enums — TypeScript representations
 *
 * These types mirror the USER-DEFINED Postgres enum types in the
 * Supabase database. They are the source-of-truth TypeScript
 * equivalents and should be used wherever the repo handles
 * enum-backed columns.
 *
 * Source of truth: the real Supabase database.
 * If this file disagrees with the database, the database wins.
 */

/* ── User ─────────────────────────────────────────────────── */

export type UserRole = 'guest' | 'admin';

/* ── Stay ─────────────────────────────────────────────────── */

export type StayStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out';

/* ── Room ─────────────────────────────────────────────────── */

export type RoomStatus = 'vacant_clean' | 'vacant_dirty' | 'occupied' | 'out_of_order';

/* ── Service Tasks ────────────────────────────────────────── */

export type ServiceTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * service_tasks.task_type — USER-DEFINED enum.
 * All values must match the servicetasktype enum in Supabase exactly.
 */
export type ServiceTaskType =
  | 'room_cleaning'
  | 'turndown'
  | 'departure_clean'
  | 'stayover_tidy'
  | 'maintenance'
  | 'inspection'
  | 'breakfast_delivery'
  | 'extra_towels'
  | 'extra_pillows'
  | 'extra_amenities'
  | 'laundry'
  | 'ironing'
  | 'wakeup_call'
  | 'late_checkout'
  | 'early_checkin'
  | 'luggage_storage'
  | 'luggage'
  | 'taxi_booking'
  | 'restaurant_reservation'
  | 'room_service'
  | 'baby_cot'
  | 'do_not_disturb'
  | 'noise_complaint'
  | 'housekeeping'
  | 'other';

/* ── Itinerary ────────────────────────────────────────────── */

export type ItineraryStatus = 'active';

export type ItineraryItemStatus = 'planned';

export type ItemSource = 'discover';

/* ── Content / Discover ───────────────────────────────────── */

export type ContentStatus = 'draft' | 'published' | 'archived';

/**
 * discovercategories.categorytype — USER-DEFINED enum.
 * Exact values are property-defined; use string for extensibility.
 */
export type CategoryType = string;

/**
 * localinsights.insighttype — USER-DEFINED enum.
 * Exact values are property-defined; use string for extensibility.
 */
export type InsightType = string;
