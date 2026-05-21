import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

function getRegionHealthStatus(
  lastSyncAt: string | null,
  syncStatus: string | null,
  isActive: boolean,
): string {
  if (!isActive) return 'inactive';
  if (syncStatus === 'failed') return 'failed';
  if (!lastSyncAt) return 'never_synced';
  const ageMs = Date.now() - new Date(lastSyncAt).getTime();
  if (ageMs <= 24 * 60 * 60 * 1000) return 'healthy';
  if (ageMs <= 72 * 60 * 60 * 1000) return 'warning';
  return 'stale';
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: regions }, { data: places }, { data: syncRuns }] = await Promise.all([
      supabase
        .from('regions')
        .select('id, name, country_code, is_active, image_path')
        .order('name', { ascending: true }),
      supabase.from('places').select('region_id, editorial_summary').eq('is_active', true),
      supabase
        .from('sync_runs')
        .select('region_id, status, started_at')
        .eq('sync_type', 'places')
        .order('started_at', { ascending: false })
        .limit(300),
    ]);

    const placesByRegion = (places ?? []).reduce<Record<string, { total: number; enriched: number }>>(
      (acc, row) => {
        const regionId = (row.region_id as string) ?? '';
        if (!regionId) return acc;
        const next = acc[regionId] ?? { total: 0, enriched: 0 };
        next.total += 1;
        if ((row.editorial_summary as string | null)?.trim()) next.enriched += 1;
        acc[regionId] = next;
        return acc;
      },
      {},
    );

    const latestSyncByRegion = (syncRuns ?? []).reduce<
      Record<string, { status: string | null; startedAt: string | null }>
    >((acc, run) => {
      const regionId = (run.region_id as string) ?? '';
      if (!regionId || acc[regionId]) return acc;
      acc[regionId] = {
        status: (run.status as string | null) ?? null,
        startedAt: (run.started_at as string | null) ?? null,
      };
      return acc;
    }, {});

    const result = (regions ?? []).map((region) => {
      const regionId = (region.id as string) ?? '';
      const placeMeta = placesByRegion[regionId] ?? { total: 0, enriched: 0 };
      const latestSync = latestSyncByRegion[regionId];
      return {
        id: regionId,
        name: (region.name as string) ?? '—',
        countryCode: (region.country_code as string) ?? '—',
        placesCount: placeMeta.total,
        enrichedCount: placeMeta.enriched,
        lastSyncAt: latestSync?.startedAt ?? null,
        healthStatus: getRegionHealthStatus(
          latestSync?.startedAt ?? null,
          latestSync?.status ?? null,
          Boolean(region.is_active),
        ),
        imagePath: (region.image_path as string | null) ?? null,
      };
    });

    return NextResponse.json({ regions: result });
  } catch (err) {
    console.error('Admin regions fetch error', err);
    return NextResponse.json({ regions: [] });
  }
}
