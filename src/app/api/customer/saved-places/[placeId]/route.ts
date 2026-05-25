/**
 * DELETE /api/customer/saved-places/[placeId]
 *
 * Remove a place from the user's saved wishlist.
 * Accepts a Supabase JWT via Authorization: Bearer <token>.
 *
 * Returns:
 *   200 { success: true }
 *   401 { error: 'Unauthorized' }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';
import { unsavePlace } from '@/lib/supabase/saved-places-repository';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  const { placeId } = await params;
  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400, headers: rateLimit.headers });
  }

  try {
    const ok = await unsavePlace(user.id, placeId);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to remove saved place' }, { status: 500, headers: rateLimit.headers });
    }
    return NextResponse.json({ success: true }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[DELETE /api/customer/saved-places/[placeId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
