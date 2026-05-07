/**
 * Mews Connector API — Schema of Truth
 *
 * This file documents EVERY field Stayscape depends on from the Mews
 * Connector API. It serves three purposes:
 *
 *   1. Single source of truth for Mews field names, types, and meanings.
 *   2. Reference for the MewsAdapter implementation.
 *   3. Validation contract for the nightly drift-detection canary
 *      (/api/cron/pms-drift-check). If Mews quietly renames a field
 *      or changes a type, the canary alerts us before guests notice.
 *
 * Source documentation:
 *   https://docs.mews.com/connector-api
 *   https://mews-systems.gitbook.io/connector-api/operations/reservations
 *
 * API version: 2023-06-06
 * Last reviewed: 2026-05-07
 *
 * IMPORTANT — DEPRECATED FIELDS:
 *   The legacy `StartUtc` and `EndUtc` fields still appear in responses
 *   but are deprecated. Always use `ScheduledStartUtc`/`ActualStartUtc`
 *   and `ScheduledEndUtc`/`ActualEndUtc` instead.
 */

/* ──────────────────────────────────────────────────────────────────
   API ENVIRONMENT
   ────────────────────────────────────────────────────────────────── */

export const MEWS_API_VERSION = '2023-06-06';

export const MEWS_PLATFORMS = {
  /** Sandbox / demo environment — used for testing and development. */
  demo: 'https://api.mews-demo.com',
  /** Production — each hotel has their own platform address. */
  production: '', // Set per-property at runtime from pms_config.api_endpoint
} as const;

/* ──────────────────────────────────────────────────────────────────
   AUTHENTICATION
   ──────────────────────────────────────────────────────────────────
   Mews does NOT use OAuth despite some third-party docs claiming so.
   Every request body must include these three fields.
   ────────────────────────────────────────────────────────────────── */

export interface MewsAuthEnvelope {
  /** Identifies the partner application. Issued by Mews to Stayscape. */
  ClientToken: string;
  /** Per-hotel access grant. Issued when a hotel connects to Stayscape. */
  AccessToken: string;
  /** Partner application name + version. Used for logging on Mews side. */
  Client: string; // e.g. "Stayscape 1.0.0"
}

/* ──────────────────────────────────────────────────────────────────
   ENDPOINTS WE USE
   ────────────────────────────────────────────────────────────────── */

export const MEWS_ENDPOINTS = {
  /** Pull all reservations with filters and pagination. */
  reservationsGetAll: '/api/connector/v1/reservations/getAll/2023-06-06',

  /** Pull customer/guest profiles. */
  customersGetAll: '/api/connector/v1/customers/getAll',

  /** Pull rooms (Mews calls them "resources"). */
  resourcesGetAll: '/api/connector/v1/resources/getAll',

  /** Pull room categories (suite, standard, etc). */
  resourceCategoriesGetAll: '/api/connector/v1/resourceCategories/getAll',

  /** Pull bookable services (Mews calls each property's stay-service "Service"). */
  servicesGetAll: '/api/connector/v1/services/getAll',

  /** Pull folio/charges. */
  orderItemsGetAll: '/api/connector/v1/orderItems/getAll',

  /** Trigger check-in for a reservation. */
  reservationStart: '/api/connector/v1/reservations/start',

  /** Push a service request note back to PMS for hotel staff visibility. */
  serviceOrderNotesAdd: '/api/connector/v1/serviceOrderNotes/add',

  /** Test connection — used by health checks. */
  configurationGet: '/api/connector/v1/configuration/get',
} as const;

/* ──────────────────────────────────────────────────────────────────
   ENUMS — STATE
   ──────────────────────────────────────────────────────────────────
   Note Mews uses American "Canceled" (one L). Common API gotcha.
   ────────────────────────────────────────────────────────────────── */

export const MEWS_RESERVATION_STATES = [
  'Inquired',   // Not confirmed by either party
  'Confirmed',  // Both parties confirmed, before check-in
  'Started',    // Checked in
  'Processed',  // Checked out
  'Canceled',   // Cancelled (note: one L)
  'Optional',   // Hotel holding for guest
  'Requested',  // Waitlist
] as const;

export type MewsReservationState = (typeof MEWS_RESERVATION_STATES)[number];

/**
 * Translate Mews state → Stayscape internal stay status.
 * Adapter MUST go through this map; do not hand-roll comparisons.
 */
export const MEWS_STATE_TO_STAYSCAPE: Record
  MewsReservationState,
  'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'held' | 'waitlist'
> = {
  Inquired: 'pending',
  Confirmed: 'confirmed',
  Started: 'checked_in',
  Processed: 'checked_out',
  Canceled: 'cancelled',
  Optional: 'held',
  Requested: 'waitlist',
};

