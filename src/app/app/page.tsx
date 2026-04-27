'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CustomerPanel from '@/components/CustomerPanel';
import DiscoverPanel from '@/components/DiscoverPanel';
import ItineraryPanel from '@/components/ItineraryPanel';
import { ItineraryProvider } from '@/components/ItineraryContext';
import ItineraryTimeline from '@/components/concierge/ItineraryTimeline';
import QuickActions from '@/components/concierge/QuickActions';
import InsightsStrip from '@/components/concierge/InsightsStrip';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RegionProvider, useRegion } from '@/lib/context/region-context';
import { getStaySelectedRegion } from '@/components/guest-lounge/stay-region';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';
import WarmBottomTabBar from '@/components/guest-lounge/WarmBottomTabBar';

type ActiveTab = 'concierge' | 'discover' | 'itinerary';
type MobileView = 'guest' | 'assistant';

const ACCENT_GOLD = '#C17F3A';

/* ─── Stay Summary Panel (concierge tab right column) ─── */

function StaySummaryPanel({
  dashboardData,
  onGoToDiscover,
}: {
  dashboardData: DashboardData | null;
  onGoToDiscover: () => void;
}) {
  const stay = dashboardData?.upcomingStay ?? null;
  const profile = dashboardData?.profile ?? null;

  const regionName =
    stay?.property?.region?.name ??
    stay?.property?.city ??
    null;

  const checkIn = stay?.check_in ?? null;
  const checkOut = stay?.check_out ?? null;
  const nights =
    checkIn && checkOut
      ? Math.max(
          1,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            background: 'rgba(193,127,58,0.12)',
            border: '1px solid rgba(193,127,58,0.25)',
            color: ACCENT_GOLD,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: ACCENT_GOLD,
              display: 'inline-block',
            }}
          />
          {stay?.status ?? 'Upcoming'}
        </span>
      </div>

      {/* Hotel name */}
      {stay?.property?.name && (
        <h2
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 18,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.90)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {stay.property.name}
        </h2>
      )}

      {/* Guest name */}
      {profile?.full_name && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
          {profile.full_name}
        </p>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* Check-in / Check-out */}
      {(checkIn || checkOut) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {checkIn && (
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 4,
                }}
              >
                Check-in
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)' }}>
                {formatDate(checkIn)}
              </p>
            </div>
          )}
          {checkOut && (
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 4,
                }}
              >
                Check-out
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)' }}>
                {formatDate(checkOut)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Nights count */}
      {nights !== null && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
          {nights} {nights === 1 ? 'night' : 'nights'}
        </p>
      )}

      {/* Room type + guest count */}
      {(stay?.room_type || stay?.guests) && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {stay?.room_type && (
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.60)',
                padding: '3px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {stay.room_type}
            </span>
          )}
          {stay?.guests && (
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.60)',
                padding: '3px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {stay.guests} {stay.guests === 1 ? 'guest' : 'guests'}
            </span>
          )}
        </div>
      )}

      {/* Quick link to Discover */}
      {regionName && (
        <button
          type="button"
          onClick={onGoToDiscover}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 13,
            color: ACCENT_GOLD,
            cursor: 'pointer',
            textAlign: 'left',
            marginTop: 4,
          }}
        >
          Explore {regionName} →
        </button>
      )}
    </div>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { region: globalRegion } = useRegion();
  const { user } = useAuth();

  // URL ?tab=map opens the concierge layout (which renders the map panel);
  // any other value (or unset) defaults to the discover tab.
  const initialTab: ActiveTab =
    searchParams?.get('tab') === 'map' ? 'concierge' : 'discover';
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [mobileView, setMobileView] = useState<MobileView>('guest');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [regionSetupFailed, setRegionSetupFailed] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const prevAwaitingRegionRef = useRef(false);
  const MAX_REGION_POLL_ATTEMPTS = 10;

  const selectedStay = dashboardData?.upcomingStay ?? null;
  const stayRegion = selectedStay ? getStaySelectedRegion(selectedStay) : null;
  const awaitingRegion = selectedStay !== null && stayRegion === null && !regionSetupFailed;

  useEffect(() => {
    if (selectedStay === null && stayRegion === null && globalRegion === null) {
      router.replace('/select-region');
    }
  }, [selectedStay, stayRegion, globalRegion, router]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/customer/dashboard?userId=${encodeURIComponent(user.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DashboardData | null) => {
        if (data) setDashboardData(data);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!awaitingRegion || !user?.id) {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      return;
    }
    if (!prevAwaitingRegionRef.current) {
      pollAttemptsRef.current = 0;
    }
    prevAwaitingRegionRef.current = true;
    let canceled = false;
    const poll = () => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current >= MAX_REGION_POLL_ATTEMPTS) {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        setRegionSetupFailed(true);
        return;
      }
      fetch(`/api/customer/dashboard?userId=${encodeURIComponent(user.id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: DashboardData | null) => {
          if (data) setDashboardData(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!canceled) {
            pollTimerRef.current = setTimeout(poll, 5000);
          }
        });
    };
    pollTimerRef.current = setTimeout(poll, 5000);
    return () => {
      canceled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      prevAwaitingRegionRef.current = false;
    };
  }, [awaitingRegion, user?.id]);

  const city = selectedStay?.property?.city ?? null;
  const loadingOverlay = regionSetupFailed ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="rounded-2xl bg-black/80 border border-white/10 px-10 py-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4 text-center shadow-2xl">
        <span
          className="inline-block w-12 h-12 rounded-full"
          style={{ backgroundColor: ACCENT_GOLD, opacity: 0.85 }}
        />
        <h2 className="text-white text-lg font-semibold tracking-wide">
          We&apos;re still setting up your destination.
        </h2>
        <p className="text-white/60 text-sm leading-relaxed">
          You can explore the app while we finish in the background.
        </p>
        <button
          type="button"
          onClick={() => setRegionSetupFailed(false)}
          className="mt-2 px-6 py-2 rounded-full text-sm font-medium tracking-wide text-white cursor-pointer"
          style={{ backgroundColor: ACCENT_GOLD }}
        >
          Continue anyway
        </button>
      </div>
    </div>
  ) : awaitingRegion ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="rounded-2xl bg-black/80 border border-white/10 px-10 py-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4 text-center shadow-2xl">
        <span
          className="inline-block w-12 h-12 rounded-full animate-pulse"
          style={{ backgroundColor: ACCENT_GOLD, opacity: 0.85 }}
        />
        <h2 className="text-white text-lg font-semibold tracking-wide">
          {city ? `Setting up your ${city} experience…` : 'Setting up your experience…'}
        </h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We&apos;re personalizing your destination — this only takes a moment
        </p>
      </div>
    </div>
  ) : null;

  const pageContent = (
    <ItineraryProvider stayId={dashboardData?.upcomingStay?.id}>
      {loadingOverlay}
      {/* Cinematic background — discover/map keeps dark aesthetic */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: 'rgba(15,14,12,0.65)' }} />
      </div>

      <div
        className="relative flex flex-col h-screen overflow-hidden"
        data-theme="dark"
      >
        <Header />

        {/* Tab bar */}
        <div
          className="flex items-center px-5 sm:px-8 h-[42px] border-b flex-shrink-0 gap-6"
          style={{
            background: 'rgba(15,14,12,0.50)',
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        >
          {(['concierge', 'discover', 'itinerary'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="h-full flex items-center text-[11px] tracking-[0.14em] uppercase font-medium border-b-2 transition-colors duration-200 cursor-pointer"
                style={{
                  color: isActive ? ACCENT_GOLD : 'rgba(255,255,255,0.45)',
                  borderColor: isActive ? ACCENT_GOLD : 'transparent',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Mobile sub-nav */}
        {activeTab === 'concierge' && (
          <div
            className="lg:hidden flex items-center justify-around h-[48px] border-b flex-shrink-0"
            style={{
              background: 'rgba(15,14,12,0.50)',
              borderColor: 'rgba(255,255,255,0.10)',
            }}
          >
            {(['guest', 'assistant'] as const).map((view) => {
              const isActive = mobileView === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => setMobileView(view)}
                  className="flex items-center justify-center gap-1.5 flex-1 h-full text-[11px] font-medium tracking-wide transition-colors duration-200 cursor-pointer uppercase"
                  style={{
                    color: isActive ? ACCENT_GOLD : 'rgba(255,255,255,0.40)',
                  }}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              );
            })}
          </div>
        )}

        {/* Main layout */}
        <main className="flex flex-1 overflow-hidden">
          {activeTab === 'concierge' ? (
            <ErrorBoundary fallbackTitle="Map & Concierge">
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                  <div className={`${mobileView === 'guest' ? 'flex flex-1' : 'hidden'} lg:flex lg:w-[38%] flex-col overflow-hidden border-r border-white/10 bg-black/70`}>
                    <CustomerPanel
                      stayId={dashboardData?.upcomingStay?.id}
                      guestName={dashboardData?.profile?.full_name ?? undefined}
                      roomLabel={dashboardData?.upcomingStay?.room_type ?? undefined}
                      roomType={dashboardData?.upcomingStay?.room_type ?? undefined}
                      guestCount={dashboardData?.upcomingStay?.guests ?? undefined}
                      checkIn={dashboardData?.upcomingStay?.check_in ?? undefined}
                      checkOut={dashboardData?.upcomingStay?.check_out ?? undefined}
                    />
                  </div>

                  <div className="hidden lg:flex lg:w-[24%] flex-col overflow-y-auto scrollbar-hide border-r border-white/10 bg-black/70 p-4 gap-4">
                    <ItineraryTimeline />
                    <QuickActions
                      stayId={dashboardData?.upcomingStay?.id}
                      onContactAI={() => setMobileView('assistant')}
                    />
                  </div>

                  <div className={`${mobileView === 'assistant' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-1 flex-col overflow-y-auto scrollbar-hide`}
                    style={{
                      background: 'rgba(15,14,12,0.70)',
                      borderLeft: '1px solid rgba(255,255,255,0.07)',
                      padding: 20,
                    }}
                  >
                    <StaySummaryPanel
                      dashboardData={dashboardData}
                      onGoToDiscover={() => setActiveTab('discover')}
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 bg-black/60 pb-[env(safe-area-inset-bottom)]">
                  <InsightsStrip />
                </div>
              </div>
            </ErrorBoundary>
          ) : activeTab === 'discover' ? (
            <ErrorBoundary fallbackTitle="Discover">
              <DiscoverPanel
                stayId={dashboardData?.upcomingStay?.id ?? null}
                guestName={dashboardData?.profile?.guestName ?? dashboardData?.profile?.full_name ?? ''}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary fallbackTitle="Itinerary">
              <ItineraryPanel />
            </ErrorBoundary>
          )}
        </main>

        {/* Warm bottom tab bar — consistent across the whole app */}
        <WarmBottomTabBar />
      </div>
    </ItineraryProvider>
  );

  return stayRegion ? (
    <RegionProvider initialRegion={stayRegion}>{pageContent}</RegionProvider>
  ) : (
    pageContent
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}
