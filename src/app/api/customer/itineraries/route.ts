/**
 * GET  /api/customer/itineraries
 * POST /api/customer/itineraries
 *
 * List and create standalone itineraries for the authenticated user.
 * Returns both stay-linked and standalone itineraries in the GET response.
 * Accepts a Supabase JWT via Authorization: Bearer <token>.
 *
 * Both handlers use getSupabaseAdmin() directly so they work correctly
 * from a server-side context (no browser session / cookie available).
 *
 * GET Returns:
 *   200 { itineraries: DbItineraryListed[] }  — each row includes cover_image (first item image or null)
 *   401 { error: 'Unauthorized' }
 *
 * POST Body: { title?: string }
 * POST Returns:
 *   201 { id: string }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
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

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  try {
    const sb = getSupabaseAdmin();

    // Fetch itineraries with stay context
    const { data, error } = await sb
      .from('itineraries')
      .select(`
        id, stayid, userid, title, status, startdate, enddate, createdat, updatedat,
        stays ( checkindate, checkoutdate, properties ( name ) )
      `)
      .eq('userid', user.id)
      .order('updatedat', { ascending: false });

    if (error) {
      console.error('[GET /api/customer/itineraries]', error.message);
      return NextResponse.json({ error: 'Failed to fetch itineraries' }, { status: 500, headers: rateLimit.headers });
    }

    const itineraries = data ?? [];

    // For each itinerary, fetch the first item's image (cover image)
    // Done in parallel — one query per itinerary, ordered by createdat ASC
    const coverImages = await Promise.all(
      itineraries.map(async (itin) => {
        const { data: items } = await sb
          .from('itineraryitems')
          .select('image, places ( image_url )')
          .eq('itineraryid', itin.id)
          .order('createdat', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!items) return null;
        // Prefer the cached image column; fall back to joined place image_url
        const img = (items as { image?: string | null; places?: { image_url?: string | null } | null });
        return img.image ?? img.places?.image_url ?? null;
      })
    );

    const enriched = itineraries.map((itin, i) => ({
      ...itin,
      cover_image: coverImages[i] ?? null,
    }));

    return NextResponse.json({ itineraries: enriched }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[GET /api/customer/itineraries]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  let body: { title?: string; startdate?: string; enddate?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — empty POST creates an untitled itinerary
  }

  const title = typeof body.title === 'string' ? body.title.trim() : undefined;
  if (title !== undefined && title.length === 0) {
    return NextResponse.json({ error: 'title cannot be empty' }, { status: 400, headers: rateLimit.headers });
  }
  if (title !== undefined && title.length > 100) {
    return NextResponse.json({ error: 'title must be 100 characters or fewer' }, { status: 400, headers: rateLimit.headers });
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const startdate = typeof body.startdate === 'string' && dateRe.test(body.startdate) ? body.startdate : null;
  const enddate   = typeof body.enddate   === 'string' && dateRe.test(body.enddate)   ? body.enddate   : null;

  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('itineraries')
      .insert({ userid: user.id, stayid: null, title: title ?? null })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[POST /api/customer/itineraries]', error?.message);
      return NextResponse.json({ error: 'Failed to create itinerary' }, { status: 500, headers: rateLimit.headers });
    }

    if (startdate || enddate) {
      const { error: dateErr } = await sb
        .from('itineraries')
        .update({ startdate, enddate })
        .eq('id', data.id);
      if (dateErr) {
        console.warn('[POST /api/customer/itineraries] date columns not yet migrated:', dateErr.message);
      }
    }

    return NextResponse.json({ id: data.id }, { status: 201, headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[POST /api/customer/itineraries]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
