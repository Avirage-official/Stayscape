'use client';

import Header from '@/components/Header';
import MapPlaceholder from '@/components/MapPlaceholder';
import CustomerPanel from '@/components/CustomerPanel';
import AICopilotPanel from '@/components/AICopilotPanel';
import ConciergeSearch from '@/components/ConciergeSearch';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] overflow-hidden">
      <Header />
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Floating concierge search */}
        <ConciergeSearch />
        <main className="flex flex-1 overflow-hidden">
          {/* Left panel — Customer dossier */}
          <div className="hidden lg:flex w-[320px] flex-shrink-0 flex-col overflow-hidden border-r border-[#1A1A1A]/80">
            <CustomerPanel />
          </div>
          {/* Center — Map workspace */}
          <div className="flex-1 relative">
            <MapPlaceholder />
          </div>
          {/* Right panel — AI Copilot */}
          <div className="hidden lg:flex w-[300px] flex-shrink-0 flex-col overflow-hidden border-l border-[#1A1A1A]/80">
            <AICopilotPanel />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
