'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewRow {
  id: string;
  name: string;
  region: string;
  category: string;
  city: string;
  flagged_at: string;
}

type Action = 'approve' | 'delete';
type RowState = 'idle' | 'loading' | 'done' | 'error';

export default function ReviewQueueClient({ rows: initialRows }: { rows: ReviewRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [rows, setRows] = useState(initialRows);
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleAction(id: string, action: Action) {
    setStates((s) => ({ ...s, [id]: 'loading' }));
    setErrors((e) => { const next = { ...e }; delete next[id]; return next; });

    try {
      const res = await fetch(`/api/admin/places/${id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error((body.error as string | undefined) ?? `${res.status}`);
      }
      setStates((s) => ({ ...s, [id]: 'done' }));
      // Remove from list after short delay so user sees the done state
      setTimeout(() => {
        setRows((r) => r.filter((row) => row.id !== id));
        startTransition(() => router.refresh());
      }, 800);
    } catch (err) {
      setStates((s) => ({ ...s, [id]: 'error' }));
      setErrors((e) => ({ ...e, [id]: err instanceof Error ? err.message : 'Failed' }));
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-white/40">All clear — no places flagged for review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/35 pb-1">
        These places were flagged by Claude during re-verification (quality score dropped below threshold).
        Approve to restore them as active, or delete to remove permanently.
      </p>

      <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {rows.map((row) => {
          const state = states[row.id] ?? 'idle';
          const error = errors[row.id];
          const isDone = state === 'done';
          const isLoading = state === 'loading';

          return (
            <div
              key={row.id}
              className={`flex items-center gap-4 px-5 py-4 transition-opacity ${
                isDone ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{row.name}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {row.region} · {row.category} · {row.city}
                </p>
                {error && (
                  <p className="text-xs text-red-400 mt-1">{error}</p>
                )}
              </div>

              {/* Flagged date */}
              <span className="hidden md:block text-xs text-white/30 tabular-nums shrink-0">
                {new Date(row.flagged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={isLoading || isDone}
                  onClick={() => void handleAction(row.id, 'approve')}
                  className="h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:pointer-events-none disabled:opacity-40"
                >
                  {isLoading ? '…' : isDone ? '✓' : 'Approve'}
                </button>
                <button
                  disabled={isLoading || isDone}
                  onClick={() => void handleAction(row.id, 'delete')}
                  className="h-8 rounded-lg border border-red-500/25 bg-red-500/10 px-3 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:pointer-events-none disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
