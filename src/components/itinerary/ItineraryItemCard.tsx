'use client';

import { Badge } from '@/components/ui/badge';
import type { ItineraryItem } from '@/components/ItineraryContext';

export default function ItineraryItemCard({
  item,
  onEdit,
  onRemove,
}: {
  item: ItineraryItem;
  onEdit: (item: ItineraryItem) => void;
  onRemove: (item: ItineraryItem) => void;
}) {
  const durationLabel = item.durationHours === 0.5 ? '30m' : `${item.durationHours}h`;

  return (
    <div className="flex items-start gap-3.5 py-3.5 discover-card-fade-in group">
      {/* Time column */}
      <div className="flex-shrink-0 w-[52px] text-right pt-0.5">
        <p className="text-[13px] font-semibold text-[var(--discover-title)] tabular-nums">{item.time}</p>
        <p className="text-[10px] text-[var(--discover-body)]">{durationLabel}</p>
      </div>

      {/* Timeline dot + line */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1.5">
        <div className="w-2 h-2 rounded-full bg-[var(--discover-gold)] shadow-[0_0_6px_rgba(200,168,90,0.3)]" />
        <div className="w-px flex-1 bg-[var(--discover-border)] mt-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0 border border-[var(--discover-border)]"
            style={{ backgroundImage: `url(${item.image})` }}
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-semibold text-[var(--discover-title)] truncate leading-tight">{item.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-[18px] rounded-md font-medium">
                {item.category}
              </Badge>
            </div>
            {/* Quick actions — visible on hover */}
            <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-[var(--discover-body)] hover:text-[var(--discover-gold)] hover:bg-[var(--discover-gold-8)] border border-transparent hover:border-[var(--discover-gold-15)] transition-all duration-200 cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-[var(--discover-body)] hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all duration-200 cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 3H10M4.5 3V2H7.5V3M5 5.5V8.5M7 5.5V8.5M3 3V10H9V3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
