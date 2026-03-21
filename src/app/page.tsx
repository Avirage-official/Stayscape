'use client';

import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import MapPlaceholder from '@/components/MapPlaceholder';
import CustomerPanel from '@/components/CustomerPanel';
import TravelAssistantPanel, { TravelAssistantPanelHandle } from '@/components/TravelAssistantPanel';
import ConciergeSearch from '@/components/ConciergeSearch';
import DiscoverPanel from '@/components/DiscoverPanel';
import Footer from '@/components/Footer';
import { Place } from '@/types';

type ActiveTab = 'concierge' | 'discover';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concierge');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const panelRef = useRef<TravelAssistantPanelHandle>(null);

  const handleSelectPlace = useCallback((place: Place) => {
    setSelectedPlace(place);
    panelRef.current?.selectPlace(place);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] overflow-hidden">
      <Header />

      {/* ── Tab bar ── */}
      <div className="flex items-center px-6 h-[36px] bg-[#0C0C0C] border-b border-[#181818] flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('concierge')}
            className={`px-3.5 py-1.5 rounded-[5px] text-[10px] font-medium tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'concierge'
                ? 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/25'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#161616] border border-transparent'
            }`}
          >
            Concierge
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-3.5 py-1.5 rounded-[5px] text-[10px] font-medium tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/25'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#161616] border border-transparent'
            }`}
          >
            Discover
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Floating concierge search — only on concierge tab */}
        {activeTab === 'concierge' && <ConciergeSearch />}
        <main className="flex flex-1 overflow-hidden">
          {/* Left panel — Customer dossier (always visible) */}
          <div className="hidden lg:flex w-[320px] flex-shrink-0 flex-col overflow-hidden border-r border-[#1A1A1A]/80">
            <CustomerPanel />
          </div>

          {activeTab === 'concierge' ? (
            <>
              {/* Center — Map workspace */}
              <div className="flex-1 relative">
                <MapPlaceholder
                  onSelectPlace={handleSelectPlace}
                  selectedPlaceId={selectedPlace?.id ?? null}
                />
              </div>
              {/* Right panel — AI Travel Assistant */}
              <div className="hidden lg:flex w-[360px] flex-shrink-0 flex-col overflow-hidden border-l border-[#1A1A1A]/80">
                <TravelAssistantPanel
                  ref={panelRef}
                  selectedPlace={selectedPlace}
                  onClearSelection={() => setSelectedPlace(null)}
                />
              </div>
            </>
          ) : (
            /* Discover tab — full remaining width */
            <DiscoverPanel />
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
