/**
 * GET /api/explore
 *
 * Returns 4 personalised sections for the Explore dashboard page.
 *
 * Sections (Option A labels):
 *   1. Made for you  — places in user's current / selected region
 *   2. In your world — other regions to explore (destination cards)
 *   3. Happening now — upcoming events in the region
 *   4. Aria's picks  — explore_properties (manually seeded hotel cards)
 *
 * Query params:
 *   ?region_id=<uuid>   Override region (from dropdown)
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
import {
  queryExploreProperties,
  getExplorePropertyTags,
  toDiscoveryPropertyCard,
} from '@/lib/supabase/explore-properties-repository';
import { applyRateLimit } from '@/lib/rate-limit';

function regionImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  // Already a full URL (e.g. stored via Supabase Studio or older upload flows)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  // Strip accidental bucket-name prefix so we never double it
  const clean = imagePath.replace(/^region-images\//, '');
  return `${base}/storage/v1/object/public/region-images/${clean}`;
}

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  // ── Auth ────────────────────────────────────────────────────
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

  // ── Query param override ─────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const regionOverride = searchParams.get('region_id') ?? null;

  try {
    // ── User profile + stays + regions (parallel) ────────────────
    const [profileResult, staysResult, regionsResult, userRow] = await Promise.all([
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

    const userVibes: string[] = profileResult.data?.vibe ?? [];
    const stayRegionId: string | null = staysResult.data?.region_id ?? null;
    // regionOverride (dropdown) > active stay region > null (global fallback)
    const regionId: string | null = regionOverride ?? stayRegionId;
    const regions = regionsResult.data ?? [];
    const firstName = userRow.data?.firstname ?? null;

    // ── 1. Made for you — places in the region ───────────────────
    const rawPlaces = await queryPlaces(supabase, {
      region_id: regionId ?? undefined,
      featured_only: !regionId,   // if no region, show featured globally
      limit: 6,
    });
    const placeCards = await Promise.all(
      rawPlaces.map(async (p) => {
        const tags = await getPlaceTags(supabase, p.id);
        return toDiscoveryCard(p, tags);
      }),
    );
    // Sort by vibe overlap score
    const scoredPlaces = placeCards
      .map((c) => ({
        card: c,
        score: c.vibes.filter((v) => userVibes.includes(v)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .map((s) => s.card);
    const heroPlace = scoredPlaces[0] ?? null;

    // ── 2. In your world — other regions ────────────────────────
    const otherRegions = regions
      .filter((r) => r.id !== stayRegionId)
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        country_code: r.country_code,
        image_url: regionImageUrl((r.image_path as string | null) ?? null),
        description: `Explore ${r.name}`,
        gradient: 'from-stone-900/80 via-stone-950/60 to-black/80',
      }));

    // ── 3. Happening now — events ────────────────────────────────
    const rawEvents = await queryEvents(supabase, {
      region_id: regionId ?? undefined,
      featured_only: true,
      date_from: new Date().toISOString(),
      limit: 6,
    });
    const eventCards = await Promise.all(
      rawEvents.map(async (e) => {
        const tags = await getEventTags(supabase, e.id);
        return toDiscoveryEventCard(e, tags);
      }),
    );

    // ── 4. Aria's picks — explore_properties ────────────────────
    const rawProperties = await queryExploreProperties(supabase, {
      region_id: regionId ?? undefined,
      featured_only: !regionId,
      limit: 6,
    });
    const propertyCards = await Promise.all(
      rawProperties.map(async (p) => {
        const tags = await getExplorePropertyTags(supabase, p.id);
        return toDiscoveryPropertyCard(p, tags);
      }),
    );
    // Vibe-score properties too
    const scoredProperties = propertyCards
      .map((c) => ({
        card: c,
        score: c.vibes.filter((v) => userVibes.includes(v)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .map((s) => s.card);

    // ── Build sections ───────────────────────────────────────────
    const sections = [
      {
        id: 'made_for_you',
        label: 'MADE FOR YOU',
        title: heroPlace?.name ?? 'Places you\'ll love',
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
        title: eventCards.length > 0 ? 'Don\'t miss this' : 'Nothing on yet',
        subtitle: 'Events & experiences near you',
        image_url: eventCards[0]?.image_url ?? null,
        gradient: 'from-red-900/80 via-red-950/60 to-black/80',
        content_type: 'events' as const,
        items: eventCards,
      },
      {
        id: 'arias_picks',
        label: "ARIA'S PICKS",
        title: 'Places worth staying at',
        subtitle: 'Curated stays across our network',
        image_url: scoredProperties[0]?.image_url ?? null,
        gradient: 'from-teal-900/80 via-teal-950/60 to-black/80',
        content_type: 'properties' as const,
        items: scoredProperties,
      },
    ];

    return NextResponse.json(
      {
        firstName,
        activeRegionId: regionId,
        regions,
        sections,
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
