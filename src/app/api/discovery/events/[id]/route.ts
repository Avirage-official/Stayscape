/**
 * GET /api/discovery/events/:id
 *
 * Returns full event detail shaped for the Stayscape detail view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { getEventById, getEventTags, toDiscoveryEventDetail } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const { id } = await params;
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  }

  try {
    const event = await getEventById(supabase, id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const tags = await getEventTags(supabase, event.id);
    const detail = toDiscoveryEventDetail(event, tags);

    return NextResponse.json({ data: detail }, { headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
