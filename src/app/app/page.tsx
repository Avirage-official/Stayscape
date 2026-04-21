'use client';

import { useState, useEffect } from 'react';
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
import { useRegion } from '@/lib/context/region-context';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';

type ActiveTab = 'concierge' | 'discover' | 'itinerary';
type MobileView = 'guest' | 'assistant';

export default function Home() {
  const router = useRouter();
  const { region } = useRegion();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('concierge');
  const [mobileView, setMobileView] = useState<MobileView>('guest');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  /* Redirect to region selection if no region chosen */
  useEffect(() => {
    if (region === null) {
      router.replace('/select-region');
    }
  }, [region, router]);

  /* Fetch dashboard / stay data when user is available */
  useState(() => {
    if (!user?.id) return;
    fetch(`/api/customer/dashboard?userId=${encodeURIComponent(user.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DashboardData | null) => {
        if (data) setDashboardData(data);
      })
      .catch(() => {});
  });

  return (
    <ItineraryProvider stayId={dashboardData?.upcomingStay?.id}>
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
          <div className="lg:hidden flex items-center justify-around h-[40px] bg-black/50 border-b border-white/10 flex-shrink-0">
            {(['guest', 'assistant'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setMobileView(view)}
                className={`flex items-center justify-center gap-1.5 flex-1 h-full text-[10px] font-medium tracking-wide transition-colors duration-200 cursor-pointer uppercase ${
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

                <div className="border-t border-white/10 bg-black/60">
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
}
