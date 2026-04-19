import Link from 'next/link';
import DataTable from '@/components/admin/DataTable';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

type PlacesSearchParams = {
  page?: string;
  region?: string;
  category?: string;
  search?: string;
};

interface PlaceRow {
  id: string;
  name: string;
  region: string;
  category: string;
  city: string;
  enriched: boolean;
  hasBookingUrl: boolean;
}

function buildQueryString(params: PlacesSearchParams): string {
  const entries = Object.entries(params).filter(([, value]) => value);
  const searchParams = new URLSearchParams(entries as Array<[string, string]>);
  return searchParams.toString();
}

async function getPlacesData(rawParams: PlacesSearchParams): Promise<{
  rows: PlaceRow[];
  total: number;
  page: number;
  regions: Array<{ id: string; name: string }>;
  categories: string[];
}> {
  const page = Math.max(Number(rawParams.page ?? '1') || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('places')
      .select('id, name, category, city, editorial_summary, booking_url, regions:region_id(id, name)', {
        count: 'exact',
      })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (rawParams.region) query = query.eq('region_id', rawParams.region);
    if (rawParams.category) query = query.eq('category', rawParams.category);
    if (rawParams.search) query = query.ilike('name', `%${rawParams.search}%`);

    const [{ data, count }, { data: regions }, { data: categories }] = await Promise.all([
      query.range(from, to),
      supabase.from('regions').select('id, name').eq('is_active', true).order('name', { ascending: true }),
      supabase.from('places').select('category').eq('is_active', true),
    ]);

    const categoryValues = Array.from(
      new Set((categories ?? []).map((item) => (item.category as string) ?? '').filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    return {
      rows: (data ?? []).map((place) => ({
        id: place.id as string,
        name: (place.name as string) ?? '—',
        region: ((place.regions as { name?: string } | null)?.name) ?? '—',
        category: (place.category as string) ?? '—',
        city: (place.city as string) ?? '—',
        enriched: Boolean((place.editorial_summary as string | null)?.trim()),
        hasBookingUrl: Boolean((place.booking_url as string | null)?.trim()),
      })),
      total: count ?? 0,
      page,
      regions: (regions ?? []).map((region) => ({
        id: region.id as string,
        name: (region.name as string) ?? '—',
      })),
      categories: categoryValues,
    };
  } catch {
    return {
      rows: [],
      total: 0,
      page,
      regions: [],
      categories: [],
    };
  }
}

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: Promise<PlacesSearchParams>;
}) {
  const params = await searchParams;
  const data = await getPlacesData(params);
  const totalPages = Math.max(Math.ceil(data.total / PAGE_SIZE), 1);
  const currentPage = Math.min(data.page, totalPages);
  const startItem = data.total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = data.total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, data.total);

  return (
    <div className="space-y-5">
      <SectionHeader title="Places" />

      <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4" method="GET">
        <select
          name="region"
          defaultValue={params.region ?? ''}
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All regions</option>
          {data.regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>

        <select
          name="category"
          defaultValue={params.category ?? ''}
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All categories</option>
          {data.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="search"
          placeholder="Search place name"
          defaultValue={params.search ?? ''}
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none"
        />

        <button
          type="submit"
          className="rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#C9A84C]"
        >
          Apply Filters
        </button>
      </form>

      <DataTable
        columns={[
          { key: 'name', header: 'Place' },
          { key: 'region', header: 'Region' },
          { key: 'category', header: 'Category' },
          { key: 'city', header: 'City' },
          {
            key: 'enriched',
            header: 'Enrichment',
            render: (row) => {
              const enriched = (row as PlaceRow).enriched;
              return (
                <span className="inline-flex items-center gap-2 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${enriched ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {enriched ? 'Enriched' : 'Pending'}
                </span>
              );
            },
          },
          {
            key: 'hasBookingUrl',
            header: 'Booking URL',
            render: (row) => ((row as PlaceRow).hasBookingUrl ? 'Available' : 'Missing'),
          },
        ]}
        rows={data.rows}
        getRowKey={(row) => (row as PlaceRow).id}
        emptyMessage="No places match the current filters."
      />

      <div className="flex items-center justify-between text-sm text-white/65">
        <p>
          Showing {startItem}-{endItem} of {data.total}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/places?${buildQueryString({
              ...params,
              page: String(Math.max(currentPage - 1, 1)),
            })}`}
            className={`rounded-md border px-3 py-1.5 ${currentPage <= 1 ? 'pointer-events-none border-white/10 text-white/30' : 'border-white/20 text-white/80 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'}`}
          >
            Prev
          </Link>
          <span className="text-white/80">Page {currentPage} / {totalPages}</span>
          <Link
            href={`/admin/places?${buildQueryString({
              ...params,
              page: String(Math.min(currentPage + 1, totalPages)),
            })}`}
            className={`rounded-md border px-3 py-1.5 ${currentPage >= totalPages ? 'pointer-events-none border-white/10 text-white/30' : 'border-white/20 text-white/80 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