/* ──────────────────────────────────────────────────────────────────
   ENUMS — ORIGIN
   ────────────────────────────────────────────────────────────────── */

export const MEWS_RESERVATION_ORIGINS = [
  'Distributor',     // Mews Booking Engine (direct booking)
  'ChannelManager',  // Came in via OTA channel manager
  'Commander',       // Hotel staff entered manually in Mews Operations
  'Import',          // Bulk import
  'Connector',       // Connector API (could be us!)
  'Navigator',       // Mews Guest Services
] as const;

export type MewsReservationOrigin = (typeof MEWS_RESERVATION_ORIGINS)[number];

/* ──────────────────────────────────────────────────────────────────
   ENUMS — PURPOSE
   ────────────────────────────────────────────────────────────────── */

export const MEWS_RESERVATION_PURPOSES = ['Leisure', 'Business', 'Student'] as const;
export type MewsReservationPurpose = (typeof MEWS_RESERVATION_PURPOSES)[number];

/* ──────────────────────────────────────────────────────────────────
   ENUMS — CANCELLATION REASONS
   ────────────────────────────────────────────────────────────────── */

export const MEWS_CANCELLATION_REASONS = [
  'Other',
  'ConfirmationMissed',
  'BookedElsewhere',
  'ForceMajeure',
  'GuestComplaint',
  'NoShow',
  'PriceTooHigh',
  'ServiceNotAvailable',
  'InputError',
  'InvalidPayment',
  'TravelAgency',
  'RequestedByGuest',
  'Update',
  'BookingAbandoned',
  'RequestedByBooker',
] as const;

export type MewsCancellationReason = (typeof MEWS_CANCELLATION_REASONS)[number];

/* ──────────────────────────────────────────────────────────────────
   ENUMS — ACCOUNT TYPE
   ────────────────────────────────────────────────────────────────── */

export const MEWS_ACCOUNT_TYPES = ['Customer', 'Company'] as const;
export type MewsAccountType = (typeof MEWS_ACCOUNT_TYPES)[number];

/* ──────────────────────────────────────────────────────────────────
   RESERVATION OBJECT — version 2023-06-06
   ──────────────────────────────────────────────────────────────────
   This is the canonical shape returned by /reservations/getAll.
   The drift canary validates incoming Mews payloads against this.
   ────────────────────────────────────────────────────────────────── */

export interface MewsReservation {
  /** Unique Mews-side identifier. Maps to stays.external_id. REQUIRED. */
  Id: string;

  /** Identifier of the bookable Service (usually the property's main stay service). REQUIRED. */
  ServiceId: string;

  /** Identifier of the Customer or Company who owns the reservation. REQUIRED. */
  AccountId: string;

  /** Discriminator for AccountId: usually "Customer". REQUIRED. */
  AccountType: MewsAccountType;

  /** Mews user who created the reservation. REQUIRED. */
  CreatorProfileId: string;

  /** Mews user who last updated the reservation. REQUIRED. */
  UpdaterProfileId: string;

  /** Booker on whose behalf the reservation was made (if different from owner). OPTIONAL. */
  BookerId: string | null;

  /** Confirmation number visible in Mews UI. REQUIRED. */
  Number: string;

  /** Current state of the reservation. REQUIRED. */
  State: MewsReservationState;

  /** Where the reservation came from. REQUIRED. */
  Origin: MewsReservationOrigin;

  /** Further detail when Origin === "Commander" (e.g. "InPerson", "Phone"). OPTIONAL. */
  CommanderOrigin: string | null;

  /** Free-text origin details. OPTIONAL. */
  OriginDetails: string | null;

  /** ISO 8601 UTC timestamp of creation. REQUIRED. */
  CreatedUtc: string;

  /** ISO 8601 UTC timestamp of last update. REQUIRED. Used for incremental sync. */
  UpdatedUtc: string;

  /** ISO 8601 UTC timestamp of cancellation. OPTIONAL (null unless cancelled). */
  CancelledUtc: string | null;

  /** Voucher used to create the reservation, if any. OPTIONAL. */
  VoucherId: string | null;

  /** Mews business segment (e.g. "Leisure", "Corporate"). OPTIONAL. */
  BusinessSegmentId: string | null;

  /** Reservation options — check-in flags. REQUIRED. */
  Options: MewsReservationOptions;

  /** Rate plan applied. REQUIRED. */
  RateId: string;

  /** Credit card linked to the reservation. OPTIONAL. */
  CreditCardId: string | null;

  /** Reservation group (multi-room bookings share a group). REQUIRED. */
  GroupId: string;

  /** Requested room category (e.g. "Deluxe Suite"). REQUIRED. */
  RequestedResourceCategoryId: string;

