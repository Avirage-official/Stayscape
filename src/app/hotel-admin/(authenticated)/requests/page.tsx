'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Clock } from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

/* ── Types ──────────────────────────────────────────────────────── */

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface ServiceTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: TaskStatus;
  priority: number;
  createdat: string;
  updatedat: string;
  roomid: string | null;
  stayid: string | null;
  property_rooms: { room_number: string; room_type: string } | null;
  stays: { guest_email: string; roomlabel: string | null } | null;
}

type FilterTab = 'all' | TaskStatus;

/* ── Helpers ────────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatTaskType(taskType: string): string {
  return taskType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getRoomLabel(task: ServiceTask): string {
  if (task.property_rooms?.room_number) return task.property_rooms.room_number;
  if (task.stays?.roomlabel) return task.stays.roomlabel;
  return '—';
}

/* ── Status badge ───────────────────────────────────────────────── */

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
    cancelled: 'bg-white/[0.04] text-white/30 border border-white/10',
  };

  const labels: Record<TaskStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* ── Loading skeleton ───────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/[0.06] rounded w-1/3" />
        <div className="h-3 bg-white/[0.04] rounded w-1/4" />
      </div>
      <div className="h-6 bg-white/[0.06] rounded w-16" />
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function RequestsPage() {
  useHotelAdmin(); // ensure we're inside the provider

  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchTasks = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const token = supabase
      ? (await supabase.auth.getSession()).data.session?.access_token
      : null;

    if (!token) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/hotel-admin/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to load requests');
        return;
      }

      const data = (await res.json()) as { tasks: ServiceTask[] };
      setTasks(data.tasks);
      setError(null);
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    void fetchTasks();
    const interval = setInterval(() => void fetchTasks(), 30_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  async function handleAction(task: ServiceTask, newStatus: TaskStatus) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );

    const supabase = getSupabaseBrowser();
    const token = supabase
      ? (await supabase.auth.getSession()).data.session?.access_token
      : null;

    if (!token) return;

    try {
      const res = await fetch(`/api/hotel-admin/requests/${task.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert optimistic update on failure
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)),
        );
      } else {
        const data = (await res.json()) as { task: ServiceTask };
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? data.task : t)),
        );
      }
    } catch {
      // Revert optimistic update on error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)),
      );
    }
  }

  // Count per tab
  const counts: Record<FilterTab, number> = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
  };

  const filteredTasks =
    activeTab === 'all' ? tasks : tasks.filter((t) => t.status === activeTab);

  return (
    <div className="px-5 py-8 md:px-8 space-y-6">
      {/* Page title */}
      <h1 className="text-[22px] font-semibold text-white">Requests</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive ? 'text-[#C9A84C]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span
                  className={`ml-1.5 text-[11px] ${isActive ? 'text-[#C9A84C]/70' : 'text-white/20'}`}
                >
                  {counts[key]}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C] rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell size={32} className="text-white/20" />
          <p className="text-[13px] text-white/30">No requests yet</p>
        </div>
      )}

      {/* Request list */}
      {!loading && filteredTasks.length > 0 && (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4"
            >
              {/* Left: info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-medium text-white truncate">
                    {task.title}
                  </span>
                  <span className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md shrink-0">
                    {formatTaskType(task.task_type)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-white/30">
                  <span>Room {getRoomLabel(task)}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {timeAgo(task.createdat)}
                  </span>
                </div>
              </div>

              {/* Right: status + action */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={task.status} />
                {task.status === 'pending' && (
                  <button
                    onClick={() => void handleAction(task, 'in_progress')}
                    className="text-[12px] font-medium text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Start
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => void handleAction(task, 'completed')}
                    className="text-[12px] font-medium text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
