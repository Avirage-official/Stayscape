'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import type { ItineraryItem } from '@/components/ItineraryContext';
import ItineraryItemCard from '@/components/itinerary/ItineraryItemCard';

export default function ItineraryDayGroup({
  date,
  items,
  totalHours,
  onEdit,
  onRemove,
}: {
  date: Date;
  items: ItineraryItem[];
  totalHours: number;
  onEdit: (item: ItineraryItem) => void;
  onRemove: (item: ItineraryItem) => void;
}) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.time.localeCompare(b.time)),
    [items],
  );

  return (
    <div className="discover-card-fade-in">
      {/* Day header — sticky on mobile */}
      <div className="sticky top-0 z-10 flex items-center gap-2.5 mb-3 bg-black/80 backdrop-blur-sm -mx-5 sm:-mx-8 px-5 sm:px-8 py-2 -mt-2 rounded-t-lg">
        <div className="w-8 h-8 rounded-lg bg-[var(--discover-gold-8)] border border-[var(--discover-gold-15)] flex items-center justify-center">
          <span className="text-[12px] font-bold text-[var(--discover-gold)]">{format(date, 'd')}</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--discover-title)]">{format(date, 'EEEE')}</p>
          <p className="text-[10px] text-[var(--discover-body)]">{format(date, 'MMMM d, yyyy')}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-[var(--discover-body)]">
            {items.length} {items.length === 1 ? 'activity' : 'activities'}
          </span>
          <span className="text-[10px] text-[var(--discover-body)]/50">·</span>
          <span className="text-[10px] text-[var(--discover-gold)]/70 font-medium">
            {totalHours === 0.5 ? '30m' : `${totalHours}h`} planned
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="ml-1">
        {sorted.map((item) => (
          <ItineraryItemCard key={item.id} item={item} onEdit={onEdit} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
