'use client';

import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-[48px] bg-[var(--header-bg)] border-b border-[var(--header-border)] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <span className="font-serif text-[17px] text-[var(--gold)] tracking-[0.04em]">Stayscape</span>
        <span className="hidden sm:inline text-[9px] text-[var(--text-faint)] tracking-[0.18em] uppercase border-l border-[var(--border-subtle)] pl-3 font-light">Concierge</span>
      </div>

      <ThemeToggle />
    </header>
  );
}
