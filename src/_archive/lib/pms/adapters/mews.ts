/**
 * Mews Connector API Adapter
 *
 * Translates between Mews's Connector API and Stayscape's internal data
 * model. Implements the PmsAdapter contract from ../types.ts.
 *
 * Field names, enums, and types are sourced from ./mews-schema.ts —
 * the single source of truth. If Mews's API changes, update the schema
 * file first; the adapter follows.
 *
 * Reference:
 *   https://docs.mews.com/connector-api
 *   ./mews-schema.ts
 */

import type {
  PmsAdapter,
  PmsAdapterConfig,
  PmsWebhookEvent,
  InternalStay,
} from '../types';

import {
  MEWS_ENDPOINTS,
  MEWS_STATE_TO_STAYSCAPE,
  type MewsAuthEnvelope,
  type MewsReservation,
  type MewsReservationsGetAllRequest,
  type MewsReservationsGetAllResponse,
  type MewsReservationState,
  type MewsPersonCount,
} from './mews-schema';

/* ──────────────────────────────────────────────────────────────────
   ADAPTER
   ────────────────────────────────────────────────────────────────── */

export class MewsAdapter implements PmsAdapter {
  readonly providerName = 'Mews';

  private readonly platformAddress: string;
  private readonly auth: MewsAuthEnvelope;
  private readonly webhookSecret: string | null;

  constructor(config: PmsAdapterConfig) {
    /**
     * Mews requires three auth fields, but our PmsAdapterConfig only
     * exposes one `apiKey`. We pack ClientToken + AccessToken into it
     * as a JSON-encoded blob: { "ClientToken": "...", "AccessToken": "..." }
     * The hotel onboarding wizard handles this packing.
     */
    let parsed: { ClientToken?: string; AccessToken?: string };
    try {
      parsed = JSON.parse(config.apiKey);
    } catch {
      throw new Error(
        'MewsAdapter: apiKey must be JSON with ClientToken and AccessToken',
      );
    }

    if (!parsed.ClientToken || !parsed.AccessToken) {
      throw new Error('MewsAdapter: missing ClientToken or AccessToken');
    }

    this.platformAddress = config.apiEndpoint.replace(/\/$/, '');
    this.auth = {
      ClientToken: parsed.ClientToken,
      AccessToken: parsed.AccessToken,
      Client: 'Stayscape 1.0.0',
    };
    this.webhookSecret = config.webhookSecret ?? null;
  }

  /* ──────────────────────────────────────────────────────────────
     PUBLIC METHODS — required by PmsAdapter contract
     ────────────────────────────────────────────────────────────── */

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.callMews(MEWS_ENDPOINTS.configurationGet, {});
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async pullReservations(params: {
    fromDate: Date;
    toDate: Date;
  }): Promise<InternalStay[]> {
    /**
     * Mews caps date ranges at 3 months. If a caller asks for more,
     * we split into 3-month chunks and concat results.
     */
    const chunks = splitDateRange(params.fromDate, params.toDate, 90);
    const allReservations: MewsReservation[] = [];

    for (const chunk of chunks) {
      const reservations = await this.fetchReservationsInRange(
        chunk.from,
        chunk.to,
      );
      allReservations.push(...reservations);
    }

    return allReservations.map((r) => translateReservation(r));
  }

  async pullReservationById(externalId: string): Promise<InternalStay | null> {
    const body: Partial<MewsReservationsGetAllRequest> = {
      ReservationIds: [externalId],
      States: [
        'Inquired',
        'Confirmed',
        'Started',
        'Processed',
        'Canceled',
        'Optional',
        'Requested',
      ],
      Limitation: { Count: 1 },
    };

    const response = await this.callMews<MewsReservationsGetAllResponse>(
      MEWS_ENDPOINTS.reservationsGetAll,
      body,
    );

    const reservation = response.Reservations[0];
    return reservation ? translateReservation(reservation) : null;
  }

