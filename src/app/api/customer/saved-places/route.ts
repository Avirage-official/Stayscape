/**
 * GET  /api/customer/saved-places
 * POST /api/customer/saved-places
 *
 * User's saved place wishlist — places they want to visit but haven't
 * scheduled yet. Accepts a Supabase JWT via Authorization: Bearer <token>.
 *
 * GET Returns:
 *   200 { saved_places: DbSavedPlaceEnriched[] }
 *   401 { error: 'Unauthorized' }
 *
 * POST Body: { place_id: string }
 * POST Returns:
 *   201 { id: string }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSavedPlaces, savePlace } from '@/lib/supabase/saved-places-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

  try {
    const saved_places = await getSavedPlaces(user.id);
    if (saved_places === null) {
      return NextResponse.json({ error: 'Failed to fetch saved places' }, { status: 500, headers: rateLimit.headers });
    }
    return NextResponse.json({ saved_places }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[GET /api/customer/saved-places]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}

export async function POST(request: NextRequest) {
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

  let body: { place_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: rateLimit.headers });
  }

  const { place_id } = body;
  if (!place_id || typeof place_id !== 'string') {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400, headers: rateLimit.headers });
  }

  try {
    const id = await savePlace(user.id, place_id);
    if (!id) {
      return NextResponse.json({ error: 'Failed to save place' }, { status: 500, headers: rateLimit.headers });
    }
    return NextResponse.json({ id }, { status: 201, headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[POST /api/customer/saved-places]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
