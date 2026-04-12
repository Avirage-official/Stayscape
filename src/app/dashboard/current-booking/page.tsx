'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';

import PostLoginHero from '@/components/guest-lounge/PostLoginHero';
import CurrentBookingView from '@/components/guest-lounge/CurrentBookingView';
import AddStayDialog from '@/components/guest-lounge/AddStayDialog';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';

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

  if (loadState === 'loading') {
    return <GuestArrivalSkeleton />;
  }

  return (
    <>
      <PostLoginHero>
        {/* ── Minimal top bar — matches post-login nav style ── */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-10 lg:px-14 h-[64px]">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors cursor-pointer"
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
            <span className="text-[12px] font-medium tracking-[0.18em] uppercase hidden sm:inline">
              Back
            </span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="font-serif text-[18px] sm:text-[20px] text-white/90 tracking-[0.06em]">
              Stayscape
            </span>
            <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase mt-0.5 hidden sm:block">
              Your Booking
            </span>
          </div>

          <div className="w-[52px]" />
        </header>

        {/* ── Error state ── */}
        {loadState === 'error' && (
          <div className="h-full flex items-center justify-center px-6">
            <div className="text-center">
              <p className="text-[14px] text-white/50 mb-4">{errorMsg}</p>
              <button
                type="button"
                onClick={refetch}
                className="text-[13px] text-white/70 hover:text-white border border-white/20 px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Ready state ── */}
        {loadState === 'ready' && data && (
          <CurrentBookingView
            stay={data.upcomingStay}
            onAddStay={() => setAddStayOpen(true)}
          />
        )}
      </PostLoginHero>

      <AddStayDialog open={addStayOpen} onOpenChange={setAddStayOpen} />
    </>
  );
}

/* ─── Page shell ─── */

export default function CurrentBookingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <GuestArrivalSkeleton />;
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return <CurrentBookingContent userId={user.id} />;
}
