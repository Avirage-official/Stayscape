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
    active: 'bg-blue-500',
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
        bg-white/[0.10] border-white/[0.12] backdrop-blur-xl
        hover:bg-white/[0.15] hover:border-[var(--gold)]/30
        hover:shadow-[0_0_24px_rgba(201,168,76,0.10)]
        transition-all duration-300 cursor-pointer
      "
    >
      {/* Status dot */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[11px] text-white/55 uppercase tracking-[0.18em] font-medium capitalize">
          {stay.status}
        </span>
      </div>

      {/* Hotel name */}
      <p className="font-serif text-[18px] text-white/90 group-hover:text-white leading-snug mb-1 transition-colors">
        {stay.property?.name ?? 'Unknown Hotel'}
      </p>

      {/* City / address */}
      {stay.property?.address && (
        <p className="text-[12px] text-white/50 mb-4 truncate">
          {stay.property.address}
        </p>
      )}

      {/* Dates */}
      <div className="flex items-center gap-2 text-[12px] text-white/60">
        <span className="text-white/70">{checkIn}</span>
        <span className="text-white/30">—</span>
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
  const currentStays = data?.currentStays ?? [];
  const upcomingStays = data?.upcomingStays ?? [];
  const pastStays = data?.pastStays ?? [];
  // "active" stays = current + upcoming (for display / concierge logic)
  const activeStays = [...currentStays, ...upcomingStays];
  const stay = activeStays[0] ?? null;
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
            {activeStays.length === 0 && pastStays.length === 0 ? (
              /* ── No stay yet: show the demo PMS activation flow ── */
              <div className="h-full overflow-y-auto flex flex-col items-center justify-center">
                <DemoBookingActivation
                  userId={userId}
                  firstName={firstName}
                  onActivated={refetch}
                />
              </div>
            ) : activeStays.length === 1 && pastStays.length === 0 ? (
              /* ── Exactly 1 active stay, no history: show the concierge prompt ── */
              <>
                <div className="h-full flex flex-col items-center justify-center pb-16">
                  <ConciergePrompt firstName={firstName} hotelName={stay?.property?.name} />
                </div>
                {stay && (
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/stay/${encodeURIComponent(stay.id)}`)}
                    className="absolute bottom-0 left-0 right-0 cursor-pointer group"
                    aria-label="View stay details"
                  >
                    <StayContextMeta
                      hotelName={stay.property?.name}
                      city={stay.property?.address}
                      checkIn={stay.check_in}
                      checkOut={stay.check_out}
                      status={stay.status}
                    />
                  </button>
                )}
              </>
            ) : (
              /* ── Multiple stays or has history: show categorised sections ── */
              <>
                <div className="h-full overflow-y-auto flex flex-col">
                  <div className="flex-shrink-0 px-6 sm:px-10 lg:px-14 pt-24 pb-6 space-y-8">

                    {/* Current stays */}
                    {currentStays.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--gold)]/70 font-medium mb-4">
                          Current Stay{currentStays.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                          {currentStays.map((s) => (
                            <div key={s.id} className="flex-shrink-0 w-[260px] sm:w-[280px]">
                              <StayCard
                                stay={s}
                                onClick={() => router.push(`/dashboard/stay/${encodeURIComponent(s.id)}`)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming stays */}
                    {upcomingStays.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--gold)]/70 font-medium mb-4">
                          Upcoming Stay{upcomingStays.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                          {upcomingStays.map((s) => (
                            <div key={s.id} className="flex-shrink-0 w-[260px] sm:w-[280px]">
                              <StayCard
                                stay={s}
                                onClick={() => router.push(`/dashboard/stay/${encodeURIComponent(s.id)}`)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past stays */}
                    {pastStays.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium mb-4">
                          Past Stay{pastStays.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                          {pastStays.map((s) => (
                            <div key={s.id} className="flex-shrink-0 w-[260px] sm:w-[280px] opacity-60">
                              <StayCard
                                stay={s}
                                onClick={() => router.push(`/dashboard/stay/${encodeURIComponent(s.id)}`)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add stay card */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setAddStayOpen(true)}
                        className="
                          w-[160px] group text-left rounded-2xl p-5 border
                          border-white/[0.10] border-dashed
                          hover:border-[var(--gold)]/30 hover:bg-white/[0.05]
                          transition-all duration-300 cursor-pointer
                          flex flex-col items-center justify-center gap-3
                        "
                      >
                        <span className="w-10 h-10 rounded-full border border-white/15 group-hover:border-[var(--gold)]/30 flex items-center justify-center transition-colors">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white/45 group-hover:text-[var(--gold)]/60 transition-colors"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </span>
                        <span className="text-[13px] text-white/45 group-hover:text-white/60 transition-colors text-center">
                          Add another stay
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ConciergePrompt — always the hero element */}
                  {stay && (
                    <div className="flex-1 flex flex-col items-center justify-center pb-16 min-h-[280px]">
                      <ConciergePrompt firstName={firstName} hotelName={stay.property?.name} />
                    </div>
                  )}
                </div>

                {/* StayContextMeta — absolute bottom strip showing nearest stay */}
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
        existingBookingRefs={[...currentStays, ...upcomingStays].map((s) => s.booking_reference).filter((ref): ref is string => Boolean(ref))}
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
