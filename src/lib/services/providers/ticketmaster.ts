/**
 * Ticketmaster Event Provider
 *
 * Implements the EventProvider interface for the Ticketmaster
 * Discovery API. Normalizes Ticketmaster responses into our
 * internal EventUpsertInput shape.
 */

import { getTicketmasterApiKey } from '@/lib/env';
import type { EventProvider, EventSearchParams } from '../events';
import type { EventUpsertInput } from '@/lib/supabase/events-repository';
import type { ExternalSource } from '@/types/database';

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';

/* ── Ticketmaster response types (internal) ──────────────── */

interface TmImage {
  url: string;
  ratio?: string;
  width?: number;
  height?: number;
}

interface TmVenue {
  name?: string;
  address?: { line1?: string };
  city?: { name?: string };
  country?: { countryCode?: string };
  location?: { latitude?: string; longitude?: string };
}

interface TmPriceRange {
  min?: number;
  max?: number;
  currency?: string;
}

interface TmDate {
  start?: {
    localDate?: string;
    localTime?: string;
    dateTime?: string;
  };
  end?: {
    localDate?: string;
    localTime?: string;
    dateTime?: string;
  };
}

interface TmClassification {
  segment?: { name?: string };
  genre?: { name?: string };
  subGenre?: { name?: string };
}

interface TmEvent {
  id: string;
  name: string;
  description?: string;
  info?: string;
  url?: string;
  images?: TmImage[];
  dates?: TmDate;
  priceRanges?: TmPriceRange[];
  classifications?: TmClassification[];
  _embedded?: { venues?: TmVenue[] };
}

interface TmSearchResponse {
  _embedded?: { events?: TmEvent[] };
  page?: { totalElements?: number };
}

/* ── Helper ──────────────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickBestImage(images?: TmImage[]): string | null {
  if (!images?.length) return null;
  // Prefer 16_9 ratio with decent width
  const wide = images.find(
    (i) => i.ratio === '16_9' && (i.width ?? 0) >= 640,
  );
  return wide?.url ?? images[0].url;
}

function mapTmCategory(classifications?: TmClassification[]): string {
  const segment = classifications?.[0]?.segment?.name?.toLowerCase();
  if (!segment) return 'general';
  if (segment.includes('music')) return 'music';
  if (segment.includes('sport')) return 'sports';
  if (segment.includes('art') || segment.includes('theatre')) return 'arts';
  if (segment.includes('film')) return 'film';
  if (segment.includes('misc')) return 'general';
  return segment;
}

/* ── Provider implementation ─────────────────────────────── */

export class TicketmasterProvider implements EventProvider {
  readonly source: ExternalSource = 'ticketmaster';
  readonly displayName = 'Ticketmaster';

  async searchEvents(params: EventSearchParams): Promise<EventUpsertInput[]> {
    const apiKey = getTicketmasterApiKey();
    const {
      latitude,
      longitude,
      radius_km = 25,
      category,
      date_from,
      date_to,
      limit = 50,
    } = params;

    const url = new URL(`${TM_BASE}/events.json`);
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('latlong', `${latitude},${longitude}`);
    url.searchParams.set('radius', String(radius_km));
    url.searchParams.set('unit', 'km');
    url.searchParams.set('size', String(Math.min(limit, 200)));
    url.searchParams.set('sort', 'date,asc');

    if (category) url.searchParams.set('classificationName', category);
    if (date_from) url.searchParams.set('startDateTime', `${date_from}T00:00:00Z`);
    if (date_to) url.searchParams.set('endDateTime', `${date_to}T23:59:59Z`);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(
        `Ticketmaster API error: ${res.status} ${res.statusText}`,
      );
    }

    const json = (await res.json()) as TmSearchResponse;
    const events = json._embedded?.events ?? [];
    return events.map((e) => this.normalize(e));
  }

  async getEventDetails(
    externalId: string,
  ): Promise<EventUpsertInput | null> {
    const apiKey = getTicketmasterApiKey();
    const url = new URL(`${TM_BASE}/events/${encodeURIComponent(externalId)}.json`);
    url.searchParams.set('apikey', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const event = (await res.json()) as TmEvent;
    return this.normalize(event);
  }

  /* ── Normalize a Ticketmaster event ────────────────────── */

  private normalize(e: TmEvent): EventUpsertInput {
    const venue = e._embedded?.venues?.[0];
    const price = e.priceRanges?.[0];
    const startDate = e.dates?.start?.dateTime ?? e.dates?.start?.localDate;
    const endDate = e.dates?.end?.dateTime ?? e.dates?.end?.localDate ?? null;

    return {
      name: e.name,
      slug: slugify(e.name),
      description: e.description ?? e.info ?? '',
      category: mapTmCategory(e.classifications),
      subcategory: e.classifications?.[0]?.genre?.name ?? null,
      venue_name: venue?.name ?? null,
      latitude: venue?.location?.latitude
        ? parseFloat(venue.location.latitude)
        : null,
      longitude: venue?.location?.longitude
        ? parseFloat(venue.location.longitude)
        : null,
      address: venue?.address?.line1 ?? null,
      city: venue?.city?.name ?? null,
      country_code: venue?.country?.countryCode ?? null,
      image_url: pickBestImage(e.images),
      image_urls: (e.images ?? []).map((i) => i.url),
      ticket_url: e.url ?? null,
      price_min: price?.min ?? null,
      price_max: price?.max ?? null,
      currency: price?.currency ?? 'USD',
      start_date: startDate ?? new Date().toISOString(),
      end_date: endDate,
      start_time: e.dates?.start?.localTime ?? null,
      end_time: e.dates?.end?.localTime ?? null,
      external_source: 'ticketmaster',
      external_id: e.id,
      expires_at: endDate,
    };
  }
}
