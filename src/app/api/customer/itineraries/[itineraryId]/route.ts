/**
 * GET    /api/customer/itineraries/[itineraryId]
 * PATCH  /api/customer/itineraries/[itineraryId]
 * DELETE /api/customer/itineraries/[itineraryId]
 *
 * Single itinerary operations. Ownership is enforced — users can only
 * access their own itineraries. Accepts a Supabase JWT via Authorization: Bearer <token>.
 * All DB access uses getSupabaseAdmin() so it works server-side (bypasses RLS).
 *
 * GET Returns:
 *   200 { itinerary: DbItineraryListed, items: DbItineraryItemEnriched[] }
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'Itinerary not found' }
 *
 * PATCH Body: { title: string }
 * PATCH Returns:
 *   200 { success: true }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'Itinerary not found' }
 *
 * DELETE Returns:
 *   200 { success: true }
 *   401 { error: 'Unauthorized' }
 *   403 { error: 'Cannot delete a stay-linked itinerary' }
 *   404 { error: 'Itinerary not found' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  const { itineraryId } = await params;
  const sb = getSupabaseAdmin();

  try {
    const { data: itinerary, error: itinError } = await sb
      .from('itineraries')
      .select(`
        id, stayid, userid, title, status, startdate, enddate, createdat, updatedat,
        stays ( checkindate, checkoutdate, properties ( name ) )
      `)
      .eq('id', itineraryId)
      .eq('userid', user.id)
      .maybeSingle();

    if (itinError || !itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
    }

    const { data: items } = await sb
      .from('itineraryitems')
      .select(`
        *,
        places ( id, name, category, latitude, longitude, image_url )
      `)
      .eq('itineraryid', itineraryId)
      .order('scheduleddate', { ascending: true })
      .order('starttime', { ascending: true });

    return NextResponse.json({ itinerary, items: items ?? [] }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[GET /api/customer/itineraries/[itineraryId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  const { itineraryId } = await params;
  const sb = getSupabaseAdmin();

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: rateLimit.headers });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : undefined;
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400, headers: rateLimit.headers });
  }
  if (title.length > 100) {
    return NextResponse.json({ error: 'title must be 100 characters or fewer' }, { status: 400, headers: rateLimit.headers });
  }

  try {
    const { data: existing } = await sb
      .from('itineraries')
      .select('id')
      .eq('id', itineraryId)
      .eq('userid', user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
    }

    const { error: updateError } = await sb
      .from('itineraries')
      .update({ title, updatedat: new Date().toISOString() })
      .eq('id', itineraryId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update itinerary' }, { status: 500, headers: rateLimit.headers });
    }

    return NextResponse.json({ success: true }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[PATCH /api/customer/itineraries/[itineraryId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  const { itineraryId } = await params;
  const sb = getSupabaseAdmin();

  try {
    const { data: itin } = await sb
      .from('itineraries')
      .select('id, stayid')
      .eq('id', itineraryId)
      .eq('userid', user.id)
      .maybeSingle();

    if (!itin) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
    }
    if (itin.stayid !== null) {
      return NextResponse.json({ error: 'Cannot delete a stay-linked itinerary' }, { status: 403, headers: rateLimit.headers });
    }

    await sb.from('itineraryitems').delete().eq('itineraryid', itineraryId);

    const { error: delError } = await sb.from('itineraries').delete().eq('id', itineraryId);
    if (delError) {
      return NextResponse.json({ error: 'Failed to delete itinerary' }, { status: 500, headers: rateLimit.headers });
    }

    return NextResponse.json({ success: true }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[DELETE /api/customer/itineraries/[itineraryId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
