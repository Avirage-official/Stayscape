/**
 * GET /api/explore
 *
 * Returns 4 personalised sections for the Explore dashboard page.
 *
 * Sections:
 *   1. Made for you  — places in user’s current / selected region
 *   2. In your world — other regions to explore (destination cards)
 *   3. Happening now — upcoming events in the region
 *   4. Aria’s picks  — explore_properties (manually seeded hotel cards)
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
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = imagePath.replace(/^region-images\//, '');
  return `${base}/storage/v1/object/public/region-images/${clean}`;
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
    const [profileResult, staysResult, regionsResult, userRow, prefsResult] = await Promise.all([
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
      // Wire in guest_preferences for richer personalisation
      supabase
        .from('guest_preferences')
        .select('preferred_categories, preferred_vibes, preferred_price_levels')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const profileVibes: string[] = profileResult.data?.vibe ?? [];
    const guestVibes: string[] = prefsResult.data?.preferred_vibes ?? [];
    const preferredCategories: string[] = prefsResult.data?.preferred_categories ?? [];
    const preferredPriceLevels: number[] = prefsResult.data?.preferred_price_levels ?? [];
    // Merge vibes from both sources, deduplicated
    const userVibes = Array.from(new Set([...profileVibes, ...guestVibes]));

    const stayRegionId: string | null = staysResult.data?.region_id ?? null;
    const regionId: string | null = regionOverride ?? stayRegionId;
    const regions = regionsResult.data ?? [];
    const firstName = userRow.data?.firstname ?? null;

    // 1. Made for you — places
    const rawPlaces = await queryPlaces(supabase, {
      region_id: regionId ?? undefined,
      featured_only: !regionId,
      limit: 12, // fetch more so vibe + category filtering has room to work
    });
    const placeCards = await Promise.all(
      rawPlaces.map(async (p) => {
        const tags = await getPlaceTags(supabase, p.id);
        return toDiscoveryCard(p, tags);
      }),
    );

    // Score by vibe overlap + category preference + price level match
    const scoredPlaces = placeCards
      .map((c) => {
        let score = c.vibes.filter((v) => userVibes.includes(v)).length * 2;
        if (preferredCategories.length && preferredCategories.includes(c.category)) score += 3;
        if (preferredPriceLevels.length && c.price_level != null && preferredPriceLevels.includes(c.price_level)) score += 1;
        return { card: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((s) => s.card)
      .slice(0, 6);

    const heroPlace = scoredPlaces[0] ?? null;

    // 2. In your world — regions
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

    // 3. Happening now — events
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

    // 4. Aria’s picks — properties
    const rawProperties = await queryExploreProperties(supabase, {
      region_id: regionId ?? undefined,
      featured_only: !regionId,
      limit: 12,
    });
    const propertyCards = await Promise.all(
      rawProperties.map(async (p) => {
        const tags = await getExplorePropertyTags(supabase, p.id);
        return toDiscoveryPropertyCard(p, tags);
      }),
    );
    const scoredProperties = propertyCards
      .map((c) => ({
        card: c,
        score: c.vibes.filter((v) => userVibes.includes(v)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .map((s) => s.card)
      .slice(0, 6);

    const sections = [
      {
        id: 'made_for_you',
        label: 'MADE FOR YOU',
        title: heroPlace?.name ?? "Places you'll love",
        subtitle: heroPlace
          ? (heroPlace.vibes.slice(0, 2).join(' \u00b7 ') || heroPlace.category)
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
        title: 'Places worth staying at',
        subtitle: 'Curated stays across our network',
        image_url: scoredProperties[0]?.image_url ?? null,
        gradient: 'from-teal-900/80 via-teal-950/60 to-black/80',
        content_type: 'properties' as const,
        items: scoredProperties,
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
