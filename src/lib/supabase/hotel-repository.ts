/**
 * Hotel Repository — Supabase data access layer.
 *
 * Fetches hotel context (branding, amenities, policies) for a given property.
 * Used to inject per-property configuration into the guest app and admin portal.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/* ── Types ───────────────────────────────────────────────────── */

export interface HotelContext {
  branding: {
    logo_url: string | null;
    accent_color: string;
    hero_image_url: string | null;
    welcome_message: string | null;
    subdomain_slug: string | null;
  } | null;
  amenities: Array<{
    id: string;
    category: string;
    name: string;
    description: string | null;
    availability_hours: string | null;
    location_hint: string | null;
  }>;
  policies: {
    checkin_time: string | null;
    checkout_time: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
    cancellation_policy: string | null;
    pet_policy: string | null;
    smoking_policy: string | null;
    extra_policies: Record<string, unknown> | null;
  } | null;
}

/* ── Internal row types ──────────────────────────────────────── */

interface HotelBrandingRow {
  logo_url: string | null;
  accent_color: string;
  hero_image_url: string | null;
  welcome_message: string | null;
  subdomain_slug: string | null;
}

interface HotelAmenityRow {
  id: string;
  category: string;
  name: string;
  description: string | null;
  availability_hours: string | null;
  location_hint: string | null;
}

interface HotelPoliciesRow {
  checkin_time: string | null;
  checkout_time: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  cancellation_policy: string | null;
  pet_policy: string | null;
  smoking_policy: string | null;
  extra_policies: Record<string, unknown> | null;
}

/* ── Read operations ─────────────────────────────────────────── */

/**
 * Fetch all hotel context (branding, amenities, policies) for a property.
 * The three queries run in parallel for performance.
 * Returns `null` if the property has no branding record (i.e. not found).
 */
export async function getHotelContext(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<HotelContext | null> {
  const [brandingResult, amenitiesResult, policiesResult] = await Promise.all([
    supabase
      .from('hotel_branding')
      .select(
        'logo_url, accent_color, hero_image_url, welcome_message, subdomain_slug',
      )
      .eq('property_id', propertyId)
      .maybeSingle<HotelBrandingRow>(),

    supabase
      .from('hotel_amenities')
      .select(
        'id, category, name, description, availability_hours, location_hint',
      )
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .returns<HotelAmenityRow[]>(),

    supabase
      .from('hotel_policies')
      .select(
        'checkin_time, checkout_time, wifi_name, wifi_password, cancellation_policy, pet_policy, smoking_policy, extra_policies',
      )
      .eq('property_id', propertyId)
      .maybeSingle<HotelPoliciesRow>(),
  ]);

  if (brandingResult.error) {
    throw new Error(
      `getHotelContext branding failed: ${brandingResult.error.message}`,
    );
  }
  if (amenitiesResult.error) {
    throw new Error(
      `getHotelContext amenities failed: ${amenitiesResult.error.message}`,
    );
  }
  if (policiesResult.error) {
    throw new Error(
      `getHotelContext policies failed: ${policiesResult.error.message}`,
    );
  }

  // If there is no branding record the property has not been configured for
  // the multi-hotel platform yet, so return null to let callers handle the
  // missing context gracefully.
  if (!brandingResult.data) {
    return null;
  }

  return {
    branding: brandingResult.data,
    amenities: amenitiesResult.data ?? [],
    policies: policiesResult.data ?? null,
  };
}
