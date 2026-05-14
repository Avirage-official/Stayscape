'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, Clock, X } from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getHotelAdminToken } from '@/lib/hotel-admin-token';

/* ── Types ── */

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
  cancel_reason?: string | null;
  property_rooms: { room_number: string; room_type: string } | null;
  stays: { guest_email: string; roomlabel: string | null } | null;
}

interface TaskMessage {
  id: string;
  sender_role: 'guest' | 'hotel';
  message: string;
  createdat: string;
}

type FilterTab = 'all' | TaskStatus;

/* ── Helpers ── */

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatTaskType(taskType: string): string {
  return taskType.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getRoomLabel(task: ServiceTask): string {
  if (task.property_rooms?.room_number) return task.property_rooms.room_number;
  if (task.stays?.roomlabel) return task.stays.roomlabel;
  return '—';
}

/* ── Status badge ── */

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    pending:     'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    completed:   'bg-green-500/10 text-green-400 border border-green-500/20',
    cancelled:   'bg-white/[0.04] text-white/30 border border-white/10',
  };
  const labels: Record<TaskStatus, string> = {
    pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

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

/* ── Task Drawer ── */

function TaskDrawer({
  task,
  onClose,
  onStatusChange,
}: {
  task: ServiceTask;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus, cancelReason?: string) => Promise<void>;
}) {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const token = await getHotelAdminToken();
    if (!token) return;
    const res = await fetch(`/api/hotel-admin/requests/${task.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const json = (await res.json()) as { messages: TaskMessage[] };
    setMessages(json.messages);
    setLoadingMsgs(false);
  }, [task.id]);

  useEffect(() => { void fetchMessages(); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    const token = await getHotelAdminToken();
    if (!token) { setSending(false); return; }
    try {
      const res = await fetch(`/api/hotel-admin/requests/${task.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const json = (await res.json()) as { message: TaskMessage };
        setMessages((prev) => [...prev, json.message]);
      }
    } finally { setSending(false); }
  };

  const handleAction = async (newStatus: TaskStatus, reason?: string) => {
    setActioning(true);
    try {
      await onStatusChange(task.id, newStatus, reason);
      // If cancelled with reason, post it as a hotel message so guest sees it
      if (newStatus === 'cancelled' && reason?.trim()) {
        const token = await getHotelAdminToken();
        if (token) {
          const res = await fetch(`/api/hotel-admin/requests/${task.id}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Request cancelled: ${reason.trim()}` }),
          });
          if (res.ok) {
            const json = (await res.json()) as { message: TaskMessage };
            setMessages((prev) => [...prev, json.message]);
          }
        }
      }
      onClose();
    } finally { setActioning(false); }
  };

  const handleCancelConfirm = async () => {
    setShowCancelModal(false);
    await handleAction('cancelled', cancelReason);
  };

  const isClosed = task.status === 'completed' || task.status === 'cancelled';

  return (
    <>
      {/* Drawer backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0e0e0c] border-l border-white/[0.06] z-50 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[15px] font-medium text-white truncate">{task.title}</p>
              <StatusBadge status={task.status} />
            </div>
            <p className="mt-1 text-[12px] text-white/40">
              {formatTaskType(task.task_type)} · Room {getRoomLabel(task)}
              {task.stays?.guest_email && <> · {task.stays.guest_email}</>}
            </p>
            {task.description && (
              <p className="mt-2 text-[13px] text-white/50 leading-relaxed">{task.description}</p>
            )}
            {task.status === 'cancelled' && task.cancel_reason && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-[12px] text-red-400"><span className="font-medium">Reason: </span>{task.cancel_reason}</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0 mt-0.5" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Action buttons */}
        {!isClosed && (
          <div className="px-5 py-3 border-b border-white/[0.06] flex gap-2">
            {task.status === 'pending' && (
              <button
                onClick={() => void handleAction('in_progress')}
                disabled={actioning}
                className="text-[12px] font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                Start
              </button>
            )}
            {task.status === 'in_progress' && (
              <button
                onClick={() => void handleAction('completed')}
                disabled={actioning}
                className="text-[12px] font-medium text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                Mark Complete
              </button>
            )}
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actioning}
              className="text-[12px] font-medium text-white/30 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {loadingMsgs ? (
            <p className="text-[13px] text-white/30 text-center m-auto">Loading…</p>
          ) : messages.length === 0 ? (
            <div className="m-auto text-center">
              <p className="text-[13px] text-white/30">No messages yet.</p>
              {!isClosed && <p className="text-[12px] text-white/20 mt-1">Send a message to the guest below.</p>}
            </div>
          ) : (
            messages.map((m) => {
              const isHotel = m.sender_role === 'hotel';
              return (
                <div key={m.id} className={`flex ${isHotel ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl ${
                    isHotel
                      ? 'bg-[#C9A84C] text-[#1a1208] rounded-br-sm'
                      : 'bg-white/[0.06] text-white border border-white/[0.06] rounded-bl-sm'
                  }`}>
                    <p className="text-[13px] leading-[1.45]">{m.message}</p>
                    <p className={`text-[10px] mt-1 opacity-55 ${isHotel ? 'text-right' : 'text-left'}`}>
                      {isHotel ? 'You' : 'Guest'} · {formatTime(m.createdat)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message input */}
        {!isClosed ? (
          <div className="px-4 py-3 border-t border-white/[0.06] flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
              placeholder="Message guest…"
              rows={1}
              className="flex-1 resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-colors"
              style={{ minHeight: 40, maxHeight: 120, lineHeight: 1.4 }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="h-10 w-10 rounded-xl bg-[#C9A84C] text-[#1a1208] flex items-center justify-center shrink-0 hover:bg-[#d4b05c] transition-colors disabled:opacity-40"
              aria-label="Send"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 border-t border-white/[0.06] text-center">
            <p className="text-[12px] text-white/30">This request is {task.status}. Thread is read-only.</p>
          </div>
        )}
      </div>

      {/* Cancel with reason modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-5" onClick={() => setShowCancelModal(false)}>
          <div className="bg-[#151512] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[16px] font-semibold text-white mb-1">Cancel this request?</p>
            <p className="text-[13px] text-white/40 mb-4">Optionally add a reason — the guest will see it in their thread.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Fully booked, will reschedule tomorrow…"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/20 px-3 py-2.5 resize-none focus:outline-none focus:border-white/20 transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-11 rounded-xl border border-white/[0.08] text-[13px] text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                Go back
              </button>
              <button
                onClick={() => void handleCancelConfirm()}
                disabled={actioning}
                className="flex-1 h-11 rounded-xl bg-red-500/20 border border-red-500/30 text-[13px] text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {actioning ? 'Cancelling…' : 'Cancel request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Main page ── */

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function RequestsPage() {
  useHotelAdmin();

  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);

  const fetchTasks = useCallback(async () => {
    const token = await getHotelAdminToken();
    if (!token) { setError('Session expired.'); setLoading(false); return; }
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

  useEffect(() => {
    void fetchTasks();
    const interval = setInterval(() => void fetchTasks(), 30_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, cancelReason?: string) => {
    // Optimistic
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    const token = await getHotelAdminToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/hotel-admin/requests/${taskId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...(cancelReason ? { cancel_reason: cancelReason } : {}) }),
      });
      if (!res.ok) {
        // revert
        void fetchTasks();
      } else {
        const data = (await res.json()) as { task: ServiceTask };
        setTasks((prev) => prev.map((t) => t.id === taskId ? data.task : t));
      }
    } catch {
      void fetchTasks();
    }
  };

  const counts: Record<FilterTab, number> = {
    all:         tasks.length,
    pending:     tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed:   tasks.filter((t) => t.status === 'completed').length,
    cancelled:   tasks.filter((t) => t.status === 'cancelled').length,
  };

  const filteredTasks = activeTab === 'all' ? tasks : tasks.filter((t) => t.status === activeTab);

  return (
    <div className="px-5 py-8 md:px-8 space-y-6">
      <h1 className="text-[22px] font-semibold text-white">Requests</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive ? 'text-[#C9A84C]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1.5 text-[11px] ${isActive ? 'text-[#C9A84C]/70' : 'text-white/20'}`}>
                  {counts[key]}
                </span>
              )}
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C] rounded-t" />}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
      )}

      {loading && <div className="space-y-3"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>}

      {!loading && !error && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell size={32} className="text-white/20" />
          <p className="text-[13px] text-white/30">No requests yet</p>
        </div>
      )}

      {!loading && filteredTasks.length > 0 && (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors active:scale-[0.99]"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-medium text-white truncate">{task.title}</span>
                  <span className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md shrink-0">
                    {formatTaskType(task.task_type)}
                  </span>
                </div>
                {task.description && (
                  <p className="text-[12px] text-white/40 leading-relaxed line-clamp-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 text-[12px] text-white/30">
                  <span>Room {getRoomLabel(task)}</span>
                  {task.stays?.guest_email && <span className="truncate max-w-[160px]">{task.stays.guest_email}</span>}
                  <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(task.createdat)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={task.status} />
                <span className="text-[11px] text-white/20">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task detail drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
