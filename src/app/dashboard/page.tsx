'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData, CustomerStay } from '@/types/customer';

import CurrentBookingView from '@/components/guest-lounge/CurrentBookingView';
import ConciergePrompt from '@/components/guest-lounge/ConciergePrompt';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import AddStayDialog from '@/components/guest-lounge/AddStayDialog';
import WarmBottomTabBar from '@/components/guest-lounge/WarmBottomTabBar';

type LoadState = 'loading' | 'ready' | 'error';

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop';

/* ─── Fetch helper ─── */

async function fetchDashboardApi(): Promise<DashboardData> {
  const res = await fetch('/api/customer/dashboard', {
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to load dashboard',
    );
  }
  return res.json() as Promise<DashboardData>;
}

/* ─── Date helper ─── */

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function getTimeOfDay(): 'MORNING' | 'AFTERNOON' | 'EVENING' {
  const hour = new Date().getHours();
  if (hour < 12) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
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
  const dotColor =
    statusColors[stay.status?.toLowerCase()] ?? 'bg-[var(--text-faint)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left w-full rounded-2xl p-5 cursor-pointer transition-all duration-300"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span
          className="text-[11px] uppercase tracking-[0.18em] font-medium capitalize"
          style={{ color: 'var(--text-muted)' }}
        >
          {stay.status}
        </span>
      </div>

      <p
        className="font-serif text-[18px] leading-snug mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {stay.property?.name ?? 'Unknown Hotel'}
      </p>

      {stay.property?.address && (
        <p
          className="text-[12px] mb-4 truncate"
          style={{ color: 'var(--text-secondary)' }}
        >
          {stay.property.address}
        </p>
      )}

      <div
        className="flex items-center gap-2 text-[12px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span>{checkIn}</span>
        <span style={{ color: 'var(--text-faint)' }}>—</span>
        <span>{checkOut}</span>
      </div>
    </button>
  );
}

/* ─── Warm Greeting ─── */

