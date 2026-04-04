'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getDirections, addRouteToMap, removeRouteFromMap, formatDuration } from '@/lib/mapbox/directions';
import { MARKER_COLOR_GOLD, DEFAULT_DIRECTIONS_PROFILE } from '@/lib/mapbox/config';
import type { DirectionsProfile } from '@/types/mapbox';
import type mapboxgl from 'mapbox-gl';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapRouteProps {
  /**
   * Getter for the Mapbox GL map instance.
   * Using a getter (instead of passing map directly) keeps refs out of render.
   */
  getMap: () => mapboxgl.Map | null;
  /** Origin point (defaults to hotel if not provided) */
  origin?: LatLng;
  /** Destination point */
  destination: LatLng | null;
  /** Profile for routing */
  profile?: DirectionsProfile;
  /** Called when route is loaded with the duration string */
  onRouteLoad?: (duration: string | null) => void;
}

const HOTEL_ORIGIN: LatLng = { lat: 40.7649, lng: -73.9733 };

export default function MapRoute({
  getMap,
  origin,
  destination,
  profile = DEFAULT_DIRECTIONS_PROFILE,
  onRouteLoad,
}: MapRouteProps) {
  const [showRoute, setShowRoute] = useState(false);
  const [duration, setDuration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const onRouteLoadRef = useRef(onRouteLoad);
  useEffect(() => { onRouteLoadRef.current = onRouteLoad; }, [onRouteLoad]);

  const from = origin ?? HOTEL_ORIGIN;

  /* ── Load & draw route ──────────────────────────────────── */
  const loadRoute = useCallback(async () => {
    const map = getMap();
    if (!map || !destination) return;

    setIsLoading(true);
    const route = await getDirections(from, destination, profile);
    setIsLoading(false);

    if (!route) {
      setDuration(null);
      onRouteLoadRef.current?.(null);
      return;
    }

    const durationStr = formatDuration(route.duration);
    setDuration(durationStr);
    onRouteLoadRef.current?.(durationStr);
    addRouteToMap(map, route);
  }, [getMap, destination, from, profile]);

  /* ── Toggle route display ───────────────────────────────── */
  const toggleRoute = useCallback(async () => {
    const map = getMap();
    if (!map || !destination) return;

    if (showRoute) {
      removeRouteFromMap(map);
      setShowRoute(false);
    } else {
      setShowRoute(true);
      await loadRoute();
    }
  }, [getMap, destination, showRoute, loadRoute]);

  /* ── Clean up route layer when unmounting or destination changes ── */
  useEffect(() => {
    return () => {
      const m = getMap();
      if (m) removeRouteFromMap(m);
    };
  }, [destination, getMap]);

  if (!destination) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Show/hide route toggle */}
      <button
        type="button"
        onClick={toggleRoute}
        disabled={isLoading}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: showRoute ? `${MARKER_COLOR_GOLD}20` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${showRoute ? `${MARKER_COLOR_GOLD}50` : 'rgba(255,255,255,0.1)'}`,
          color: showRoute ? MARKER_COLOR_GOLD : 'var(--text-muted)',
        }}
      >
        {isLoading ? (
          <>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ animation: 'routeSpin 0.9s linear infinite' }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={MARKER_COLOR_GOLD}
                strokeWidth="3"
                fill="none"
                strokeDasharray="40"
                strokeDashoffset="15"
              />
            </svg>
            Loading…
          </>
        ) : (
          <>
            {/* Route icon */}
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2 14 C2 10 6 8 8 8 C10 8 14 6 14 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2 2"
              />
            </svg>
            {showRoute ? 'Hide route' : 'Show route'}
          </>
        )}
      </button>

      {/* Duration badge */}
      {duration && showRoute && (
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{
            color: MARKER_COLOR_GOLD,
            background: `${MARKER_COLOR_GOLD}14`,
            border: `1px solid ${MARKER_COLOR_GOLD}30`,
          }}
        >
          {duration}
        </span>
      )}

      <style>{`
        @keyframes routeSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