  /** Assigned specific room. OPTIONAL — null until room assignment. */
  AssignedResourceId: string | null;

  /** Availability block, if any. OPTIONAL. */
  AvailabilityBlockId: string | null;

  /** Company on whose behalf the booking was made. OPTIONAL. */
  PartnerCompanyId: string | null;

  /** Travel agency that mediated the booking. OPTIONAL. */
  TravelAgencyId: string | null;

  /** Whether the assigned room is locked (cannot be reassigned). REQUIRED. */
  AssignedResourceLocked: boolean;

  /** OTA confirmation number (e.g. Booking.com confirmation). OPTIONAL. */
  ChannelNumber: string | null;

  /** Channel manager number. OPTIONAL. */
  ChannelManagerNumber: string | null;

  /** Why the reservation was cancelled. OPTIONAL. */
  CancellationReason: MewsCancellationReason | null;

  /** When an optional reservation was released. OPTIONAL. */
  ReleasedUtc: string | null;

  /** Scheduled check-in time. REQUIRED. Use this, NOT deprecated StartUtc. */
  ScheduledStartUtc: string;

  /** Actual check-in time (when guest physically checks in). OPTIONAL. */
  ActualStartUtc: string | null;

  /** Scheduled check-out time. REQUIRED. Use this, NOT deprecated EndUtc. */
  ScheduledEndUtc: string;

  /** Actual check-out time. OPTIONAL. */
  ActualEndUtc: string | null;

  /** Trip purpose. OPTIONAL — useful for Aria personalisation. */
  Purpose: MewsReservationPurpose | null;

  /** QR code data for the reservation. OPTIONAL. */
  QrCodeData: string | null;

  /** Person counts per age category. REQUIRED. */
  PersonCounts: MewsPersonCount[];
}

export interface MewsReservationOptions {
  /** Owner of the reservation has checked in. */
  OwnerCheckedIn: boolean;
  /** All companions have checked in. */
  AllCompanionsCheckedIn: boolean;
  /** At least one companion has checked in. */
  AnyCompanionCheckedIn: boolean;
  /** Check-in was performed via the Connector API. */
  ConnectorCheckIn: boolean;
}

export interface MewsPersonCount {
  /** Age category UUID (defined per property — e.g. "Adult", "Child"). */
  AgeCategoryId: string;
  /** Number of people in this category. */
  Count: number;
}

/* ──────────────────────────────────────────────────────────────────
   REQUEST OBJECTS
   ────────────────────────────────────────────────────────────────── */

export interface MewsLimitation {
  /** Page size. Max 1000. */
  Count: number;
  /** Pagination cursor returned from the previous call. */
  Cursor?: string;
}

export interface MewsTimeInterval {
  StartUtc: string;
  EndUtc: string;
}

export interface MewsReservationsGetAllRequest extends MewsAuthEnvelope {
  EnterpriseIds?: string[];
  ReservationIds?: string[];
  ServiceIds?: string[];
  ReservationGroupIds?: string[];
  AccountIds?: string[];
  PartnerCompanyIds?: string[];
  TravelAgencyIds?: string[];
  Numbers?: string[];
  ChannelNumbers?: string[];
  AssignedResourceIds?: string[];
  AvailabilityBlockIds?: string[];

  /** Max range: 3 months. */
  CreatedUtc?: MewsTimeInterval;
  /** Max range: 3 months. Best for incremental sync. */
  UpdatedUtc?: MewsTimeInterval;
  /** Max range: 3 months. Reservations active during the interval. */
  CollidingUtc?: MewsTimeInterval;
  /** Max range: 3 months. Filter by scheduled check-in. */
  ScheduledStartUtc?: MewsTimeInterval;
  /** Max range: 3 months. Filter by actual check-in. */
  ActualStartUtc?: MewsTimeInterval;
  /** Max range: 3 months. Filter by scheduled check-out. */
  ScheduledEndUtc?: MewsTimeInterval;
  /** Max range: 3 months. Filter by actual check-out. */
  ActualEndUtc?: MewsTimeInterval;

  /**
   * If omitted, defaults to ['Confirmed', 'Started', 'Processed'].
   * Cancelled bookings need explicit ['Canceled'] request.
   */
  States?: MewsReservationState[];

  Limitation: MewsLimitation;
}

export interface MewsReservationsGetAllResponse {
  Reservations: MewsReservation[];
  /** Cursor for the next page; null when no more pages. */
  Cursor: string | null;
}

/* ──────────────────────────────────────────────────────────────────
   DRIFT-DETECTION SCHEMA
   ──────────────────────────────────────────────────────────────────
   The canary cron at /api/cron/pms-drift-check uses this list to
   validate that every field we depend on still exists in the response,
   with the expected type.
   
   If a field disappears, becomes a different type, or a new required
   field appears in the live API but is missing here — alert.
   
   Adding new fields to depend on? Add them here too.
   ────────────────────────────────────────────────────────────────── */

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'string-or-null';

