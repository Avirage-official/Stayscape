'use client';

/**
 * MapMarker — HTML/SVG marker for individual unclustered places & events.
 *
 * Replaces the Mapbox `circle` layer rendering for unclustered points.
 * Clusters are still handled natively by Mapbox.
 *
 * States:
 *   idle      — gold seal with subtle breathing halo
 *   hover     — scaled up 1.12, halo brightens
 *   selected  — ink-drop ripple expands outward (one-time on selection)
 *
 * Events distinguished by isEvent → pink halo instead of gold.
 *
 * The DOM element is mounted via `mapboxgl.Marker(...).setLngLat(...).addTo(map)`
 * by the parent (MapPlaceholder). This component only renders the inner DOM.
 */

import React, { useEffect, useRef, useState } from 'react';
import { CATEGORY_COLORS, MARKER_COLOR_GOLD } from '@/lib/mapbox/config';

/* ─── Constants ─── */

const COLOR_GOLD = MARKER_COLOR_GOLD; /* #C9A875 */
const COLOR_EVENT = '#E07B6B'; /* warm coral, matches our error/event accent */
const COLOR_RING = 'rgba(245, 230, 204, 0.85)';

/* ─── Props ─── */

export interface MapMarkerProps {
  /** Unique ID (place or event id). */
  id: string;
  /** Display name — used for aria-label and high-zoom tooltip. */
  name: string;
  /** Place category (e.g. dining, nightlife). Drives the inner-dot tint. */
  category: string;
  /** Whether this marker represents an event vs. a place. */
  isEvent: boolean;
  /** Whether this is the currently selected marker. */
  selected: boolean;
  /** Click handler — fires the parent's place/event selection logic. */
  onClick: () => void;
}

/* ─── Component ─── */

const MapMarker: React.FC<MapMarkerProps> = ({
  id: _id,
  name,
  category,
  isEvent,
  selected,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const prevSelectedRef = useRef(selected);

  /* Trigger ripple animation when this marker becomes selected */
  useEffect(() => {
    if (selected && !prevSelectedRef.current) {
      setRippleKey((k) => k + 1);
    }
    prevSelectedRef.current = selected;
  }, [selected]);

  const accent = isEvent
    ? COLOR_EVENT
    : CATEGORY_COLORS[category] ?? COLOR_GOLD;

  const scale = selected ? 1.18 : hovered ? 1.12 : 1;

  return (
    <button
      type="button"
      aria-label={name}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      style={{
        position: 'relative',
        width: 28,
        height: 28,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        transformOrigin: 'center',
        willChange: 'transform',
      }}
    >
      {/* Breathing halo — always visible, brighter when hovered */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}55 0%, ${accent}00 70%)`,
          opacity: hovered || selected ? 1 : 0.55,
          transition: 'opacity 0.4s ease',
          animation: 'mm-breathe 3.2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Selected-state ripple — re-keys to restart animation each selection */}
      {selected && (
        <span
          key={rippleKey}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: `1.5px solid ${accent}`,
            animation: 'mm-ripple 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Outer ring (cream halo) */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: COLOR_RING,
          boxShadow: selected
            ? `0 0 0 2px ${accent}, 0 4px 12px rgba(0, 0, 0, 0.35)`
            : `0 2px 8px rgba(0, 0, 0, 0.25)`,
          transition: 'box-shadow 0.25s ease',
        }}
      />

      {/* Inner gold/category seal */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 25%, ${lighten(accent, 12)} 0%, ${accent} 70%)`,
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.2)`,
        }}
      />

      {/* Tiny center dot for definition */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 4,
          height: 4,
          marginLeft: -2,
          marginTop: -2,
          borderRadius: '50%',
          background: 'rgba(20, 16, 13, 0.55)',
        }}
      />

      {/* Inline keyframes — local to component so we don't pollute globals.css */}
      <style>{`
        @keyframes mm-breathe {
          0%, 100% { transform: scale(1); opacity: var(--halo-base, 0.55); }
          50%      { transform: scale(1.18); opacity: var(--halo-peak, 0.85); }
        }
        @keyframes mm-ripple {
          0%   { transform: scale(0.6); opacity: 0.85; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </button>
  );
};

export default MapMarker;

/* ─── Helpers ─── */

/** Lighten a hex color by a percentage (rough, used for the inner seal highlight). */
function lighten(hex: string, percent: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return hex;
  const num = parseInt(cleaned, 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round((255 - ((num >> 16) & 0xff)) * (percent / 100)));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round((255 - ((num >> 8) & 0xff)) * (percent / 100)));
  const b = Math.min(255, (num & 0xff) + Math.round((255 - (num & 0xff)) * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
