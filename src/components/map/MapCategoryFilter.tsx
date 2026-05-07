'use client';

import { useRef, useEffect, useState } from 'react';
import { CATEGORY_FILTERS, MARKER_COLOR_GREEN } from './map-constants';
import { getCategoryColor } from './map-utils';

interface MapCategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export default function MapCategoryFilter({
  activeCategory,
  onCategoryChange,
  filterOpen,
  onFilterOpenChange,
}: MapCategoryFilterProps) {
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  /* ─── Dismiss on outside click ─── */
  useEffect(() => {
    if (!filterOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        onFilterOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [filterOpen, onFilterOpenChange]);

  /* ─── Compass geometry ─── */
  const COMPASS_SIZE = 240;
  const RADIUS = 88;
  const CENTER = COMPASS_SIZE / 2;
  const itemCount = CATEGORY_FILTERS.length;

  /* Active category label for the center hub */
  const activeLabel =
    CATEGORY_FILTERS.find((c) => c.key === activeCategory)?.label ?? 'All';

  return (
    <div
      ref={filterPanelRef}
      className="absolute z-20 top-3 right-3 lg:left-3 lg:right-auto lg:top-[33%]"
    >
      {/* ── Toggle button ── */}
      <button
        type="button"
        aria-label="Toggle category filter"
        onClick={() => onFilterOpenChange(!filterOpen)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: filterOpen ? 'rgba(201,168,117,0.18)' : 'var(--dashboard-card-bg)',
          border: filterOpen ? '1px solid rgba(201,168,117,0.45)' : '1px solid var(--dashboard-card-border)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          color: filterOpen ? '#C9A875' : 'var(--text-muted)',
          transition: 'all 0.18s ease',
        }}
      >
        {/* Compass-rose icon, replacing the old hamburger */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: filterOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16 8 14 14 8 16 10 10 16 8" fill="currentColor" stroke="none" opacity="0.85" />
        </svg>
      </button>

      {/* ── Compass dial ── */}
      {filterOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 12px)',
            width: COMPASS_SIZE,
            height: COMPASS_SIZE,
            animation: 'compassFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'top left',
          }}
        >
          {/* Outer glow halo */}
          <div
            style={{
              position: 'absolute',
              inset: -16,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,168,117,0.08) 0%, rgba(201,168,117,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Compass background — dark gold disc */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 30% 25%, rgba(40, 32, 22, 0.96) 0%, rgba(20, 16, 13, 0.98) 70%)',
              border: '1px solid rgba(201,168,117,0.22)',
              boxShadow: [
                '0 12px 40px rgba(0,0,0,0.65)',
                'inset 0 1px 0 rgba(245,230,204,0.08)',
                'inset 0 -1px 0 rgba(0,0,0,0.4)',
              ].join(', '),
            }}
          />

          {/* Etched ring decoration */}
          <svg
            width={COMPASS_SIZE}
            height={COMPASS_SIZE}
            style={{
              position: 'absolute',
              inset: 0,
              animation: 'compassRotate 60s linear infinite',
              animationPlayState: hoveredKey ? 'paused' : 'running',
            }}
          >
            {/* Outer tick marks — 36 ticks (every 10°) */}
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 360) / 36;
              const isMajor = i % 9 === 0;
              const r1 = RADIUS + 18;
              const r2 = isMajor ? r1 + 6 : r1 + 3;
              const rad = ((angle - 90) * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={CENTER + Math.cos(rad) * r1}
                  y1={CENTER + Math.sin(rad) * r1}
                  x2={CENTER + Math.cos(rad) * r2}
                  y2={CENTER + Math.sin(rad) * r2}
                  stroke="rgba(201,168,117,0.35)"
                  strokeWidth={isMajor ? 1.2 : 0.6}
                />
              );
            })}
          </svg>

          {/* Inner ring — static */}
          <div
            style={{
              position: 'absolute',
              top: CENTER - RADIUS - 4,
              left: CENTER - RADIUS - 4,
              width: (RADIUS + 4) * 2,
              height: (RADIUS + 4) * 2,
              borderRadius: '50%',
              border: '1px solid rgba(201,168,117,0.18)',
              pointerEvents: 'none',
            }}
          />

          {/* Category dots arranged around circle */}
          {CATEGORY_FILTERS.map((cat, i) => {
            const angle = (i * 360) / itemCount - 90; /* -90 puts first item at top */
            const rad = (angle * Math.PI) / 180;
            const x = CENTER + Math.cos(rad) * RADIUS;
            const y = CENTER + Math.sin(rad) * RADIUS;

            const isActive = activeCategory === cat.key;
            const isHovered = hoveredKey === cat.key;
            const dotColor =
              cat.key === 'all' ? MARKER_COLOR_GREEN : getCategoryColor(cat.key);

            /* Label position — pushed further out from the dot */
            const labelRadius = RADIUS + 28;
            const lx = CENTER + Math.cos(rad) * labelRadius;
            const ly = CENTER + Math.sin(rad) * labelRadius;

            /* Determine label alignment by angle */
            const cosA = Math.cos(rad);
            let textAlign: 'left' | 'center' | 'right' = 'center';
            if (cosA > 0.3) textAlign = 'left';
            else if (cosA < -0.3) textAlign = 'right';

            return (
              <button
                key={cat.key}
                type="button"
                onMouseEnter={() => setHoveredKey(cat.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => {
                  onCategoryChange(cat.key);
                  onFilterOpenChange(false);
                }}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 28,
                  height: 28,
                  marginLeft: -14,
                  marginTop: -14,
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transform: `scale(${isActive ? 1.18 : isHovered ? 1.1 : 1})`,
                  transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                aria-label={cat.label}
              >
                {/* Dot core */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: isActive ? 4 : 8,
                    borderRadius: '50%',
                    background: dotColor,
                    boxShadow: isActive
                      ? `0 0 14px ${dotColor}, 0 0 5px ${dotColor}cc`
                      : isHovered
                        ? `0 0 10px ${dotColor}90`
                        : `0 0 4px ${dotColor}50`,
                    transition: 'inset 0.28s ease, box-shadow 0.28s ease',
                  }}
                />
                {/* Active gold ring */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '1.5px solid #C9A875',
                      boxShadow: '0 0 10px rgba(201,168,117,0.6)',
                    }}
                  />
                )}

                {/* Floating label */}
                <span
                  style={{
                    position: 'absolute',
                    left: lx - x,
                    top: ly - y,
                    transform: 'translate(-50%, -50%)',
                    fontSize: 9.5,
                    fontFamily: 'system-ui, sans-serif',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isActive
                      ? '#E8DCC4'
                      : isHovered
                        ? '#C9A875'
                        : 'rgba(232, 220, 196, 0.55)',
                    fontWeight: isActive ? 600 : 500,
                    whiteSpace: 'nowrap',
                    textAlign,
                    pointerEvents: 'none',
                    transition: 'color 0.2s ease',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}

          {/* Center hub — engraved active category name */}
          <div
            style={{
              position: 'absolute',
              left: CENTER - 36,
              top: CENTER - 36,
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 25%, #2a2218 0%, #15110d 80%)',
              border: '1px solid rgba(201,168,117,0.35)',
              boxShadow: [
                'inset 0 1px 0 rgba(245,230,204,0.12)',
                'inset 0 -2px 4px rgba(0,0,0,0.5)',
                '0 0 12px rgba(201,168,117,0.15)',
              ].join(', '),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: 7,
                letterSpacing: '0.22em',
                color: 'rgba(201,168,117,0.6)',
                textTransform: 'uppercase',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Filter
            </span>
            <span
              style={{
                fontSize: 11,
                color: '#E8DCC4',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}
            >
              {activeLabel}
            </span>
          </div>
        </div>
      )}

      {/* Inline keyframes — local to component */}
      <style>{`
        @keyframes compassFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.7) rotate(-12deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes compassRotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
