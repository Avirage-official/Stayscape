'use client';

import { addDays, format, isSameDay } from 'date-fns';
import { useItinerary } from '@/components/ItineraryContext';

const DAY_OFFSETS = [
  { offset: 0, label: 'Today' },
  { offset: 1, label: 'Tomorrow' },
  { offset: 2, label: 'Day After' },
] as const;

export default function ItineraryTimeline() {
  const { items } = useItinerary();
  const now = new Date();

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <h3 className="text-[14px] font-serif text-white/90 mb-3">Stay Timeline</h3>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {DAY_OFFSETS.map((day) => {
          const date = addDays(now, day.offset);
          const dayItems = items
            .filter((item) => isSameDay(item.date, date))
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div
              key={day.label}
              className="min-w-[180px] rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#C9A84C]/70 mb-0.5">
                {day.label}
              </p>
              <p className="text-[11px] text-white/55 mb-2">{format(date, 'EEE, MMM d')}</p>
              {dayItems.length === 0 ? (
                <p className="text-[11px] text-white/40">No plans yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayItems.map((item) => (
                    <li key={item.id} className="text-[11px] text-white/80">
                      <span className="text-white/45 mr-1.5">{item.time}</span>
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
