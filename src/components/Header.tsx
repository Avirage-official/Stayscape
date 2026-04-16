'use client';

import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-[52px] bg-[var(--header-bg)] border-b border-[var(--header-border)] flex-shrink-0">
      {/* Left — Back to dashboard */}
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors duration-200 cursor-pointer group"
        aria-label="Back to dashboard"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          <path d="M19 12H5" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span className="text-[11px] tracking-[0.14em] uppercase hidden sm:inline">Dashboard</span>
      </button>

      {/* Center — Wordmark */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <span className="font-serif text-[17px] sm:text-[18px] text-[var(--gold)] tracking-[0.06em]">
          Stayscape
        </span>
        <span className="text-[9px] text-white/40 tracking-[0.2em] uppercase mt-0.5 hidden sm:block">
          Concierge
        </span>
      </div>

      {/* Right — Theme toggle only */}
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
