/**
 * Stayscape PMS Adapter Contract & Internal Data Model
 *
 * Every PMS integration (Mews, Cloudbeds, Apaleo, etc.) must implement
 * the PmsAdapter interface. This file is the rulebook.
 *
 * The InternalStay type is Stayscape's normalised stay format.
 * Adapters convert their PMS's native format INTO this shape.
 */

/* ──────────────────────────────────────────────────────────────────
   CONFIGURATION
   ────────────────────────────────────────────────────────────────── */

export interface PmsAdapterConfig {
  /** Stayscape property UUID (links to properties table). */
  propertyId: string;
  /** PMS-specific base URL — set per hotel during onboarding. */
  apiEndpoint: string;
  /** Decrypted API credentials. May be a JSON blob for multi-token auth (e.g. Mews). */
  apiKey: string;
  /** Used to verify inbound webhook signatures. */
  webhookSecret?: string;
}

/* ──────────────────────────────────────────────────────────────────
   THE CONTRACT — every adapter implements this
   ────────────────────────────────────────────────────────────────── */

export interface PmsAdapter {
  /** Human-readable provider name. */
  readonly providerName: string;

  /**
   * Pull all reservations updated within a date range.
   * Adapter handles pagination and date-range chunking internally.
   */
  pullReservations(params: {
    fromDate: Date;
    toDate: Date;
  }): Promise<InternalStay[]>;

  /** Pull a single reservation by its PMS-side ID. Used by webhooks. */
  pullReservationById(externalId: string): Promise<InternalStay | null>;

  /**
   * Push a service request from Stayscape into the PMS.
   * Returns the PMS-side ID so we can correlate later.
   */
  pushServiceRequest(task: {
    externalReservationId: string;
    description: string;
  }): Promise<{ externalId: string }>;

  /** Push guest preferences into the PMS (if supported). May be a no-op. */
  pushGuestPreferences(preferences: GuestPreference[]): Promise<void>;

  /**
   * Verify a webhook payload genuinely came from this PMS.
   * Each PMS uses a different signing scheme.
   */
  verifyWebhookSignature(payload: string, signature: string): boolean;

  /** Translate a webhook payload into a list of internal events. */
  parseWebhookEvent(payload: unknown): PmsWebhookEvent[];

  /** Health check — used by admin dashboard and drift canary. */
  testConnection(): Promise<{ ok: boolean; error?: string }>;
}

/* ──────────────────────────────────────────────────────────────────
   INTERNAL DATA MODEL — Stayscape's normalised types
   ──────────────────────────────────────────────────────────────────
   These match the Supabase schema. Adapters return data in this shape.
   ────────────────────────────────────────────────────────────────── */

export type StayStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'held'
  | 'waitlist';

export interface InternalStay {
  /* Identity */
  external_id: string;
  confirmation_number: string;

  /* Status */
  status: StayStatus;

  /* Schedule (ISO 8601 strings) */
  check_in: string;
  check_out: string;
  actual_check_in: string | null;
  actual_check_out: string | null;

  /* People */
  external_guest_id: string;
  guest_count: number;

  /* Room */
  external_room_id: string | null;
  requested_category_id: string | null;

  /* Provenance */
  booking_source: string;
  ota_confirmation_number: string | null;
  trip_purpose: string | null;

  /* Lifecycle timestamps from PMS */
  external_created_at: string;
  external_updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  /* Live state flags */
  checkin_flags: {
    owner_checked_in: boolean;
    all_companions_checked_in: boolean;
    any_companion_checked_in: boolean;
    connector_check_in: boolean;
  };
}

export interface GuestPreference {
  category: string;       // e.g. "allergy", "room_preference", "breakfast_time"
  value: string;
  notes?: string;
}

/* ──────────────────────────────────────────────────────────────────
   WEBHOOK EVENTS — normalised across all PMSs
   ────────────────────────────────────────────────────────────────── */

export type PmsWebhookEvent =
  | { type: 'stay.created'; externalId: string }
  | { type: 'stay.updated'; externalId: string }
  | { type: 'stay.cancelled'; externalId: string }
  | { type: 'stay.checked_in'; externalId: string }
  | { type: 'stay.checked_out'; externalId: string }
  | { type: 'room.status_changed'; roomNumber: string; status: string };
