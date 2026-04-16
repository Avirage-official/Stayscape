'use client';

import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-[48px] bg-[rgba(8,8,10,0.85)] border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <span className="font-serif text-[17px] text-[var(--gold)] tracking-[0.04em]">Stayscape</span>
        <span className="hidden sm:inline-flex items-center pl-3">
          <span className="w-px h-3 bg-white/10 mr-3" />
          <span className="text-[9px] text-white/30 tracking-[0.18em] uppercase font-light">Concierge</span>
        </span>
      </div>

      <ThemeToggle />
    </header>
  );
}
