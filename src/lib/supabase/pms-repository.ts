/**
 * PMS Repository
 *
 * Supabase data-access layer for PMS webhook processing:
 * - Upsert guest user by email
 * - Upsert property by PMS property ID
 * - Create stay from booking
 * - Link property to region by location
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { PmsBookingPayload, PmsWebhookResult } from '@/types/pms';

/**
 * Upsert a guest user by email.
 * If the user already exists, returns their ID without modifying.
 * If new, creates the user record.
 */
export async function upsertGuestUser(
  guest: PmsBookingPayload['guest'],
): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Check if user already exists by email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', guest.email)
    .maybeSingle();

  if (existing) return existing.id as string;

  // Create new user with a generated UUID
  const { data: created, error } = await supabase
    .from('users')
    .insert({
      id: crypto.randomUUID(),
      email: guest.email,
      firstname: guest.first_name,
      lastname: guest.last_name,
      phone: guest.phone ?? null,
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create guest user: ${error?.message ?? 'Unknown error'}`);
  }

  return created.id as string;
}

/**
 * Upsert a property by PMS property ID.
 * Uses the pms_property_id field to find or create the property record.
 */
export async function upsertProperty(
  property: PmsBookingPayload['property'],
): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Check if property already exists by pms_property_id
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('pms_property_id', property.pms_property_id)
    .maybeSingle();

  if (existing) return existing.id as string;

  // Create new property
  const insertData: Record<string, unknown> = {
    name: property.name,
    pms_property_id: property.pms_property_id,
  };
  if (property.address) insertData.address = property.address;
  if (property.image_url) insertData.image_url = property.image_url;
  if (property.city) insertData.city = property.city;
  if (property.country) insertData.country = property.country;
  if (property.latitude != null) insertData.latitude = property.latitude;
  if (property.longitude != null) insertData.longitude = property.longitude;

  const { data: created, error } = await supabase
    .from('properties')
    .insert(insertData)
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create property: ${error?.message ?? 'Unknown error'}`);
  }

  return created.id as string;
}

/**
 * Find the closest matching region for a property's location.
 * Returns region_id if found within the region's radius, null otherwise.
 */
export async function findRegionForProperty(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  // Fetch all active regions and find the closest one
  const { data: regions } = await supabase
    .from('regions')
    .select('id, latitude, longitude, radius_km')
    .eq('is_active', true);

  if (!regions || regions.length === 0) return null;

  for (const region of regions) {
    const distKm = haversineDistance(
      latitude,
      longitude,
      region.latitude as number,
      region.longitude as number,
    );
    if (distKm <= (region.radius_km as number)) {
      return region.id as string;
    }
  }

  return null;
}

/**
 * Create a stay record from a PMS booking.
 * Checks for duplicate booking references to prevent double-processing.
 */
export async function createStayFromBooking(
  userId: string,
  propertyId: string,
  booking: PmsBookingPayload,
): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Check for duplicate booking reference
  const { data: existing } = await supabase
    .from('stays')
    .select('id')
    .eq('booking_reference', booking.booking_reference)
    .maybeSingle();

  if (existing) return existing.id as string;

  const insertData: Record<string, unknown> = {
    userid: userId,
    propertyid: propertyId,
    checkindate: booking.check_in,
    checkoutdate: booking.check_out,
    status: booking.status ?? 'confirmed',
    booking_reference: booking.booking_reference,
  };
  if (booking.room_type) insertData.roomlabel = booking.room_type;
  if (booking.guests != null) insertData.guestcount = booking.guests;
  if (booking.trip_type) insertData.trip_type = booking.trip_type;
  if (booking.notes) insertData.notes = booking.notes;
  if (booking.pms_callback_url) insertData.pms_callback_url = booking.pms_callback_url;

  const { data: created, error } = await supabase
    .from('stays')
    .insert(insertData)
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create stay: ${error?.message ?? 'Unknown error'}`);
  }

  return created.id as string;
}

/**
 * Process a full PMS webhook booking payload.
 * Orchestrates user creation, property upsert, region matching, and stay creation.
 */
export async function processWebhookBooking(
  payload: PmsBookingPayload,
): Promise<PmsWebhookResult> {
  // Step 1: Upsert guest user
  const userId = await upsertGuestUser(payload.guest);

  // Step 2: Upsert property
  const propertyId = await upsertProperty(payload.property);

  // Step 3: Find matching region for the property
  let regionId: string | null = null;
  if (payload.property.latitude != null && payload.property.longitude != null) {
    regionId = await findRegionForProperty(
      payload.property.latitude,
      payload.property.longitude,
    );

    // Link property to region if found
    if (regionId) {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('properties')
        .update({ region_id: regionId })
        .eq('id', propertyId);
    }
  }

  // Step 4: Create stay
  const stayId = await createStayFromBooking(userId, propertyId, payload);

  return {
    user_id: userId,
    property_id: propertyId,
    stay_id: stayId,
    booking_reference: payload.booking_reference,
    region_id: regionId,
    curation_triggered: false,
  };
}

/* ── Helpers ─────────────────────────────────────────────────── */

/** Haversine distance in km between two lat/lng points. */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
