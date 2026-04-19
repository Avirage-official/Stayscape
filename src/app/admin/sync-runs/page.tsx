import DataTable from '@/components/admin/DataTable';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface SyncRunRow {
  id: string;
  region: string;
  status: string;
  duration: string;
  counts: string;
  error: string;
}

function getDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
  const seconds = Math.floor((end - start) / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

async function getSyncRuns(): Promise<SyncRunRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('sync_runs')
      .select('id, status, started_at, completed_at, records_fetched, records_created, records_updated, records_deactivated, error_message, regions:region_id(name)')
      .order('started_at', { ascending: false })
      .limit(100);

    return (data ?? []).map((run) => ({
      id: run.id as string,
      region: ((run.regions as { name?: string } | null)?.name) ?? '—',
      status: (run.status as string) ?? 'unknown',
      duration: getDuration(
        (run.started_at as string | null) ?? null,
        (run.completed_at as string | null) ?? null,
      ),
      counts: `F:${(run.records_fetched as number) ?? 0} C:${(run.records_created as number) ?? 0} U:${(run.records_updated as number) ?? 0} D:${(run.records_deactivated as number) ?? 0}`,
      error: ((run.error_message as string | null) ?? '—').slice(0, 120),
    }));
  } catch {
    return [];
  }
}

export default async function AdminSyncRunsPage() {
  const rows = await getSyncRuns();

  return (
    <div>
      <SectionHeader title="Sync Runs" />
      <DataTable
        columns={[
          { key: 'region', header: 'Region' },
          { key: 'status', header: 'Status' },
          { key: 'duration', header: 'Duration' },
          { key: 'counts', header: 'Counts' },
          { key: 'error', header: 'Error Message' },
        ]}
        rows={rows}
        statusColumns={['status']}
        getRowKey={(row) => (row as SyncRunRow).id}
        emptyMessage="No sync runs recorded yet."
      />
    </div>
  );
}
