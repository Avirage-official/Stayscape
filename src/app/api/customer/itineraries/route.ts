/**
 * GET  /api/customer/itineraries
 * POST /api/customer/itineraries
 *
 * List and create standalone itineraries for the authenticated user.
 * Returns both stay-linked and standalone itineraries in the GET response.
 * Accepts a Supabase JWT via Authorization: Bearer <token>.
 *
 * GET Returns:
 *   200 { itineraries: DbItineraryListed[] }
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
import {
  listUserItineraries,
  createStandaloneItinerary,
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
    const itineraries = await listUserItineraries(user.id);
    if (itineraries === null) {
      return NextResponse.json({ error: 'Failed to fetch itineraries' }, { status: 500, headers: rateLimit.headers });
    }
    return NextResponse.json({ itineraries }, { headers: rateLimit.headers });
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

  let body: { title?: string } = {};
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

  try {
    const id = await createStandaloneItinerary(user.id, title);
    if (!id) {
      return NextResponse.json({ error: 'Failed to create itinerary' }, { status: 500, headers: rateLimit.headers });
    }
    return NextResponse.json({ id }, { status: 201, headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[POST /api/customer/itineraries]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
