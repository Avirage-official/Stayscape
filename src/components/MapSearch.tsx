'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createDebouncedSearch } from '@/lib/mapbox/geocoding';
import { MARKER_COLOR_GOLD } from '@/lib/mapbox/config';
import type { SearchResult } from '@/types/mapbox';

interface MapSearchProps {
  /** Called when the user selects a result */
  onSelect: (result: SearchResult) => void;
  /** Called when the search is cleared */
  onClear?: () => void;
}

export default function MapSearch({ onSelect, onClear }: MapSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /* ── Debounced search ──────────────────────────────────── */
  const debouncedSearch = useRef(
    createDebouncedSearch((r) => {
      setResults(r);
      setIsLoading(false);
      setIsOpen(r.length > 0);
    }),
  ).current;

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setActiveIndex(-1);
      if (value.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  /* ── Keyboard navigation ───────────────────────────────── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, results, activeIndex],
  );

  /* ── Scroll active item into view ──────────────────────── */
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  /* ── Select a result ───────────────────────────────────── */
  const handleSelect = useCallback(
    (result: SearchResult) => {
      setQuery(result.name);
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      onSelect(result);
    },
    [onSelect],
  );

  /* ── Clear ─────────────────────────────────────────────── */
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setIsLoading(false);
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  /* ── Dismiss dropdown on outside click ─────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current &&
        !inputRef.current.closest('[data-mapsearch]')?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Pre-warm first result on mount ────────────────────── */
  // (no-op; search only fires on user input)

  return (
    <div
      data-mapsearch=""
      className="absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 z-20 w-[min(340px,calc(100%-96px))]"
    >
      {/* Results dropdown — opens upward when bar is at the bottom */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id="mapsearch-listbox"
          role="listbox"
          aria-label="Search results"
          className="mb-1.5 rounded-[9px] overflow-hidden overflow-y-auto max-h-[220px]"
          style={{
            background: 'rgba(10,14,19,0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
          }}
        >
          {results.map((result, i) => {
            const isActive = i === activeIndex;
            return (
              <li
                key={result.id}
                id={`mapsearch-item-${i}`}
                role="option"
                aria-selected={isActive}
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    // prevent blur on input before click fires
                    e.preventDefault();
                    handleSelect(result);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors duration-100 cursor-pointer"
                  style={{
                    background: isActive
                      ? `${MARKER_COLOR_GOLD}12`
                      : 'transparent',
                    borderBottom:
                      i < results.length - 1
                        ? '1px solid rgba(255,255,255,0.04)'
                        : 'none',
                  }}
                >
                  {/* Pin icon */}
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: isActive ? `${MARKER_COLOR_GOLD}20` : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="7" r="2.5" fill={isActive ? MARKER_COLOR_GOLD : '#6B7280'} />
                      <path
                        d="M8 14s-5-4.5-5-7a5 5 0 0110 0c0 2.5-5 7-5 7z"
                        stroke={isActive ? MARKER_COLOR_GOLD : '#6B7280'}
                        strokeWidth="1.2"
                        fill="none"
                      />
                    </svg>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[11px] font-medium truncate"
                      style={{ color: isActive ? MARKER_COLOR_GOLD : 'var(--text-primary)' }}
                    >
                      {result.name}
                    </span>
                    {result.subtitle && (
                      <span className="block text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {result.subtitle}
                      </span>
                    )}
                  </span>

                  {/* Distance badge */}
                  <span
                    className="text-[9px] font-medium flex-shrink-0 rounded-full px-1.5 py-0.5"
                    style={{
                      color: MARKER_COLOR_GOLD,
                      background: `${MARKER_COLOR_GOLD}14`,
                      border: `1px solid ${MARKER_COLOR_GOLD}25`,
                    }}
                  >
                    {result.distanceDisplay}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Search input */}
      <div
        className="flex items-center gap-2 rounded-[9px] px-3 py-2"
        style={{
          background: 'rgba(10,14,19,0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${isOpen || query ? `${MARKER_COLOR_GOLD}40` : 'rgba(255,255,255,0.09)'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
          transition: 'border-color 0.2s',
        }}
      >
        {/* Search icon */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{ flexShrink: 0, opacity: 0.5 }}
        >
          <circle cx="6.5" cy="6.5" r="5" stroke="#E8E6E1" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="#E8E6E1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Search places nearby…"
          aria-label="Search places on map"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `mapsearch-item-${activeIndex}` : undefined}
          aria-controls="mapsearch-listbox"
          autoComplete="off"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[rgba(232,230,225,0.3)] text-[var(--text-primary)] min-w-0"
        />

        {/* Loading spinner */}
        {isLoading && (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ flexShrink: 0, opacity: 0.5, animation: 'spin 0.9s linear infinite' }}
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
        )}

        {/* Clear button */}
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer"
            style={{ lineHeight: 1 }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}