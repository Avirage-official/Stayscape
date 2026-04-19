'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PlaceCard } from '@/lib/data/discover-fallback';

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--discover-gold)" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-[12px] font-medium text-[var(--discover-gold)]">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function HeroPlaceCard({
  place,
  onAdd,
  onClick,
  isFirst,
  idx,
}: {
  place: PlaceCard;
  onAdd: (placeId: string) => void;
  onClick: () => void;
  isFirst: boolean;
  idx: number;
}) {
  const hasBookingUrl = Boolean(place.bookingUrl && place.bookingUrl !== '#');

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-[var(--discover-border)]
        transition-all duration-300 ease-out cursor-pointer
        group discover-card-fade-in discover-hover-lift
        ${isFirst ? 'h-[280px] sm:h-[320px]' : 'h-[220px] sm:h-[260px]'}
      `}
      style={{ animationDelay: `${idx * 0.08}s` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${place.image})` }}
      />

      {/* Cinematic gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${place.gradient}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Content positioned at bottom */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
        {/* Category badge + distance */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm font-medium">
            {place.category}
          </Badge>
          <span className="text-[11px] text-white/60">{place.distance}</span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-white tracking-tight leading-tight mb-1.5 drop-shadow-lg ${
          isFirst ? 'text-[22px] sm:text-[26px]' : 'text-[18px] sm:text-[20px]'
        }`}>
          {place.name}
        </h3>

        {/* Description */}
        <p className={`text-white/70 leading-relaxed mb-3 line-clamp-2 ${
          isFirst ? 'text-[13px] sm:text-[14px] max-w-[480px]' : 'text-[12px] sm:text-[13px] max-w-[400px]'
        }`}>
          {place.description}
        </p>

        {/* Rating + Actions */}
        <div className="flex items-center justify-between">
          <StarRating rating={place.rating} />
          <div className="flex items-center gap-2">
            {hasBookingUrl && (
              <a
                href={place.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="
                  inline-flex items-center justify-center rounded-lg text-[12px] h-8 px-3
                  border border-white/25 text-white/85 bg-black/35
                  hover:text-[#C9A84C] hover:border-[#C9A84C]/60
                  transition-all duration-200
                "
              >
                Book
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onAdd(place.id); }}
              className="
                border-[var(--discover-gold)]/60 text-[var(--discover-gold)]
                bg-[var(--discover-gold)]/10 backdrop-blur-sm
                hover:bg-[var(--discover-gold)]/20 hover:border-[var(--discover-gold)]
                rounded-lg text-[12px] h-8 px-4
                transition-all duration-200
              "
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1">
                <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              + Itinerary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
