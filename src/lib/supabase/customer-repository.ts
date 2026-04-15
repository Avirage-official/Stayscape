/**
 * Customer Repository
 *
 * Supabase queries for the consumer dashboard:
 * - Fetch customer profile from `public.users`
 * - Fetch upcoming stay from `public.stays` (joined with `public.properties`)
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { CustomerProfile, CustomerStay } from '@/types/customer';

function mapStayRow(row: Record<string, unknown>): CustomerStay {
  const propertyRow = row.properties as (Record<string, unknown> & {
    regions?: Record<string, unknown> | null;
  }) | null;
  const regionRow = propertyRow?.regions ?? null;

  const property: CustomerStay['property'] = propertyRow
    ? {
        id: propertyRow.id as string,
        name: propertyRow.name as string,
        image_url: (propertyRow.image_url as string) ?? null,
        address: (propertyRow.address as string) ?? null,
        city: (propertyRow.city as string) ?? null,
        country: (propertyRow.country as string) ?? null,
        latitude: (propertyRow.latitude as number) ?? null,
        longitude: (propertyRow.longitude as number) ?? null,
        region_id: (propertyRow.region_id as string) ?? null,
        region: regionRow
          ? {
              id: regionRow.id as string,
              name: regionRow.name as string,
              slug: regionRow.slug as string,
              latitude: regionRow.latitude as number,
              longitude: regionRow.longitude as number,
              radius_km: regionRow.radius_km as number,
              country_code: regionRow.country_code as string,
            }
          : null,
      }
    : null;

  return {
    id: row.id as string,
    user_id: row.userid as string,
    property_id: row.propertyid as string,
    check_in: row.checkindate as string,
    check_out: row.checkoutdate as string,
    status: row.status as string,
    room_type: (row.roomlabel as string) ?? null,
    guests: (row.guestcount as number) ?? null,
    property,
  };
}

/**
 * Fetch a customer profile by their auth user id.
 */
export async function getCustomerProfile(
  userId: string,
): Promise<CustomerProfile | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, firstname, lastname, phone, createdat')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    email: row.email as string,
    full_name: [row.firstname, row.lastname].filter(v => v != null).join(' ').trim() || null,
    avatar_url: null,
    phone: (row.phone as string) ?? null,
    created_at: row.createdat as string,
  };
}

/**
 * Fetch the next upcoming stay for a customer.
 * Returns null if there is no upcoming stay.
 */
export async function getUpcomingStay(
  userId: string,
): Promise<CustomerStay | null> {
  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('stays')
    .select(
      `id, userid, propertyid, checkindate, checkoutdate, status, roomlabel, guestcount,
       properties:propertyid (
         id, name, image_url, address, city, country, latitude, longitude, region_id,
         regions:region_id ( id, name, slug, latitude, longitude, radius_km, country_code )
       )`,
    )
    .eq('userid', userId)
    .gte('checkoutdate', now)
    .order('checkindate', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return mapStayRow(data as Record<string, unknown>);
}

/**
 * Fetch ALL upcoming stays for a customer, ordered by check-in date ascending.
 * Returns an empty array if there are no upcoming stays.
 */
export async function getUpcomingStays(
  userId: string,
): Promise<CustomerStay[]> {
  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('stays')
    .select(
      `id, userid, propertyid, checkindate, checkoutdate, status, roomlabel, guestcount,
       properties:propertyid (
         id, name, image_url, address, city, country, latitude, longitude, region_id,
         regions:region_id ( id, name, slug, latitude, longitude, radius_km, country_code )
       )`,
    )
    .eq('userid', userId)
    .gte('checkoutdate', now)
    .order('checkindate', { ascending: true });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map(mapStayRow);
}
