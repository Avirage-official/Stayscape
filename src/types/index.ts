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
 * Event shapes (from /api/discovery/events) are merged into this type with
 * isEvent=true and event-specific optional fields populated.
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
  /* ─── Event-specific fields (undefined for regular places) ─── */
  isEvent?: boolean;
  ticket_url?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  currency?: string | null;
  venue_name?: string | null;
  start_date?: string;
  end_date?: string | null;
  start_time?: string | null;
}
