/**
 * GET /api/explore
 *
 * Returns 4 personalised sections for the Explore dashboard page.
 *
 * Sections:
 *   1. Made for you  — places scored by vibe overlap
 *   2. In your world — other regions to explore
 *   3. Happening now — upcoming events in the region
 *   4. Aria's picks  — persona-tag algorithm (traveler_type tags × user scores)
 *                      falls back to featured places when no scores exist yet
 *
 * Query params:
 *   ?region_id=<uuid>   Override active region (city selector)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  queryPlaces,
  toDiscoveryCard,
} from '@/lib/supabase/places-repository';
import {
  queryEvents,
  toDiscoveryEventCard,
} from '@/lib/supabase/events-repository';
import { applyRateLimit } from '@/lib/rate-limit';
import type { PlaceTag, EventTag } from '@/types/database';

export const dynamic = 'force-dynamic';

function regionImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = imagePath.replace(/^region-images\//, '');
  return `${base}/storage/v1/object/public/region-images/${clean}`;
}

/** Extract top N persona names from a scores object (score must exceed threshold). */
function topPersonas(
  scores: Record<string, number> | null | undefined,
  n = 3,
  threshold = 0.25,
): string[] {
  if (!scores) return [];
  return Object.entries(scores)
    .filter(([, v]) => v >= threshold)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([k]) => k);
}

/** Build a place_id → PlaceTag[] map from a flat tag list. */
function indexTagsByPlace(rows: PlaceTag[]): Record<string, PlaceTag[]> {
  return rows.reduce<Record<string, PlaceTag[]>>((acc, tag) => {
    (acc[tag.place_id] ??= []).push(tag);
    return acc;
  }, {});
}

