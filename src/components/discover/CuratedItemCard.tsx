'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CuratedItem } from '@/types/pms';

/* ─── Category-based gradient mapping ─── */
const GRADIENTS: Record<string, string> = {
  dining: 'from-red-900/80 via-red-950/60 to-black/80',
  restaurant: 'from-red-900/80 via-red-950/60 to-black/80',
  food: 'from-orange-900/80 via-orange-950/60 to-black/80',
  bar: 'from-violet-900/80 via-violet-950/60 to-black/80',
  cafe: 'from-amber-900/80 via-amber-950/60 to-black/80',
  nature: 'from-emerald-900/80 via-emerald-950/60 to-black/80',
  park: 'from-emerald-900/80 via-emerald-950/60 to-black/80',
  beach: 'from-teal-900/80 via-teal-950/60 to-black/80',
  shopping: 'from-fuchsia-900/80 via-fuchsia-950/60 to-black/80',
  culture: 'from-indigo-900/80 via-indigo-950/60 to-black/80',
  museum: 'from-indigo-900/80 via-indigo-950/60 to-black/80',
  landmark: 'from-slate-800/80 via-slate-950/60 to-black/80',
  activity: 'from-blue-900/80 via-blue-950/60 to-black/80',
  outdoor: 'from-green-900/80 via-green-950/60 to-black/80',
  wellness: 'from-purple-900/80 via-purple-950/60 to-black/80',
  spa: 'from-purple-900/80 via-purple-950/60 to-black/80',
  nightlife: 'from-violet-900/80 via-violet-950/60 to-black/80',
};

const FALLBACK_GRADIENTS = [
  'from-amber-900/80 via-amber-950/60 to-black/80',
  'from-blue-900/80 via-blue-950/60 to-black/80',
  'from-emerald-900/80 via-emerald-950/60 to-black/80',
  'from-rose-900/80 via-rose-950/60 to-black/80',
  'from-violet-900/80 via-violet-950/60 to-black/80',
  'from-teal-900/80 via-teal-950/60 to-black/80',
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop',
];

function getGradient(category: string, idx: number): string {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(GRADIENTS)) {
    if (key.includes(k)) return v;
  }
  return FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
}

export function curatedItemToPlaceCard(item: CuratedItem, idx: number) {
  return {
    id: item.place_id ?? `curated-${idx}`,
    name: item.name,
    category: item.category,
    description: item.description,
    rating: 4.8,
    distance: item.duration ?? '',
    gradient: getGradient(item.category, idx),
    image: FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
    bookingUrl: '#',
  };
}

/* ─── "Popular with Guests" card (vertical list, social proof) ─── */

export function PopularGuestCard({
  item,
  idx,
  onAdd,
}: {
  item: CuratedItem;
  idx: number;
  onAdd: (item: CuratedItem) => void;
}) {
  const gradient = getGradient(item.category, idx);
  const image = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--discover-border)] discover-card-fade-in"
      style={{ animationDelay: `${idx * 0.08}s` }}
    >
      {/* Compact image header */}
      <div className="relative h-[120px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm font-medium"
          >
            {item.category}
          </Badge>
          {item.time_of_day && (
            <span className="text-[10px] text-white/60">{item.time_of_day}</span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 bg-[var(--discover-card)]">
        {/* Title */}
        <h4 className="text-[14px] font-semibold text-[var(--discover-title)] tracking-tight mb-1.5 leading-tight">
          {item.name}
        </h4>

        {/* Description */}
        <p className="text-[12px] text-[var(--discover-body)] leading-relaxed mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Reason — social proof */}
        {item.reason && (
          <div className="flex items-start gap-2 mb-3 p-2.5 rounded-xl bg-[var(--discover-gold)]/5 border border-[var(--discover-gold)]/15">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="var(--discover-gold)"
              className="flex-shrink-0 mt-0.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <p className="text-[11px] text-[var(--discover-gold)] leading-relaxed italic">
              {item.reason}
            </p>
          </div>
        )}

        {/* Footer: duration + add button */}
        <div className="flex items-center justify-between">
          {item.duration ? (
            <span className="text-[11px] text-[var(--discover-body)] flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {item.duration}
            </span>
          ) : (
            <span />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdd(item)}
            className="
              border-[var(--discover-gold)]/60 text-[var(--discover-gold)]
              bg-[var(--discover-gold)]/10
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
  );
}

/* ─── "Discover the Region" card (horizontal scroll, activity style) ─── */

export function RegionalActivityCard({
  item,
  idx,
  onAdd,
}: {
  item: CuratedItem;
  idx: number;
  onAdd: (item: CuratedItem) => void;
}) {
  const gradient = getGradient(item.category, idx);
  const image = FALLBACK_IMAGES[(idx + 2) % FALLBACK_IMAGES.length];

  return (
    <div
      className="relative flex-shrink-0 w-[220px] sm:w-[240px] overflow-hidden rounded-2xl border border-[var(--discover-border)] discover-card-fade-in"
      style={{ animationDelay: `${idx * 0.07}s` }}
    >
      {/* Image header */}
      <div className="relative h-[110px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm"
          >
            {item.category}
          </Badge>
          {item.duration && (
            <span className="text-[9px] text-white/70 flex items-center gap-0.5">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {item.duration}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5 bg-[var(--discover-card)]">
        <h4 className="text-[13px] font-semibold text-[var(--discover-title)] tracking-tight mb-1 leading-tight line-clamp-1">
          {item.name}
        </h4>
        <p className="text-[11px] text-[var(--discover-body)] leading-relaxed mb-2.5 line-clamp-2">
          {item.description}
        </p>

        {/* Reason pill */}
        {item.reason && (
          <p className="text-[10px] text-[var(--discover-gold)] italic mb-3 line-clamp-2 leading-relaxed">
            &ldquo;{item.reason}&rdquo;
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd(item)}
          className="
            w-full border-[var(--discover-gold)]/60 text-[var(--discover-gold)]
            bg-[var(--discover-gold)]/10
            hover:bg-[var(--discover-gold)]/20 hover:border-[var(--discover-gold)]
            rounded-lg text-[11px] h-7
            transition-all duration-200
          "
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="mr-1">
            <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add to Trip
        </Button>
      </div>
    </div>
  );
}
