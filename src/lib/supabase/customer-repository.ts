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
      `id, user_id, property_id, check_in, check_out, status, room_type, guests,
       properties:property_id ( id, name, image_url, address )`,
    )
    .eq('user_id', userId)
    .gte('check_out', now)
    .order('check_in', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // Normalize the joined property data
  const row = data as Record<string, unknown>;
  const property = row.properties as CustomerStay['property'] ?? null;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    property_id: row.property_id as string,
    check_in: row.check_in as string,
    check_out: row.check_out as string,
    status: row.status as string,
    room_type: (row.room_type as string) ?? null,
    guests: (row.guests as number) ?? null,
    property,
  };
}
