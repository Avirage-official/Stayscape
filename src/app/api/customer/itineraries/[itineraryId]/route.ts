/**
 * GET    /api/customer/itineraries/[itineraryId]
 * PATCH  /api/customer/itineraries/[itineraryId]
 * DELETE /api/customer/itineraries/[itineraryId]
 *
 * Single itinerary operations. Ownership is enforced — users can only
 * access their own itineraries. Accepts a Supabase JWT via Authorization: Bearer <token>.
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
import {
  getItineraryById,
  updateItineraryTitle,
  deleteStandaloneItinerary,
  fetchItineraryItemsByItineraryId,
} from '@/lib/supabase/itinerary-repository';

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

  try {
    const itinerary = await getItineraryById(itineraryId, user.id);
    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
    }

    const items = await fetchItineraryItemsByItineraryId(itinerary.id);

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
    const existing = await getItineraryById(itineraryId, user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
    }

    const ok = await updateItineraryTitle(itineraryId, user.id, title);
    if (!ok) {
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

  try {
    const result = await deleteStandaloneItinerary(itineraryId, user.id);

    if (result === 'not_found') {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404, headers: rateLimit.headers });
    }
    if (result === 'stay_linked') {
      return NextResponse.json({ error: 'Cannot delete a stay-linked itinerary' }, { status: 403, headers: rateLimit.headers });
    }
    if (result === 'error') {
      return NextResponse.json({ error: 'Failed to delete itinerary' }, { status: 500, headers: rateLimit.headers });
    }

    return NextResponse.json({ success: true }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[DELETE /api/customer/itineraries/[itineraryId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
