/**
 * PATCH  /api/customer/itineraries/[itineraryId]/items/[itemId]
 * DELETE /api/customer/itineraries/[itineraryId]/items/[itemId]
 *
 * Update or remove a single itinerary item.
 * Ownership enforced via the parent itinerary's userid.
 * Accepts a Supabase JWT via Authorization: Bearer <token>.
 *
 * PATCH Body (all fields optional):
 *   {
 *     scheduleddate?: string   // 'YYYY-MM-DD'
 *     starttime?: string       // 'HH:mm'
 *     durationhours?: number
 *     notes?: string
 *   }
 * PATCH Returns:
 *   200 { success: true }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'Item not found' }
 *
 * DELETE Returns:
 *   200 { success: true }
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'Item not found' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';
import {
  getItineraryById,
  updateItineraryItem,
  removeItineraryItem,
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

/** Verify the item belongs to this itinerary (and itinerary belongs to user). */
async function verifyItemOwnership(
  itineraryId: string,
  itemId: string,
  userId: string,
): Promise<boolean> {
  // Check itinerary ownership
  const itinerary = await getItineraryById(itineraryId, userId);
  if (!itinerary) return false;

  // Check item belongs to this itinerary
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('itineraryitems')
    .select('id')
    .eq('id', itemId)
    .eq('itineraryid', itineraryId)
    .maybeSingle();

  return !!data;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  const { itineraryId, itemId } = await params;

  const owns = await verifyItemOwnership(itineraryId, itemId, user.id);
  if (!owns) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404, headers: rateLimit.headers });
  }

  let body: {
    scheduleddate?: string;
    starttime?: string;
    durationhours?: number;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: rateLimit.headers });
  }

  const updates: Parameters<typeof updateItineraryItem>[1] = {};

  if (body.scheduleddate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.scheduleddate)) {
      return NextResponse.json({ error: 'scheduleddate must be YYYY-MM-DD' }, { status: 400, headers: rateLimit.headers });
    }
    updates.scheduleddate = body.scheduleddate;
  }
  if (body.starttime !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(body.starttime)) {
      return NextResponse.json({ error: 'starttime must be HH:mm' }, { status: 400, headers: rateLimit.headers });
    }
    updates.starttime = body.starttime;
  }
  if (body.durationhours !== undefined) {
    if (typeof body.durationhours !== 'number' || body.durationhours <= 0) {
      return NextResponse.json({ error: 'durationhours must be a positive number' }, { status: 400, headers: rateLimit.headers });
    }
    updates.durationhours = body.durationhours;
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400, headers: rateLimit.headers });
  }

  try {
    const ok = await updateItineraryItem(itemId, updates);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500, headers: rateLimit.headers });
    }
    return NextResponse.json({ success: true }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[PATCH /api/customer/itineraries/[itineraryId]/items/[itemId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimit.headers });
  }

  const { itineraryId, itemId } = await params;

  const owns = await verifyItemOwnership(itineraryId, itemId, user.id);
  if (!owns) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404, headers: rateLimit.headers });
  }

  try {
    const ok = await removeItineraryItem(itemId);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to remove item' }, { status: 500, headers: rateLimit.headers });
    }
    return NextResponse.json({ success: true }, { headers: rateLimit.headers });
  } catch (err: unknown) {
    console.error('[DELETE /api/customer/itineraries/[itineraryId]/items/[itemId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimit.headers });
  }
}
