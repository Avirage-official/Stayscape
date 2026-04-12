/**
 * Customer Repository
 *
 * Supabase queries for the consumer dashboard:
 * - Fetch customer profile from `public.users`
 * - Fetch upcoming stay from `public.stays` (joined with `public.properties`)
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { CustomerProfile, CustomerStay } from '@/types/customer';

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
       properties:propertyid ( id, name, image_url, address )`,
    )
    .eq('userid', userId)
    .gte('checkoutdate', now)
    .order('checkindate', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // Normalize the joined property data
  const row = data as Record<string, unknown>;
  const property = row.properties as CustomerStay['property'] ?? null;

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
