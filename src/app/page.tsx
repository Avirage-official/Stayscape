'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import MapPlaceholder from '@/components/MapPlaceholder';
import PlaceSidebar from '@/components/PlaceSidebar';
import StayInfoCard from '@/components/StayInfoCard';
import QuickActionsCard from '@/components/QuickActionsCard';
import RecommendationCards from '@/components/RecommendationCards';
import { Place } from '@/types';

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  return (
    <div className="flex flex-col h-screen bg-dark overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        {/* Left column ~280px */}
        <div className="hidden lg:flex w-72 flex-shrink-0 flex-col overflow-y-auto p-4 space-y-4 border-r border-dark-border">
          <StayInfoCard />
          <QuickActionsCard />
        </div>
        {/* Center - map */}
        <div className="flex-1 relative">
          <MapPlaceholder />
        </div>
        {/* Right sidebar ~320px */}
        <div className="hidden lg:block w-80 flex-shrink-0 overflow-y-auto border-l border-dark-border">
          <PlaceSidebar selectedPlace={selectedPlace} />
        </div>
      </main>
      {/* Bottom recommendations */}
      <div className="flex-shrink-0 border-t border-dark-border bg-[#0A0A0A]">
        <RecommendationCards onSelectPlace={setSelectedPlace} />
      </div>
    </div>
  );
}
