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
    <section className="rounded-2xl border border-[#EDE8E1] bg-white p-4">
      <h3 className="text-[14px] font-serif italic text-[#1C1A17] mb-3">Stay Timeline</h3>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {DAY_OFFSETS.map((day) => {
          const date = addDays(now, day.offset);
          const dayItems = items
            .filter((item) => isSameDay(item.date, date))
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div
              key={day.label}
              className="min-w-[180px] rounded-xl border border-[#EDE8E1] bg-[#F5F2EE] p-3"
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#C17F3A] mb-0.5">
                {day.label}
              </p>
              <p className="text-[11px] text-[#6B6158] mb-2">{format(date, 'EEE, MMM d')}</p>
              {dayItems.length === 0 ? (
                <p className="text-[11px] text-[#9E9389]">No plans yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayItems.map((item) => (
                    <li key={item.id} className="text-[11px] text-[#1C1A17]">
                      <span className="text-[#9E9389] mr-1.5">{item.time}</span>
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
