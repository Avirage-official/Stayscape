'use client';

import type { EventCard } from '@/hooks/useDiscoverData';

export const EVENT_PINK = '#EC4899';

export default function UpcomingEventCard({
  event,
  onClick,
}: {
  event: EventCard;
  onClick: () => void;
}) {
  const dateLabel = (() => {
    try {
      const d = new Date(event.start_date + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return event.start_date;
    }
  })();

  const priceLabel = (() => {
    if (event.price_min == null) return null;
    if (event.price_min === 0) return 'Free';
    const sym = event.currency ?? '$';
    if (event.price_max != null && event.price_max !== event.price_min) {
      return `${sym}${event.price_min}+`;
    }
    return `${sym}${event.price_min}`;
  })();

  return (
    <div
      className="
        flex-shrink-0 w-[200px] sm:w-[220px]
        relative overflow-hidden rounded-2xl
        border border-[var(--discover-border)]
        cursor-pointer transition-all duration-300 ease-out
        group discover-hover-lift
        hover:border-[#EC4899]/30 hover:shadow-[0_0_16px_rgba(236,72,153,0.08)]
      "
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {/* Image / gradient header */}
      <div className="relative h-[100px] overflow-hidden">
        {event.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-950 via-purple-950 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {/* Price badge */}
        {priceLabel && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(10,14,19,0.75)', color: EVENT_PINK, border: `1px solid ${EVENT_PINK}40`, backdropFilter: 'blur(8px)' }}>
              {priceLabel}
            </span>
          </div>
        )}
        {/* Pink event dot */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: EVENT_PINK, boxShadow: `0 0 5px ${EVENT_PINK}90` }} />
          <span className="text-[9px] font-medium text-white/75 capitalize">{event.category}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 bg-[var(--discover-card)]">
        <h4 className="text-[12px] font-semibold text-[var(--discover-title)] leading-tight line-clamp-2 mb-1.5">
          {event.name}
        </h4>
        <p className="text-[10px] text-[var(--discover-body)] mb-1">{dateLabel}</p>
        {event.venue_name && (
          <p className="text-[10px] text-[var(--discover-body)] truncate">{event.venue_name}</p>
        )}
        {event.ticket_url && (
          <div className="mt-2">
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-medium inline-flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: EVENT_PINK }}
            >
              Get Tickets
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M3 2h5v5M8 2L2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
