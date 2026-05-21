'use client';

import type { ExploreSection, ExploreItem } from './ExploreCard';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';

interface ExploreWebPanelProps {
  sections: ExploreSection[];
  activeIndex: number;
  onSectionChange: (index: number) => void;
  onItemClick: (item: ExploreItem) => void;
  onPersonalise: () => void;
  isPersonalising: boolean;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function ExploreWebPanel({
  sections,
  activeIndex,
  onSectionChange,
  onItemClick,
  onPersonalise,
  isPersonalising,
}: ExploreWebPanelProps) {
  const active = sections[activeIndex];

  return (
    <div className="hidden md:flex flex-col h-full bg-[#1a1916] border-l border-white/10 w-[360px] flex-shrink-0 overflow-hidden">
      {/* Section tabs */}
      <div className="flex border-b border-white/10">
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSectionChange(i)}
            className={`flex-1 py-3 text-[10px] tracking-[0.15em] uppercase font-medium transition-colors ${
              i === activeIndex
                ? 'text-white border-b-2 border-white'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {s.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Section headline */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase">
          {active?.label}
        </p>
        <h3 className="font-serif text-white text-xl mt-1">{active?.title}</h3>
        <p className="text-white/50 text-xs mt-0.5">{active?.subtitle}</p>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
        {active?.items.length === 0 && (
          <p className="text-white/30 text-sm py-8 text-center">
            {active.id === 'events'
              ? 'No upcoming events yet.'
              : 'More coming soon.'}
          </p>
        )}
        {active?.items.map((item) => {
          const isEvent = 'start_date' in item;
          const place = !isEvent ? (item as DiscoveryPlaceCard) : null;
          const event = isEvent ? (item as DiscoveryEventCard) : null;
          const meta = isEvent
            ? formatDate(event?.start_date)
            : place?.editorial_summary?.slice(0, 55) ??
              place?.description?.slice(0, 55);

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full flex items-center gap-3 py-3 border-b border-white/8 last:border-0 text-left group hover:bg-white/5 rounded-xl px-2 -mx-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-800" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate group-hover:text-white/90">
                  {item.name}
                </p>
                {meta && (
                  <p className="text-white/40 text-xs mt-0.5 truncate">{meta}{meta.length === 55 ? '…' : ''}</p>
                )}
              </div>
              <svg
                className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Personalise CTA */}
      <div className="px-5 py-4 border-t border-white/10">
        <button
          onClick={onPersonalise}
          disabled={isPersonalising}
          className="w-full py-3 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/5 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPersonalising ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Personalising…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
              Personalise for me
            </>
          )}
        </button>
      </div>
    </div>
  );
}
