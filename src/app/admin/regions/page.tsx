import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface RegionCardData {
  id: string;
  name: string;
  countryCode: string;
  placesCount: number;
  enrichedCount: number;
  lastSyncAt: string | null;
  healthStatus: string;
}

function formatDate(date: string | null): string {
  if (!date) return 'Never';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRegionHealthStatus(lastSyncAt: string | null, syncStatus: string | null, isActive: boolean): string {
  if (!isActive) return 'inactive';
  if (syncStatus === 'failed') return 'failed';
  if (!lastSyncAt) return 'never_synced';

  const ageMs = Date.now() - new Date(lastSyncAt).getTime();
  if (ageMs <= 24 * 60 * 60 * 1000) return 'healthy';
  if (ageMs <= 72 * 60 * 60 * 1000) return 'warning';
  return 'stale';
}

function getHealthClass(status: string): string {
  if (status === 'healthy') return 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300';
  if (status === 'warning') return 'border-amber-400/30 bg-amber-400/15 text-amber-300';
  return 'border-red-400/30 bg-red-400/15 text-red-300';
}

async function getRegionCards(): Promise<RegionCardData[]> {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: regions }, { data: places }, { data: syncRuns }] = await Promise.all([
      supabase
        .from('regions')
        .select('id, name, country_code, is_active')
        .order('name', { ascending: true }),
      supabase.from('places').select('region_id, editorial_summary').eq('is_active', true),
      supabase
        .from('sync_runs')
        .select('region_id, status, started_at')
        .eq('sync_type', 'places')
        .order('started_at', { ascending: false })
        .limit(300),
    ]);

    const placesByRegion = (places ?? []).reduce<
      Record<string, { total: number; enriched: number }>
    >((acc, row) => {
      const regionId = (row.region_id as string) ?? '';
      if (!regionId) return acc;
      const next = acc[regionId] ?? { total: 0, enriched: 0 };
      next.total += 1;
      if ((row.editorial_summary as string | null)?.trim()) next.enriched += 1;
      acc[regionId] = next;
      return acc;
    }, {});

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

    return (regions ?? []).map((region) => {
      const regionId = (region.id as string) ?? '';
      const placeMeta = placesByRegion[regionId] ?? { total: 0, enriched: 0 };
      const latestSync = latestSyncByRegion[regionId];
      const healthStatus = getRegionHealthStatus(
        latestSync?.startedAt ?? null,
        latestSync?.status ?? null,
        Boolean(region.is_active),
      );

      return {
        id: regionId,
        name: (region.name as string) ?? '—',
        countryCode: (region.country_code as string) ?? '—',
        placesCount: placeMeta.total,
        enrichedCount: placeMeta.enriched,
        lastSyncAt: latestSync?.startedAt ?? null,
        healthStatus,
      };
    });
  } catch {
    return [];
  }
}

export default async function AdminRegionsPage() {
  const regions = await getRegionCards();

  return (
    <div className="space-y-5">
      <SectionHeader title="Regions" />

      <div className="grid gap-4 lg:grid-cols-2">
        {regions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/50">
            No regions found.
          </div>
        ) : (
          regions.map((region) => (
            <article key={region.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-white">{region.name}</h2>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/55">{region.countryCode}</p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${getHealthClass(region.healthStatus)}`}
                >
                  {region.healthStatus.replaceAll('_', ' ')}
                </span>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Places</p>
                  <p className="font-serif text-xl text-white">{region.placesCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Enriched</p>
                  <p className="font-serif text-xl text-white">{region.enrichedCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Coverage</p>
                  <p className="font-serif text-xl text-white">
                    {region.placesCount === 0 ? '0%' : `${Math.round((region.enrichedCount / region.placesCount) * 100)}%`}
                  </p>
                </div>
              </div>

              <p className="mb-4 text-sm text-white/60">Last sync: {formatDate(region.lastSyncAt)}</p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#C9A84C]"
                >
                  Trigger Sync
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 bg-white/[0.03] px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white/75"
                >
                  Enrich Pending
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