export interface ExpectedField {
  name: string;
  type: FieldType;
  required: boolean;
  /** Brief why-we-care note for the alert message if this field drifts. */
  purpose: string;
}

export const MEWS_RESERVATION_EXPECTED_FIELDS: ExpectedField[] = [
  { name: 'Id', type: 'string', required: true,
    purpose: 'External ID for stays table' },
  { name: 'Number', type: 'string', required: true,
    purpose: 'Confirmation number shown to guests' },
  { name: 'State', type: 'string', required: true,
    purpose: 'Drives stay status (checked in / out / cancelled)' },
  { name: 'Origin', type: 'string', required: true,
    purpose: 'Aria personalisation context (OTA vs direct)' },
  { name: 'ScheduledStartUtc', type: 'string', required: true,
    purpose: 'Check-in date — core stay field' },
  { name: 'ScheduledEndUtc', type: 'string', required: true,
    purpose: 'Check-out date — core stay field' },
  { name: 'ActualStartUtc', type: 'string-or-null', required: false,
    purpose: 'Actual check-in time — drives Aria active state' },
  { name: 'ActualEndUtc', type: 'string-or-null', required: false,
    purpose: 'Actual check-out time — triggers closeMemory()' },
  { name: 'AccountId', type: 'string', required: true,
    purpose: 'Links reservation to guest profile' },
  { name: 'AccountType', type: 'string', required: true,
    purpose: 'Distinguishes Customer vs Company bookings' },
  { name: 'AssignedResourceId', type: 'string-or-null', required: false,
    purpose: 'Room assignment — needed for room-based features' },
  { name: 'CreatedUtc', type: 'string', required: true,
    purpose: 'Record creation timestamp' },
  { name: 'UpdatedUtc', type: 'string', required: true,
    purpose: 'Used for incremental sync filtering' },
  { name: 'CancelledUtc', type: 'string-or-null', required: false,
    purpose: 'Marks cancellation timestamp' },
  { name: 'Options', type: 'object', required: true,
    purpose: 'Check-in flags — drives Aria active session' },
  { name: 'PersonCounts', type: 'array', required: true,
    purpose: 'Adult/child counts per age category' },
  { name: 'GroupId', type: 'string', required: true,
    purpose: 'Multi-room booking grouping' },
  { name: 'RateId', type: 'string', required: true,
    purpose: 'Rate plan applied — useful for hotel admin reports' },
  { name: 'RequestedResourceCategoryId', type: 'string', required: true,
    purpose: 'Requested room category' },
  { name: 'ChannelNumber', type: 'string-or-null', required: false,
    purpose: 'OTA confirmation number — useful for guest verification' },
  { name: 'Purpose', type: 'string-or-null', required: false,
    purpose: 'Trip purpose (Leisure / Business) for Aria tone' },
];

/**
 * Fields that Mews has marked as DEPRECATED.
 * If any of these stop appearing it's expected. Do NOT alert on these.
 */
export const MEWS_DEPRECATED_FIELDS: string[] = [
  'StartUtc',  // Use ScheduledStartUtc / ActualStartUtc
  'EndUtc',    // Use ScheduledEndUtc / ActualEndUtc
];

/* ──────────────────────────────────────────────────────────────────
   FIELD MAPPING — Mews → Stayscape
   ──────────────────────────────────────────────────────────────────
   Reference for the MewsAdapter's translateReservation() function.
   This is documentation; the actual translation lives in mews.ts.
   ────────────────────────────────────────────────────────────────── */

export const MEWS_TO_STAYSCAPE_RESERVATION_MAP = {
  Id: 'stays.external_id',
  Number: 'stays.confirmation_number',
  State: 'stays.status (via MEWS_STATE_TO_STAYSCAPE)',
  ScheduledStartUtc: 'stays.check_in',
  ScheduledEndUtc: 'stays.check_out',
  ActualStartUtc: 'stays.actual_check_in',
  ActualEndUtc: 'stays.actual_check_out',
  AccountId: 'stays.guest_id (via customer lookup)',
  AssignedResourceId: 'stays.room_id (via resource lookup)',
  CreatedUtc: 'stays.external_created_at',
  UpdatedUtc: 'stays.external_updated_at',
  CancelledUtc: 'stays.cancelled_at',
  Origin: 'stays.booking_source',
  Purpose: 'stays.trip_purpose',
  ChannelNumber: 'stays.ota_confirmation_number',
  PersonCounts: 'stays.guest_count (sum of all)',
  Options: 'stays.checkin_flags (jsonb)',
} as const;
