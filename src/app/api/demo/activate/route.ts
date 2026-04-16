/**
 * POST /api/demo/activate
 *
 * Demo-only route that simulates a PMS webhook booking confirmation.
 * Allows buyers to experience the full PMS → AI curation pipeline live
 * without a real hotel PMS connected.
 *
 * Accepts: { booking_id: string, user_id: string }
 * - Looks up the demo booking payload for the given booking_id
 * - Fills in the authenticated user's email and name from the DB
 * - Calls processWebhookBooking() directly (bypasses X-PMS-API-Key requirement)
 * - Fires curateStay() asynchronously (fire-and-forget, same as the real webhook)
 * - Returns { stay_id, property_id, booking_reference, curation_triggered }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhookBooking } from '@/lib/supabase/pms-repository';
import { getCustomerProfile } from '@/lib/supabase/customer-repository';
import { curateStay } from '@/lib/services/ai/stay-curation';
import { getDemoBookingPayload } from '@/lib/data/demo-bookings';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { CustomerProfile } from '@/types/customer';

async function ensureUserProfileExists(authUserId: string): Promise<CustomerProfile | null> {
  const existingProfile = await getCustomerProfile(authUserId);
  if (existingProfile) return existingProfile;

  const supabase = getSupabaseAdmin();
  const { data: authData } = await supabase.auth.admin.getUserById(authUserId);
  const authUser = authData?.user;

  if (!authUser?.email) return null;

  const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const metadataFirstName =
    typeof metadata.first_name === 'string' ? metadata.first_name : null;
  const metadataLastName =
    typeof metadata.last_name === 'string' ? metadata.last_name : null;
  const metadataFullName =
    typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  const fullNameParts = metadataFullName ? metadataFullName.split(/\s+/) : [];
  const firstName = metadataFirstName ?? fullNameParts[0] ?? null;
  const lastName =
    metadataLastName ?? (fullNameParts.length > 1 ? fullNameParts.slice(1).join(' ') : null);

  const { data: byEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', authUser.email)
    .maybeSingle();

  if (!byEmail) {
    const { error } = await supabase.from('users').insert({
      id: authUserId,
      email: authUser.email,
      firstname: firstName,
      lastname: lastName,
      phone: null,
    });

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  return getCustomerProfile(authUserId);
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as { booking_id?: string; user_id?: string };

    if (!body.booking_id || !body.user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, user_id' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Fetch the authenticated user's profile to get name details
    const profile = await ensureUserProfileExists(body.user_id);
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: rateLimit.headers },
      );
    }

    // Split full_name into first and last
    const trimmedName = (profile.full_name ?? '').trim();
    const nameParts = trimmedName ? trimmedName.split(/\s+/) : [];
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Resolve demo payload
    const payload = getDemoBookingPayload(body.booking_id, {
      email: profile.email,
      firstName,
      lastName,
    });

    if (!payload) {
      return NextResponse.json(
        { error: `Unknown demo booking ID: ${body.booking_id}` },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Run the real webhook pipeline
    const result = await processWebhookBooking(payload, body.user_id);

    // Fire curation asynchronously (same pattern as /api/pms/webhook)
    if (result.region_id && !result.stay_existed) {
      void curateStay(result.stay_id).then(
        (curation) => {
          console.log(
            '[demo/activate] Curation completed for stay:',
            result.stay_id,
            curation.curations_created,
            'curations created',
          );
        },
        (err: unknown) => {
          console.error('[demo/activate] Curation failed for stay:', result.stay_id, err);
        },
      );
    }

    const isDuplicate = !!result.stay_existed;
    const status = isDuplicate ? 200 : 201;
    const message = isDuplicate
      ? 'This stay already exists — opening your existing stay details'
      : 'Demo booking activated successfully';

    return NextResponse.json(
      {
        data: {
          ...result,
          message,
          curation_triggered: !!result.region_id && !isDuplicate,
          redirect_stay_id: result.stay_id,
        },
      },
      { status, headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
