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
 * Exact values may grow; these are the known values from the schema.
 */
export type ServiceTaskType = string;

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
