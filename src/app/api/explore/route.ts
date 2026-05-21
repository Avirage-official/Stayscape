/**
 * GET /api/explore
 *
 * Returns 4 personalised sections for the Explore dashboard page.
 * Uses existing repository helpers — no new DB queries written here.
 *
 * Sections:
 *   1. vibe        — featured place matching user vibes (hero card)
 *   2. yours       — places from user's most recent stay region
 *   3. events      — upcoming featured events in that region
 *   4. aria        — global featured places as curated fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  queryPlaces,
  getPlaceTags,
  toDiscoveryCard,
} from '@/lib/supabase/places-repository';
import {
  queryEvents,
  getEventTags,
  toDiscoveryEventCard,
} from '@/lib/supabase/events-repository';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  // ── Auth ─────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // ── User profile (vibes + past stays) ────────────────────
    const [profileResult, staysResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('vibe, spend, food')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('stays')
        .select('region_id')
        .eq('userid', user.id)
        .not('region_id', 'is', null)
        .order('createdat', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const userVibes: string[] = profileResult.data?.vibe ?? [];
    const regionId: string | null = staysResult.data?.region_id ?? null;

    // ── 1. Vibe section — best featured place overlapping user vibes ──
    // For now: featured places from user's region (or globally if no region).
    // Phase 2: proper vibe-to-place-vibes mapping.
    const vibePlaces = await queryPlaces(supabase, {
      region_id: regionId ?? undefined,
      featured_only: true,
      limit: 6,
    });
    const vibeCards = await Promise.all(
      vibePlaces.map(async (p) => {
        const tags = await getPlaceTags(supabase, p.id);
        return toDiscoveryCard(p, tags);
      }),
    );
    // Pick the card whose vibes array has most overlap with user vibes
    const scoredVibe = vibeCards
      .map((c) => ({
        card: c,
        score: c.vibes.filter((v) => userVibes.includes(v)).length,
      }))
      .sort((a, b) => b.score - a.score);
    const heroCard = scoredVibe[0]?.card ?? vibeCards[0] ?? null;

    // ── 2. Yours — top 6 places from last stay region ────────
    const yourPlaces = regionId
      ? await queryPlaces(supabase, { region_id: regionId, limit: 6 })
      : await queryPlaces(supabase, { featured_only: true, limit: 6 });
    const yourCards = await Promise.all(
      yourPlaces.map(async (p) => {
        const tags = await getPlaceTags(supabase, p.id);
        return toDiscoveryCard(p, tags);
      }),
    );

    // ── 3. Events — upcoming featured events ─────────────────
    const upcomingEvents = await queryEvents(supabase, {
      region_id: regionId ?? undefined,
      featured_only: true,
      date_from: new Date().toISOString(),
      limit: 6,
    });
    const eventCards = await Promise.all(
      upcomingEvents.map(async (e) => {
        const tags = await getEventTags(supabase, e.id);
        return toDiscoveryEventCard(e, tags);
      }),
    );

    // ── 4. Aria curations — global featured places fallback ───
    const ariaPlaces = await queryPlaces(supabase, {
      featured_only: true,
      limit: 6,
    });
    const ariaCards = await Promise.all(
      ariaPlaces.map(async (p) => {
        const tags = await getPlaceTags(supabase, p.id);
        return toDiscoveryCard(p, tags);
      }),
    );

    // ── Build first-name greeting ─────────────────────────────
    const { data: userRow } = await supabase
      .from('users')
      .select('firstname')
      .eq('id', user.id)
      .maybeSingle();
    const firstName = userRow?.firstname ?? null;

    const sections = [
      {
        id: 'vibe',
        label: 'PICKED FOR YOU',
        title: heroCard?.name ?? 'A place you might love',
        subtitle: heroCard
          ? `${heroCard.vibes.slice(0, 2).join(' · ') || heroCard.category}`
          : 'Based on your travel style',
        image_url: heroCard?.image_url ?? null,
        gradient: heroCard?.gradient ?? 'from-stone-900/80 via-stone-950/60 to-black/80',
        items: vibeCards.slice(0, 4),
      },
      {
        id: 'yours',
        label: 'A TRIP LIKE YOURS',
        title: 'Places that match your last stay',
        subtitle: regionId ? 'From your travel region' : 'Featured destinations',
        image_url: yourCards[0]?.image_url ?? null,
        gradient: yourCards[0]?.gradient ?? 'from-stone-900/80 via-stone-950/60 to-black/80',
        items: yourCards,
      },
      {
        id: 'events',
        label: "WHAT'S ON",
        title: eventCards.length > 0 ? 'Coming up near you' : 'Nothing on yet',
        subtitle: 'Events & experiences',
        image_url: eventCards[0]?.image_url ?? null,
        gradient: 'from-red-900/80 via-red-950/60 to-black/80',
        items: eventCards,
      },
      {
        id: 'aria',
        label: 'CURATED BY ARIA',
        title: 'Places worth the trip',
        subtitle: 'Hand-picked across our network',
        image_url: ariaCards[0]?.image_url ?? null,
        gradient: 'from-teal-900/80 via-teal-950/60 to-black/80',
        items: ariaCards,
      },
    ];

    return NextResponse.json(
      { firstName, sections },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
