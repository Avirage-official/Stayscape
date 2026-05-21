'use client';

import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';

export type ExploreItem =
  | DiscoveryPlaceCard
  | DiscoveryEventCard
  | ExplorePropertyCard
  | RegionOption;

export interface ExploreSection {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  gradient: string;
  content_type: 'places' | 'events' | 'properties' | 'regions';
  items: ExploreItem[];
}

interface ExploreCardProps {
  section: ExploreSection;
  isActive: boolean;
  onItemClick: (item: ExploreItem) => void;
}

/** Stars for hotels */
function StarRating({ count }: { count?: number | null }) {
  if (!count) return null;
  return (
    <span className="text-white/50 text-xs">
      {'★'.repeat(count)}
      <span className="opacity-30">{'★'.repeat(5 - count)}</span>
    </span>
  );
}

/** Single detail row inside the card item list */
function DetailRow({
  item,
  contentType,
  onClick,
}: {
  item: ExploreItem;
  contentType: ExploreSection['content_type'];
  onClick: () => void;
}) {
  const isEvent = contentType === 'events';
  const isRegion = contentType === 'regions';
  const isProperty = contentType === 'properties';

  const name = 'name' in item ? item.name : '';
  const imageUrl = 'image_url' in item ? item.image_url : null;

  let subtitle = '';
  if (isEvent) {
    const e = item as DiscoveryEventCard;
    subtitle = e.venue_name ?? e.category ?? '';
  } else if (isRegion) {
    const r = item as RegionOption;
    subtitle = r.country_code ?? '';
  } else if (isProperty) {
    const p = item as ExplorePropertyCard;
    subtitle = p.editorial_summary?.slice(0, 55) ?? p.city ?? '';
  } else {
    const p = item as DiscoveryPlaceCard;
    subtitle = p.editorial_summary?.slice(0, 55) ?? p.description?.slice(0, 55) ?? '';
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 py-3 border-b border-white/10 last:border-0 text-left hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isRegion && (
              <span className="text-white/30 text-lg">
                {(item as RegionOption).country_code ?? '🌍'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{name}</p>
        {subtitle && (
          <p className="text-white/50 text-xs mt-0.5 line-clamp-1">
            {subtitle}{subtitle.length === 55 ? '…' : ''}
          </p>
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

      {isProperty && (
        <StarRating count={(item as ExplorePropertyCard).star_rating} />
      )}
    </button>
  );
}

export default function ExploreCard({
  section,
  isActive,
  onItemClick,
}: ExploreCardProps) {
  const emptyLabel =
    section.content_type === 'events'
      ? 'No upcoming events in this region yet.'
      : section.content_type === 'regions'
      ? 'No other destinations available yet.'
      : 'More coming soon.';

  const listLabel =
    section.content_type === 'events'
      ? 'Coming up'
      : section.content_type === 'regions'
      ? 'Destinations'
      : section.content_type === 'properties'
      ? 'Stays'
      : 'Top picks';

  return (
    <div
      className={`relative w-full flex-shrink-0 transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ height: 'calc(100dvh - 68px)' }}
    >
      {/* Background image */}
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
        <div
          className={`absolute inset-0 bg-gradient-to-b ${section.gradient} opacity-90`}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 pt-8">
        {/* Top label + headline */}
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

        {/* Item list */}
        {section.items.length > 0 ? (
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 mt-4">
            <p className="text-white/40 text-[10px] tracking-widest uppercase mb-3">
              {listLabel}
            </p>
            <div>
              {section.items.slice(0, 4).map((item) => (
                <DetailRow
                  key={'id' in item ? item.id : (item as RegionOption).id}
                  item={item}
                  contentType={section.content_type}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 text-center">
            <p className="text-white/40 text-sm">{emptyLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
