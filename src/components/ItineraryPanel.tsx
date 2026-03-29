'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useItinerary, type ItineraryItem } from '@/components/ItineraryContext';
import { format, isSameDay } from 'date-fns';

/* ─── Empty state ─── */
function EmptyState() {
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
      <p className="text-[13px] text-[var(--discover-body)] leading-relaxed max-w-[280px]">
        Discover places and activities, then add them here to plan your perfect stay.
      </p>
    </div>
  );
}

/* ─── Individual itinerary card ─── */
function ItineraryCard({ item }: { item: ItineraryItem }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 discover-card-fade-in group">
      {/* Time column */}
      <div className="flex-shrink-0 w-[52px] text-right pt-0.5">
        <p className="text-[13px] font-semibold text-[var(--discover-title)] tabular-nums">{item.time}</p>
        <p className="text-[10px] text-[var(--discover-body)]">{item.durationHours === 0.5 ? '30m' : `${item.durationHours}h`}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Day group ─── */
function DayGroup({ date, items }: { date: Date; items: ItineraryItem[] }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.time.localeCompare(b.time)),
    [items],
  );

  return (
    <div className="discover-card-fade-in">
      {/* Day header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--discover-gold-8)] border border-[var(--discover-gold-15)] flex items-center justify-center">
          <span className="text-[12px] font-bold text-[var(--discover-gold)]">{format(date, 'd')}</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--discover-title)]">{format(date, 'EEEE')}</p>
          <p className="text-[10px] text-[var(--discover-body)]">{format(date, 'MMMM d, yyyy')}</p>
        </div>
        <span className="ml-auto text-[10px] text-[var(--discover-body)]">
          {items.length} {items.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>

      {/* Items */}
      <div className="ml-1">
        {sorted.map((item) => (
          <ItineraryCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main ItineraryPanel ─── */
export default function ItineraryPanel() {
  const { items } = useItinerary();

  // Group items by date
  const groupedByDate = useMemo(() => {
    const groups: { date: Date; items: ItineraryItem[] }[] = [];
    const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const item of sorted) {
      const existing = groups.find((g) => isSameDay(g.date, item.date));
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    }
    return groups;
  }, [items]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--discover-bg)] discover-card-fade-in">
      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 pb-4 flex-shrink-0 border-b border-[var(--discover-border)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[16px] text-[var(--discover-gold)]">✦</span>
              <h2 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-[var(--discover-title)]">
                Itinerary
              </h2>
            </div>
            <p className="text-[12px] text-[var(--discover-body)] ml-[30px]">
              {items.length === 0
                ? 'Plan your perfect New York experience'
                : `${items.length} ${items.length === 1 ? 'activity' : 'activities'} planned`}
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--discover-gold-8)] border border-[var(--discover-gold-15)]">
              <span className="text-[10px] font-semibold text-[var(--discover-gold)]">Dec 14–19</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollArea className="flex-1">
          <div className="px-5 sm:px-8 py-6 space-y-6">
            {groupedByDate.map((group) => (
              <div key={format(group.date, 'yyyy-MM-dd')}>
                <DayGroup date={group.date} items={group.items} />
                <Separator className="mt-4" />
              </div>
            ))}
            <div className="h-4" />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
