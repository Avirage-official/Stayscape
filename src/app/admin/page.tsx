import DataTable from '@/components/admin/DataTable';
import SectionHeader from '@/components/admin/SectionHeader';
import StatCard from '@/components/admin/StatCard';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

function formatDate(date: string | null): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface OverviewData {
  counts: {
    properties: number;
    regions: number;
    places: number;
    enrichedPlaces: number;
    stays: number;
  };
  syncRuns: Array<{
    id: string;
    region: string;
    status: string;
    startedAt: string | null;
    fetched: number;
    created: number;
    updated: number;
  }>;
  stays: Array<{
    id: string;
    guest: string;
    hotel: string;
    dates: string;
    status: string;
    bookingReference: string;
  }>;
}

async function getOverviewData(): Promise<OverviewData> {
  try {
    const supabase = getSupabaseAdmin();

    const [
      propertiesCount,
      regionsCount,
      placesCount,
      enrichedPlacesCount,
      staysCount,
      recentSyncRuns,
      recentStays,
    ] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('regions').select('id', { count: 'exact', head: true }),
      supabase.from('places').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('places')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('editorial_summary', 'is', null)
        .neq('editorial_summary', ''),
      supabase.from('stays').select('id', { count: 'exact', head: true }),
      supabase
        .from('sync_runs')
        .select('id, status, started_at, records_fetched, records_created, records_updated, regions:region_id(name)')
        .order('started_at', { ascending: false })
        .limit(5),
      supabase
        .from('stays')
        .select('id, booking_reference, checkindate, checkoutdate, status, users:userid(firstname, lastname, email), properties:propertyid(name)')
        .order('createdat', { ascending: false })
        .limit(10),
    ]);

    return {
      counts: {
        properties: propertiesCount.count ?? 0,
        regions: regionsCount.count ?? 0,
        places: placesCount.count ?? 0,
        enrichedPlaces: enrichedPlacesCount.count ?? 0,
        stays: staysCount.count ?? 0,
      },
      syncRuns: (recentSyncRuns.data ?? []).map((run) => {
        const region = (run.regions as { name?: string } | null)?.name ?? '—';
        return {
          id: run.id as string,
          region,
          status: (run.status as string) ?? 'unknown',
          startedAt: (run.started_at as string | null) ?? null,
          fetched: (run.records_fetched as number) ?? 0,
          created: (run.records_created as number) ?? 0,
          updated: (run.records_updated as number) ?? 0,
        };
      }),
      stays: (recentStays.data ?? []).map((stay) => {
        const user = stay.users as { firstname?: string | null; lastname?: string | null; email?: string | null } | null;
        const property = stay.properties as { name?: string | null } | null;
        const fullName = `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim();
        const guest = fullName || user?.email || 'Unknown guest';

        return {
          id: stay.id as string,
          guest,
          hotel: property?.name ?? '—',
          dates: `${(stay.checkindate as string) ?? '—'} → ${(stay.checkoutdate as string) ?? '—'}`,
          status: (stay.status as string) ?? 'unknown',
          bookingReference: ((stay.booking_reference as string | null) ?? '—'),
        };
      }),
    };
  } catch {
    return {
      counts: {
        properties: 0,
        regions: 0,
        places: 0,
        enrichedPlaces: 0,
        stays: 0,
      },
      syncRuns: [],
      stays: [],
    };
  }
}

export default async function AdminOverviewPage() {
  const data = await getOverviewData();

  return (
    <div className="space-y-8">
      <SectionHeader title="Overview" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Properties" value={data.counts.properties} />
        <StatCard label="Regions" value={data.counts.regions} />
        <StatCard label="Places" value={data.counts.places} />
        <StatCard label="Enriched Places" value={data.counts.enrichedPlaces} />
        <StatCard label="Stays" value={data.counts.stays} />
      </div>

      <section>
        <SectionHeader title="Recent Sync Runs" actionLabel="View all" actionHref="/admin/sync-runs" />
        <DataTable
          columns={[
            { key: 'region', header: 'Region' },
            { key: 'status', header: 'Status' },
            {
              key: 'startedAt',
              header: 'Started',
              render: (row) => formatDate((row as { startedAt: string | null }).startedAt),
            },
            {
              key: 'counts',
              header: 'Counts',
              render: (row) => {
                const run = row as { fetched: number; created: number; updated: number };
                return `F:${run.fetched} C:${run.created} U:${run.updated}`;
              },
            },
          ]}
          rows={data.syncRuns}
          statusColumns={['status']}
          getRowKey={(row) => (row as { id: string }).id}
          emptyMessage="No sync runs yet."
        />
      </section>

      <section>
        <SectionHeader title="Recent Stays" actionLabel="View all" actionHref="/admin/stays" />
        <DataTable
          columns={[
            { key: 'guest', header: 'Guest' },
            { key: 'hotel', header: 'Hotel' },
            { key: 'dates', header: 'Dates' },
            { key: 'status', header: 'Status' },
            { key: 'bookingReference', header: 'Booking Ref' },
          ]}
          rows={data.stays}
          statusColumns={['status']}
          getRowKey={(row) => (row as { id: string }).id}
          emptyMessage="No stays found."
        />
      </section>
    </div>
  );
}
