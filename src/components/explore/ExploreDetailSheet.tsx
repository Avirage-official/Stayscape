'use client';

import { useEffect, useRef } from 'react';
import type { ExploreItem } from './ExploreCard';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';

interface ExploreDetailSheetProps {
  item: ExploreItem | null;
  onClose: () => void;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
) {
  if (!min && !max) return 'Price not listed';
  const sym = currency === 'SGD' ? 'S$' : (currency ?? '$');
  if (min && max && min !== max) return `${sym}${min} – ${sym}${max}`;
  return `${sym}${min ?? max}`;
}

/** Type guard — RegionOption has no image_url */
function isRegionOption(item: ExploreItem): item is RegionOption {
  return !('image_url' in item);
}

export default function ExploreDetailSheet({
  item,
  onClose,
}: ExploreDetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  const isRegion = item ? isRegionOption(item) : false;
  const isEvent = item && !isRegion && 'start_date' in item;
  const isProperty = item && !isRegion && !isEvent && 'star_rating' in item;

  const place = item && !isRegion && !isEvent && !isProperty ? (item as DiscoveryPlaceCard) : null;
  const event = isEvent ? (item as DiscoveryEventCard) : null;
  const property = isProperty ? (item as ExplorePropertyCard) : null;
  const region = isRegion ? (item as RegionOption) : null;

  const imageUrl = item && !isRegion ? (item as DiscoveryPlaceCard).image_url : null;
  const itemName = item ? item.name : '';
  const itemCategory =
    item && !isRegion && 'category' in item
      ? (item as DiscoveryPlaceCard).category
      : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          item ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={itemName || 'Detail'}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#1a1916] rounded-t-3xl max-h-[85dvh] overflow-y-auto transition-transform duration-300 ease-out ${
          item ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {item && (
          <div className="px-6 pb-10 pt-2">

            {/* Region — simple display, no image */}
            {region && (
              <div className="py-4 text-center">
                <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2">
                  Destination
                </p>
                <h3 className="font-serif text-white text-3xl">{region.name}</h3>
                {region.country_code && (
                  <p className="text-white/50 text-sm mt-1">{region.country_code}</p>
                )}
                <button
                  onClick={onClose}
                  className="mt-6 px-5 py-3 border border-white/20 text-white/60 text-sm rounded-xl"
                >
                  Close
                </button>
              </div>
            )}

            {/* Place / Event / Property */}
            {!region && (
              <>
                {imageUrl && (
                  <div className="w-full h-48 rounded-2xl overflow-hidden mb-5">
                    <img
                      src={imageUrl}
                      alt={itemName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {itemCategory && (
                  <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-1">
                    {itemCategory}
                  </p>
                )}
                <h3 className="font-serif text-white text-2xl leading-tight mb-2">
                  {itemName}
                </h3>

                {event && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {event.start_date && (
                      <span className="text-white/60 text-sm">
                        📅 {formatDate(event.start_date)}
                        {event.start_time ? ` · ${event.start_time}` : ''}
                      </span>
                    )}
                    {event.venue_name && (
                      <span className="text-white/60 text-sm">📍 {event.venue_name}</span>
                    )}
                    {(event.price_min != null || event.price_max != null) && (
                      <span className="text-white/60 text-sm">
                        {formatPrice(event.price_min, event.price_max, event.currency)}
                      </span>
                    )}
                  </div>
                )}

                {property && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {property.star_rating && (
                      <span className="text-white/60 text-sm">
                        {'★'.repeat(property.star_rating)}
                      </span>
                    )}
                    {property.city && (
                      <span className="text-white/60 text-sm">📍 {property.city}</span>
                    )}
                    {property.price_from != null && (
                      <span className="text-white/60 text-sm">
                        From {property.currency === 'SGD' ? 'S$' : (property.currency ?? '$')}
                        {property.price_from}
                      </span>
                    )}
                  </div>
                )}

                {place && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {place.rating && (
                      <span className="text-white/60 text-sm">★ {place.rating.toFixed(1)}</span>
                    )}
                    {place.price_level && (
                      <span className="text-white/60 text-sm">{'$'.repeat(place.price_level)}</span>
                    )}
                  </div>
                )}

                <p className="text-white/70 text-sm leading-relaxed mb-5">
                  {(item as DiscoveryPlaceCard).editorial_summary ||
                    (item as DiscoveryPlaceCard).description ||
                    (item as ExplorePropertyCard).editorial_summary ||
                    ''}
                </p>

                {'vibes' in item && (item as DiscoveryPlaceCard).vibes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(item as DiscoveryPlaceCard).vibes.map((v) => (
                      <span
                        key={v}
                        className="text-xs text-white/50 border border-white/20 rounded-full px-3 py-1"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  {event?.ticket_url && (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-white text-black text-sm font-medium py-3 rounded-xl text-center"
                    >
                      Get tickets
                    </a>
                  )}
                  {property?.booking_url && (
                    <a
                      href={property.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-white text-black text-sm font-medium py-3 rounded-xl text-center"
                    >
                      Book stay
                    </a>
                  )}
                  {place?.booking_url && (
                    <a
                      href={place.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-white text-black text-sm font-medium py-3 rounded-xl text-center"
                    >
                      Book
                    </a>
                  )}
                  <button
                    onClick={onClose}
                    className="px-5 py-3 border border-white/20 text-white/60 text-sm rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
