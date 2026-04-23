/**
 * PMS (Property Management System) Integration Types
 *
 * Types for incoming webhook payloads from hotel PMS systems,
 * AI curation requests/responses, and preference push-back payloads.
 */

/* ═══════════════════════════════════════════════════════════════
   PMS Webhook — Incoming Booking Confirmation
   ═══════════════════════════════════════════════════════════════ */

/** Guest details from the PMS booking. */
export interface PmsGuest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
}

/** Property details from the PMS booking. */
export interface PmsProperty {
  /** External PMS property ID — used to upsert. */
  pms_property_id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
}

/** The booking payload sent by the hotel PMS via webhook. */
export interface PmsBookingPayload {
  /** Unique booking reference from the PMS (e.g. "BK-12345"). */
  booking_reference: string;
  /** Guest details. */
  guest: PmsGuest;
  /** Property details. */
  property: PmsProperty;
  /** ISO date string (YYYY-MM-DD). */
  check_in: string;
  /** ISO date string (YYYY-MM-DD). */
  check_out: string;
  /** Booking status from PMS. */
  status?: string;
  /** Room type / label. */
  room_type?: string | null;
  /** Number of guests. */
  guests?: number | null;
  /** Trip type if known (leisure, business, romantic, etc.). */
  trip_type?: string | null;
  /** Any guest notes or special requests. */
  notes?: string | null;
  /** URL to push preferences back to the PMS. */
  pms_callback_url?: string | null;
}

/** Result of processing a PMS webhook. */
export interface PmsWebhookResult {
  user_id: string;
  property_id: string;
  stay_id: string;
  booking_reference: string;
  region_id: string | null;
  curation_triggered: boolean;
  /** True when an existing stay was reused instead of creating a new one. */
  stay_existed?: boolean;
  /** Why a duplicate/existing stay was matched. */
  duplicate_reason?: 'booking_reference' | 'property_period' | null;
}

/* ═══════════════════════════════════════════════════════════════
   AI Stay Curation
   ═══════════════════════════════════════════════════════════════ */

export type CurationType =
  | 'default_itinerary'
  | 'recommended_places'
  | 'regional_activities'
  | 'safety_tips';

/** A single curated item (place/activity suggestion). */
export interface CuratedItem {
  name: string;
  category: string;
  description: string;
  /** Why this was recommended. */
  reason?: string;
  /** Suggested time of day. */
  time_of_day?: string;
  /** Suggested duration. */
  duration?: string;
  /** Place ID if matched to existing DB record. */
  place_id?: string | null;
}

/** AI-generated curation for a stay. */
export interface StayCuration {
  id: string;
  stay_id: string;
  curation_type: CurationType;
  /** AI-generated content stored as JSONB. */
  content: {
    title: string;
    summary: string;
    items: CuratedItem[];
  };
  created_at: string;
  updated_at: string;
}

/** Request to curate a stay. */
export interface CurationRequest {
  stay_id: string;
  /** Force re-curation even if curations already exist. */
  force?: boolean;
}

/** Result of a curation run. */
export interface CurationResult {
  stay_id: string;
  curations_created: number;
  types: CurationType[];
}

/* ═══════════════════════════════════════════════════════════════
   Guest Preferences Push-back
   ═══════════════════════════════════════════════════════════════ */

export type PreferenceType =
  | 'dining'
  | 'activity'
  | 'transport'
  | 'room_service'
  | 'spa'
  | 'excursion'
  | 'general'
  | 'interests'
  | 'pace'
  | 'food_preferences'
  /** Single combined row written by the stay onboarding flow. */
  | 'stay_onboarding';

/** A guest preference captured from the concierge/map. */
export interface GuestPreference {
  id: string;
  stay_id: string;
  preference_type: PreferenceType;
  /** Structured preference data. */
  preference_data: Record<string, unknown>;
  /** Whether this has been synced back to the PMS. */
  synced_to_pms: boolean;
  synced_at: string | null;
  created_at: string;
  updated_at?: string | null;
}

/** Payload sent back to the PMS callback URL. */
export interface PmsPreferencesPushPayload {
  booking_reference: string;
  guest_email: string;
  preferences: Array<{
    type: PreferenceType;
    data: Record<string, unknown>;
    created_at: string;
  }>;
}
