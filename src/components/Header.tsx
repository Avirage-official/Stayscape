'use client';

import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-5 sm:px-8 h-[52px] bg-black/60 border-b border-white/10 flex-shrink-0 relative z-20">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors duration-200 cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span className="text-[11px] tracking-widest uppercase hidden sm:inline">Back</span>
      </button>

      {/* Centre wordmark */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <span className="font-serif text-[18px] text-[#C17F3A] tracking-[0.06em]">Stayscape</span>
        <span className="text-[9px] text-white/35 tracking-[0.22em] uppercase mt-0.5">Concierge</span>
      </div>

      {/* Right — spacer to keep wordmark centered */}
      <span aria-hidden="true" className="w-[14px]" />
    </header>
  );
}
