'use client';

import { useRef, useEffect } from 'react';
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

  return (
    <div ref={filterPanelRef} className="absolute z-20 top-3 right-3 lg:left-3 lg:right-auto lg:top-[33%]">
      {/* Toggle button */}
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
          background: filterOpen ? 'rgba(34,197,94,0.15)' : 'var(--dashboard-card-bg)',
          border: filterOpen ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--dashboard-card-border)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          color: filterOpen ? MARKER_COLOR_GREEN : 'var(--text-muted)',
          transition: 'all 0.18s ease',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="12" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {/* Dropdown panel — slides in from left */}
      {filterOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 6px)',
            minWidth: 148,
            background: 'var(--dashboard-card-bg)',
            border: '1px solid var(--dashboard-card-border)',
            borderRadius: 9,
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
            overflow: 'hidden',
            animation: 'filterSlideIn 0.22s ease forwards',
          }}
        >
          {CATEGORY_FILTERS.map(({ key, label }) => {
            const isActive = activeCategory === key;
            const dotColor = key === 'all' ? MARKER_COLOR_GREEN : getCategoryColor(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => { onCategoryChange(key); onFilterOpenChange(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 12px',
                  fontSize: 11,
                  letterSpacing: '0.03em',
                  fontFamily: 'system-ui, sans-serif',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isActive ? 'rgba(34,197,94,0.10)' : 'transparent',
                  color: isActive ? MARKER_COLOR_GREEN : 'var(--text-primary)',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isActive ? dotColor : `${dotColor}70`,
                  flexShrink: 0,
                  display: 'inline-block',
                  boxShadow: isActive ? `0 0 5px ${dotColor}80` : 'none',
                }} />
                {label}
                {isActive && (
                  <svg style={{ marginLeft: 'auto' }} width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="2 8 6 12 14 4" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
