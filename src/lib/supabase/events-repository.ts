/**
 * Events Repository — Supabase data access layer.
 *
 * All database operations for the `events` and `event_tags` tables.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  InternalEvent,
  EventTag,
  EventsQueryParams,
  DiscoveryEventCard,
  DiscoveryEventDetail,
} from '@/types/database';

/* ── Read operations ─────────────────────────────────────── */

export async function queryEvents(
  supabase: SupabaseClient,
  params: EventsQueryParams = {},
): Promise<InternalEvent[]> {
  let query = supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: true });

  if (params.region_id) query = query.eq('region_id', params.region_id);
  if (params.category) query = query.eq('category', params.category);
  if (params.featured_only) query = query.eq('is_featured', true);
  if (params.date_from) query = query.gte('start_date', params.date_from);
  if (params.date_to) query = query.lte('start_date', params.date_to);
  if (params.search) query = query.ilike('name', `%${params.search}%`);
  if (params.limit) query = query.limit(params.limit);
  if (params.offset) query = query.range(params.offset, params.offset + (params.limit ?? 20) - 1);

  const { data, error } = await query;
  if (error) throw new Error(`queryEvents failed: ${error.message}`);
  return (data ?? []) as InternalEvent[];
}

export async function getEventById(
  supabase: SupabaseClient,
  id: string,
): Promise<InternalEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') {
    throw new Error(`getEventById failed: ${error.message}`);
  }
  return (data as InternalEvent) ?? null;
}

export async function getEventTags(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventTag[]> {
  const { data, error } = await supabase
    .from('event_tags')
    .select('*')
    .eq('event_id', eventId);
  if (error) throw new Error(`getEventTags failed: ${error.message}`);
  return (data ?? []) as EventTag[];
}

/* ── Write operations (admin / sync) ─────────────────────── */

export interface EventUpsertInput {
  name: string;
  slug: string;
  description: string;
  category: string;
  start_date: string;
  region_id?: string;
  subcategory?: string | null;
  editorial_summary?: string | null;
  venue_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  country_code?: string | null;
  image_url?: string | null;
  image_urls?: string[];
  ticket_url?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  currency?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_featured?: boolean;
  external_source: string;
  external_id: string;
  expires_at?: string | null;
}

export async function upsertEvent(
  supabase: SupabaseClient,
  input: EventUpsertInput,
): Promise<{ event: InternalEvent; created: boolean }> {
  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('external_source', input.external_source)
    .eq('external_id', input.external_id)
    .maybeSingle();

  const now = new Date().toISOString();
  const record = {
    ...input,
    image_urls: input.image_urls ?? [],
    is_active: true,
    last_synced_at: now,
    updated_at: now,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('events')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(`upsertEvent update failed: ${error.message}`);
    return { event: data as InternalEvent, created: false };
  }

  const { data, error } = await supabase
    .from('events')
    .insert({ ...record, created_at: now })
    .select()
    .single();
  if (error) throw new Error(`upsertEvent insert failed: ${error.message}`);
  return { event: data as InternalEvent, created: true };
}

/**
 * Deactivate events that have expired (past their end_date or expires_at).
 */
export async function deactivateExpiredEvents(
  supabase: SupabaseClient,
): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .update({ is_active: false, updated_at: now })
    .eq('is_active', true)
    .or(`expires_at.lt.${now},end_date.lt.${now}`)
    .select('id');
  if (error) throw new Error(`deactivateExpiredEvents failed: ${error.message}`);
  return data?.length ?? 0;
}

/**
 * Deactivate events from a given source not seen since `since`.
 */
export async function deactivateStaleEvents(
  supabase: SupabaseClient,
  source: string,
  regionId: string,
  since: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('events')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('external_source', source)
    .eq('region_id', regionId)
    .eq('is_active', true)
    .lt('last_synced_at', since)
    .select('id');
  if (error) throw new Error(`deactivateStaleEvents failed: ${error.message}`);
  return data?.length ?? 0;
}

/* ── Shape for frontend consumption ──────────────────────── */

export function toDiscoveryEventCard(
  event: InternalEvent,
  tags: EventTag[] = [],
): DiscoveryEventCard {
  return {
    id: event.id,
    name: event.name,
    category: event.category,
    description: event.description,
    editorial_summary: event.editorial_summary,
    venue_name: event.venue_name,
    image_url: event.image_url,
    start_date: event.start_date,
    end_date: event.end_date,
    start_time: event.start_time,
    price_min: event.price_min,
    price_max: event.price_max,
    currency: event.currency,
    ticket_url: event.ticket_url,
    tags: tags.filter((t) => t.tag_type === 'general').map((t) => t.tag),
    vibes: tags.filter((t) => t.tag_type === 'vibe').map((t) => t.tag),
    is_featured: event.is_featured,
  };
}

export function toDiscoveryEventDetail(
  event: InternalEvent,
  tags: EventTag[] = [],
): DiscoveryEventDetail {
  return {
    ...toDiscoveryEventCard(event, tags),
    latitude: event.latitude,
    longitude: event.longitude,
    address: event.address,
    end_time: event.end_time,
    image_urls: event.image_urls,
  };
}
