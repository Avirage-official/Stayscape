/**
 * GET  /api/customer/history
 * POST /api/customer/history
 *
 * GET  — Returns the user's full trip history, upcoming trips, stats, and
 *         travel-pattern insights. Derives "past vs upcoming" from dates only
 *         (no enum change needed).
 *
 * POST — Creates a past-trip itinerary (standalone, no stayid).
 *        Body: { title?: string, region_id: string, startdate: string, enddate: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/* ── Auth helper ──────────────────────────────────────────── */

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  if (!token) return null;
  const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/* ── Image URL helper (mirrors /api/explore) ─────────────── */

function regionImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = imagePath.replace(/^region-images\//, '');
  return `${base}/storage/v1/object/public/region-images/${clean}`;
}

/* ── Travel-pattern helpers ──────────────────────────────── */

function avgDays(intervals: number[]): number | null {
  if (intervals.length === 0) return null;
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

const SEASON_MAP: Record<number, string> = {
  12: 'Winter', 1: 'Winter', 2: 'Winter',
  3: 'Spring', 4: 'Spring', 5: 'Spring',
  6: 'Summer', 7: 'Summer', 8: 'Summer',
  9: 'Autumn', 10: 'Autumn', 11: 'Autumn',
};

/* ── GET ──────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sb = getSupabaseAdmin();

    // Fetch all itineraries with stay + region context
    const { data, error } = await sb
      .from('itineraries')
      .select(`
        id, stayid, userid, title, status, startdate, enddate, cover_image, createdat,
        region_id,
        stays ( checkindate, checkoutdate, region_id,
          properties ( name )
        )
      `)
      .eq('userid', user.id)
      .order('startdate', { ascending: false });

    if (error) throw error;
    const rows = data ?? [];

    // Batch-fetch item counts per itinerary
    const { data: itemCounts } = await sb
      .from('itineraryitems')
      .select('itineraryid')
      .in('itineraryid', rows.map(r => r.id));

    const countMap: Record<string, number> = {};
    for (const item of itemCounts ?? []) {
      countMap[item.itineraryid] = (countMap[item.itineraryid] ?? 0) + 1;
    }

    // Fetch regions referenced by any itinerary (via stay or direct)
    const regionIds = [...new Set(
      rows.map(r => (r.region_id as string | null) ?? ((r.stays as { region_id?: string | null } | null)?.region_id ?? null)).filter(Boolean) as string[]
    )];

    const { data: regionsData } = regionIds.length > 0
      ? await sb.from('regions').select('id, name, slug, country_code, country_name, flag_emoji, image_path').in('id', regionIds)
      : { data: [] };

    const regionMap = Object.fromEntries((regionsData ?? []).map(r => [r.id, r]));

    const today = new Date().toISOString().split('T')[0];

    // Enrich rows
    const enriched = rows.map(r => {
      const startdate = r.startdate ?? (r.stays as { checkindate?: string } | null)?.checkindate ?? null;
      const enddate   = r.enddate   ?? (r.stays as { checkoutdate?: string } | null)?.checkoutdate ?? null;
      const effectiveRegionId = (r.region_id as string | null) ?? ((r.stays as { region_id?: string | null } | null)?.region_id ?? null);
      const region = effectiveRegionId ? regionMap[effectiveRegionId] ?? null : null;
      const isPast = enddate ? enddate < today : false;
      const isUpcoming = startdate ? startdate > today : false;

      return {
        id: r.id,
        title: r.title ?? (r.stays as { properties?: { name?: string } | null } | null)?.properties?.name ?? null,
        startdate,
        enddate,
        cover_image: r.cover_image ?? null,
        item_count: countMap[r.id] ?? 0,
        is_past: isPast,
        is_upcoming: isUpcoming,
        is_active: !isPast && !isUpcoming,
        region: region ? {
          id: effectiveRegionId,
          name: region.name,
          slug: region.slug,
          country_code: region.country_code,
          country_name: region.country_name ?? null,
          flag_emoji: region.flag_emoji ?? null,
          image_url: regionImageUrl(region.image_path ?? null),
        } : null,
      };
    });

    const past = enriched.filter(t => t.is_past);
    const upcoming = enriched.filter(t => t.is_upcoming || t.is_active);

    // ── Stats ────────────────────────────────────────────────
    const tripsWithRegion = enriched.filter(t => t.region !== null);
    const uniqueCities = new Set(tripsWithRegion.map(t => t.region!.id)).size;
    const uniqueCountries = new Set(tripsWithRegion.map(t => t.region!.country_code)).size;

    // Countries detail (for flag chips)
    const countrySeen = new Map<string, { country_code: string; country_name: string | null; flag_emoji: string | null }>();
    for (const t of tripsWithRegion) {
      if (!countrySeen.has(t.region!.country_code)) {
        countrySeen.set(t.region!.country_code, {
          country_code: t.region!.country_code,
          country_name: t.region!.country_name,
          flag_emoji: t.region!.flag_emoji,
        });
      }
    }
    const countries = [...countrySeen.values()];

    // ── Travel patterns (past trips only) ────────────────────
    const sortedPast = [...past]
      .filter(t => t.startdate && t.enddate)
      .sort((a, b) => (a.startdate! > b.startdate! ? 1 : -1));

    const durations = sortedPast.map(t => daysBetween(t.startdate!, t.enddate!));
    const gaps = sortedPast.slice(1).map((t, i) => daysBetween(sortedPast[i].enddate!, t.startdate!));

    // Most visited region
    const regionCount: Record<string, { count: number; name: string }> = {};
    for (const t of past) {
      if (t.region) {
        regionCount[t.region.id] = {
          count: (regionCount[t.region.id]?.count ?? 0) + 1,
          name: t.region.name,
        };
      }
    }
    const mostVisited = Object.entries(regionCount).sort((a, b) => b[1].count - a[1].count)[0] ?? null;

    // Most travelled season
    const seasonCount: Record<string, number> = {};
    for (const t of sortedPast) {
      const month = new Date(t.startdate!).getMonth() + 1;
      const season = SEASON_MAP[month] ?? 'Unknown';
      seasonCount[season] = (seasonCount[season] ?? 0) + 1;
    }
    const favSeason = Object.entries(seasonCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const patterns = {
      avg_trip_days: avgDays(durations),
      avg_gap_days: avgDays(gaps),
      most_visited_region: mostVisited ? { name: mostVisited[1].name, count: mostVisited[1].count } : null,
      favourite_season: favSeason,
      total_days_travelled: durations.reduce((a, b) => a + b, 0) || null,
    };

    return NextResponse.json(
      {
        stats: { total_trips: past.length, cities: uniqueCities, countries: uniqueCountries },
        countries,
        upcoming,
        past,
        patterns,
      },
      { headers: rateLimit.headers },
    );
  } catch (err) {
    console.error('[GET /api/customer/history]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ── POST — add a past trip ──────────────────────────────── */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { title?: string; region_id?: string; startdate?: string; enddate?: string } = {};
  try { body = await request.json(); } catch { /* empty body */ }

  const { region_id, startdate, enddate, title } = body;

  if (!region_id || typeof region_id !== 'string') {
    return NextResponse.json({ error: 'region_id is required' }, { status: 400 });
  }
  if (!startdate || !DATE_RE.test(startdate)) {
    return NextResponse.json({ error: 'startdate is required (YYYY-MM-DD)' }, { status: 400 });
  }
  if (!enddate || !DATE_RE.test(enddate)) {
    return NextResponse.json({ error: 'enddate is required (YYYY-MM-DD)' }, { status: 400 });
  }
  if (startdate > enddate) {
    return NextResponse.json({ error: 'startdate must be before enddate' }, { status: 400 });
  }

  try {
    const sb = getSupabaseAdmin();

    // Verify region exists
    const { data: region } = await sb.from('regions').select('id').eq('id', region_id).maybeSingle();
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });

    const { data, error } = await sb
      .from('itineraries')
      .insert({
        userid: user.id,
        stayid: null,
        region_id,
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        startdate,
        enddate,
      })
      .select('id')
      .single();

    if (error || !data) throw error ?? new Error('Insert failed');

    return NextResponse.json({ id: data.id }, { status: 201, headers: rateLimit.headers });
  } catch (err) {
    console.error('[POST /api/customer/history]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
