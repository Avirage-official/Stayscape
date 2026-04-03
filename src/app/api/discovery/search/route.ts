/**
 * GET /api/discovery/search
 *
 * Unified search across places and events.
 * Returns Stayscape-shaped results for the search experience.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  queryPlaces,
  getPlaceTags,
  toDiscoveryCard,
  queryEvents,
  getEventTags,
  toDiscoveryEventCard,
} from '@/lib/supabase';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';

interface SearchResults {
  places: DiscoveryPlaceCard[];
  events: DiscoveryEventCard[];
  total: number;
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q');
  if (!q) {
    return NextResponse.json(
      { error: 'Missing required parameter: q' },
      { status: 400 },
    );
  }

  const type = searchParams.get('type') ?? 'all'; // 'place' | 'event' | 'all'
  const regionId = searchParams.get('region_id') ?? undefined;
  const limit = searchParams.get('limit')
    ? parseInt(searchParams.get('limit')!, 10)
    : 10;

  try {
    const results: SearchResults = { places: [], events: [], total: 0 };

    if (type === 'all' || type === 'place') {
      const places = await queryPlaces(supabase, {
        search: q,
        region_id: regionId,
        limit,
      });
      results.places = await Promise.all(
        places.map(async (p) => {
          const tags = await getPlaceTags(supabase, p.id);
          return toDiscoveryCard(p, tags);
        }),
      );
    }

    if (type === 'all' || type === 'event') {
      const events = await queryEvents(supabase, {
        search: q,
        region_id: regionId,
        limit,
      });
      results.events = await Promise.all(
        events.map(async (e) => {
          const tags = await getEventTags(supabase, e.id);
          return toDiscoveryEventCard(e, tags);
        }),
      );
    }

    results.total = results.places.length + results.events.length;
    return NextResponse.json({ data: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
