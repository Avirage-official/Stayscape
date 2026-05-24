'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Bell, BedDouble, Users, TrendingUp, Clock, AlertTriangle,
  ArrowUpRight, LayoutGrid, CalendarCheck, CalendarX, CheckSquare,
  Percent,
} from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getHotelAdminToken } from '@/lib/hotel-admin-token';

/* ─── Types ─────────────────────────────────────────────────── */
interface RecentTask {
  id: string;
  title: string;
  task_type: string;
  status: string;
  createdat: string;
  room: string | null;
}

interface DayBucket { date: string; count: number; }
interface TypeBucket { type: string; count: number; }
interface Hotspot    { room: string; open_count: number; }

interface StatsPayload {
  requests: {
    active: number;
    pending: number;
    sla_breaches: number;
    avg_response_mins: number | null;
    by_day: DayBucket[];
    by_type: TypeBucket[];
    recent: RecentTask[];
  };
  stays: {
    arrivals_today: number;
    departures_today: number;
    active_count: number;
    occupancy_pct: number | null;
  };
  rooms: { total: number };
  hotspots: Hotspot[];
}

/* ─── Helpers ────────────────────────────────────────────────── */
function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function formatType(t: string) {
  return t.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (diff < 1)  return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const STATUS_PILL: Record<string, string> = {
  pending:     'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  in_progress: 'bg-blue-500/10  text-blue-400  border border-blue-500/20',
  completed:   'bg-green-500/10 text-green-400  border border-green-500/20',
  cancelled:   'bg-white/[0.04] text-white/30   border border-white/10',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
};

/* ─── Sparkline bar chart ────────────────────────────────────── */
function BarChart({ data }: { data: DayBucket[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const todayStr = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex items-end gap-[6px] h-[72px] w-full">
      {data.map((d) => {
        const pct = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 3);
        const isToday = d.date === todayStr;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5" title={`${shortDate(d.date)}: ${d.count} request${d.count !== 1 ? 's' : ''}`}>
            <div
              className="w-full rounded-sm transition-all duration-500"
              style={{
                height: `${pct}%`,
                background: isToday ? 'rgba(201,168,76,0.7)' : 'rgba(255,255,255,0.12)',
              }}
            />
            <span className="text-[9px] text-white/25 leading-none">
              {new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Type breakdown bars ──────────────────────────────────── */
function TypeBreakdown({ data }: { data: TypeBucket[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-[13px] text-white/30 py-4 text-center">No requests yet</p>;
  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((d) => {
        const pct = Math.round((d.count / total) * 100);
        return (
          <div key={d.type}>
            <div className="flex justify-between mb-1">
              <span className="text-[12px] text-white/60">{formatType(d.type)}</span>
              <span className="text-[12px] text-white/40">{pct}%</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'rgba(201,168,76,0.55)' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Skeleton pulse ─────────────────────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/[0.06] rounded animate-pulse ${className}`} />;
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function HotelAdminDashboardPage() {
  const { adminName } = useHotelAdmin();
  const [stats, setStats]     = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchStats() {
    const token = await getHotelAdminToken();
    if (!token) return;
    try {
      const res = await fetch('/api/hotel-admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json() as StatsPayload);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function startInterval() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => void fetchStats(), 60_000);
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void fetchStats();
        startInterval();
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }
    void fetchStats();
    startInterval();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const s = stats;
  const hasSlaBreaches = (s?.requests.sla_breaches ?? 0) > 0;
  const hasHotspots    = (s?.hotspots?.length ?? 0) > 0;
  const showAlertStrip = !loading && (hasSlaBreaches || hasHotspots);

  const KPI_CARDS = [
    {
      label: 'Active Requests',
      value: s?.requests.active ?? 0,
      icon: Bell,
      href: '/hotel-admin/requests',
      sub: s?.requests.pending ? `${s.requests.pending} pending` : null,
      highlight: (s?.requests.active ?? 0) > 0,
    },
    {
      label: 'Pending Tasks',
      value: s?.requests.pending ?? 0,
      icon: CheckSquare,
      href: '/hotel-admin/requests?status=pending',
      sub: null,
      highlight: false,
    },
    {
      label: 'Avg Response',
      value: s?.requests.avg_response_mins != null ? `${s.requests.avg_response_mins}m` : '—',
      icon: Clock,
      href: null,
      sub: 'target: 15 min',
      highlight: (s?.requests.avg_response_mins ?? 0) > 15,
    },
    {
      label: 'Occupancy',
      value: s?.stays.occupancy_pct != null ? `${s.stays.occupancy_pct}%` : '—',
      icon: Percent,
      href: '/hotel-admin/rooms',
      sub: s?.rooms.total ? `of ${s.rooms.total} rooms` : null,
      highlight: false,
    },
    {
      label: 'Arrivals Today',
      value: s?.stays.arrivals_today ?? 0,
      icon: CalendarCheck,
      href: '/hotel-admin/stays',
      sub: null,
      highlight: false,
    },
    {
      label: 'Departures Today',
      value: s?.stays.departures_today ?? 0,
      icon: CalendarX,
      href: '/hotel-admin/stays',
      sub: null,
      highlight: false,
    },
  ];

  // Column widths for skeleton table cells (as percentages)
  const SKELETON_COL_WIDTHS = [60, 20, 30, 25, 20];

  return (
    <div className="px-5 py-8 md:px-8 space-y-6 pb-16">

      {/* Greeting + title */}
      <div>
        <p className="text-[13px] text-white/40">{getGreeting()}, {adminName}.</p>
        <h1 className="text-[22px] font-semibold text-white mt-1">Dashboard</h1>
      </div>

      {/* Alert strip */}
      {showAlertStrip && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 flex flex-col gap-2">
          {hasSlaBreaches && (
            <Link href="/hotel-admin/requests?status=pending" className="flex items-center gap-2 group">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span className="text-[13px] text-amber-300">
                <span className="font-semibold">{s!.requests.sla_breaches}</span>
                {' '}pending request{s!.requests.sla_breaches !== 1 ? 's' : ''} breached the 15-min SLA
              </span>
              <ArrowUpRight size={13} className="text-amber-400/60 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
          {hasHotspots && s!.hotspots.map((h) => (
            <div key={h.room} className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400/70 shrink-0" />
              <span className="text-[13px] text-amber-300/80">
                Room <span className="font-semibold">{h.room}</span> has {h.open_count} open requests
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map(({ label, value, icon: Icon, href, sub, highlight }) => {
          const inner = (
            <div
              className={`relative bg-white/[0.02] border rounded-xl p-4 flex flex-col gap-2 h-full transition-colors ${
                highlight
                  ? 'border-amber-500/30 bg-amber-500/[0.04]'
                  : 'border-white/[0.06] hover:border-white/[0.10]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#C9A84C]/60 uppercase tracking-[0.1em] leading-tight">{label}</span>
                <Icon size={14} className={highlight ? 'text-amber-400/60' : 'text-white/20'} />
              </div>
              <span className={`text-[24px] font-semibold leading-none ${highlight ? 'text-amber-300' : 'text-white'}`}>
                {loading ? <Skeleton className="h-6 w-10" /> : value}
              </span>
              {sub && <span className="text-[10px] text-white/30 leading-none">{sub}</span>}
              {href && !loading && <ArrowUpRight size={11} className="absolute top-3 right-3 text-white/15" />}
            </div>
          );
          return href ? (
            <Link key={label} href={href} className="block">{inner}</Link>
          ) : (
            <div key={label}>{inner}</div>
          );
        })}
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* 7-day chart */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={13} className="text-white/30" />
                <span className="text-[12px] font-medium text-white/60">Requests — Last 7 Days</span>
              </div>
              {!loading && s && (
                <span className="text-[11px] text-white/30">
                  {s.requests.by_day.reduce((n, d) => n + d.count, 0)} total
                </span>
              )}
            </div>
            {loading ? <Skeleton className="h-[72px] w-full" /> : <BarChart data={s?.requests.by_day ?? []} />}
          </div>

          {/* Type breakdown */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={13} className="text-white/30" />
              <span className="text-[12px] font-medium text-white/60">Top Request Types</span>
            </div>
            {loading
              ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
              : <TypeBreakdown data={s?.requests.by_type ?? []} />
            }
          </div>

          {/* Stays summary */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BedDouble size={13} className="text-white/30" />
                <span className="text-[12px] font-medium text-white/60">Stays Overview</span>
              </div>
              <Link href="/hotel-admin/stays" className="text-[11px] text-[#C9A84C]/50 hover:text-[#C9A84C]/80 transition-colors flex items-center gap-0.5">
                View all <ArrowUpRight size={10} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: 'Active Guests',    value: s?.stays.active_count ?? 0 },
                  { label: 'Arrivals Today',   value: s?.stays.arrivals_today ?? 0 },
                  { label: 'Departures Today', value: s?.stays.departures_today ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[12px] text-white/50">{label}</span>
                    <span className="text-[13px] font-medium text-white/80">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: recent requests table */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <LayoutGrid size={13} className="text-white/30" />
              <span className="text-[13px] font-medium text-white/70">Recent Requests</span>
            </div>
            <Link href="/hotel-admin/requests" className="text-[11px] text-[#C9A84C]/50 hover:text-[#C9A84C]/80 transition-colors flex items-center gap-0.5">
              View all <ArrowUpRight size={10} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Request', 'Room', 'Type', 'Status', 'Time'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] text-white/25 uppercase tracking-[0.08em] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {SKELETON_COL_WIDTHS.map((w, j) => (
                        <td key={j} className="px-5 py-3.5">
                          {/* Inline div avoids passing style to Skeleton component */}
                          <div
                            className="h-3 bg-white/[0.06] rounded animate-pulse"
                            style={{ width: `${w}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !s?.requests.recent.length ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-white/30">
                      No requests yet
                    </td>
                  </tr>
                ) : (
                  s.requests.recent.map((task) => (
                    <tr key={task.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-default">
                      <td className="px-5 py-3.5 max-w-[180px]">
                        <span className="text-[13px] text-white/80 font-medium truncate block">{task.title}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-white/40">{task.room ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] text-white/40 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">
                          {formatType(task.task_type)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_PILL[task.status] ?? STATUS_PILL.cancelled}`}>
                          {STATUS_LABEL[task.status] ?? task.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] text-white/30">{timeAgo(task.createdat)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
