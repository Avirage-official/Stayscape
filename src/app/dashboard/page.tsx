'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';

import GuestLoungeHeader from '@/components/guest-lounge/GuestLoungeHeader';
import GuestLoungeSkeleton from '@/components/guest-lounge/GuestLoungeSkeleton';
import WelcomeHero from '@/components/guest-lounge/WelcomeHero';
import CurrentStayCard from '@/components/guest-lounge/CurrentStayCard';
import QuickAccessActions from '@/components/guest-lounge/QuickAccessActions';
import SecondaryModules from '@/components/guest-lounge/SecondaryModules';
import EmptyStayState from '@/components/guest-lounge/EmptyStayState';
import AddStayDialog from '@/components/guest-lounge/AddStayDialog';

type LoadState = 'loading' | 'ready' | 'error';

/* ─── Fetch helper ─── */

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

/* ─── Error state ─── */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-[var(--card-bg)] border border-red-500/20 rounded-xl p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/8 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-[13px] text-[var(--text-muted)] mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-[12px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Guest Lounge Content — the premium post-login experience.
   Uses a lazy useState initializer to kick off the data fetch.
   ═══════════════════════════════════════════════════════════════ */

function GuestLoungeContent({
  userId,
  onLogout,
}: {
  userId: string;
  onLogout: () => void;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [addStayOpen, setAddStayOpen] = useState(false);

  /* Kick off initial fetch via a separate lazy initializer.
     All setters are declared above, so no circular reference. */
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

  const hasStay = !!data?.upcomingStay;
  const firstName =
    data?.profile.full_name?.split(' ')[0] ?? 'Guest';

  if (loadState === 'loading') {
    return <GuestLoungeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <GuestLoungeHeader
        name={data?.profile.full_name ?? 'Guest'}
        avatarUrl={data?.profile.avatar_url ?? null}
        onLogout={onLogout}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loadState === 'error' && (
          <ErrorState message={errorMsg} onRetry={refetch} />
        )}

        {loadState === 'ready' && data && (
          <>
            {/* 1. Welcome hero */}
            <WelcomeHero
              firstName={firstName}
              hasStay={hasStay}
              hotelName={data.upcomingStay?.property?.name}
              city={data.upcomingStay?.property?.address}
            />

            {/* 2. Current stay or empty state */}
            {hasStay ? (
              <CurrentStayCard stay={data.upcomingStay!} />
            ) : (
              <EmptyStayState onAddStay={() => setAddStayOpen(true)} />
            )}

            {/* 3. Quick access actions */}
            <QuickAccessActions disabled={!hasStay} />

            {/* 4. Secondary modules */}
            <SecondaryModules
              hasStay={hasStay}
              hotelName={data.upcomingStay?.property?.name}
              city={data.upcomingStay?.property?.address}
            />

            {/* Footer */}
            <footer className="pt-4 pb-8 text-center">
              <p className="text-[10px] text-[var(--text-dim)] tracking-wide">
                Your private guest experience by Stayscape
              </p>
            </footer>
          </>
        )}
      </main>

      {/* Add stay dialog */}
      <AddStayDialog open={addStayOpen} onOpenChange={setAddStayOpen} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page — outer shell that handles auth gating
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  /* Auth loading */
  if (authLoading) {
    return <GuestLoungeSkeleton />;
  }

  /* Not authenticated — redirect */
  if (!user) {
    router.replace('/login');
    return null;
  }

  /* Authenticated — render guest lounge */
  return <GuestLoungeContent userId={user.id} onLogout={handleLogout} />;
}
