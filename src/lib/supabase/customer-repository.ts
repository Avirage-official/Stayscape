/**
 * Customer Repository
 *
 * Supabase queries for the consumer dashboard:
 * - Fetch customer profile from `public.users`
 * - Fetch upcoming stay from `public.stays` (joined with `public.properties`)
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { CustomerProfile, CustomerStay } from '@/types/customer';

async function resolveUserIdByAuthOrEmail(authUserId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data: direct } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUserId)
    .maybeSingle();

  if (direct) return direct.id as string;

  const { data: authData } = await supabase.auth.admin.getUserById(authUserId);
  const email = authData?.user?.email;
  if (!email) return null;

  const { data: byEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  return byEmail ? (byEmail.id as string) : null;
}

function mapStayRow(row: Record<string, unknown>): CustomerStay {
  const propertyRaw = row.properties as Record<string, unknown> | null;
  const regionRaw = propertyRaw?.regions as Record<string, unknown> | null;

  return {
    id: row.id as string,
    user_id: row.userid as string,
    property_id: row.propertyid as string,
    booking_reference: (row.booking_reference as string) ?? null,
    check_in: row.checkindate as string,
    check_out: row.checkoutdate as string,
    status: row.status as string,
    room_type: (row.roomlabel as string) ?? null,
    guests: (row.guestcount as number) ?? null,
    property: propertyRaw
      ? {
          id: propertyRaw.id as string,
          name: propertyRaw.name as string,
          image_url: (propertyRaw.image_url as string) ?? null,
          address: (propertyRaw.address as string) ?? null,
          city: (propertyRaw.city as string) ?? null,
          country: (propertyRaw.country as string) ?? null,
          latitude: (propertyRaw.latitude as number) ?? null,
          longitude: (propertyRaw.longitude as number) ?? null,
          region_id: (propertyRaw.region_id as string) ?? null,
          region: regionRaw
            ? {
                id: regionRaw.id as string,
                name: regionRaw.name as string,
                slug: regionRaw.slug as string,
                latitude: regionRaw.latitude as number,
                longitude: regionRaw.longitude as number,
                radius_km: regionRaw.radius_km as number,
                country_code: regionRaw.country_code as string,
              }
            : null,
        }
      : null,
  };
}

/**
 * Fetch a customer profile by their auth user id.
 */
export async function getCustomerProfile(
  userId: string,
): Promise<CustomerProfile | null> {
  const effectiveId = await resolveUserIdByAuthOrEmail(userId);
  if (!effectiveId) return null;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, firstname, lastname, phone, createdat')
    .eq('id', effectiveId)
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
  const effectiveId = await resolveUserIdByAuthOrEmail(userId);
  if (!effectiveId) return null;

  const supabase = getSupabaseAdmin();

  // Use date-only string (YYYY-MM-DD) to match the DATE column type
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('stays')
    .select(
      `id, userid, propertyid, booking_reference, checkindate, checkoutdate, status, roomlabel, guestcount,
       properties:propertyid ( id, name, image_url, address, city, country, latitude, longitude, region_id,
       regions:region_id ( id, name, slug, latitude, longitude, radius_km, country_code ) )`,
    )
    .eq('userid', effectiveId)
    .gte('checkoutdate', today)
    .order('checkindate', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getUpcomingStay] DB error:', error.message);
    return null;
  }
  if (!data) return null;

  return mapStayRow(data as Record<string, unknown>);
}

/**
 * Fetch ALL upcoming stays for a customer, ordered by check-in date ascending.
 * Returns an empty array if there are no upcoming stays.
 */
export async function getUpcomingStays(
  userId: string,
): Promise<CustomerStay[]> {
  const effectiveId = await resolveUserIdByAuthOrEmail(userId);
  if (!effectiveId) return [];

  const supabase = getSupabaseAdmin();

  // Use date-only string (YYYY-MM-DD) to match the DATE column type
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('stays')
    .select(
      `id, userid, propertyid, booking_reference, checkindate, checkoutdate, status, roomlabel, guestcount,
       properties:propertyid ( id, name, image_url, address, city, country, latitude, longitude, region_id,
       regions:region_id ( id, name, slug, latitude, longitude, radius_km, country_code ) )`,
    )
    .eq('userid', effectiveId)
    .gte('checkoutdate', today)
    .order('checkindate', { ascending: true });

  if (error) {
    console.error('[getUpcomingStays] DB error:', error.message);
    return [];
  }
  if (!data) return [];

  return (data as Record<string, unknown>[]).map(mapStayRow);
}
