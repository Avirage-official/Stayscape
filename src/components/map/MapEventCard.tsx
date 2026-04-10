'use client';

import type { MapPlace } from '@/types';
import { MARKER_COLOR_PINK } from './map-constants';

interface MapEventCardProps {
  event: MapPlace;
  itinAdded: string | null;
  onAddToItinerary: () => void;
  onClose: () => void;
}

export default function MapEventCard({ event, itinAdded, onAddToItinerary, onClose }: MapEventCardProps) {
  return (
    <div
      key={event.id}
      className="absolute bottom-20 left-4 z-10 animate-card-entrance"
      style={{ maxWidth: 'min(300px, calc(100% - 80px))' }}
    >
      <div
        className="rounded-[9px] p-3.5"
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${MARKER_COLOR_PINK}35`,
          boxShadow: `0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px ${MARKER_COLOR_PINK}10`,
        }}
      >
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: MARKER_COLOR_PINK,
            flexShrink: 0,
            marginTop: 3,
            boxShadow: `0 0 6px ${MARKER_COLOR_PINK}70`,
          }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
              {event.name}
            </p>
            {event.venue_name && (
              <p className="text-[9.5px] text-[var(--text-muted)] mt-0.5 truncate">
                {event.venue_name}
              </p>
            )}
          </div>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event card"
            style={{
              flexShrink: 0,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
              <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Date + price row */}
        <div className="flex items-center gap-2.5 mb-2">
          {event.start_date && (
            <span className="text-[9.5px] font-medium" style={{ color: MARKER_COLOR_PINK }}>
              {(() => {
                try {
                  const d = new Date(event.start_date + 'T00:00:00');
                  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                } catch {
                  return event.start_date;
                }
              })()}
              {event.start_time && ` · ${event.start_time.slice(0, 5)}`}
            </span>
          )}
          {event.price_min != null && (
            <>
              <span className="text-[var(--text-dim)] text-[9px]">·</span>
              <span className="text-[9.5px] text-[var(--text-muted)]">
                {event.price_min === 0
                  ? 'Free'
                  : event.price_max != null && event.price_max !== event.price_min
                  ? `${event.currency ?? '$'}${event.price_min} – ${event.currency ?? '$'}${event.price_max}`
                  : `${event.currency ?? '$'}${event.price_min}`}
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center gap-1.5 flex-wrap" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Get Tickets button */}
          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all"
              style={{
                color: MARKER_COLOR_PINK,
                background: `${MARKER_COLOR_PINK}18`,
                border: `1px solid ${MARKER_COLOR_PINK}40`,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 10l1.5-1.5a2 2 0 0 1 2.83 0L8 10.17l1.67-1.67a2 2 0 0 1 2.83 0L14 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <rect x="1" y="4" width="14" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Get Tickets
            </a>
          )}

          {/* Add to Itinerary */}
          <button
            type="button"
            onClick={() => {
              if (itinAdded === event.id) return;
              onAddToItinerary();
            }}
            className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all cursor-pointer"
            style={{
              color: itinAdded === event.id ? '#4ADE80' : 'var(--text-muted)',
              background: itinAdded === event.id ? 'rgba(74,222,128,0.1)' : 'var(--surface-raised)',
              border: `1px solid ${itinAdded === event.id ? 'rgba(74,222,128,0.35)' : 'var(--border)'}`,
            }}
          >
            {itinAdded === event.id ? <>✓ Added</> : (
              <>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Itinerary
              </>
            )}
          </button>

          {/* Directions */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L15 8L8 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Directions
          </a>
        </div>
      </div>
      {/* Arrow pointer */}
      <div
        className="absolute bottom-[-5px] left-5 w-2.5 h-2.5 rotate-45"
        style={{
          background: 'var(--card-bg)',
          border: `1px solid ${MARKER_COLOR_PINK}35`,
          borderTop: 'none',
          borderLeft: 'none',
        }}
      />
    </div>
  );
}
