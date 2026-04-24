'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CustomerPanel from '@/components/CustomerPanel';
import TravelAssistantPanel from '@/components/TravelAssistantPanel';
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

type ActiveTab = 'concierge' | 'discover' | 'itinerary';
type MobileView = 'guest' | 'assistant';

export default function Home() {
  const router = useRouter();
  const { region: globalRegion } = useRegion();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('concierge');
  const [mobileView, setMobileView] = useState<MobileView>('guest');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [regionSetupFailed, setRegionSetupFailed] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const prevAwaitingRegionRef = useRef(false);
  const MAX_REGION_POLL_ATTEMPTS = 10;

  // Derive region from the selected stay's property — this takes precedence over localStorage
  const selectedStay = dashboardData?.upcomingStay ?? null;
  const stayRegion = selectedStay ? getStaySelectedRegion(selectedStay) : null;

  // Whether we are waiting for a region to be created in the background
  const awaitingRegion = selectedStay !== null && stayRegion === null && !regionSetupFailed;

  /* Redirect to region selection only when no stay exists AND no global region */
  useEffect(() => {
    if (selectedStay === null && stayRegion === null && globalRegion === null) {
      router.replace('/select-region');
    }
  }, [selectedStay, stayRegion, globalRegion, router]);

  /* Fetch dashboard / stay data when user is available */
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/customer/dashboard?userId=${encodeURIComponent(user.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DashboardData | null) => {
        if (data) setDashboardData(data);
      })
      .catch(() => {});
  }, [user?.id]);

  /* Poll every 5 s while waiting for region creation to complete */
  useEffect(() => {
    if (!awaitingRegion || !user?.id) {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      return;
    }
    // Reset attempt counter only when awaitingRegion transitions false → true
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

  /* Loading overlay — shown while region is being created */
  const city = selectedStay?.property?.city ?? null;
  const loadingOverlay = regionSetupFailed ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="rounded-2xl bg-black/80 border border-white/10 px-10 py-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4 text-center shadow-2xl">
        <span
          className="inline-block w-12 h-12 rounded-full"
          style={{ backgroundColor: '#C9A84C', opacity: 0.85 }}
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
          className="mt-2 px-6 py-2 rounded-full text-sm font-medium tracking-wide text-black cursor-pointer"
          style={{ backgroundColor: '#C9A84C' }}
        >
          Continue anyway
        </button>
      </div>
    </div>
  ) : awaitingRegion ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="rounded-2xl bg-black/80 border border-white/10 px-10 py-10 flex flex-col items-center gap-4 max-w-sm w-full mx-4 text-center shadow-2xl">
        {/* Gold pulse ring */}
        <span
          className="inline-block w-12 h-12 rounded-full animate-pulse"
          style={{ backgroundColor: '#C9A84C', opacity: 0.85 }}
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
      {/* Cinematic background */}
      <div className="fixed inset-0 -z-10">
        <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover"
            priority
          />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="relative flex flex-col h-screen overflow-hidden">
        <Header />

        {/* Tab bar */}
        <div className="flex items-center px-5 sm:px-8 h-[42px] bg-black/50 border-b border-white/10 flex-shrink-0 gap-6">
          {(['concierge', 'discover', 'itinerary'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`h-full flex items-center text-[11px] tracking-[0.14em] uppercase font-medium border-b-2 transition-colors duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'text-[#C9A84C] border-[#C9A84C]'
                  : 'text-white/45 border-transparent hover:text-white/75'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Mobile sub-nav */}
        {activeTab === 'concierge' && (
          <div className="lg:hidden flex items-center justify-around h-[48px] bg-black/50 border-b border-white/10 flex-shrink-0">
            {(['guest', 'assistant'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setMobileView(view)}
                className={`flex items-center justify-center gap-1.5 flex-1 h-full text-[11px] font-medium tracking-wide transition-colors duration-200 cursor-pointer uppercase ${
                  mobileView === view ? 'text-[#C9A84C]' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Main layout */}
        <main className="flex flex-1 overflow-hidden">
          {activeTab === 'concierge' ? (
            <ErrorBoundary fallbackTitle="Map & Concierge">
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                  {/* Left — Guest panel */}
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

                  {/* Center — Timeline + quick actions */}
                  <div className="hidden lg:flex lg:w-[24%] flex-col overflow-y-auto scrollbar-hide border-r border-white/10 bg-black/70 p-4 gap-4">
                    <ItineraryTimeline />
                    <QuickActions
                      stayId={dashboardData?.upcomingStay?.id}
                      onContactAI={() => setMobileView('assistant')}
                    />
                  </div>

                  {/* Right — AI Assistant */}
                  <div className={`${mobileView === 'assistant' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-1 flex-col overflow-hidden bg-black/70`}>
                    <TravelAssistantPanel
                      selectedPlace={null}
                      onClearSelection={() => {}}
                      stayId={dashboardData?.upcomingStay?.id ?? null}
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
      </div>
    </ItineraryProvider>
  );

  // When the selected stay has a region, wrap the page in a scoped RegionProvider
  // so Discover, map and curation use the stay's region instead of the global localStorage value.
  return stayRegion ? (
    <RegionProvider initialRegion={stayRegion}>
      {pageContent}
    </RegionProvider>
  ) : pageContent;
}
