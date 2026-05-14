'use client';

import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { StayContext } from '../stay-context';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

/* ─── Types ─── */

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
  cancel_reason?: string | null;
}

interface TaskMessage {
  id: string;
  sender_role: 'guest' | 'hotel';
  message: string;
  createdat: string;
}

/* ─── Status config ─── */

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',     color: '#c9a84c',              bg: 'rgba(201,168,76,0.10)' },
  in_progress: { label: 'In Progress', color: '#6ab0a0',              bg: 'rgba(106,176,160,0.10)' },
  completed:   { label: 'Completed',   color: '#7ab56a',              bg: 'rgba(122,181,106,0.10)' },
  cancelled:   { label: 'Cancelled',   color: 'var(--text-muted)',    bg: 'rgba(120,120,120,0.08)' },
};

/* ─── Helpers ─── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

async function getToken() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const session = (await supabase.auth.getSession()).data.session;
  return session?.access_token ?? null;
}

function formatTaskType(t: string) {
  return t.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/* ─── Request drawer ─── */

function RequestDrawer({
  task,
  onClose,
}: {
  task: ServiceTask;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[task.status];

  const fetchMessages = useCallback(async () => {
    const token = await getToken();
    const res = await fetch(`/api/customer/requests/${task.id}/messages`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const json = (await res.json()) as { messages: TaskMessage[] };
    setMessages(json.messages);
    setLoadingMsgs(false);
  }, [task.id]);

  useEffect(() => { void fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trap body scroll while drawer open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    const token = await getToken();
    try {
      const res = await fetch(`/api/customer/requests/${task.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const json = (await res.json()) as { message: TaskMessage };
        setMessages((prev) => [...prev, json.message]);
      }
    } finally {
      setSending(false);
    }
  };

  const isClosed = task.status === 'completed' || task.status === 'cancelled';

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,16,12,0.60)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'req-fade 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: '22px 22px 0 0',
          width: '100%',
          maxWidth: 520,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {task.title}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {formatTaskType(task.task_type)} · {formatDate(task.createdat)}
              </p>
            </div>
            <span style={{
              flexShrink: 0,
              fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
              padding: '4px 10px', borderRadius: 99,
              color: cfg.color, background: cfg.bg,
            }}>
              {cfg.label}
            </span>
          </div>

          {task.description && (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}

          {task.status === 'cancelled' && task.cancel_reason && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 10,
              background: 'rgba(180,60,60,0.08)', border: '1px solid rgba(180,60,60,0.15)',
            }}>
              <p style={{ margin: 0, fontSize: 12, color: '#e07070' }}>
                <strong>Reason: </strong>{task.cancel_reason}
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loadingMsgs ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 'auto 0' }}>Loading…</p>
          ) : messages.length === 0 ? (
            <div style={{ margin: 'auto 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No messages yet.</p>
              {!isClosed && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Send a message to the team below.</p>
              )}
            </div>
          ) : (
            messages.map((m) => {
              const isGuest = m.sender_role === 'guest';
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isGuest ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '78%',
                    padding: '9px 13px',
                    borderRadius: isGuest ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isGuest ? 'var(--gold)' : 'var(--background)',
                    color: isGuest ? '#1a1208' : 'var(--text-primary)',
                    border: isGuest ? 'none' : '1px solid var(--border)',
                  }}>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{m.message}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 10, opacity: 0.55, textAlign: isGuest ? 'right' : 'left' }}>
                      {isGuest ? 'You' : 'Hotel'} · {formatTime(m.createdat)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!isClosed ? (
          <div style={{
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
              placeholder="Message the team…"
              rows={1}
              className={dmSans.className}
              style={{
                flex: 1, resize: 'none', minHeight: 42, maxHeight: 120,
                borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--background)', color: 'var(--text-primary)',
                fontSize: 13, padding: '10px 12px', fontFamily: 'inherit',
                lineHeight: 1.4, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="ss-gold-btn"
              style={{
                height: 42, width: 42, borderRadius: 12, padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                opacity: !input.trim() || sending ? 0.45 : 1,
              }}
              aria-label="Send message"
            >
              <IconSend />
            </button>
          </div>
        ) : (
          <div style={{
            padding: '14px 20px',
            paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              This request is {task.status}. Thread is read-only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function RequestsPage() {
  const params = useParams();
  const { user } = useAuth();
  const stayCtx = useContext(StayContext);
  const stay = stayCtx?.stay ?? null;

  const stayId =
    typeof params.stayId === 'string' ? params.stayId
    : Array.isArray(params.stayId) ? params.stayId[0] : '';

  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedTask, setSelectedTask] = useState<ServiceTask | null>(null);

  /* New request form */
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('concierge');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchTasks = async () => {
    const token = await getToken();
    const res = await fetch('/api/customer/requests', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed');
    const json = (await res.json()) as { tasks: ServiceTask[] };
    return json.tasks;
  };

  useEffect(() => {
    if (!user) return;
    fetchTasks()
      .then((t) => { setTasks(t); setLoadState('ready'); })
      .catch(() => setLoadState('error'));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/customer/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ task_type: formType, title: formTitle.trim(), description: formDesc.trim() || undefined }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed');
      }
      const { task } = (await res.json()) as { task: ServiceTask };
      setTasks((prev) => [task, ...prev]);
      setFormTitle(''); setFormDesc(''); setFormType('concierge');
      setShowForm(false);
      showToast('Request sent to the team.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={dmSans.className}
      style={{ background: 'var(--background)', minHeight: '100vh', color: 'var(--text-primary)', padding: '28px 20px 80px' }}
    >
      <style>{`
        @keyframes req-fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .req-card { animation: req-fade 0.22s ease both; cursor: pointer; }
        .req-card:active { transform: scale(0.985); }
        .req-card + .req-card { margin-top: 10px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p className={cormorant.className} style={{ margin: 0, fontSize: 'clamp(26px,4vw,36px)', fontWeight: 400, lineHeight: 1.15, color: 'var(--text-primary)' }}>
            My <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Requests</span>
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 300 }}>
            Track your service requests at {stay?.property?.name ?? 'your hotel'}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="ss-gold-btn"
          style={{ height: 42, padding: '0 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>
          + New
        </button>
      </div>

      {/* Loading */}
      {loadState === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="ss-card-raised" style={{ height: 88, borderRadius: 16, opacity: 0.5 }} />)}
        </div>
      )}

      {loadState === 'error' && (
        <div className="ss-card-raised" style={{ padding: 32, textAlign: 'center', borderRadius: 16 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Could not load requests. Please try again.</p>
        </div>
      )}

      {loadState === 'ready' && tasks.length === 0 && (
        <div className="ss-card-raised" style={{ padding: '48px 32px', textAlign: 'center', borderRadius: 20 }}>
          <div style={{ marginBottom: 14 }}><IconBell /></div>
          <p className={cormorant.className} style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' }}>No requests yet</p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 300 }}>Tap the button above to send your first request.</p>
          <button type="button" onClick={() => setShowForm(true)} className="ss-gold-btn"
            style={{ height: 44, padding: '0 24px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
            Make a request
          </button>
        </div>
      )}

      {loadState === 'ready' && tasks.length > 0 && (
        <div>
          {tasks.map((task, i) => {
            const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={task.id} className="req-card ss-card-raised"
                style={{ borderRadius: 16, padding: '16px 18px', animationDelay: `${i * 0.04}s`, transition: 'transform 0.12s ease' }}
                onClick={() => setSelectedTask(task)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTask(task); }}
                aria-label={`Open ${task.title}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}>
                        {task.description}
                      </p>
                    )}
                    <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                      {formatDate(task.createdat)}
                      {task.property_rooms && <> · Room {task.property_rooms.room_number}</>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                      padding: '4px 10px', borderRadius: 99, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>Tap to view →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request detail drawer */}
      {selectedTask && (
        <RequestDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* New request modal */}
      {showForm && (
        <div role="dialog" aria-modal="true" onClick={() => { if (!submitting) setShowForm(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,16,12,0.55)',
            backdropFilter: 'blur(6px)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            animation: 'req-fade 0.2s ease',
          }}
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 22, padding: 26,
              maxWidth: 440, width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)', border: '1px solid var(--border)',
            }}
          >
            <p className={cormorant.className} style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' }}>
              New Request
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>REQUEST TYPE</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className={dmSans.className}
                  style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 13, padding: '0 12px', fontFamily: 'inherit' }}>
                  <option value="concierge">Concierge</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="room_service">Room Service</option>
                  <option value="transport">Transport</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>WHAT DO YOU NEED? *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Extra towels, Late checkout…" required className={dmSans.className}
                  style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 13, padding: '0 12px', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>ADDITIONAL DETAILS (optional)</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Any extra details…" rows={3} className={dmSans.className}
                  style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 13, padding: '10px 12px', fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { if (!submitting) setShowForm(false); }} disabled={submitting}
                  className="ss-pill" style={{ flex: 1, height: 46, borderRadius: 14, fontSize: 13, fontWeight: 500, opacity: submitting ? 0.5 : 1 }}>Cancel</button>
                <button type="submit" disabled={submitting || !formTitle.trim()} className="ss-gold-btn"
                  style={{ flex: 1, height: 46, borderRadius: 14, fontSize: 13, fontWeight: 600, opacity: submitting || !formTitle.trim() ? 0.6 : 1 }}>
                  {submitting ? 'Sending…' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-primary)', color: 'var(--surface)',
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500,
          zIndex: 300, boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
          animation: 'req-fade 0.25s ease', maxWidth: 'calc(100% - 40px)', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─── Icons ─── */

function svgProps() {
  return { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'var(--gold)', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}
function IconBell() {
  return <svg {...svgProps()}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
}
function IconSend() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}
