/**
 * POST /api/admin/hotels
 *
 * Creates a new hotel (property) along with its branding, policies, and PMS config.
 * Auth: requires `sa_session` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface CreateHotelBody {
  // Step 1 — basics
  name: string;
  city: string;
  country: string;
  timezone?: string;
  address?: string | null;
  region_id?: string | null;
  booking_url?: string | null;

  // Step 2 — branding
  logo_url?: string | null;
  accent_color?: string;
  hero_image_url?: string | null;
  welcome_message?: string | null;
  concierge_name?: string;
  concierge_tone?: string;

  // Step 3 — policies
  checkin_time?: string | null;
  checkout_time?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  cancellation_policy?: string | null;
  pet_policy?: string | null;
  smoking_policy?: string | null;

  // Step 4 — PMS
  pms_provider?: string;
  webhook_secret?: string | null;
  pms_is_active?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .split('-')
    .filter(Boolean)
    .join('-');
}

export async function POST(request: NextRequest) {
  const saSession = request.cookies.get('sa_session');
  if (!saSession?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateHotelBody;

    if (!body.name || !body.city || !body.country) {
      return NextResponse.json(
        { error: 'Missing required fields: name, city, country' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const slug = generateSlug(body.name);

    // Step 1: Insert into properties
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert({
        name: body.name,
        slug,
        city: body.city,
        country: body.country,
        timezone: body.timezone ?? 'UTC',
        address: body.address ?? null,
        region_id: body.region_id ?? null,
        booking_url: body.booking_url ?? null,
      })
      .select('id')
      .single();

    if (propertyError || !propertyData) {
      const message = propertyError?.message ?? 'Failed to create property';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const propertyId = (propertyData as { id: string }).id;

    // Step 2: Insert into hotel_branding
    const { error: brandingError } = await supabase.from('hotel_branding').insert({
      property_id: propertyId,
      logo_url: body.logo_url ?? null,
      accent_color: body.accent_color ?? '#C9A96E',
      hero_image_url: body.hero_image_url ?? null,
      welcome_message: body.welcome_message ?? null,
      concierge_name: body.concierge_name ?? 'Aria',
      concierge_tone: body.concierge_tone ?? 'warm',
    });

    if (brandingError) {
      return NextResponse.json({ error: brandingError.message }, { status: 500 });
    }

    // Step 3: Insert into hotel_policies
    const { error: policiesError } = await supabase.from('hotel_policies').insert({
      property_id: propertyId,
      checkin_time: body.checkin_time ?? null,
      checkout_time: body.checkout_time ?? null,
      wifi_name: body.wifi_name ?? null,
      wifi_password: body.wifi_password ?? null,
      cancellation_policy: body.cancellation_policy ?? null,
      pet_policy: body.pet_policy ?? null,
      smoking_policy: body.smoking_policy ?? null,
    });

    if (policiesError) {
      return NextResponse.json({ error: policiesError.message }, { status: 500 });
    }

    // Step 4: Insert into pms_config
    const { error: pmsError } = await supabase.from('pms_config').insert({
      property_id: propertyId,
      provider: body.pms_provider ?? 'manual',
      webhook_secret: body.webhook_secret ?? null,
      is_active: body.pms_is_active ?? false,
    });

    if (pmsError) {
      return NextResponse.json({ error: pmsError.message }, { status: 500 });
    }

    return NextResponse.json({ propertyId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
