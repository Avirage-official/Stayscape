'use client';

import { useState } from 'react';

export default function Header() {
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="flex items-center justify-between px-6 h-[56px] bg-[#0E0E0E] border-b border-[#1A1A1A] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <span className="font-serif text-lg text-[#D4AF37] tracking-wide">Stayscape</span>
        <span className="hidden sm:inline text-[10px] text-gray-600 tracking-[0.15em] uppercase border-l border-[#1E1E1E] pl-3">Concierge Workspace</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-sm mx-8 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search guests, rooms, services…"
          className="w-full bg-[#141414] border border-[#1E1E1E] rounded-lg py-1.5 pl-9 pr-4 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/40 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all duration-200"
        />
      </div>

      {/* User */}
      <div className="flex items-center space-x-3">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium text-gray-300">Mr. Anderson</div>
          <div className="text-[10px] text-gray-600">Suite 1204</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/25 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
