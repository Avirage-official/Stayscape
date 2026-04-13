'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData, CustomerStay } from '@/types/customer';

import PostLoginHero from '@/components/guest-lounge/PostLoginHero';
import HeroTopNav from '@/components/guest-lounge/HeroTopNav';
import ConciergePrompt from '@/components/guest-lounge/ConciergePrompt';
import StayContextMeta from '@/components/guest-lounge/StayContextMeta';
import ExpandedMenuOverlay from '@/components/guest-lounge/ExpandedMenuOverlay';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import AddStayDialog from '@/components/guest-lounge/AddStayDialog';
import DemoBookingActivation from '@/components/guest-lounge/DemoBookingActivation';

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

/* ─── Date helper ─── */

/** Parse a date-only string to a local Date, avoiding timezone shifts. */
function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/* ─── Stay card (multi-stay grid) ─── */

function StayCard({ stay, onClick }: { stay: CustomerStay; onClick: () => void }) {
  const checkIn = stay.check_in
    ? parseLocalDate(stay.check_in).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : '—';
  const checkOut = stay.check_out
    ? parseLocalDate(stay.check_out).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : '—';

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-500',
    pending: 'bg-amber-400',
    cancelled: 'bg-red-500',
  };
  const dotColor = statusColors[stay.status?.toLowerCase()] ?? 'bg-white/30';

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group relative text-left w-full rounded-2xl p-5 border
        bg-white/[0.04] border-white/[0.08]
        hover:bg-white/[0.07] hover:border-[var(--gold)]/30
        hover:shadow-[0_0_24px_rgba(201,168,76,0.10)]
        transition-all duration-300 cursor-pointer
      "
    >
      {/* Status dot */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[11px] text-white/40 uppercase tracking-[0.18em] font-medium capitalize">
          {stay.status}
        </span>
      </div>

      {/* Hotel name */}
      <p className="font-serif text-[18px] text-white/90 group-hover:text-white leading-snug mb-1 transition-colors">
        {stay.property?.name ?? 'Unknown Hotel'}
      </p>

      {/* City / address */}
      {stay.property?.address && (
        <p className="text-[12px] text-white/35 mb-4 truncate">
          {stay.property.address}
        </p>
      )}

      {/* Dates */}
      <div className="flex items-center gap-2 text-[12px] text-white/50">
        <span className="text-white/70">{checkIn}</span>
        <span className="text-white/20">—</span>
        <span className="text-white/70">{checkOut}</span>
      </div>

      {/* Arrow */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
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
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Guest Arrival — the premium cinematic post-login experience.
   Full-screen hero, centered concierge prompt, overlay menu.
   ═══════════════════════════════════════════════════════════════ */

function GuestArrivalContent({
  userId,
  onLogout,
}: {
  userId: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [menuOpen, setMenuOpen] = useState(false);
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

  const firstName = data?.profile.full_name?.split(' ')[0] ?? 'Guest';
  const stays = data?.upcomingStays ?? (data?.upcomingStay ? [data.upcomingStay] : []);
  const stay = stays[0] ?? null;
  const stayContext = stay?.property?.name
    ? `${stay.property.name}${stay.property.address ? ` · ${stay.property.address}` : ''}`
    : null;

  if (loadState === 'loading') {
    return <GuestArrivalSkeleton />;
  }

  return (
    <>
      <PostLoginHero>
        {/* Top navigation */}
        <HeroTopNav
          onMenuOpen={() => setMenuOpen(true)}
          onLogout={onLogout}
          stayContext={stayContext}
        />

        {/* Error state */}
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

        {/* Main content */}
        {loadState === 'ready' && data && (
          <>
            {stays.length === 0 ? (
              /* ── No stay yet: show the demo PMS activation flow ── */
              <div className="h-full overflow-y-auto flex flex-col items-center justify-center">
                <DemoBookingActivation
                  userId={userId}
                  firstName={firstName}
                  onActivated={refetch}
                />
              </div>
            ) : stays.length === 1 ? (
              /* ── Exactly 1 stay: show the concierge prompt ── */
              <>
                <div className="h-full flex flex-col items-center justify-center pb-16">
                  <ConciergePrompt firstName={firstName} hotelName={stay?.property?.name} />
                </div>
                {stay && (
                  <StayContextMeta
                    hotelName={stay.property?.name}
                    city={stay.property?.address}
                    checkIn={stay.check_in}
                    checkOut={stay.check_out}
                    status={stay.status}
                  />
                )}
              </>
            ) : (
              /* ── 2+ stays: show stay cards grid ── */
              <div className="h-full overflow-y-auto">
                <div className="px-6 sm:px-10 lg:px-14 pt-24 pb-16">
                  {/* Compact concierge greeting */}
                  <div className="mb-8">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--gold)]/70 font-medium mb-2">
                      Your Stays
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl text-white/90">
                      Welcome back, {firstName}.
                    </h2>
                    <p className="text-[14px] text-white/45 mt-1.5">
                      Select a stay to view your curated experience.
                    </p>
                  </div>

                  {/* Stay cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {stays.map((s) => (
                      <StayCard
                        key={s.id}
                        stay={s}
                        onClick={() =>
                          router.push(
                            `/dashboard/current-booking?stayId=${encodeURIComponent(s.id)}`,
                          )
                        }
                      />
                    ))}

                    {/* Add stay card */}
                    <button
                      type="button"
                      onClick={() => setAddStayOpen(true)}
                      className="
                        group text-left rounded-2xl p-5 border
                        border-white/[0.06] border-dashed
                        hover:border-[var(--gold)]/30 hover:bg-white/[0.03]
                        transition-all duration-300 cursor-pointer
                        flex flex-col items-center justify-center gap-3 min-h-[120px]
                      "
                    >
                      <span className="w-10 h-10 rounded-full border border-white/10 group-hover:border-[var(--gold)]/30 flex items-center justify-center transition-colors">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white/30 group-hover:text-[var(--gold)]/60 transition-colors"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                      <span className="text-[13px] text-white/30 group-hover:text-white/50 transition-colors">
                        Add another stay
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </PostLoginHero>

      {/* Overlay menu */}
      <ExpandedMenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddStay={() => setAddStayOpen(true)}
      />

      {/* Add stay dialog */}
      <AddStayDialog
        open={addStayOpen}
        onOpenChange={setAddStayOpen}
        userId={userId}
        onActivated={refetch}
      />
    </>
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
    return <GuestArrivalSkeleton />;
  }

  /* Not authenticated — redirect */
  if (!user) {
    router.replace('/login');
    return null;
  }

  /* Authenticated — render cinematic arrival */
  return <GuestArrivalContent userId={user.id} onLogout={handleLogout} />;
}