/** Build an event_id → EventTag[] map from a flat tag list. */
function indexTagsByEvent(rows: EventTag[]): Record<string, EventTag[]> {
  return rows.reduce<Record<string, EventTag[]>>((acc, tag) => {
    const key = (tag as EventTag & { event_id: string }).event_id;
    (acc[key] ??= []).push(tag);
    return acc;
  }, {});
}

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const regionOverride = searchParams.get('region_id') ?? null;

  try {
    // Parallel: profile (now includes region_id), most-recent stay region, region list, user name
    const [profileResult, staysResult, regionsResult, userRow] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('vibe, spend, food, extra, region_id')  // region_id added: home city set during onboarding
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
      supabase
        .from('regions')
        .select('id, name, slug, country_code, image_path')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('users')
        .select('firstname')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const profileVibes: string[] = profileResult.data?.vibe ?? [];
    const stayRegionId: string | null = staysResult.data?.region_id ?? null;
    // Priority: URL override → active stay region → home city set during onboarding
    const profileRegionId: string | null = (profileResult.data?.region_id as string | null) ?? null;
    const regionId: string | null = regionOverride ?? stayRegionId ?? profileRegionId;
    const regions = regionsResult.data ?? [];
    const firstName = userRow.data?.firstname ?? null;

    // Persona scores from user_profiles.extra (set during onboarding)
    const personaScores = (
      (profileResult.data?.extra as Record<string, unknown> | null)
        ?.persona_scores as Record<string, number> | undefined
    );
    const userPersonas = topPersonas(personaScores);

    // ── 1. Made for you — places ─────────────────────────────────────────────
    const rawPlaces = await queryPlaces(supabase, {
      region_id: regionId ?? undefined,
      featured_only: !regionId,
      limit: 12,
    });

    // Batch all place tags in one query instead of N individual lookups
    const placeTagMap: Record<string, PlaceTag[]> =
      rawPlaces.length > 0
        ? indexTagsByPlace(
            (
              (await supabase
                .from('place_tags')
                .select('*')
                .in('place_id', rawPlaces.map(p => p.id))
              ).data ?? []
            ) as PlaceTag[],
          )
        : {};

    const placeCards = rawPlaces.map(p => toDiscoveryCard(p, placeTagMap[p.id] ?? []));

    // Score by vibe overlap with user's profile vibes
    const scoredPlaces = placeCards
      .map(c => ({ card: c, score: c.vibes.filter(v => profileVibes.includes(v)).length * 2 }))
      .sort((a, b) => b.score - a.score)
      .map(s => s.card)
      .slice(0, 6);

    const heroPlace = scoredPlaces[0] ?? null;

    // ── 2. In your world — regions ───────────────────────────────────────────
    const otherRegions = regions
      .filter(r => r.id !== stayRegionId)
      .slice(0, 6)
      .map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        country_code: r.country_code,
        image_url: regionImageUrl((r.image_path as string | null) ?? null),
        description: `Explore ${r.name}`,
        gradient: 'from-stone-900/80 via-stone-950/60 to-black/80',
      }));

    // ── 3. Happening now — events ────────────────────────────────────────────
    const rawEvents = await queryEvents(supabase, {
      region_id: regionId ?? undefined,
      featured_only: true,
      date_from: new Date().toISOString(),
      limit: 6,
    });

    // Batch all event tags in one query
    const eventTagMap: Record<string, EventTag[]> =
      rawEvents.length > 0
        ? indexTagsByEvent(
            (
              (await supabase
                .from('event_tags')
                .select('*')
                .in('event_id', rawEvents.map(e => e.id))
              ).data ?? []
            ) as EventTag[],
          )
        : {};

    const eventCards = rawEvents.map(e =>
      toDiscoveryEventCard(e, eventTagMap[e.id] ?? []),
    );

    // ── 4. Aria's picks — persona-tag algorithm ──────────────────────────────
    // If the user has persona scores: filter places by traveler_type tags that
    // match their top personas. Fallback: featured places in the region.
    let ariaCards = placeCards.filter(c => c.is_featured).slice(0, 6);
    if (ariaCards.length === 0) ariaCards = scoredPlaces.slice(0, 6);

    if (userPersonas.length > 0 && regionId) {
      const { data: personaTagRows } = await supabase
        .from('place_tags')
        .select('place_id')
        .eq('tag_type', 'traveler_type')
        .in('tag', userPersonas);

      const matchedIds = new Set((personaTagRows ?? []).map(t => t.place_id as string));

      if (matchedIds.size > 0) {
        // Fetch a wider pool so persona filtering has room to work
        const personaPool = await queryPlaces(supabase, {
          region_id: regionId,
          limit: 50,
        });
        const filtered = personaPool.filter(p => matchedIds.has(p.id)).slice(0, 6);

        if (filtered.length > 0) {
          const { data: ariaTagRows } = await supabase
            .from('place_tags')
            .select('*')
            .in('place_id', filtered.map(p => p.id));
          const ariaTagMap = indexTagsByPlace((ariaTagRows ?? []) as PlaceTag[]);
          ariaCards = filtered.map(p => toDiscoveryCard(p, ariaTagMap[p.id] ?? []));
        }
      }
    }

    const ariaHero = ariaCards[0] ?? null;

    // ── Sections ─────────────────────────────────────────────────────────────
    const sections = [
      {
        id: 'made_for_you',
        label: 'MADE FOR YOU',
        title: heroPlace?.name ?? "Places you'll love",
        subtitle: heroPlace
          ? (heroPlace.vibes.slice(0, 2).join(' · ') || heroPlace.category)
          : 'Based on your travel style',
        image_url: heroPlace?.image_url ?? null,
        gradient: heroPlace?.gradient ?? 'from-stone-900/80 via-stone-950/60 to-black/80',
        content_type: 'places' as const,
        items: scoredPlaces,
      },
      {
        id: 'in_your_world',
        label: 'IN YOUR WORLD',
        title: 'Where to next?',
        subtitle: 'Destinations worth exploring',
        image_url: otherRegions[0]?.image_url ?? null,
        gradient: 'from-indigo-900/80 via-indigo-950/60 to-black/80',
        content_type: 'regions' as const,
        items: otherRegions,
      },
      {
        id: 'happening_now',
        label: 'HAPPENING NOW',
        title: eventCards.length > 0 ? "Don't miss this" : 'Nothing on yet',
        subtitle: 'Events & experiences near you',
        image_url: eventCards[0]?.image_url ?? null,
        gradient: 'from-red-900/80 via-red-950/60 to-black/80',
        content_type: 'events' as const,
        items: eventCards,
      },
      {
        id: 'arias_picks',
        label: "ARIA'S PICKS",
        title: ariaHero?.name ?? 'Places picked for you',
        subtitle: userPersonas.length > 0
          ? `Matched to your ${userPersonas[0]} style`
          : 'Top picks in the area',
        image_url: ariaHero?.image_url ?? null,
        gradient: 'from-teal-900/80 via-teal-950/60 to-black/80',
        content_type: 'places' as const,
        items: ariaCards,
      },
    ];

    return NextResponse.json(
      { firstName, activeRegionId: regionId, regions, sections },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