function WarmGreeting({
  firstName,
  hotelName,
  city,
}: {
  firstName: string;
  hotelName?: string | null;
  city?: string | null;
}) {
  const tod = getTimeOfDay();
  return (
    <div className="px-5 sm:px-8 pt-8 pb-6">
      <p
        className="text-[10px] uppercase font-medium mb-3"
        style={{ color: 'var(--gold)', letterSpacing: '0.2em' }}
      >
        GOOD {tod}
      </p>
      <h1
        className="font-serif text-[28px] leading-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        Welcome back, {firstName}.
      </h1>
      {hotelName && (
        <div className="mt-4">
          <span
            className="inline-block px-3 py-1 rounded-full text-[12px] font-medium"
            style={{
              background: 'var(--gold-subtle)',
              color: 'var(--gold)',
            }}
          >
            {hotelName}
            {city ? ` · ${city}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Guest Arrival — warm modern post-login experience.
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
  const [addStayOpen, setAddStayOpen] = useState(false);

  // Lazy initial fetch
  useState(() => {
    fetchDashboardApi()
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
    fetchDashboardApi()
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  }, []);

  const firstName = data?.profile.full_name?.split(' ')[0] ?? 'Guest';
  const currentStays = data?.currentStays ?? [];
  const upcomingStays = data?.upcomingStays ?? [];
  const pastStays = data?.pastStays ?? [];
  const activeStays = [...currentStays, ...upcomingStays];
  const stay = activeStays[0] ?? null;

  if (loadState === 'loading') {
    return <GuestArrivalSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        {/* Warm top header */}
        <div
          className="sticky top-0 z-40 px-5 sm:px-8 h-[60px] flex items-center justify-between"
          style={{
            background: 'var(--header-bg)',
            borderBottom: '1px solid var(--header-border)',
          }}
        >
          <span
            className="font-serif text-[20px]"
            style={{ color: 'var(--gold)' }}
          >
            Stayscape
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="text-[12px] cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Sign out
          </button>
        </div>

        {/* Page content */}
        <div className="pt-2 pb-4">
          {loadState === 'error' && (
            <div className="px-5 sm:px-8 py-12 text-center">
              <p
                className="text-[14px] mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={refetch}
                className="text-[13px] px-5 py-2 rounded-lg transition-colors cursor-pointer"
                style={{
                  color: 'var(--gold)',
                  border: '1px solid var(--border)',
                }}
              >
                Try again
              </button>
            </div>
          )}

          {loadState === 'ready' && data && (
            <>
              {activeStays.length === 0 && pastStays.length === 0 ? (
                /* No stay yet: discovery experience (NoBookingState) */
                <CurrentBookingView
                  stay={null}
                  onAddStay={() => setAddStayOpen(true)}
                />
              ) : activeStays.length === 1 && pastStays.length === 0 ? (
                /* Exactly 1 active stay, no history: warm greeting + hotel image + concierge */
                <>
                  <WarmGreeting
                    firstName={firstName}
                    hotelName={stay?.property?.name}
                    city={stay?.property?.address}
                  />

                  {/* Hotel hero strip */}
                  <div className="px-5 sm:px-8">
                    <div className="relative w-full h-[200px] sm:h-[220px] rounded-2xl overflow-hidden">
                      <Image
                        src={stay?.property?.image_url || HERO_FALLBACK}
                        alt={stay?.property?.name ?? 'Hotel'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 720px"
                        priority
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(to bottom, transparent 40%, rgba(28,26,23,0.4) 100%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* ConciergePrompt below */}
                  <div className="px-5 sm:px-8 pt-6">
                    <ConciergePrompt
                      firstName={firstName}
                      hotelName={stay?.property?.name}
                      stayId={stay?.id ?? null}
                    />
                  </div>
                </>
              ) : (
                /* Multiple stays or has history: categorised sections */
                <>
                  <WarmGreeting
                    firstName={firstName}
                    hotelName={stay?.property?.name}
                    city={stay?.property?.address}
                  />

                  <div className="px-5 sm:px-8 space-y-8 pt-2">
                    {currentStays.length > 0 && (
                      <div>
                        <p
                          className="text-[11px] uppercase font-medium mb-4"
                          style={{
                            color: 'var(--gold)',
                            letterSpacing: '0.2em',
                          }}
                        >
                          Current Stay{currentStays.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                          {currentStays.map((s) => (
                            <div
                              key={s.id}
                              className="flex-shrink-0 w-[260px] sm:w-[280px]"
                            >
                              <StayCard
                                stay={s}
                                onClick={() =>
                                  router.push(
                                    `/dashboard/stay/${encodeURIComponent(s.id)}`,
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {upcomingStays.length > 0 && (
                      <div>
                        <p
                          className="text-[11px] uppercase font-medium mb-4"
                          style={{
                            color: 'var(--gold)',
                            letterSpacing: '0.2em',
                          }}
                        >
                          Upcoming Stay{upcomingStays.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                          {upcomingStays.map((s) => (
                            <div
                              key={s.id}
                              className="flex-shrink-0 w-[260px] sm:w-[280px]"
                            >
                              <StayCard
                                stay={s}
                                onClick={() =>
                                  router.push(
                                    `/dashboard/stay/${encodeURIComponent(s.id)}`,
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pastStays.length > 0 && (
                      <div>
                        <p
                          className="text-[11px] uppercase font-medium mb-4"
                          style={{
                            color: 'var(--text-muted)',
                            letterSpacing: '0.2em',
                          }}
                        >
                          Past Stay{pastStays.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                          {pastStays.map((s) => (
                            <div
                              key={s.id}
                              className="flex-shrink-0 w-[260px] sm:w-[280px] opacity-70"
                            >
                              <StayCard
                                stay={s}
                                onClick={() =>
                                  router.push(
                                    `/dashboard/stay/${encodeURIComponent(s.id)}`,
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add stay card */}
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setAddStayOpen(true)}
                        className="w-[180px] group text-left rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3"
                        style={{
                          border: '1px dashed var(--border)',
                          background: 'var(--surface-raised)',
                        }}
                      >
                        <span
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                          style={{
                            border: '1px solid var(--border)',
                            color: 'var(--gold)',
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
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
                        </span>
                        <span
                          className="text-[13px] text-center"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Add another stay
                        </span>
                      </button>
                    </div>

                    {stay && (
                      <div className="pt-2">
                        <ConciergePrompt
                          firstName={firstName}
                          hotelName={stay.property?.name}
                          stayId={stay.id ?? null}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <WarmBottomTabBar />
      </div>

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

  if (authLoading) {
    return <GuestArrivalSkeleton />;
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return <GuestArrivalContent userId={user.id} onLogout={handleLogout} />;
}
