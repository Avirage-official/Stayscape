'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MapPlaceholder from '@/components/MapPlaceholder';
import CustomerPanel from '@/components/CustomerPanel';
import TravelAssistantPanel, { TravelAssistantPanelHandle } from '@/components/TravelAssistantPanel';
import ConciergeSearch from '@/components/ConciergeSearch';
import DiscoverPanel from '@/components/DiscoverPanel';
import ItineraryPanel from '@/components/ItineraryPanel';
import { ItineraryProvider } from '@/components/ItineraryContext';
import Footer from '@/components/Footer';
import { Place } from '@/types';
import { useRegion } from '@/lib/context/region-context';

type ActiveTab = 'concierge' | 'discover' | 'itinerary';
type MobileView = 'map' | 'guest' | 'assistant';

export default function Home() {
  const router = useRouter();
  const { region } = useRegion();
  const [activeTab, setActiveTab] = useState<ActiveTab>('concierge');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('map');
  const panelRef = useRef<TravelAssistantPanelHandle>(null);

  /* Redirect to region selection if no region chosen */
  useEffect(() => {
    if (region === null) {
      router.replace('/select-region');
    }
  }, [region, router]);

  const handleSelectPlace = useCallback((place: Place) => {
    setSelectedPlace(place);
    panelRef.current?.selectPlace(place);
  }, []);

  return (
    <ItineraryProvider>
    <div className="flex flex-col h-screen bg-[var(--background)] overflow-hidden">
      <Header />

      {/* ── Tab bar ── */}
      <div className="flex items-center px-4 sm:px-6 h-[36px] bg-[var(--header-bg)] border-b border-[var(--header-border)] flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('concierge')}
            className={`px-3.5 py-1.5 rounded-[5px] text-[10px] font-medium tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'concierge'
                ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--tab-hover)] border border-transparent'
            }`}
          >
            Concierge
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-3.5 py-1.5 rounded-[5px] text-[10px] font-medium tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--tab-hover)] border border-transparent'
            }`}
          >
            Discover
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('itinerary')}
            className={`px-3.5 py-1.5 rounded-[5px] text-[10px] font-medium tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'itinerary'
                ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--tab-hover)] border border-transparent'
            }`}
          >
            Itinerary
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Floating concierge search — only on concierge tab */}
        {activeTab === 'concierge' && <ConciergeSearch />}
        <main className="flex flex-1 overflow-hidden">
          {/* Left panel — Customer dossier (desktop: always visible, mobile: shown when mobileView=guest) */}
          <div className={`${mobileView === 'guest' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[320px] flex-shrink-0 flex-col overflow-hidden lg:border-r border-[var(--charcoal-light)]/80`}>
            <CustomerPanel />
          </div>

          {activeTab === 'concierge' ? (
            <>
              {/* Center — Map workspace */}
              <div className={`flex-1 relative min-h-0 ${mobileView === 'map' ? 'flex' : 'hidden'} lg:flex flex-col`}>
                <MapPlaceholder
                  onSelectPlace={handleSelectPlace}
                  selectedPlaceId={selectedPlace?.id ?? null}
                />
              </div>
              {/* Right panel — AI Travel Assistant */}
              <div className={`${mobileView === 'assistant' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[360px] flex-shrink-0 flex-col overflow-hidden lg:border-l border-[var(--charcoal-light)]/80`}>
                <TravelAssistantPanel
                  ref={panelRef}
                  selectedPlace={selectedPlace}
                  onClearSelection={() => setSelectedPlace(null)}
                />
              </div>
            </>
          ) : activeTab === 'discover' ? (
            /* Discover tab — full remaining width */
            <DiscoverPanel />
          ) : (
            /* Itinerary tab — full remaining width */
            <ItineraryPanel />
          )}
        </main>
        <Footer />
      </div>

      {/* ── Mobile bottom navigation ── (only on concierge tab) */}
      {activeTab === 'concierge' && (
        <div className="lg:hidden flex items-center justify-around h-[52px] bg-[var(--header-bg)] border-t border-[var(--header-border)] flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
              mobileView === 'map' ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span className="text-[9px] mt-0.5 tracking-wide">Map</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('guest')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
              mobileView === 'guest' ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-[9px] mt-0.5 tracking-wide">Guest</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('assistant')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
              mobileView === 'assistant' ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[9px] mt-0.5 tracking-wide">Assistant</span>
          </button>
        </div>
      )}
    </div>
    </ItineraryProvider>
  );
}
