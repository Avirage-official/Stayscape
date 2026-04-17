/**
 * Customer / Stay types for the consumer dashboard.
 *
 * These types model the `public.users` and `public.stays` tables,
 * plus lightweight join data for the dashboard view.
 */

/**
 * Valid stay status values.
 *
 * The real Supabase column is `staystatus` — a Postgres enum with default 'upcoming'.
 * The original enum values are: upcoming, active, completed, cancelled.
 * The migration added PMS webhook values: confirmed, checked_in, checked_out.
 */
export type StayStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out';

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
  property?: {
    id: string;
    name: string;
    image_url: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    region_id: string | null;
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
