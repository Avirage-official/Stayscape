/**
 * GET  /api/admin/hotels/[propertyId]  — load all hotel data for the edit page
 * PUT  /api/admin/hotels/[propertyId]  — update hotel (partial body, all fields optional)
 * POST /api/admin/hotels/[propertyId]  — add a new amenity
 *
 * Auth: requires `sa_session` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/* ── Types ─────────────────────────────────────────────────────── */

interface UpdateHotelBody {
  // Basics
  name?: string;
  city?: string;
  country?: string;
  timezone?: string;
  address?: string | null;
  region_id?: string | null;
  booking_url?: string | null;

  // Branding
  logo_url?: string | null;
  accent_color?: string;
  hero_image_url?: string | null;
  welcome_message?: string | null;
  concierge_name?: string;
  concierge_tone?: string;

  // Policies
  checkin_time?: string | null;
  checkout_time?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  cancellation_policy?: string | null;
  pet_policy?: string | null;
  smoking_policy?: string | null;

  // PMS
  pms_provider?: string;
  webhook_secret?: string | null;
  pms_is_active?: boolean;
}

interface AddAmenityBody {
  category: string;
  name: string;
  description?: string | null;
  availability_hours?: string | null;
  location_hint?: string | null;
}

/* ── Auth helper ────────────────────────────────────────────────── */

function checkAuth(request: NextRequest): boolean {
  const saSession = request.cookies.get('sa_session');
  return Boolean(saSession?.value);
}

/* ── GET ────────────────────────────────────────────────────────── */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId } = await params;
  const supabase = getSupabaseAdmin();

  try {
    const [propertyRes, brandingRes, policiesRes, pmsRes, amenitiesRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, name, city, country, timezone, address, region_id, booking_url')
        .eq('id', propertyId)
        .maybeSingle(),
      supabase
        .from('hotel_branding')
        .select(
          'logo_url, accent_color, hero_image_url, welcome_message, concierge_name, concierge_tone',
        )
        .eq('property_id', propertyId)
        .maybeSingle(),
      supabase
        .from('hotel_policies')
        .select(
          'checkin_time, checkout_time, wifi_name, wifi_password, cancellation_policy, pet_policy, smoking_policy',
        )
        .eq('property_id', propertyId)
        .maybeSingle(),
      supabase
        .from('pms_config')
        .select('provider, webhook_secret, is_active')
        .eq('property_id', propertyId)
        .maybeSingle(),
      supabase
        .from('hotel_amenities')
        .select('id, category, name, description, availability_hours, location_hint, is_active, sort_order')
        .eq('property_id', propertyId)
        .order('sort_order'),
    ]);

    if (propertyRes.error) {
      return NextResponse.json({ error: propertyRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      property: propertyRes.data,
      branding: brandingRes.data,
      policies: policiesRes.data,
      pms: pmsRes.data,
      amenities: amenitiesRes.data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ── PUT ────────────────────────────────────────────────────────── */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId } = await params;
  const supabase = getSupabaseAdmin();

  try {
    const body = (await request.json()) as UpdateHotelBody;

    // Update basics if any basics field is present
    const basicsFields = ['name', 'city', 'country', 'timezone', 'address', 'region_id', 'booking_url'] as const;
    const hasBasics = basicsFields.some((f) => f in body);
    if (hasBasics) {
      const update: Record<string, unknown> = {};
      if ('name' in body) update.name = body.name;
      if ('city' in body) update.city = body.city;
      if ('country' in body) update.country = body.country;
      if ('timezone' in body) update.timezone = body.timezone;
      if ('address' in body) update.address = body.address;
      if ('region_id' in body) update.region_id = body.region_id;
      if ('booking_url' in body) update.booking_url = body.booking_url;

      const { error } = await supabase
        .from('properties')
        .update(update)
        .eq('id', propertyId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Upsert branding if any branding field is present
    const brandingFields = ['logo_url', 'accent_color', 'hero_image_url', 'welcome_message', 'concierge_name', 'concierge_tone'] as const;
    const hasBranding = brandingFields.some((f) => f in body);
    if (hasBranding) {
      const upsert: Record<string, unknown> = { property_id: propertyId };
      if ('logo_url' in body) upsert.logo_url = body.logo_url;
      if ('accent_color' in body) upsert.accent_color = body.accent_color;
      if ('hero_image_url' in body) upsert.hero_image_url = body.hero_image_url;
      if ('welcome_message' in body) upsert.welcome_message = body.welcome_message;
      if ('concierge_name' in body) upsert.concierge_name = body.concierge_name;
      if ('concierge_tone' in body) upsert.concierge_tone = body.concierge_tone;

      const { error } = await supabase
        .from('hotel_branding')
        .upsert(upsert, { onConflict: 'property_id' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Upsert policies if any policies field is present
    const policiesFields = ['checkin_time', 'checkout_time', 'wifi_name', 'wifi_password', 'cancellation_policy', 'pet_policy', 'smoking_policy'] as const;
    const hasPolicies = policiesFields.some((f) => f in body);
    if (hasPolicies) {
      const upsert: Record<string, unknown> = { property_id: propertyId };
      if ('checkin_time' in body) upsert.checkin_time = body.checkin_time;
      if ('checkout_time' in body) upsert.checkout_time = body.checkout_time;
      if ('wifi_name' in body) upsert.wifi_name = body.wifi_name;
      if ('wifi_password' in body) upsert.wifi_password = body.wifi_password;
      if ('cancellation_policy' in body) upsert.cancellation_policy = body.cancellation_policy;
      if ('pet_policy' in body) upsert.pet_policy = body.pet_policy;
      if ('smoking_policy' in body) upsert.smoking_policy = body.smoking_policy;

      const { error } = await supabase
        .from('hotel_policies')
        .upsert(upsert, { onConflict: 'property_id' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Upsert pms_config if any PMS field is present
    const pmsFields = ['pms_provider', 'webhook_secret', 'pms_is_active'] as const;
    const hasPms = pmsFields.some((f) => f in body);
    if (hasPms) {
      const upsert: Record<string, unknown> = { property_id: propertyId };
      if ('pms_provider' in body) upsert.provider = body.pms_provider;
      if ('webhook_secret' in body) upsert.webhook_secret = body.webhook_secret;
      if ('pms_is_active' in body) upsert.is_active = body.pms_is_active;

      const { error } = await supabase
        .from('pms_config')
        .upsert(upsert, { onConflict: 'property_id' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ── POST (add amenity) ─────────────────────────────────────────── */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId } = await params;
  const supabase = getSupabaseAdmin();

  try {
    const body = (await request.json()) as AddAmenityBody;

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('hotel_amenities')
      .insert({
        property_id: propertyId,
        category: body.category ?? 'General',
        name: body.name,
        description: body.description ?? null,
        availability_hours: body.availability_hours ?? null,
        location_hint: body.location_hint ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, amenity: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
