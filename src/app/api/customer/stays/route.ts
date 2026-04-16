import { NextRequest, NextResponse } from 'next/server';
import { processWebhookBooking } from '@/lib/supabase/pms-repository';
import { getCustomerProfile } from '@/lib/supabase/customer-repository';
import { curateStay } from '@/lib/services/ai/stay-curation';
import { applyRateLimit } from '@/lib/rate-limit';
import type { PmsBookingPayload } from '@/types/pms';

/**
 * POST /api/customer/stays
 *
 * Creates a stay from manual entry form data.
 * Reuses the same processWebhookBooking pipeline (user upsert, property
 * upsert, region matching, stay creation) so manual entries get full
 * AI curation just like PMS-sourced bookings.
 *
 * Accepts: { user_id, country, city, hotel_name, check_in, check_out,
 *            guests?, trip_type?, room_type?, booking_reference?, notes?,
 *            contact_email?, contact_phone? }
 */
export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as {
      user_id?: string;
      country?: string;
      city?: string;
      hotel_name?: string;
      check_in?: string;
      check_out?: string;
      guests?: number;
      trip_type?: string;
      room_type?: string;
      booking_reference?: string;
      notes?: string;
      contact_email?: string;
      contact_phone?: string;
    };

    // Validate required fields
    if (!body.user_id || !body.country || !body.city || !body.hotel_name || !body.check_in || !body.check_out) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, country, city, hotel_name, check_in, check_out' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Validate dates
    if (body.check_out <= body.check_in) {
      return NextResponse.json(
        { error: 'check_out must be after check_in' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Get user profile for guest info
    const profile = await getCustomerProfile(body.user_id);
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: rateLimit.headers },
      );
    }

    const nameParts = (profile.full_name ?? '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Build a PMS-compatible payload from the manual form data
    const pmsPropertyId = `manual-${crypto.randomUUID()}`;
    const bookingRef = body.booking_reference || `MANUAL-${crypto.randomUUID()}`;

    const payload: PmsBookingPayload = {
      booking_reference: bookingRef,
      guest: {
        email: profile.email,
        first_name: firstName,
        last_name: lastName,
        phone: body.contact_phone ?? undefined,
      },
      property: {
        pms_property_id: pmsPropertyId,
        name: body.hotel_name,
        city: body.city,
        country: body.country,
      },
      check_in: body.check_in,
      check_out: body.check_out,
      status: 'confirmed',
      room_type: body.room_type ?? undefined,
      guests: body.guests ?? undefined,
      trip_type: body.trip_type ?? undefined,
      notes: body.notes ?? undefined,
    };

    // Run the same pipeline as a PMS webhook
    const result = await processWebhookBooking(payload, body.user_id);

    // Fire curation asynchronously if region was found
    if (result.region_id && !result.stay_existed) {
      void curateStay(result.stay_id).then(
        (curation) => {
          console.log(
            '[customer/stays] Curation completed for stay:',
            result.stay_id,
            curation.curations_created,
            'curations created',
          );
        },
        (err: unknown) => {
          console.error('[customer/stays] Curation failed for stay:', result.stay_id, err);
        },
      );
    }

    return NextResponse.json(
      {
        data: {
          ...result,
          message: 'Stay created successfully',
          curation_triggered: !!result.region_id,
        },
      },
      { status: 201, headers: rateLimit.headers },
    );
  } catch (error) {
    console.error('[customer/stays] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create stay' },
      { status: 500 },
    );
  }
}
