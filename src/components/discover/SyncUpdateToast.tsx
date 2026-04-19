'use client';

import { useEffect } from 'react';

export default function SyncUpdateToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 discover-card-fade-in">
      <div className="
        flex items-start gap-3 px-5 py-3.5
        rounded-2xl border border-[var(--discover-gold)]/25
        bg-[var(--discover-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      ">
        <span className="
          flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0
          bg-[var(--discover-gold-12)] border border-[var(--discover-gold-25)]
          text-[var(--discover-gold)] text-[12px]
        ">
          ✦
        </span>
        <p className="text-[12px] text-[var(--discover-title)] leading-relaxed">
          ✦ Your guide was refreshed last night with the latest places.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[var(--discover-body)] hover:text-[var(--discover-title)] transition-colors cursor-pointer p-1 -mr-1"
          aria-label="Dismiss update notice"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
