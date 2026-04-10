'use client';

import { MARKER_COLOR_GOLD } from '@/lib/mapbox/config';
import type { SearchResult } from '@/types/mapbox';

interface MapSearchCardProps {
  searchedPlace: SearchResult;
}

export default function MapSearchCard({ searchedPlace }: MapSearchCardProps) {
  return (
    <div
      className="absolute bottom-20 left-4 z-10 animate-card-entrance"
      style={{ maxWidth: 'min(280px, calc(100% - 80px))' }}
    >
      <div
        className="rounded-[9px] p-3.5"
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${MARKER_COLOR_GOLD}30`,
          boxShadow: `0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px ${MARKER_COLOR_GOLD}10`,
        }}
      >
        <div className="flex items-start gap-2 mb-2">
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: MARKER_COLOR_GOLD,
            flexShrink: 0,
            marginTop: 3,
            boxShadow: `0 0 5px ${MARKER_COLOR_GOLD}60`,
          }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
              {searchedPlace.name}
            </p>
            {searchedPlace.subtitle && (
              <p className="text-[9.5px] text-[var(--text-muted)] mt-0.5 truncate">
                {searchedPlace.subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9.5px] font-medium"
            style={{ color: MARKER_COLOR_GOLD }}
          >
            {searchedPlace.distanceDisplay} from here
          </span>
        </div>
        {/* Get Directions for searched place */}
        <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${searchedPlace.lat},${searchedPlace.lng}&travelmode=walking`}
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
    </div>
  );
}