  async pushServiceRequest(task: {
    externalReservationId: string;
    description: string;
  }): Promise<{ externalId: string }> {
    /**
     * Mews doesn't have a first-class "service request" concept on the
     * Connector API; the cleanest equivalent is attaching a note to the
     * reservation that hotel staff can see in Mews Operations.
     */
    const response = await this.callMews<{ Id: string }>(
      MEWS_ENDPOINTS.serviceOrderNotesAdd,
      {
        ServiceOrderId: task.externalReservationId,
        Text: task.description,
      },
    );

    return { externalId: response.Id };
  }

  async pushGuestPreferences(_preferences: import('../types').GuestPreference[]): Promise<void> {
    /**
     * Phase 2: write guest preferences (allergies, room prefs, etc.)
     * back to Mews customer notes. Skipping in v1 — preferences live
     * in Stayscape only for now and Aria reads them from there.
     */
    return;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('[MewsAdapter] No webhook secret configured; signature unverified');
      return false;
    }
    /**
     * Mews signs webhooks with HMAC-SHA256 of the raw payload using the
     * webhook secret. The signature comes through in the
     * `X-Mews-Signature` header, hex-encoded.
     */
    const expected = hmacSha256Hex(this.webhookSecret, payload);
    return timingSafeEqual(expected, signature);
  }

  parseWebhookEvent(payload: unknown): PmsWebhookEvent[] {
    if (!isMewsWebhookPayload(payload)) {
      console.warn('[MewsAdapter] Webhook payload did not match expected shape');
      return [];
    }

    const events: PmsWebhookEvent[] = [];

    for (const event of payload.Events) {
      switch (event.Type) {
        case 'ReservationCreated':
          if (!event.Reservation?.Id) break;
          events.push({ type: 'stay.created', externalId: event.Reservation.Id });
          break;
        case 'ReservationUpdated': {
          if (!event.Reservation?.Id) break;
          /* Drill into specific transitions where possible */
          const { Id, State } = event.Reservation;
          if (State === 'Started') {
            events.push({ type: 'stay.checked_in', externalId: Id });
          } else if (State === 'Processed') {
            events.push({ type: 'stay.checked_out', externalId: Id });
          } else if (State === 'Canceled') {
            events.push({ type: 'stay.cancelled', externalId: Id });
          } else {
            events.push({ type: 'stay.updated', externalId: Id });
          }
          break;
        }
        case 'ResourceStatusChanged':
          if (!event.Resource?.Id) break;
          events.push({
            type: 'room.status_changed',
            roomNumber: event.Resource.Number ?? event.Resource.Id,
            status: event.Resource.State ?? 'unknown',
          });
          break;
        default:
          /* Unknown event type — ignore but don't crash */
          break;
      }
    }

    return events;
  }

  /* ──────────────────────────────────────────────────────────────
     INTERNAL HELPERS
     ────────────────────────────────────────────────────────────── */

  private async fetchReservationsInRange(
    from: Date,
    to: Date,
  ): Promise<MewsReservation[]> {
    const reservations: MewsReservation[] = [];
    let cursor: string | undefined;

    /**
     * Pagination loop: keep calling until the cursor is null.
     * Hard cap at 50 pages = 50,000 reservations to prevent runaway.
     */
    for (let page = 0; page < 50; page++) {
      const body: MewsReservationsGetAllRequest = {
        ...this.auth,
        UpdatedUtc: {
          StartUtc: from.toISOString(),
          EndUtc: to.toISOString(),
        },
        States: ['Inquired', 'Confirmed', 'Started', 'Processed', 'Canceled'],
        Limitation: {
          Count: 1000,
          ...(cursor ? { Cursor: cursor } : {}),
        },
      };

      const response = await this.callMews<MewsReservationsGetAllResponse>(
        MEWS_ENDPOINTS.reservationsGetAll,
        body,
      );

      reservations.push(...response.Reservations);

      if (!response.Cursor || response.Reservations.length === 0) break;
      cursor = response.Cursor;
    }

    return reservations;
  }
  
  private async callMews<T>(
  endpoint: string,
  body: object,
  ): Promise<T> {
    const url = `${this.platformAddress}${endpoint}`;
    const fullBody = { ...this.auth, ...body };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Mews API ${res.status} at ${endpoint}: ${errText}`);
    }

    /* Mews returns 204 No Content for empty results when Prefer header is set */
    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  }
}

/* ──────────────────────────────────────────────────────────────────
   TRANSLATION — Mews reservation → Stayscape InternalStay
   ──────────────────────────────────────────────────────────────────
   Pure function. No side effects. Easy to unit test.
   ────────────────────────────────────────────────────────────────── */

export function translateReservation(r: MewsReservation): InternalStay {
  const status = MEWS_STATE_TO_STAYSCAPE[r.State as MewsReservationState];

  return {
    /* Identity */
    external_id: r.Id,
    confirmation_number: r.Number,

    /* Status */
    status,

    /* Schedule */
    check_in: r.ScheduledStartUtc,
    check_out: r.ScheduledEndUtc,
    actual_check_in: r.ActualStartUtc,
    actual_check_out: r.ActualEndUtc,

    /* People */
    external_guest_id: r.AccountId,
    guest_count: sumPersonCounts(r.PersonCounts),

    /* Room */
    external_room_id: r.AssignedResourceId,
    requested_category_id: r.RequestedResourceCategoryId,

    /* Provenance */
    booking_source: r.Origin,
    ota_confirmation_number: r.ChannelNumber,
    trip_purpose: r.Purpose,

    /* Lifecycle timestamps from PMS */
    external_created_at: r.CreatedUtc,
    external_updated_at: r.UpdatedUtc,
    cancelled_at: r.CancelledUtc,
    cancellation_reason: r.CancellationReason,

    /* Live state flags */
    checkin_flags: {
      owner_checked_in: r.Options.OwnerCheckedIn,
      all_companions_checked_in: r.Options.AllCompanionsCheckedIn,
      any_companion_checked_in: r.Options.AnyCompanionCheckedIn,
      connector_check_in: r.Options.ConnectorCheckIn,
    },
  };
}

function sumPersonCounts(counts: MewsPersonCount[]): number {
  return counts.reduce((sum, c) => sum + c.Count, 0);
}

/* ──────────────────────────────────────────────────────────────────
   UTILITIES
   ────────────────────────────────────────────────────────────────── */

function splitDateRange(
  from: Date,
  to: Date,
  maxDays: number,
): Array<{ from: Date; to: Date }> {
  const chunks: Array<{ from: Date; to: Date }> = [];
  const msPerDay = 24 * 60 * 60 * 1000;
  let cursor = new Date(from);

  while (cursor < to) {
    const next = new Date(Math.min(cursor.getTime() + maxDays * msPerDay, to.getTime()));
    chunks.push({ from: new Date(cursor), to: next });
    cursor = next;
  }

  return chunks;
}

function hmacSha256Hex(secret: string, payload: string): string {
  /**
   * Web Crypto API equivalent — works in Node 18+ and Edge runtimes.
   * Done synchronously via a small wrapper using crypto module fallback.
   */
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require('node:crypto');
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  // Both inputs are SHA-256 hex digests (always 64 chars). A length
  // difference means a malformed input — not a match.
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/* ──────────────────────────────────────────────────────────────────
   WEBHOOK PAYLOAD TYPE GUARD
   ──────────────────────────────────────────────────────────────────
   Mews's webhook envelope shape — we only need a minimal type guard.
   ────────────────────────────────────────────────────────────────── */

interface MewsWebhookReservationEvent {
  Type: 'ReservationCreated' | 'ReservationUpdated';
  Reservation: { Id: string; State: MewsReservationState };
  Resource?: never;
}

interface MewsWebhookResourceEvent {
  Type: 'ResourceStatusChanged';
  Resource: { Id: string; Number?: string; State?: string };
  Reservation?: never;
}

interface MewsWebhookUnknownEvent {
  Type: string;
  Reservation?: { Id: string; State: MewsReservationState };
  Resource?: { Id: string; Number?: string; State?: string };
}

type MewsWebhookEvent =
  | MewsWebhookReservationEvent
  | MewsWebhookResourceEvent
  | MewsWebhookUnknownEvent;

interface MewsWebhookPayload {
  Events: MewsWebhookEvent[];
}

function isMewsWebhookPayload(p: unknown): p is MewsWebhookPayload {
  if (!p || typeof p !== 'object') return false;
  const obj = p as { Events?: unknown };
  return Array.isArray(obj.Events);
}
