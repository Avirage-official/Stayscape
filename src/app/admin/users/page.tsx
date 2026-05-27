import type { ReactNode } from 'react';
import Link from 'next/link';
import DataTable from '@/components/admin/DataTable';
import SectionHeader from '@/components/admin/SectionHeader';
import StatCard from '@/components/admin/StatCard';
import UsersTabNav from '@/components/admin/UsersTabNav';
import UserActionsMenu from '@/components/admin/UserActionsMenu';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

type Tab = 'all' | 'standalone' | 'hotel';

type UsersSearchParams = {
  tab?: string;
  page?: string;
};

interface UserRow {
  id: string;
  name: string;
  email: string;
  type: 'standalone' | 'hotel_guest';
  location: string;
  region: string;
  profileStatus: 'complete' | 'incomplete';
  ariaCredits: number;
  joinedAt: string;
}

interface InsightItem {
  label: string;
  count: number;
}

interface UsersPageData {
  stats: {
    total: number;
    standalone: number;
    hotelGuests: number;
    profileComplete: number;
    creditsUsed: number;
  };
  rows: UserRow[];
  total: number;
  page: number;
  topCountries: InsightItem[];
  topRegions: InsightItem[];
  topVibes: InsightItem[];
}

type ProfileJoin = {
  completed: boolean | null;
  location_city: string | null;
  location_country: string | null;
  regions: { name: string } | null;
};

function resolveTab(raw: string | undefined): Tab {
  if (raw === 'standalone' || raw === 'hotel') return raw;
  return 'all';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildQueryString(params: UsersSearchParams): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  return new URLSearchParams(entries as Array<[string, string]>).toString();
}

