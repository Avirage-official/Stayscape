'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';

import CurrentBookingView from '@/components/guest-lounge/CurrentBookingView';
import AddStayDialog from '@/components/guest-lounge/AddStayDialog';

type LoadState = 'loading' | 'ready' | 'error';

async function fetchDashboardApi(userId: string): Promise<DashboardData> {
  const res = await fetch(
    `/api/customer/dashboard?userId=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to load dashboard',
    );
  }
  return res.json() as Promise<DashboardData>;
}

/* ─── Inner content (requires userId) ─── */

function CurrentBookingContent({ userId }: { userId: string }) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [addStayOpen, setAddStayOpen] = useState(false);

  /* Initial fetch via lazy initializer (project pattern) */
  useState(() => {
    fetchDashboardApi(userId)
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  });

  const refetch = useCallback(() => {
    setLoadState('loading');
    fetchDashboardApi(userId)
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  }, [userId]);

  const handleBack = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--dashboard-bg)' }}
    >
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 backdrop-blur-md border-b border-[var(--dashboard-border-subtle)]" style={{ background: 'var(--dashboard-header-bg)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 sm:px-10 h-[56px]">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-[13px] text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <span className="font-serif text-[16px] text-[var(--dashboard-text-primary)] tracking-[0.04em]">
            Current Booking
          </span>

          <div className="w-[52px]" />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-10 sm:py-14">
        {/* Loading state */}
        {loadState === 'loading' && <BookingSkeleton />}

        {/* Error state */}
        {loadState === 'error' && (
          <div className="text-center py-20">
            <p className="text-[14px] text-[var(--dashboard-text-muted)] mb-4">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={refetch}
              className="text-[13px] text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)] border border-[var(--dashboard-card-border)] px-5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Ready state */}
        {loadState === 'ready' && data && (
          <CurrentBookingView
            stay={data.upcomingStay}
            onAddStay={() => setAddStayOpen(true)}
          />
        )}
      </main>

      {/* Add stay dialog */}
      <AddStayDialog open={addStayOpen} onOpenChange={setAddStayOpen} />
    </div>
  );
}

/* ─── Skeleton loader ─── */

function BookingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] overflow-hidden">
        <div className="h-56 bg-[var(--dashboard-surface-raised)]" />
        <div className="px-8 pb-8 -mt-6 relative z-10 space-y-3">
          <div className="h-8 w-64 rounded bg-[var(--dashboard-surface-raised)]" />
          <div className="h-4 w-40 rounded bg-[var(--dashboard-surface-raised)]" />
          <div className="h-4 w-56 rounded bg-[var(--dashboard-surface-raised)]" />
        </div>
      </div>

      {/* Details skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-32 rounded bg-[var(--dashboard-surface-raised)]" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-[var(--dashboard-surface-raised)]" />
              <div className="h-5 w-28 rounded bg-[var(--dashboard-surface-raised)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page shell ─── */

export default function CurrentBookingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dashboard-bg)' }}>
        <div className="animate-pulse text-[var(--dashboard-text-faint)] text-sm">
          Loading…
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return <CurrentBookingContent userId={user.id} />;
}
