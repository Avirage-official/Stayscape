'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerPanel from '@/components/CustomerPanel';
import DiscoverPanel from '@/components/DiscoverPanel';
import ItineraryPanel from '@/components/ItineraryPanel';
import { ItineraryProvider } from '@/components/ItineraryContext';
import ItineraryTimeline from '@/components/concierge/ItineraryTimeline';
import QuickActions from '@/components/concierge/QuickActions';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RegionProvider, useRegion } from '@/lib/context/region-context';
import { getStaySelectedRegion } from '@/components/guest-lounge/stay-region';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';
import WarmBottomTabBar from '@/components/guest-lounge/WarmBottomTabBar';

type ActiveTab = 'concierge' | 'discover' | 'itinerary';
type MobileView = 'guest' | 'assistant';

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

  // Stay summary panel data (used in concierge tab right column)
  const summarySt = dashboardData?.upcomingStay ?? null;
  const summaryCity = summarySt?.property?.city ?? '';
  const summaryCheckIn = summarySt?.check_in ?? null;
  const summaryCheckOut = summarySt?.check_out ?? null;
  const summaryNights =
    summaryCheckIn && summaryCheckOut
      ? Math.max(
          1,
          Math.round(
            (new Date(summaryCheckOut).getTime() - new Date(summaryCheckIn).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;
  const fmtStayDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };
  const detailLabelStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: 'rgba(255,255,255,0.25)',
    marginBottom: 4,
  };
  const detailValueStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.75)',
  };
  const loadingOverlay = regionSetupFailed ? (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#0F0E0C', gap: 16 }}
    >
      <h2
        style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 20,
          color: 'rgba(255,255,255,0.80)',
          margin: 0,
        }}
      >
        Still getting things ready.
      </h2>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
        You can explore in the meantime.
      </p>
      <button
        type="button"
        onClick={() => setRegionSetupFailed(false)}
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: '#C17F3A',
          background: 'transparent',
          border: '1px solid rgba(193,127,58,0.30)',
          padding: '8px 20px',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Continue →
      </button>
    </div>
  ) : awaitingRegion ? (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#0F0E0C', gap: 16 }}
    >
      <div
        className="app-spin"
        style={{
          width: 32,
          height: 32,
          border: '2px solid rgba(193,127,58,0.20)',
          borderTopColor: '#C17F3A',
          borderRadius: 999,
        }}
      />
      <h2
        style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 20,
          color: 'rgba(255,255,255,0.80)',
          margin: 0,
        }}
      >
        {city ? `Setting up ${city}…` : 'Setting up your experience…'}
      </h2>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
        This only takes a moment
      </p>
    </div>
  ) : null;

  const pageContent = (
    <ItineraryProvider stayId={dashboardData?.upcomingStay?.id}>
      {loadingOverlay}
      <div className="fixed inset-0 -z-10 bg-[#0F0E0C]" />

      <div
        className="relative flex flex-col h-screen overflow-hidden"
        data-theme="dark"
      >
        {/* Tab bar */}
        <div
          className="flex items-center px-5 sm:px-8 h-[42px] border-b flex-shrink-0 gap-6"
          style={{
            background: '#0F0E0C',
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
                  color: isActive ? '#C17F3A' : 'rgba(255,255,255,0.45)',
                  borderColor: isActive ? '#C17F3A' : 'transparent',
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
              background: '#0F0E0C',
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
                    color: isActive ? '#C17F3A' : 'rgba(255,255,255,0.40)',
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

                  <div className="hidden lg:flex lg:flex-1 flex-col overflow-y-auto scrollbar-hide border-l border-white/[0.07]"
                    style={{ background: 'rgba(15,14,12,0.80)', padding: 24 }}
                  >
                    {/* Status badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(193,127,58,0.12)',
                        border: '1px solid rgba(193,127,58,0.25)',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                        color: '#C17F3A',
                        marginBottom: 20,
                      }}
                    >
                      {summarySt?.status ?? 'upcoming'}
                    </div>

                    {/* Hotel name */}
                    <p
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontStyle: 'italic',
                        fontSize: 22,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.90)',
                        lineHeight: 1.2,
                        marginBottom: 4,
                      }}
                    >
                      {summarySt?.property?.name ?? 'Your Stay'}
                    </p>

                    {/* City */}
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.08em',
                        marginBottom: 24,
                      }}
                    >
                      {summaryCity}
                    </p>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

                    {/* Details grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <p style={detailLabelStyle}>Check-in</p>
                        <p style={detailValueStyle}>{summaryCheckIn ? fmtStayDate(summaryCheckIn) : '—'}</p>
                      </div>
                      <div>
                        <p style={detailLabelStyle}>Check-out</p>
                        <p style={detailValueStyle}>{summaryCheckOut ? fmtStayDate(summaryCheckOut) : '—'}</p>
                      </div>
                      <div>
                        <p style={detailLabelStyle}>Nights</p>
                        <p style={detailValueStyle}>{summaryNights ?? '—'}</p>
                      </div>
                      <div>
                        <p style={detailLabelStyle}>Room</p>
                        <p style={detailValueStyle}>{summarySt?.room_type ?? '—'}</p>
                      </div>
                      <div>
                        <p style={detailLabelStyle}>Guests</p>
                        <p style={detailValueStyle}>{summarySt?.guests ?? 1}</p>
                      </div>
                      <div>
                        <p style={detailLabelStyle}>Status</p>
                        <p style={detailValueStyle}>{summarySt?.curation_status ?? '—'}</p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />

                    {/* Discover link */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('discover')}
                      className="app-discover-link"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#C17F3A',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        marginTop: 'auto',
                      }}
                    >
                      Explore {summaryCity} →
                    </button>

                    {/* Powered by note */}
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.20)',
                        lineHeight: 1.5,
                        marginTop: 16,
                      }}
                    >
                      Powered by Stayscape
                    </p>
                  </div>
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
