'use client';

import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';

export type ExploreItem = DiscoveryPlaceCard | DiscoveryEventCard;

export interface ExploreSection {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  gradient: string;
  items: ExploreItem[];
}

interface ExploreCardProps {
  section: ExploreSection;
  isActive: boolean;
  onItemClick: (item: ExploreItem) => void;
}

/** Price dots helper */
function PriceDots({ level }: { level?: number | null }) {
  if (!level) return null;
  return (
    <span className="text-white/50 text-xs tracking-widest">
      {'$'.repeat(level)}
      <span className="opacity-30">{'$'.repeat(4 - level)}</span>
    </span>
  );
}

/** Single detail row inside the card detail list */
function DetailRow({
  item,
  onClick,
}: {
  item: ExploreItem;
  onClick: () => void;
}) {
  const isEvent = 'start_date' in item;
  const subtitle = isEvent
    ? (item as DiscoveryEventCard).venue_name ?? (item as DiscoveryEventCard).category
    : (item as DiscoveryPlaceCard).editorial_summary ??
      (item as DiscoveryPlaceCard).description?.slice(0, 60);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 py-3 border-b border-white/10 last:border-0 text-left hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${'gradient' in item ? item.gradient : 'from-stone-800 to-stone-900'}`} />
        )}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{item.name}</p>
        {subtitle && (
          <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{subtitle}</p>
        )}
        {'vibes' in item && (item as DiscoveryPlaceCard).vibes?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {(item as DiscoveryPlaceCard).vibes.slice(0, 2).map((v) => (
              <span
                key={v}
                className="text-[10px] text-white/40 border border-white/20 rounded-full px-1.5 py-0.5"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>
      {'price_level' in item && (
        <PriceDots level={(item as DiscoveryPlaceCard).price_level} />
      )}
    </button>
  );
}

export default function ExploreCard({
  section,
  isActive,
  onItemClick,
}: ExploreCardProps) {
  return (
    <div
      className={`relative w-full flex-shrink-0 transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ height: 'calc(100dvh - 68px)' }}
    >
      {/* ── Background image ───────────────────────────────── */}
      <div className="absolute inset-0">
        {section.image_url ? (
          <img
            src={section.image_url}
            alt={section.title}
            className="w-full h-full object-cover"
            loading={isActive ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full bg-stone-900" />
        )}
        {/* Gradient overlay — stronger at bottom for legibility */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${section.gradient} opacity-90`}
        />
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 pt-8">
        {/* Top label */}
        <div>
          <p className="text-white/50 text-[10px] tracking-[0.2em] font-medium uppercase mb-2">
            {section.label}
          </p>
          <h2
            className="font-serif text-white leading-tight"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)' }}
          >
            {section.title}
          </h2>
          <p className="text-white/60 text-sm mt-1">{section.subtitle}</p>
        </div>

        {/* Detail items list */}
        {section.items.length > 0 && (
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 mt-4">
            <p className="text-white/40 text-[10px] tracking-widest uppercase mb-3">
              {section.id === 'events' ? 'Coming up' : 'Top picks'}
            </p>
            <div className="space-y-0">
              {section.items.slice(0, 4).map((item) => (
                <DetailRow
                  key={item.id}
                  item={item}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {section.items.length === 0 && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 text-center">
            <p className="text-white/40 text-sm">
              {section.id === 'events'
                ? 'No upcoming events in this region yet.'
                : 'More coming soon.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
