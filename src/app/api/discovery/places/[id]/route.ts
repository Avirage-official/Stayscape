/**
 * GET /api/discovery/places/:id
 *
 * Returns full place detail shaped for the Stayscape detail view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { getPlaceById, getPlaceTags, toDiscoveryDetail } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  }

  try {
    const place = await getPlaceById(supabase, id);
    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const tags = await getPlaceTags(supabase, place.id);
    const detail = toDiscoveryDetail(place, tags);

    return NextResponse.json({ data: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
