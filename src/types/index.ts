export interface Place {
  id: string;
  name: string;
  category: string;
  distance: string;
  rating: number;
  description: string;
  aiRundown: string;
  gradient: string;
  bookingUrl?: string;
}

/**
 * Place shape returned by the /api/places endpoint (Supabase `places` table).
 * Used by MapPlaceholder markers and the map info card.
 */
export interface MapPlace {
  id: string;
  name: string;
  category: string;
  description: string | null;
  editorial_summary: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  rating: number | null;
  booking_url: string | null;
  website: string | null;
  image_url: string | null;
}
