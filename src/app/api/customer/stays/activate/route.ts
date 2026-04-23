import { NextRequest, NextResponse } from 'next/server';
import { getCustomerProfile } from '@/lib/supabase/customer-repository';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/customer/stays/activate
 *
 * Looks up an existing stay by booking reference and links it to the
 * logged-in user if their email matches the guest email on the booking.
 *
 * Accepts: { booking_reference, user_id }
 * Returns: { data: { stay_id, redirect_stay_id } }
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
      booking_reference?: string;
      user_id?: string;
    };

    if (!body.booking_reference || !body.user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_reference, user_id' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const bookingRef = body.booking_reference.trim();

    // Get the logged-in user's profile to verify their email
    const profile = await getCustomerProfile(body.user_id);
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: rateLimit.headers },
      );
    }

    const supabase = getSupabaseAdmin();

    // Look up the stay by booking reference, joining user info for email check
    const { data: stay, error: stayError } = await supabase
      .from('stays')
      .select('id, userid, users:userid(email)')
      .eq('booking_reference', bookingRef)
      .maybeSingle();

    if (stayError) {
      console.error('[customer/stays/activate] DB error:', stayError.message);
      return NextResponse.json(
        { error: 'Failed to look up booking reference' },
        { status: 500, headers: rateLimit.headers },
      );
    }

    if (!stay) {
      return NextResponse.json(
        { error: 'Booking reference not found' },
        { status: 404, headers: rateLimit.headers },
      );
    }

    const stayRow = stay as { id: string; userid: string | null; users: { email?: string | null } | null };
    const guestEmail = stayRow.users?.email ?? null;

    // Verify the booking's guest email matches the logged-in user's email
    if (!guestEmail || guestEmail.toLowerCase() !== profile.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This booking reference does not match your account' },
        { status: 403, headers: rateLimit.headers },
      );
    }

    // Link the stay to this user if not already linked
    if (stayRow.userid !== profile.id) {
      const { error: updateError } = await supabase
        .from('stays')
        .update({ userid: profile.id })
        .eq('id', stayRow.id);

      if (updateError) {
        console.error('[customer/stays/activate] Update error:', updateError.message);
        return NextResponse.json(
          { error: 'Failed to activate stay' },
          { status: 500, headers: rateLimit.headers },
        );
      }
    }

    return NextResponse.json(
      {
        data: {
          stay_id: stayRow.id,
          redirect_stay_id: stayRow.id,
        },
      },
      { status: 200, headers: rateLimit.headers },
    );
  } catch (error) {
    console.error('[customer/stays/activate] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to activate stay' },
      { status: 500 },
    );
  }
}
