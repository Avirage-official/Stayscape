import DataTable from '@/components/admin/DataTable';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface PropertyRow {
  id: string;
  name: string;
  region: string;
  stays: number;
  city: string;
  country: string;
  created: string;
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function getProperties(): Promise<PropertyRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: properties }, { data: stays }] = await Promise.all([
      supabase
        .from('properties')
        .select('id, name, city, country, createdat, regions:region_id(name)')
        .order('createdat', { ascending: false }),
      supabase.from('stays').select('propertyid'),
    ]);

    const stayCounts = (stays ?? []).reduce<Record<string, number>>((acc, row) => {
      const propertyId = (row.propertyid as string) ?? '';
      if (!propertyId) return acc;
      acc[propertyId] = (acc[propertyId] ?? 0) + 1;
      return acc;
    }, {});

    return (properties ?? []).map((property) => ({
      id: property.id as string,
      name: (property.name as string) ?? '—',
      region: ((property.regions as { name?: string } | null)?.name) ?? '—',
      stays: stayCounts[(property.id as string) ?? ''] ?? 0,
      city: (property.city as string) ?? '—',
      country: (property.country as string) ?? '—',
      created: (property.createdat as string) ?? '',
    }));
  } catch {
    return [];
  }
}

export default async function AdminPropertiesPage() {
  const rows = await getProperties();

  return (
    <div>
      <SectionHeader title="Properties" />
      <DataTable
        columns={[
          { key: 'name', header: 'Property' },
          { key: 'region', header: 'Region' },
          { key: 'stays', header: 'Stays' },
          { key: 'city', header: 'City' },
          { key: 'country', header: 'Country' },
          {
            key: 'created',
            header: 'Created',
            render: (row) => formatDate((row as PropertyRow).created),
          },
        ]}
        rows={rows}
        getRowKey={(row) => (row as PropertyRow).id}
        emptyMessage="No properties found."
      />
    </div>
  );
}
