'use client';

import type { Place, MapPlace } from '@/types';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-[0.14em] mb-2.5 ml-0.5">
      {children}
    </h4>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? 'text-[var(--gold)]' : 'text-[var(--text-dim)]'}
          style={{ fontSize: '11px' }}
        >
          ★
        </span>
      ))}
      <span className="text-[10px] text-[var(--text-secondary)] ml-1">{rating}</span>
    </div>
  );
}

interface PlaceDetailsCardProps {
  place: Place | MapPlace;
  onAddToItinerary: () => void;
}

export default function PlaceDetailsCard({ place, onAddToItinerary }: PlaceDetailsCardProps) {
  /* Normalize fields that differ between Place and MapPlace */
  const description = ('editorial_summary' in place && place.editorial_summary)
    ? place.editorial_summary
    : place.description ?? '';
  const aiRundown = 'aiRundown' in place ? place.aiRundown : null;
  const bookingUrl = 'booking_url' in place ? place.booking_url : place.bookingUrl;
  const rating = place.rating ?? 0;
  const gradient = 'gradient' in place ? place.gradient : 'from-slate-800 to-slate-900';
  const distance = 'distance' in place ? place.distance : null;

  return (
    <div className="animate-fade-in-up stagger-1">
      <SectionLabel>Place Details</SectionLabel>
      <div className="bg-[var(--card-bg)] rounded-[6px] border border-[var(--card-border)] overflow-hidden">
        {/* Gradient header */}
        <div className={`h-20 bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-2.5 bg-gradient-to-t from-[var(--card-bg)] to-transparent">
            <span className="inline-block text-[9px] text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/25 rounded-[4px] px-2 py-[2px] mb-1 uppercase tracking-wider">
              {place.category}
            </span>
            <h3 className="text-[13px] font-medium text-[var(--text-primary)] tracking-wide">{place.name}</h3>
          </div>
        </div>

        {/* Info body */}
        <div className="px-3.5 py-3 space-y-3">
          {/* Rating & Distance */}
          <div className="flex items-center justify-between">
            <StarRating rating={rating} />
            {distance && (
              <span className="text-[10px] text-[var(--text-muted)] flex items-center space-x-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{distance}</span>
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-[11px] text-[var(--text-secondary)] leading-[1.7]">
            {description}
          </p>

          {/* AI Rundown / Concierge Notes */}
          {aiRundown && (
            <div className="bg-[var(--panel-bg)] rounded-[5px] p-3 border border-[var(--charcoal-light)]">
              <div className="flex items-center space-x-1.5 mb-2">
                <span className="text-[9px] text-[var(--gold)]">✦</span>
                <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Concierge Notes</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] leading-[1.7]">
                {aiRundown}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {/* Book externally */}
            <a
              href={bookingUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full bg-[var(--gold)] hover:opacity-90 text-[var(--background)] text-[11px] font-medium py-2.5 rounded-[6px] transition-all duration-200 tracking-wide"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Book This Place</span>
            </a>

            {/* Add to itinerary */}
            <button
              onClick={onAddToItinerary}
              className="flex items-center justify-center space-x-2 w-full border border-[var(--gold)]/25 hover:border-[var(--gold)]/50 text-[var(--gold)] text-[11px] py-2.5 rounded-[6px] transition-all duration-200 tracking-wide hover:bg-[var(--gold)]/5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="18" />
                <line x1="10" y1="16" x2="14" y2="16" />
              </svg>
              <span>Add to Itinerary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
