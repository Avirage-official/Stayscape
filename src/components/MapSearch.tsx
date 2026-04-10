'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchPlaces, haversineMetres, formatDistanceDisplay } from '@/lib/mapbox/geocoding';
import { MARKER_COLOR_GOLD, SEARCH_DEBOUNCE_MS, DEFAULT_SEARCH_LIMIT } from '@/lib/mapbox/config';
import type { SearchResult } from '@/types/mapbox';
import { useRegion } from '@/lib/context/region-context';

interface MapSearchProps {
  /** Called when the user selects a result */
  onSelect: (result: SearchResult) => void;
  /** Called when the search is cleared */
  onClear?: () => void;
}

/**
 * Compute a bounding box from a center lat/lng and a radius in km.
 * Returns [west, south, east, north].
 */
function computeBbox(lat: number, lng: number, radiusKm: number): [number, number, number, number] {
  const deltaLat = radiusKm / 111.32;
  const deltaLng = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [
    parseFloat((lng - deltaLng).toFixed(6)),
    parseFloat((lat - deltaLat).toFixed(6)),
    parseFloat((lng + deltaLng).toFixed(6)),
    parseFloat((lat + deltaLat).toFixed(6)),
  ];
}

export default function MapSearch({ onSelect, onClear }: MapSearchProps) {
  const { region } = useRegion();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* -- Combined search: Supabase places + Mapbox geocoding--- */
  const runSearch = useCallback(
    async (value: string) => {
      if (value.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const regionLat = region?.latitude ?? 0;
      const regionLng = region?.longitude ?? 0;
      const radiusKm = region?.radius_km ?? 30;
      const bbox = region
        ? computeBbox(regionLat, regionLng, radiusKm)
        : undefined;

      /* Run both fetches in parallel */
      const [supabaseResults, mapboxResults] = await Promise.all([
        /* 1 — Supabase local places */
        region
          ? fetch(
              `/api/places/search?q=${encodeURIComponent(value)}&region_id=${region.id}&limit=${DEFAULT_SEARCH_LIMIT}`,
            )
              .then((r) => (r.ok ? r.json() : { data: [] }))
              .then((j: { data?: SearchResult[] }) => (j.data ?? []) as SearchResult[])
              .catch(() => [] as SearchResult[])
          : Promise.resolve([] as SearchResult[]),

        /* 2 — Mapbox geocoding with bbox restriction */
        searchPlaces(value, {
          proximityLat: region != null ? regionLat : undefined,
          proximityLng: region != null ? regionLng : undefined,
          regionLat: region != null ? regionLat : undefined,
          regionLng: region != null ? regionLng : undefined,
          bbox,
          limit: DEFAULT_SEARCH_LIMIT,
        }),
      ]);

      /* Tag sources */
      const supabaseTagged: SearchResult[] = supabaseResults.map((r) => ({
        ...r,
        source: 'supabase' as const,
      }));
      const mapboxTagged: SearchResult[] = mapboxResults.map((r) => ({
        ...r,
        source: 'mapbox' as const,
      }));

      /* Deduplicate by name (case-insensitive) — Supabase results take priority */
      const seen = new Set<string>();
      const merged: SearchResult[] = [];
      for (const r of [...supabaseTagged, ...mapboxTagged]) {
        const key = r.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(r);
        }
      }

      /* Recompute distances if we have a region center */
      const final = merged.map((r) => {
        if (!region) return r;
        const distanceMetres = haversineMetres(regionLat, regionLng, r.lat, r.lng);
        return { ...r, distanceMetres, distanceDisplay: formatDistanceDisplay(distanceMetres) };
      });

      setResults(final);
      setIsLoading(false);
      setIsOpen(final.length > 0);
    },
    [region],
  );

  /* -- Debounced query change--- */
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setActiveIndex(-1);
      if (value.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        return;
      }
      setIsLoading(true);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        runSearch(value);
      }, SEARCH_DEBOUNCE_MS);
    },
    [runSearch],
  );

  /* -- Keyboard navigation--- */
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

  /* -- Scroll active item into view--- */
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  /* -- Select a result--- */
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

  /* -- Clear--- */
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setIsLoading(false);
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  /* -- Dismiss dropdown on outside click--- */
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
            background: 'var(--card-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--card-border)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
          }}
        >
          {results.map((result, i) => {
            const isActive = i === activeIndex;
            const isSupabase = result.source === 'supabase';
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
                        ? '1px solid var(--border-subtle)'
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
                      background: isActive ? `${MARKER_COLOR_GOLD}20` : 'var(--surface-raised)',
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

                  <span className="flex items-center gap-1 flex-shrink-0">
                    {/* Stayscape badge for local DB results */}
                    {isSupabase && (
                      <span
                        className="text-[8px] font-semibold rounded-full px-1 py-0.5 hidden sm:inline-block"
                        style={{
                          color: MARKER_COLOR_GOLD,
                          background: `${MARKER_COLOR_GOLD}18`,
                          border: `1px solid ${MARKER_COLOR_GOLD}30`,
                          letterSpacing: '0.03em',
                        }}
                      >
                        Stayscape
                      </span>
                    )}

                    {/* Distance badge */}
                    <span
                      className="text-[9px] font-medium rounded-full px-1.5 py-0.5"
                      style={{
                        color: MARKER_COLOR_GOLD,
                        background: `${MARKER_COLOR_GOLD}14`,
                        border: `1px solid ${MARKER_COLOR_GOLD}25`,
                      }}
                    >
                      {result.distanceDisplay}
                    </span>
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
          background: 'var(--card-bg)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${isOpen || query ? `${MARKER_COLOR_GOLD}40` : 'var(--card-border)'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
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
          style={{ flexShrink: 0, opacity: 0.5, color: 'var(--text-primary)' }}
        >
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={region ? `Search in ${region.name}…` : 'Search places nearby…'}
          aria-label="Search places on map"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `mapsearch-item-${activeIndex}` : undefined}
          aria-controls="mapsearch-listbox"
          autoComplete="off"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--text-faint)] text-[var(--text-primary)] min-w-0"
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
