'use client';

import { useState } from 'react';

export default function ConciergeSearch() {
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-[520px] px-4 pt-3 animate-fade-in-up">
      <div
        className={`
          relative flex items-center
          bg-[var(--card-bg)] border rounded-[8px]
          transition-all duration-300 ease-out
          ${isFocused
            ? 'border-[var(--gold)]/35 shadow-[0_6px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(201,168,76,0.1)] -translate-y-0.5'
            : 'border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          }
        `}
      >
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search guests, venues, services, or ask the concierge…"
          className="w-full bg-transparent py-3 pl-11 pr-12 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none tracking-wide"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] text-[var(--text-faint)] bg-[var(--surface-raised)] border border-[var(--border)] rounded font-mono">⌘K</kbd>
        </div>
      </div>
    </div>
  );
}
