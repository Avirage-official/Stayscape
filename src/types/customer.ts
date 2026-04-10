/**
 * Customer / Stay types for the consumer dashboard.
 *
 * These types model the `public.users` and `public.stays` tables,
 * plus lightweight join data for the dashboard view.
 */

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface CustomerStay {
  id: string;
  user_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
  room_type: string | null;
  guests: number | null;
  property?: {
    id: string;
    name: string;
    image_url: string | null;
    address: string | null;
  } | null;
}

export interface DashboardData {
  profile: CustomerProfile;
  upcomingStay: CustomerStay | null;
}
