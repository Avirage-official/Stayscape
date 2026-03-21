'use client';

import Header from '@/components/Header';
import MapPlaceholder from '@/components/MapPlaceholder';
import CustomerPanel from '@/components/CustomerPanel';
import AICopilotPanel from '@/components/AICopilotPanel';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-dark overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        {/* Left panel — Customer details */}
        <div className="hidden lg:flex w-[300px] flex-shrink-0 flex-col overflow-hidden border-r border-[#1A1A1A]">
          <CustomerPanel />
        </div>
        {/* Center — Map workspace */}
        <div className="flex-1 relative">
          <MapPlaceholder />
        </div>
        {/* Right panel — AI Copilot */}
        <div className="hidden lg:flex w-[300px] flex-shrink-0 flex-col overflow-hidden border-l border-[#1A1A1A]">
          <AICopilotPanel />
        </div>
      </main>
    </div>
  );
}
