/**
 * GET /api/discovery/places
 *
 * Returns places from Supabase shaped for the Stayscape Discover
 * experience. Supports filtering by region, category, tags, featured
 * status, and search term.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { queryPlaces, getPlaceTags, toDiscoveryCard } from '@/lib/supabase';
import type { PlaceCategory } from '@/types/database';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const requestedLimit = Number.parseInt(searchParams.get('limit') ?? '10', 10);
  const requestedOffset = Number.parseInt(searchParams.get('offset') ?? '0', 10);
  const params = {
    region_id: searchParams.get('region_id') ?? undefined,
    category: (searchParams.get('category') as PlaceCategory) ?? undefined,
    featured_only: searchParams.get('featured') === 'true',
    search: searchParams.get('search') ?? undefined,
    limit: Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 10,
    offset: Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0,
  };

  try {
    const places = await queryPlaces(supabase, params);

    // Fetch tags for each place and shape for frontend
    const cards = await Promise.all(
      places.map(async (place) => {
        const tags = await getPlaceTags(supabase, place.id);
        return toDiscoveryCard(place, tags);
      }),
    );

    return NextResponse.json({ data: cards, count: cards.length }, { headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
