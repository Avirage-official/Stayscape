/**
 * POST /api/customer/itineraries/[itineraryId]/items
 *
 * Add a place to a standalone or stay-linked itinerary.
 * Ownership is enforced — users can only modify their own itineraries.
 * Accepts a Supabase JWT via Authorization: Bearer <token>.
 *
 * POST Body:
 *   {
 *     place_id: string          // UUID of the place (required)
 *     scheduleddate: string     // 'YYYY-MM-DD' (required)
 *     starttime?: string        // 'HH:mm' (optional, defaults to '09:00')
 *     durationhours?: number    // optional, defaults to 1
 *     titleoverride?: string    // optional display name override
 *     notes?: string            // optional notes
 *   }
 *
 * POST Returns:
 *   201 { id: string }           — new item id
 *   400 { error: string }        — validation error
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'Itinerary not found' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';
import { getItineraryById, insertItineraryItem } from '@/lib/supabase/itinerary-repository';

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

  // Verify ownership
  const itinerary = await getItineraryById(itineraryId, user.id);
  if (!itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
  }

  let body: {
    place_id?: string;
    scheduleddate?: string;
    starttime?: string;
    durationhours?: number;
    titleoverride?: string;
    notes?: string;
    name?: string;
    category?: string;
    image?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: rateLimit.headers });
  }

  const { place_id, scheduleddate, starttime, durationhours, titleoverride, notes, name, category, image } = body;

  if (!place_id || typeof place_id !== 'string') {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400, headers: rateLimit.headers });
  }
  if (!scheduleddate || !/^\d{4}-\d{2}-\d{2}$/.test(scheduleddate)) {
    return NextResponse.json({ error: 'scheduleddate is required and must be YYYY-MM-DD' }, { status: 400, headers: rateLimit.headers });
  }

  try {
    const id = await insertItineraryItem(itineraryId, {
      place_id,
      scheduleddate,
      starttime: starttime ?? '09:00',
      durationhours: durationhours ?? 1,
      titleoverride: titleoverride ?? null,
      name: name ?? null,
      category: category ?? null,
      image: image ?? null,
    });

    if (!id) {
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500, headers: rateLimit.headers });
    }

    // If notes provided, update after insert (insertItineraryItem does not accept notes)
    if (notes) {
      const { getSupabaseAdmin: admin } = await import('@/lib/supabase/client');
      await admin().from('itineraryitems').update({ notes }).eq('id', id);
    }

    return NextResponse.json({ id }, { status: 201, headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[POST /api/customer/itineraries/[itineraryId]/items]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