async function getUsersData(rawParams: UsersSearchParams): Promise<UsersPageData> {
  const tab = resolveTab(rawParams.tab);
  const page = Math.max(Number(rawParams.page ?? '1') || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const empty: UsersPageData = {
    stats: { total: 0, standalone: 0, hotelGuests: 0, profileComplete: 0, creditsUsed: 0 },
    rows: [],
    total: 0,
    page,
    topCountries: [],
    topRegions: [],
    topVibes: [],
  };

  try {
    const supabase = getSupabaseAdmin();

    // Get all distinct user IDs that have at least one stay
    const { data: stayUserData } = await supabase
      .from('stays')
      .select('userid')
      .not('userid', 'is', null);

    const hotelUserIds = [
      ...new Set((stayUserData ?? []).map((s) => s.userid as string).filter(Boolean)),
    ];
    const hotelUserIdSet = new Set(hotelUserIds);

    // For hotel tab with zero hotel users, avoid a useless query
    if (tab === 'hotel' && hotelUserIds.length === 0) {
      const [totalRes, profileRes, creditsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('users').select('id', { count: 'exact', head: true }).lt('aria_credits', 3),
      ]);
      return {
        ...empty,
        stats: {
          total: totalRes.count ?? 0,
          standalone: totalRes.count ?? 0,
          hotelGuests: 0,
          profileComplete: profileRes.count ?? 0,
          creditsUsed: creditsRes.count ?? 0,
        },
      };
    }

    // Build the paginated users query
    const baseSelect =
      'id, firstname, lastname, email, createdat, aria_credits, user_profiles(completed, location_city, location_country, regions(name))';

    let userQuery = supabase
      .from('users')
      .select(baseSelect, { count: 'exact' })
      .order('createdat', { ascending: false })
      .range(from, to);

    if (tab === 'standalone' && hotelUserIds.length > 0) {
      userQuery = userQuery.not('id', 'in', `(${hotelUserIds.join(',')})`);
    } else if (tab === 'hotel') {
      userQuery = userQuery.in('id', hotelUserIds);
    }

    const [
      totalRes,
      profileCompleteRes,
      creditsUsedRes,
      paginatedRes,
      countriesRes,
      regionsRes,
      vibesRes,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).lt('aria_credits', 3),
      userQuery,
      supabase
        .from('user_profiles')
        .select('location_country')
        .not('location_country', 'is', null)
        .neq('location_country', ''),
      supabase
        .from('user_profiles')
        .select('regions(name)')
        .not('region_id', 'is', null),
      supabase
        .from('user_profiles')
        .select('vibe')
        .not('vibe', 'is', null),
    ]);

    const totalUsers = totalRes.count ?? 0;

    // Aggregate top countries
    const countryCounts: Record<string, number> = {};
    (countriesRes.data ?? []).forEach((p) => {
      const c = p.location_country as string | null;
      if (c) countryCounts[c] = (countryCounts[c] ?? 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    // Aggregate top regions
    const regionCounts: Record<string, number> = {};
    (regionsRes.data ?? []).forEach((p) => {
      const name = (p.regions as { name?: string } | null)?.name;
      if (name) regionCounts[name] = (regionCounts[name] ?? 0) + 1;
    });
    const topRegions = Object.entries(regionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    // Aggregate top vibes
    const vibeCounts: Record<string, number> = {};
    (vibesRes.data ?? []).forEach((row) => {
      const vibes = (row.vibe as string[] | null) ?? [];
      vibes.forEach((v) => {
        if (v) vibeCounts[v] = (vibeCounts[v] ?? 0) + 1;
      });
    });
    const topVibes = Object.entries(vibeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));

    // Map rows
    const rows: UserRow[] = (paginatedRes.data ?? []).map((u) => {
      const profiles = u.user_profiles as ProfileJoin[] | null;
      const profile = Array.isArray(profiles) ? (profiles[0] ?? null) : null;

      const first = (u.firstname as string | null) ?? '';
      const last = (u.lastname as string | null) ?? '';
      const name = `${first} ${last}`.trim() || '—';

      const city = profile?.location_city ?? null;
      const country = profile?.location_country ?? null;
      const location = [city, country].filter(Boolean).join(', ') || '—';
      const region = (profile?.regions as { name?: string } | null)?.name ?? '—';

      return {
        id: u.id as string,
        name,
        email: (u.email as string | null) ?? '—',
        type: hotelUserIdSet.has(u.id as string) ? 'hotel_guest' : 'standalone',
        location,
        region,
        profileStatus: profile?.completed ? 'complete' : 'incomplete',
        ariaCredits: (u.aria_credits as number) ?? 3,
        joinedAt: (u.createdat as string) ?? '',
      };
    });

    return {
      stats: {
        total: totalUsers,
        standalone: totalUsers - hotelUserIds.length,
        hotelGuests: hotelUserIds.length,
        profileComplete: profileCompleteRes.count ?? 0,
        creditsUsed: creditsUsedRes.count ?? 0,
      },
      rows,
      total: paginatedRes.count ?? 0,
      page,
      topCountries,
      topRegions,
      topVibes,
    };
  } catch (err) {
    console.error('[admin/users] data fetch error:', err);
    return empty;
  }
}

function InsightBarList({ title, items }: { title: string; items: InsightItem[] }) {
  const max = items[0]?.count ?? 1;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-white/60">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-white/40">No data yet</p>
      ) : (
        <ul className="space-y-3">
          {items.map(({ label, count }) => (
            <li key={label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm capitalize text-white/80">{label}</span>
                <span className="text-xs text-white/45">{count}</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full bg-[#C9A84C]/60"
                  style={{ width: `${Math.round((count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<UsersSearchParams>;
}) {
  const params = await searchParams;
  const tab = resolveTab(params.tab);
  const data = await getUsersData(params);

  const totalPages = Math.max(Math.ceil(data.total / PAGE_SIZE), 1);
  const currentPage = Math.min(data.page, totalPages);
  const startItem = data.total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = data.total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, data.total);
  const profilePct =
    data.stats.total > 0
      ? Math.round((data.stats.profileComplete / data.stats.total) * 100)
      : 0;

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row: unknown): ReactNode => {
        const r = row as UserRow;
        return (
          <div>
            <p className="text-white/90">{r.name}</p>
            <p className="text-xs text-white/45">{r.email}</p>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: unknown): ReactNode => {
        const r = row as UserRow;
        return r.type === 'standalone' ? (
          <span className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium text-sky-300">
            Standalone
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/15 px-2.5 py-1 text-[11px] font-medium text-violet-300">
            Hotel Guest
          </span>
        );
      },
    },
    { key: 'location', header: 'Location' },
    { key: 'region', header: 'Region' },
    {
      key: 'profileStatus',
      header: 'Profile',
      render: (row: unknown): ReactNode => {
        const r = row as UserRow;
        return r.profileStatus === 'complete' ? (
          <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            Complete
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            Incomplete
          </span>
        );
      },
    },
    {
      key: 'ariaCredits',
      header: 'Credits',
      render: (row: unknown): ReactNode => {
        const r = row as UserRow;
        return (
          <span className={r.ariaCredits < 3 ? 'text-amber-300' : 'text-white/80'}>
            {r.ariaCredits}
          </span>
        );
      },
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (row: unknown): ReactNode => formatDate((row as UserRow).joinedAt),
    },
    {
      key: 'actions',
      header: '',
      render: (row: unknown): ReactNode => {
        const r = row as UserRow;
        return (
          <UserActionsMenu
            userId={r.id}
            email={r.email}
            ariaCredits={r.ariaCredits}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Users" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={data.stats.total} />
        <StatCard label="Standalone" value={data.stats.standalone} />
        <StatCard label="Hotel Guests" value={data.stats.hotelGuests} />
        <StatCard label="Profile Complete" value={`${profilePct}%`} />
        <StatCard label="Credits Used" value={data.stats.creditsUsed} />
      </div>

      {/* Insights */}
      <div className="grid gap-4 sm:grid-cols-3">
        <InsightBarList title="Top Countries" items={data.topCountries} />
        <InsightBarList title="Top Regions" items={data.topRegions} />
        <InsightBarList title="Top Vibes" items={data.topVibes} />
      </div>

      {/* Tabs */}
      <UsersTabNav tab={tab} counts={data.stats} />

      {/* Table */}
      <DataTable
        columns={columns}
        rows={data.rows}
        getRowKey={(row) => (row as UserRow).id}
        emptyMessage="No users found."
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-white/65">
        <p>
          Showing {startItem}–{endItem} of {data.total}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/users?${buildQueryString({ ...params, page: String(Math.max(currentPage - 1, 1)) })}`}
            className={`rounded-md border px-3 py-1.5 ${
              currentPage <= 1
                ? 'pointer-events-none border-white/10 text-white/30'
                : 'border-white/20 text-white/80 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'
            }`}
          >
            Prev
          </Link>
          <span className="text-white/80">
            Page {currentPage} / {totalPages}
          </span>
          <Link
            href={`/admin/users?${buildQueryString({ ...params, page: String(Math.min(currentPage + 1, totalPages)) })}`}
            className={`rounded-md border px-3 py-1.5 ${
              currentPage >= totalPages
                ? 'pointer-events-none border-white/10 text-white/30'
                : 'border-white/20 text-white/80 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]'
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
