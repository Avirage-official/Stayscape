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

      {/* Minimal nav */}
      <nav className="hidden md:flex items-center space-x-6">
        <span className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors duration-200 tracking-wide">Guests</span>
        <span className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors duration-200 tracking-wide">Bookings</span>
        <span className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors duration-200 tracking-wide">Services</span>
      </nav>

      {/* Concierge operator */}
      <div className="flex items-center space-x-3">
        <ThemeToggle />
        <div className="flex items-center space-x-2">
          <div className="w-[6px] h-[6px] rounded-full bg-emerald-500/70" />
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">On Duty</span>
        </div>
        <div className="w-px h-4 bg-[var(--border-subtle)]" />
        <div className="flex items-center space-x-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide">L. Marchand</div>
          </div>
          <div className="w-7 h-7 rounded-[6px] bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
            <span className="text-[10px] text-[var(--gold)] font-medium">LM</span>
          </div>
        </div>
      </div>
    </header>
  );
}
