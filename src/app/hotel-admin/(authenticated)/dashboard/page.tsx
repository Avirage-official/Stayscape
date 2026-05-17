'use client';

import { useEffect, useState } from 'react';
import { Bell, BedDouble, Users, CheckSquare, LayoutGrid, Clock } from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getHotelAdminToken } from '@/lib/hotel-admin-token';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface ServiceTask {
  id: string;
  title: string;
  task_type: string;
  status: TaskStatus;
  createdat: string;
  property_rooms: { room_number: string } | null;
  stays: { guest_email: string; roomlabel: string | null } | null;
}

function formatTaskType(t: string) {
  return t.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getRoomLabel(task: ServiceTask): string {
  if (task.property_rooms?.room_number) return task.property_rooms.room_number;
  if (task.stays?.roomlabel) return task.stays.roomlabel;
  return '—';
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending:     'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  completed:   'bg-green-500/10 text-green-400 border border-green-500/20',
  cancelled:   'bg-white/[0.04] text-white/30 border border-white/10',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TABLE_HEADERS = ['Request', 'Room', 'Type', 'Status', 'Time'];

export default function HotelAdminDashboardPage() {
  const { adminName } = useHotelAdmin();

  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [roomsCount, setRoomsCount] = useState(0);
  const [guestsTodayCount, setGuestsTodayCount] = useState(0);
  const [recentTasks, setRecentTasks] = useState<ServiceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const token = await getHotelAdminToken();
      if (!token) return;

      try {
        const [requestsRes, roomsRes, staysRes] = await Promise.all([
          fetch('/api/hotel-admin/requests', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/hotel-admin/rooms',    { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/hotel-admin/stays',    { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (requestsRes.ok) {
          const data = (await requestsRes.json()) as { tasks: ServiceTask[] };
          const tasks = data.tasks ?? [];
          setActiveRequestsCount(tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length);
          setPendingTasksCount(tasks.filter((t) => t.status === 'pending').length);
          // Most recent 8 tasks for the table
          setRecentTasks(
            [...tasks]
              .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
              .slice(0, 8),
          );
        }

        if (roomsRes.ok) {
          const data = (await roomsRes.json()) as { rooms: unknown[] };
          setRoomsCount(data.rooms?.length ?? 0);
        }

        if (staysRes.ok) {
          const data = (await staysRes.json()) as { stays: { checkin: string; checkout: string }[] };
          const today = new Date().toISOString().slice(0, 10);
          const activeToday = (data.stays ?? []).filter((s) => s.checkin <= today && s.checkout >= today);
          setGuestsTodayCount(activeToday.length);
        }
      } catch {
        // silently fail — stat cards stay at last known value
      } finally {
        setLoading(false);
      }
    }

    void fetchStats();
  }, []);

  const STAT_CARDS = [
    { label: 'Active Requests', value: activeRequestsCount, icon: Bell },
    { label: 'Rooms',           value: roomsCount,          icon: BedDouble },
    { label: 'Guests Today',    value: guestsTodayCount,    icon: Users },
    { label: 'Pending Tasks',   value: pendingTasksCount,   icon: CheckSquare },
  ];

  return (
    <div className="px-5 py-8 md:px-8 space-y-8">
      {/* Greeting */}
      <p className="text-[13px] text-white/40">{getGreeting()}, {adminName}.</p>

      {/* Page title */}
      <h1 className="text-[22px] font-semibold text-white -mt-4">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#C9A84C]/60 uppercase tracking-[0.1em]">{label}</span>
              <Icon size={18} className="text-white/20" />
            </div>
            <span className="text-[28px] font-semibold text-white leading-none">
              {loading ? <span className="inline-block w-8 h-7 rounded bg-white/[0.06] animate-pulse" /> : value}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <LayoutGrid size={14} className="text-white/30" />
          <span className="text-[13px] font-medium text-white/70">Recent Requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-5 py-3 text-[11px] text-white/30 uppercase tracking-[0.08em] font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {TABLE_HEADERS.map((h) => (
                      <td key={h} className="px-5 py-3.5">
                        <div className="h-3 bg-white/[0.05] rounded animate-pulse" style={{ width: h === 'Request' ? '60%' : '40%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentTasks.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-5 py-10 text-center text-[13px] text-white/30">
                    No requests yet
                  </td>
                </tr>
              ) : (
                recentTasks.map((task) => (
                  <tr key={task.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-white/80 font-medium">{task.title}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-white/50">{getRoomLabel(task)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] text-white/40 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
                        {formatTaskType(task.task_type)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLES[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-white/30 flex items-center gap-1">
                        <Clock size={11} />{timeAgo(task.createdat)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
