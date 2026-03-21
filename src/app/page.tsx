'use client';

import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import MapPlaceholder from '@/components/MapPlaceholder';
import TravelAssistantPanel, { TravelAssistantPanelHandle } from '@/components/TravelAssistantPanel';
import ConciergeSearch from '@/components/ConciergeSearch';
import Footer from '@/components/Footer';
import { Place } from '@/types';

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const panelRef = useRef<TravelAssistantPanelHandle>(null);

  const handleSelectPlace = useCallback((place: Place) => {
    setSelectedPlace(place);
    panelRef.current?.selectPlace(place);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] overflow-hidden">
      <Header />
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Floating concierge search */}
        <ConciergeSearch />
        <main className="flex flex-1 overflow-hidden">
          {/* Left panel — Travel Assistant */}
          <div className="hidden lg:flex w-[360px] flex-shrink-0 flex-col overflow-hidden border-r border-[#1A1A1A]/80">
            <TravelAssistantPanel
              ref={panelRef}
              selectedPlace={selectedPlace}
              onClearSelection={() => setSelectedPlace(null)}
            />
          </div>
          {/* Right panel — Map workspace */}
          <div className="flex-1 relative">
            <MapPlaceholder
              onSelectPlace={handleSelectPlace}
              selectedPlaceId={selectedPlace?.id ?? null}
            />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
