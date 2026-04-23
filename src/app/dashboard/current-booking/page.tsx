'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData, CustomerStay } from '@/types/customer';

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

const MS_PER_DAY = 86400000;

/** Parse a date-only string to a local Date, avoiding timezone shifts. */
function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/* ─── Compact stay panel used in split view ─── */

function SplitStayPanel({ stay, label }: { stay: CustomerStay; label: string }) {
  const checkIn = stay.check_in
    ? parseLocalDate(stay.check_in).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const checkOut = stay.check_out
    ? parseLocalDate(stay.check_out).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const nights =
    stay.check_in && stay.check_out
      ? Math.round(
          (parseLocalDate(stay.check_out).getTime() -
            parseLocalDate(stay.check_in).getTime()) /
            MS_PER_DAY,
        )
      : 0;

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-500',
    pending: 'bg-amber-400',
    cancelled: 'bg-red-500',
  };
  const dotColor = statusColors[stay.status?.toLowerCase()] ?? 'bg-white/30';

  return (
    <div className="flex-1 min-w-0 px-6 sm:px-8 py-8 border border-white/[0.08] rounded-2xl bg-white/[0.03] flex flex-col gap-5">
      {/* Label */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)]/60 font-medium">
        {label}
      </p>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[11px] text-white/40 uppercase tracking-[0.18em] capitalize">
          {stay.status}
        </span>
      </div>

      {/* Hotel name */}
      <div>
        <h3 className="font-serif text-[22px] sm:text-[26px] text-white/90 leading-snug mb-1">
          {stay.property?.name ?? 'Unknown Hotel'}
        </h3>
        {stay.property?.address && (
          <p className="text-[12px] text-white/35 truncate">{stay.property.address}</p>
        )}
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/35 uppercase tracking-[0.14em]">Check-in</span>
          <span className="text-white/70">{checkIn}</span>
        </div>
        <div className="h-px bg-white/[0.06]" />
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/35 uppercase tracking-[0.14em]">Check-out</span>
          <span className="text-white/70">{checkOut}</span>
        </div>
      </div>

      {/* Nights / room */}
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
        {nights > 0 && (
          <span>
            {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        )}
        {nights > 0 && stay.room_type && (
          <span className="w-px h-3 bg-white/10" aria-hidden="true" />
        )}
        {stay.room_type && <span>{stay.room_type}</span>}
      </div>
    </div>
  );
}

/* ─── Inner content (requires userId) ─── */

function CurrentBookingContent({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStayId = searchParams.get('stayId');

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

  // Resolve which stays to show
  const currentStays: CustomerStay[] = data?.currentStays ?? [];
  const upcomingStaysData: CustomerStay[] = data?.upcomingStays ?? [];
  const allActiveStays: CustomerStay[] = [...currentStays, ...upcomingStaysData];
  // Fallback for backward compatibility
  const allStays = allActiveStays.length > 0
    ? allActiveStays
    : (data?.upcomingStay ? [data.upcomingStay] : []);

  // If a specific stayId was requested, reorder so that stay is first
  let displayStays = allStays;
  if (requestedStayId) {
    const idx = allStays.findIndex((s) => s.id === requestedStayId);
    if (idx > 0) {
      displayStays = [allStays[idx], ...allStays.filter((_, i) => i !== idx)];
    }
  }

  // For single-stay view, use existing CurrentBookingView
  const primaryStay = displayStays[0] ?? null;
  const secondStay = displayStays[1] ?? null;
  const extraCount = displayStays.length > 2 ? displayStays.length - 2 : 0;

  const isSplitView = displayStays.length >= 2;

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
          <>
            {isSplitView ? (
              /* ── Split view: 2 stays side-by-side (desktop) / stacked (mobile) ── */
              <div className="h-full overflow-y-auto">
                <div className="px-6 sm:px-10 lg:px-14 pt-20 pb-16">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--gold)]/60 font-medium mb-6">
                    Current Stays
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {primaryStay && (
                      <SplitStayPanel stay={primaryStay} label="Stay 1" />
                    )}
                    {secondStay && (
                      <SplitStayPanel stay={secondStay} label="Stay 2" />
                    )}
                  </div>

                  {extraCount > 0 && (
                    <p className="mt-6 text-[13px] text-white/35 text-center">
                      You have{' '}
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-[var(--gold)]/70 hover:text-[var(--gold)] underline underline-offset-2 cursor-pointer"
                      >
                        {extraCount} more upcoming {extraCount === 1 ? 'stay' : 'stays'}
                      </button>{' '}
                      — go back to see all.
                    </p>
                  )}

                  {/* Add stay */}
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setAddStayOpen(true)}
                      className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all text-[13px] cursor-pointer"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add another stay
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Single stay: original CurrentBookingView ── */
              <CurrentBookingView
                stay={primaryStay}
                onAddStay={() => setAddStayOpen(true)}
              />
            )}
          </>
        )}
      </PostLoginHero>

      <AddStayDialog
        open={addStayOpen}
        onOpenChange={setAddStayOpen}
        userId={userId}
        onActivated={refetch}
      />
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

  return (
    <Suspense fallback={<GuestArrivalSkeleton />}>
      <CurrentBookingContent userId={user.id} />
    </Suspense>
  );
}
