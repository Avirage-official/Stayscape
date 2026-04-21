'use client';

export default function ItineraryEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
      {/* Subtle icon */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--discover-gold-5)] border border-[var(--discover-gold-15)] flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="6" width="20" height="18" rx="2.5" stroke="var(--discover-gold)" strokeWidth="1.2" opacity="0.5" />
          <line x1="4" y1="11" x2="24" y2="11" stroke="var(--discover-gold)" strokeWidth="1.2" opacity="0.35" />
          <line x1="10" y1="6" x2="10" y2="3" stroke="var(--discover-gold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="18" y1="6" x2="18" y2="3" stroke="var(--discover-gold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <circle cx="14" cy="18" r="2" stroke="var(--discover-gold)" strokeWidth="1.2" opacity="0.4" />
        </svg>
      </div>
      <h3 className="text-[16px] font-semibold text-[var(--discover-title)] mb-2 tracking-tight">
        Your itinerary is empty
      </h3>
      <p className="text-[13px] text-[var(--discover-body)] leading-relaxed max-w-[280px] mb-6">
        Discover places and activities, then add them here to craft your perfect stay.
      </p>
      <p className="text-[11px] text-[var(--discover-body)]/70">
        Switch to the <span className="text-[var(--discover-gold)] font-medium">Discover</span> tab to explore
      </p>
    </div>
  );
}
