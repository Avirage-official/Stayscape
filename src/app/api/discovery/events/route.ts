/**
 * GET /api/discovery/events
 *
 * Returns events from Supabase shaped for the Stayscape discovery
 * experience. Supports filtering by region, category, date range,
 * featured status, and search term.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { queryEvents, getEventTags, toDiscoveryEventCard } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const params = {
    region_id: searchParams.get('region_id') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    date_from: searchParams.get('date_from') ?? undefined,
    date_to: searchParams.get('date_to') ?? undefined,
    featured_only: searchParams.get('featured') === 'true',
    search: searchParams.get('search') ?? undefined,
    limit: searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 20,
    offset: searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : 0,
  };

  try {
    const events = await queryEvents(supabase, params);

    const cards = await Promise.all(
      events.map(async (event) => {
        const tags = await getEventTags(supabase, event.id);
        return toDiscoveryEventCard(event, tags);
      }),
    );

    return NextResponse.json({ data: cards, count: cards.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
