'use client';

import { MARKER_COLOR_GOLD } from '@/lib/mapbox/config';
import { haversineMetres, formatDistanceDisplay } from '@/lib/mapbox/geocoding';
import type { MapPlace } from '@/types';
import type { SelectedRegion } from '@/lib/context/region-context';
import { getCategoryColor } from './map-utils';

interface MapPlaceCardProps {
  place: MapPlace;
  region: SelectedRegion | null;
  itinAdded: string | null;
  onAddToItinerary: () => void;
}

export default function MapPlaceCard({ place, region, itinAdded, onAddToItinerary }: MapPlaceCardProps) {
  return (
    <div
      key={place.id}
      className="absolute bottom-20 left-4 z-10 animate-card-entrance"
      style={{ maxWidth: 'min(280px, calc(100% - 80px))' }}
    >
      <div
        className="rounded-[9px] p-3.5"
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${getCategoryColor(place.category)}35`,
          boxShadow: `0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px ${getCategoryColor(place.category)}10`,
        }}
      >
        <div className="flex items-start gap-2 mb-2">
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: getCategoryColor(place.category),
            flexShrink: 0,
            marginTop: 3,
            boxShadow: `0 0 6px ${getCategoryColor(place.category)}70`,
          }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
              {place.name}
            </p>
            <p className="text-[9.5px] text-[var(--text-muted)] mt-0.5 truncate">
              {place.editorial_summary ?? place.description ?? place.address ?? ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {place.rating != null && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill={i < Math.round(place.rating ?? 0) ? MARKER_COLOR_GOLD : 'none'}
                  stroke={MARKER_COLOR_GOLD}
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <span className="text-[9.5px] font-medium ml-0.5" style={{ color: MARKER_COLOR_GOLD }}>
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}

          {region && place.rating != null && (
            <span className="text-[var(--text-dim)] text-[9px]">·</span>
          )}

          {region && (
            <div className="flex items-center gap-1">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[9.5px] text-[var(--text-muted)]">
                {formatDistanceDisplay(haversineMetres(region.latitude, region.longitude, place.latitude, place.longitude))}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-2.5 pt-2 flex items-center gap-1.5 flex-wrap" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Book button */}
          {(place.booking_url || place.website) ? (
            <a
              href={(place.booking_url || place.website) as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all"
              style={{
                color: MARKER_COLOR_GOLD,
                background: `${MARKER_COLOR_GOLD}18`,
                border: `1px solid ${MARKER_COLOR_GOLD}40`,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 3V2M11 3V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Book
            </a>
          ) : null}

          {/* Add to Itinerary button */}
          <button
            type="button"
            onClick={() => {
              if (itinAdded === place.id) return;
              onAddToItinerary();
            }}
            className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all cursor-pointer"
            style={{
              color: itinAdded === place.id ? '#4ADE80' : 'var(--text-muted)',
              background: itinAdded === place.id ? 'rgba(74,222,128,0.1)' : 'var(--surface-raised)',
              border: `1px solid ${itinAdded === place.id ? 'rgba(74,222,128,0.35)' : 'var(--border)'}`,
            }}
          >
            {itinAdded === place.id ? (
              <>✓ Added</>
            ) : (
              <>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Itinerary
              </>
            )}
          </button>

          {/* Get Directions button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=walking`}
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
          border: `1px solid ${getCategoryColor(place.category)}35`,
          borderTop: 'none',
          borderLeft: 'none',
        }}
      />
    </div>
  );
}
