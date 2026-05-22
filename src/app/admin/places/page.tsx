import Link from 'next/link';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import ReviewQueueClient from './ReviewQueueClient';
import PlacesTableClient from './PlacesTableClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

type Tab = 'all' | 'review';

type PlacesSearchParams = {
  page?: string;
  region?: string;
  category?: string;
  search?: string;
  tab?: Tab;
};

export interface PlaceRow {
  id: string;
  name: string;
  region_id: string;
  region: string;
  category: string;
  city: string;
  address: string;
  country_code: string;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  image_url: string | null;
  image_urls: string[];
  editorial_summary: string | null;
  description: string;
  rating: number | null;
  price_level: number | null;
  is_featured: boolean;
  is_active: boolean;
  vibes: string[] | null;
  best_for: string[] | null;
  recommended_duration: string | null;
  enriched: boolean;
}

export interface ReviewRow {
  id: string;
  name: string;
  region: string;
  category: string;
  city: string;
  flagged_at: string;
}

function buildQueryString(params: PlacesSearchParams): string {
  const entries = Object.entries(params).filter(([, value]) => value);
  return new URLSearchParams(entries as Array<[string, string]>).toString();
}

async function getPlacesData(rawParams: PlacesSearchParams) {
  const page = Math.max(Number(rawParams.page ?? '1') || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('places')
      .select(
        'id, name, region_id, category, city, address, country_code, phone, website, booking_url, image_url, image_urls, editorial_summary, description, rating, price_level, is_featured, is_active, vibes, best_for, recommended_duration, regions:region_id(id, name)',
        { count: 'exact' },
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (rawParams.region) query = query.eq('region_id', rawParams.region);
    if (rawParams.category) query = query.eq('category', rawParams.category);
    if (rawParams.search) query = query.ilike('name', `%${rawParams.search}%`);

    const [{ data, count }, { data: regions }, { data: categories }] = await Promise.all([
      query.range(from, to),
      supabase.from('regions').select('id, name').eq('is_active', true).order('name'),
      supabase.from('places').select('category').eq('is_active', true),
    ]);

    const categoryValues = Array.from(
      new Set((categories ?? []).map((item) => (item.category as string) ?? '').filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    return {
      rows: (data ?? []).map((p) => ({
        id: p.id as string,
        name: (p.name as string) ?? '—',
        region_id: (p.region_id as string) ?? '',
        region: ((p.regions as { name?: string } | null)?.name) ?? '—',
        category: (p.category as string) ?? '—',
        city: (p.city as string) ?? '—',
        address: (p.address as string) ?? '',
        country_code: (p.country_code as string) ?? '',
        phone: (p.phone as string | null) ?? null,
        website: (p.website as string | null) ?? null,
        booking_url: (p.booking_url as string | null) ?? null,
        image_url: (p.image_url as string | null) ?? null,
        image_urls: (p.image_urls as string[]) ?? [],
        editorial_summary: (p.editorial_summary as string | null) ?? null,
        description: (p.description as string) ?? '',
        rating: (p.rating as number | null) ?? null,
        price_level: (p.price_level as number | null) ?? null,
        is_featured: Boolean(p.is_featured),
        is_active: Boolean(p.is_active),
        vibes: (p.vibes as string[] | null) ?? null,
        best_for: (p.best_for as string[] | null) ?? null,
        recommended_duration: (p.recommended_duration as string | null) ?? null,
        enriched: Boolean((p.editorial_summary as string | null)?.trim()),
      })) as PlaceRow[],
      total: count ?? 0,
      page,
      regions: (regions ?? []).map((r) => ({ id: r.id as string, name: (r.name as string) ?? '—' })),
      categories: categoryValues,
    };
  } catch {
    return { rows: [] as PlaceRow[], total: 0, page, regions: [], categories: [] };
  }
}

async function getReviewQueue() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('places')
      .select('id, name, category, city, updated_at, regions:region_id(id, name)')
      .eq('is_active', false)
      .not('editorial_summary', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(100);
    return (data ?? []).map((p) => ({
      id: p.id as string,
      name: (p.name as string) ?? '—',
      region: ((p.regions as { name?: string } | null)?.name) ?? '—',
      category: (p.category as string) ?? '—',
      city: (p.city as string) ?? '—',
      flagged_at: (p.updated_at as string) ?? '',
    })) as ReviewRow[];
  } catch {
    return [] as ReviewRow[];
  }
}

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: Promise<PlacesSearchParams>;
}) {
  const params = await searchParams;
  const tab: Tab = params.tab === 'review' ? 'review' : 'all';

  const [data, reviewQueue] = await Promise.all([getPlacesData(params), getReviewQueue()]);

  const totalPages = Math.max(Math.ceil(data.total / PAGE_SIZE), 1);
  const currentPage = Math.min(data.page, totalPages);
  const startItem = data.total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = data.total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, data.total);

  return (
    <div className="space-y-5">
      <SectionHeader title="Places" />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10">
        <Link
          href="/admin/places?tab=all"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'all' ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-white/45 hover:text-white/70'
          }`}
        >
          All Places
        </Link>
        <Link
          href="/admin/places?tab=review"
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'review' ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-white/45 hover:text-white/70'
          }`}
        >
          Review Queue
          {reviewQueue.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-400">
              {reviewQueue.length}
            </span>
          )}
        </Link>
      </div>

      {tab === 'review' ? (
        <ReviewQueueClient rows={reviewQueue} />
      ) : (
        <>
          {/* Filters */}
          <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4" method="GET">
            <input type="hidden" name="tab" value="all" />
            <select name="region" defaultValue={params.region ?? ''} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
              <option value="">All regions</option>
              {data.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select name="category" defaultValue={params.category ?? ''} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none">
              <option value="">All categories</option>
              {data.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" name="search" placeholder="Search place name" defaultValue={params.search ?? ''} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none" />
            <button type="submit" className="rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#C9A84C]">
              Apply Filters
            </button>
          </form>

          <PlacesTableClient rows={data.rows} />

          <div className="flex items-center justify-between text-sm text-white/65">
            <p>Showing {startItem}–{endItem} of {data.total}</p>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/places?${buildQueryString({ ...params, page: String(Math.max(currentPage - 1, 1)) })}`}
                className={`rounded-md border px-3 py-1.5 ${currentPage <= 1 ? 'pointer-events-none border-white/10 text-white/30' : 'border-white/20 text-white/80 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'}`}
              >
                Prev
              </Link>
              <span className="text-white/80">Page {currentPage} / {totalPages}</span>
              <Link
                href={`/admin/places?${buildQueryString({ ...params, page: String(Math.min(currentPage + 1, totalPages)) })}`}
                className={`rounded-md border px-3 py-1.5 ${currentPage >= totalPages ? 'pointer-events-none border-white/10 text-white/30' : 'border-white/20 text-white/80 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'}`}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
