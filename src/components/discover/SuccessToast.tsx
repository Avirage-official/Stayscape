'use client';

import { FALLBACK_STAY_DAYS } from '@/lib/data/discover-fallback';

const stayDays = FALLBACK_STAY_DAYS;

export default function SuccessToast({
  placeName,
  dayValue,
  bookingUrl,
  onDismiss,
}: {
  placeName: string;
  dayValue: string;
  bookingUrl: string;
  onDismiss: () => void;
}) {
  const dayLabel = stayDays.find((d) => d.value === dayValue)?.label ?? dayValue;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 discover-card-fade-in">
      <div className="
        flex items-center gap-3 px-5 py-3.5
        rounded-2xl border border-[var(--discover-gold)]/25
        bg-[var(--discover-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      ">
        <span className="
          flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0
          bg-[var(--discover-gold-12)] border border-[var(--discover-gold-25)]
        ">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="var(--discover-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--discover-title)]">{placeName}</p>
          <p className="text-[11px] text-[var(--discover-body)]">Added to {dayLabel}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-[var(--discover-gold)] hover:underline whitespace-nowrap"
          >
            Book →
          </a>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[var(--discover-body)] hover:text-[var(--discover-title)] transition-colors cursor-pointer p-1"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
