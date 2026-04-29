/**
 * Customer / Stay types for the consumer dashboard.
 *
 * These types model the `public.users` and `public.stays` tables,
 * plus lightweight join data for the dashboard view.
 *
 * Intentionally omitted from the consumer view:
 *   - users.role       — userrole enum (DB default 'guest'). Not used by
 *                         the consumer dashboard; see DbUser for the full shape.
 *   - users.updatedat  — tracked in DB but not surfaced in profile card.
 *   - properties.createdat / updatedat — not relevant for dashboard display.
 */

import type { StayStatus } from '@/types/enums';

// Re-export so existing imports from '@/types/customer' keep working.
export type { StayStatus } from '@/types/enums';

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string | null;
  guestName?: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface CustomerStay {
  id: string;
  user_id: string;
  property_id: string;
  /**
   * The active booking reference (from stays.booking_reference TEXT column).
   * Note: the schema also has a legacy `bookingreference` VARCHAR column
   * which is NOT used by the application.
   */
  booking_reference: string | null;
  check_in: string;
  check_out: string;
  /** staystatus enum — see StayStatus type. */
  status: StayStatus;
  room_type: string | null;
  guests: number | null;
  trip_type?: string | null;
  stay_confirmed_by_guest?: boolean | null;
  stay_confirmation_status?: string | null;
  onboarding_completed?: boolean | null;
  onboarding_completed_at?: string | null;
  curation_status?: string | null;
  curated_at?: string | null;
  property?: {
    id: string;
    name: string;
    slug: string | null;
    image_url: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    region_id: string | null;
    /** DB default 'UTC'. Available for display context (e.g. local check-in times). */
    timezone: string | null;
    region: {
      id: string;
      name: string;
      slug: string;
      latitude: number;
      longitude: number;
      radius_km: number;
      country_code: string;
    } | null;
  } | null;
}

export interface DashboardData {
  profile: CustomerProfile;
  /** @deprecated Use currentStays / upcomingStays / pastStays instead. */
  upcomingStay: CustomerStay | null;
  /** Stays where check-in ≤ today ≤ check-out. */
  currentStays: CustomerStay[];
  /** Stays where check-in > today. */
  upcomingStays: CustomerStay[];
  /** Stays where check-out < today (most recent first). */
  pastStays: CustomerStay[];
}
