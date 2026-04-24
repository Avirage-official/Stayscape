import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { getCustomerProfile } from '@/lib/supabase/customer-repository';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { curateStay } from '@/lib/services/ai/stay-curation';

/**
 * POST /api/customer/stays/activate
 *
 * Called when the guest enters their booking reference in the app.
 * Looks up the pre-registered stay by booking reference, verifies the
 * guest_email matches the logged-in user, links the stay to that user,
 * then triggers AI curation (fire-and-forget).
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

    // Step 1 — Get the logged-in user's profile
    const profile = await getCustomerProfile(body.user_id);
    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: rateLimit.headers },
      );
    }

    const supabase = getSupabaseAdmin();

    // Step 2 — Look up stay by booking reference
    const { data: stay, error: stayError } = await supabase
      .from('stays')
      .select('id, userid, guest_email')
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

    const stayRow = stay as { id: string; userid: string | null; guest_email: string | null };

    // Step 3 — Verify guest_email matches the logged-in user's email
    if (!stayRow.guest_email || stayRow.guest_email.toLowerCase() !== profile.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This booking reference does not match your account' },
        { status: 403, headers: rateLimit.headers },
      );
    }

    // Step 4 — Link stay to this user
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

    // Step 5 — Trigger curation (fire-and-forget)
    waitUntil(
      curateStay(stayRow.id).then(
        (result) => console.log('[activate] Curation completed:', result.curations_created),
        (err) => console.error('[activate] Curation failed:', err),
      ),
    );

    // Step 6 — Return
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
