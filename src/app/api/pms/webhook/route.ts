/**
 * POST /api/pms/webhook
 *
 * Called by the admin simulate page to pre-register a booking.
 * Creates/upserts the property and stay shell (no guest user created).
 * Curation is triggered later from the activate route when the guest links
 * their account.
 *
 * Authentication: API key via X-PMS-API-Key header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhookBooking } from '@/lib/supabase/pms-repository';
import { createRegionForProperty, seedPlacesForRegion } from '@/lib/services/ai/region-creation';
import type { PmsBookingPayload } from '@/types/pms';
import { applyRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    // Validate API key
    const apiKey = request.headers.get('x-pms-api-key');
    const expectedKey = process.env.PMS_WEBHOOK_API_KEY;

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'PMS webhook not configured' },
        { status: 503, headers: rateLimit.headers },
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: rateLimit.headers },
      );
    }

    // Parse and validate payload
    const body = (await request.json()) as PmsBookingPayload;

    if (!body.booking_reference || !body.guest?.email || !body.property?.pms_property_id) {
      return NextResponse.json(
        {
          error: 'Missing required fields: booking_reference, guest.email, property.pms_property_id',
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (!body.check_in || !body.check_out) {
      return NextResponse.json(
        { error: 'Missing required fields: check_in, check_out' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Process the webhook — pre-registers the booking without creating a guest user
    const result = await processWebhookBooking(body);

    // If no region was matched, create one synchronously (admin action, not time-sensitive)
    if (result.region_id === null && result.property_id) {
      const city = body.property.city ?? null;
      const country = body.property.country ?? null;
      const propertyId = result.property_id;

      console.log(
        '[pms webhook] No region — creating region + seeding places for property:',
        propertyId,
      );

      try {
        const newRegionId = await createRegionForProperty(propertyId);
        if (newRegionId && city && country) {
          await seedPlacesForRegion(newRegionId, city, country);
        }
        result.region_id = newRegionId;
      } catch (err) {
        console.error('[pms webhook] Region creation / seeding failed:', err);
      }
    }

    return NextResponse.json(
      {
        data: {
          booking_reference: result.booking_reference,
          guest_email: result.guest_email,
          property_id: result.property_id,
          stay_id: result.stay_id,
          region_id: result.region_id,
          message: 'Booking pre-registered successfully',
        },
      },
      { status: 201, headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
