'use client';

import { useState } from 'react';

export default function Header() {
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="flex items-center justify-between px-6 h-[72px] bg-[#111111] border-b border-[#2A2A2A] flex-shrink-0">
      {/* Logo */}
      <div className="flex flex-col">
        <span className="font-serif text-xl text-[#D4AF37] tracking-wide">Stayscape</span>
        <span className="text-xs text-gray-500 tracking-widest uppercase">Discover more. Stay better.</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search places, restaurants, activities..."
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-full py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
        />
      </div>

      {/* User */}
      <div className="flex items-center space-x-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-200">Mr. Anderson</div>
          <div className="text-xs text-gray-500">Suite 1204</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#D4AF37] bg-opacity-20 border border-[#D4AF37] border-opacity-40 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
