import Link from 'next/link';
import DataTable from '@/components/admin/DataTable';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

type StaysSearchParams = {
  page?: string;
};

interface StayRow {
  id: string;
  guest: string;
  hotel: string;
  dates: string;
  status: string;
  curation: 'curated' | 'pending';
  bookingReference: string;
}

function buildQueryString(params: StaysSearchParams): string {
  const entries = Object.entries(params).filter(([, value]) => value);
  const searchParams = new URLSearchParams(entries as Array<[string, string]>);
  return searchParams.toString();
}

async function getStaysData(rawParams: StaysSearchParams): Promise<{
  rows: StayRow[];
  total: number;
  page: number;
}> {
  const page = Math.max(Number(rawParams.page ?? '1') || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const supabase = getSupabaseAdmin();
    const { data: stays, count } = await supabase
      .from('stays')
      .select('id, booking_reference, checkindate, checkoutdate, status, users:userid(firstname, lastname, email), properties:propertyid(name)', {
        count: 'exact',
      })
      .order('createdat', { ascending: false })
      .range(from, to);

    const stayIds = (stays ?? []).map((stay) => stay.id as string);
    const { data: curations } = stayIds.length
      ? await supabase.from('stay_curations').select('stay_id').in('stay_id', stayIds)
      : { data: [] as Array<{ stay_id: string }> };

    const curatedStayIds = new Set((curations ?? []).map((curation) => curation.stay_id as string));

    return {
      rows: (stays ?? []).map((stay) => {
        const user = stay.users as { firstname?: string | null; lastname?: string | null; email?: string | null } | null;
        const property = stay.properties as { name?: string | null } | null;
        const fullName = `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim();
        const guestLabel = fullName || 'Unknown guest';
        const email = user?.email ? ` · ${user.email}` : '';

        return {
          id: stay.id as string,
          guest: `${guestLabel}${email}`,
          hotel: property?.name ?? '—',
          dates: `${(stay.checkindate as string) ?? '—'} → ${(stay.checkoutdate as string) ?? '—'}`,
          status: (stay.status as string) ?? 'unknown',
          curation: curatedStayIds.has(stay.id as string) ? 'curated' : 'pending',
          bookingReference: (stay.booking_reference as string | null) ?? '—',
        };
      }),
      total: count ?? 0,
      page,
    };
  } catch {
    return {
      rows: [],
      total: 0,
      page,
    };
  }
}

export default async function AdminStaysPage({
  searchParams,
}: {
  searchParams: Promise<StaysSearchParams>;
}) {
  const params = await searchParams;
  const data = await getStaysData(params);
  const totalPages = Math.max(Math.ceil(data.total / PAGE_SIZE), 1);
  const currentPage = Math.min(data.page, totalPages);
  const startItem = data.total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = data.total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, data.total);

  return (
    <div className="space-y-5">
      <SectionHeader title="Stays" />

      <DataTable
        columns={[
          { key: 'guest', header: 'Guest' },
          { key: 'hotel', header: 'Hotel' },
          { key: 'dates', header: 'Dates' },
          { key: 'status', header: 'Status' },
          {
            key: 'curation',
            header: 'Curation',
            render: (row) => {
              const curation = (row as StayRow).curation;
              return (
                <span className={curation === 'curated' ? 'text-emerald-300' : 'text-amber-300'}>
                  {curation}
                </span>
              );
            },
          },
          { key: 'bookingReference', header: 'Booking Ref' },
        ]}
        rows={data.rows}
        statusColumns={['status']}
        getRowKey={(row) => (row as StayRow).id}
        emptyMessage="No stays found."
      />

      <div className="flex items-center justify-between text-sm text-white/65">
        <p>
          Showing {startItem}-{endItem} of {data.total}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/stays?${buildQueryString({
              ...params,
              page: String(Math.max(currentPage - 1, 1)),
            })}`}
            className={`rounded-md border px-3 py-1.5 ${currentPage <= 1 ? 'pointer-events-none border-white/10 text-white/30' : 'border-white/20 text-white/80 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'}`}
          >
            Prev
          </Link>
          <span className="text-white/80">Page {currentPage} / {totalPages}</span>
          <Link
            href={`/admin/stays?${buildQueryString({
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
