'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConciergeExperience from '@/components/concierge/ConciergeExperience';
import DiscoverPanel from '@/components/DiscoverPanel';
import ItineraryPanel from '@/components/ItineraryPanel';
import { ItineraryProvider } from '@/components/ItineraryContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RegionProvider, useRegion } from '@/lib/context/region-context';
import { getStaySelectedRegion } from '@/components/guest-lounge/stay-region';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';
import WarmBottomTabBar from '@/components/guest-lounge/WarmBottomTabBar';

type ActiveTab = 'concierge' | 'discover' | 'itinerary';

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { region: globalRegion } = useRegion();
  const { user } = useAuth();

  // No ?tab param (/app)           → ConciergeExperience (full-width)
  // ?tab=discover (/app?tab=discover) → DiscoverPanel
  // ?tab=itinerary (/app?tab=itinerary) → ItineraryPanel
  const tabParam = searchParams?.get('tab');
  const activeTab: ActiveTab =
    tabParam === 'discover'
      ? 'discover'
      : tabParam === 'itinerary'
        ? 'itinerary'
        : 'concierge';
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [regionSetupFailed, setRegionSetupFailed] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const prevAwaitingRegionRef = useRef(false);
  const MAX_REGION_POLL_ATTEMPTS = 10;

  const selectedStay =
    dashboardData?.currentStays?.[0] ??
    dashboardData?.upcomingStays?.[0] ??
    dashboardData?.upcomingStay ??
    null;
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
    <ItineraryProvider stayId={selectedStay?.id}>
      <div
        className="relative flex flex-col h-screen overflow-hidden"
        style={{ background: 'var(--background)' }}
      >
        {loadingOverlay}

        {/* Main layout */}
        <main className="flex flex-1 overflow-hidden">
          {activeTab === 'concierge' ? (
            <ErrorBoundary fallbackTitle="Concierge">
              <div className="flex flex-1 overflow-hidden">
                <ConciergeExperience
                  stayId={selectedStay?.id ?? null}
                  guestName={dashboardData?.profile?.full_name ?? null}
                  propertyName={selectedStay?.property?.name ?? null}
                  propertyImageUrl={selectedStay?.property?.image_url ?? null}
                  propertyCity={selectedStay?.property?.city ?? null}
                  propertyCountry={selectedStay?.property?.country ?? null}
                  bookingReference={selectedStay?.booking_reference ?? null}
                  checkIn={selectedStay?.check_in ?? null}
                  checkOut={selectedStay?.check_out ?? null}
                  guestCount={selectedStay?.guests ?? null}
                  userId={user?.id ?? null}
                />
              </div>
            </ErrorBoundary>
          ) : activeTab === 'discover' ? (
            <ErrorBoundary fallbackTitle="Discover">
              <DiscoverPanel
                stayId={selectedStay?.id ?? null}
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
