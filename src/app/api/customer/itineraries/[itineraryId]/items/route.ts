/**
 * POST /api/customer/itineraries/[itineraryId]/items
 *
 * Add an item to a standalone itinerary owned by the authenticated user.
 * Uses the service-role key so RLS/FK issues cannot block the write.
 *
 * Body: {
 *   place_id:      string | null
 *   name:          string
 *   category?:     string | null
 *   image?:        string | null
 *   scheduleddate: string        -- 'YYYY-MM-DD'
 *   starttime:     string        -- 'HH:mm'
 *   durationhours: number
 * }
 *
 * Returns:
 *   201 { id: string }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 *   403 { error: 'Not your itinerary' }
 *   500 { error: string }
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

export async function POST(
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

  // Verify ownership
  const { data: itin, error: itinErr } = await sb
    .from('itineraries')
    .select('id, userid')
    .eq('id', itineraryId)
    .maybeSingle();

  if (itinErr || !itin) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
  }
  if (itin.userid !== user.id) {
    return NextResponse.json({ error: 'Not your itinerary' }, { status: 403, headers: rateLimit.headers });
  }

  let body: {
    place_id?: string | null;
    name?: string;
    category?: string | null;
    image?: string | null;
    scheduleddate?: string;
    starttime?: string;
    durationhours?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: rateLimit.headers });
  }

  const { place_id = null, name, category = null, image = null, scheduleddate, starttime, durationhours } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400, headers: rateLimit.headers });
  }
  if (!scheduleddate || typeof scheduleddate !== 'string') {
    return NextResponse.json({ error: 'scheduleddate is required' }, { status: 400, headers: rateLimit.headers });
  }
  if (!starttime || typeof starttime !== 'string') {
    return NextResponse.json({ error: 'starttime is required' }, { status: 400, headers: rateLimit.headers });
  }
  if (typeof durationhours !== 'number') {
    return NextResponse.json({ error: 'durationhours is required' }, { status: 400, headers: rateLimit.headers });
  }

  try {
    const { data, error } = await sb
      .from('itineraryitems')
      .insert({
        itineraryid: itineraryId,
        place_id: place_id ?? null,
        titleoverride: null,
        scheduleddate,
        starttime,
        durationhours,
        name,
        category,
        image,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[POST /api/customer/itineraries/[itineraryId]/items]', error?.message);
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500, headers: rateLimit.headers });
    }

    return NextResponse.json({ id: data.id }, { status: 201, headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[POST /api/customer/itineraries/[itineraryId]/items]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
