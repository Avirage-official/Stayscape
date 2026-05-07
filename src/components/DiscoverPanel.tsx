'use client';

/**
 * DiscoverPanel — redesigned shell.
 *
 * Layout (matches reference):
 *   Desktop: cards sidebar (left, ~380px) + map (right, flex)
 *   Mobile:  map on top (30vh) + cards stacked below
 *
 * Reuses untouched:
 *   - useDiscoverCategories / useDiscoverPlaces / useDiscoverEvents / useCurations / useLocalInsights
 *   - MapPlaceholder (all map behaviors preserved)
 *   - PlaceDetailDialog / EventDetailDialog / AddToDayDialog / AddUnknownPlaceDialog
 *   - SuccessToast / SyncUpdateToast
 *   - useItinerary / region context
 *
 * Dropped from old version:
 *   - Inline AI chat section (Aria is in side nav)
 *   - Mobile explore/map tab toggle (stack works)
 *   - Hardcoded light-theme colours (now uses CSS vars)
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import PlaceDetailDialog from '@/components/PlaceDetailDialog';
import EventDetailDialog from '@/components/EventDetailDialog';
import {
  useDiscoverCategories,
  useDiscoverPlaces,
  useLocalInsights,
  useDiscoverEvents,
  useCurations,
} from '@/hooks/useDiscoverData';
import type { EventCard } from '@/hooks/useDiscoverData';
import {
  FALLBACK_PLACES_BY_CATEGORY,
  type CategoryItem,
  type PlaceCard,
} from '@/lib/data/discover-fallback';
import { useRegion } from '@/lib/context/region-context';
import AddToDayDialog from '@/components/discover/AddToDayDialog';
import AddUnknownPlaceDialog from '@/components/discover/AddUnknownPlaceDialog';
import { useItinerary } from '@/components/ItineraryContext';
import SuccessToast from '@/components/discover/SuccessToast';
import SyncUpdateToast from '@/components/discover/SyncUpdateToast';
import MapPlaceholder from '@/components/MapPlaceholder';
import DiscoverCard from '@/components/discover/DiscoverCard';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

/* ─── Constants ─── */

const PLACES_PAGE_SIZE = 10;
const MAX_DISCOVER_PLACES = 20;
const DISCOVER_VISITED_KEY_PREFIX = 'stayscape_discover_visited_';

/* ─── Inline error component ─── */

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: 12,
        border: '1px solid rgba(224, 123, 107, 0.20)',
        background: 'rgba(224, 123, 107, 0.05)',
      }}
    >
      <span
        style={{ fontSize: 11, color: 'var(--error)', opacity: 0.85 }}
      >
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="ss-pill"
        style={{
          padding: '4px 10px',
          fontSize: 11,
          marginLeft: 12,
          flexShrink: 0,
        }}
      >
        Retry
      </button>
    </div>
  );
}

/* ─── Category pill ─── */

function CategoryPill({
  cat,
  active,
  onClick,
}: {
  cat: CategoryItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={dmSans.className}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: active
          ? '1px solid var(--gold)'
          : '1px solid var(--border)',
        background: active
          ? 'linear-gradient(180deg, rgba(201, 168, 117, 0.18) 0%, rgba(201, 168, 117, 0.10) 100%)'
          : 'var(--surface)',
        color: active ? 'var(--gold)' : 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        letterSpacing: '0.01em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: active
          ? 'inset 0 1px 0 rgba(245, 230, 204, 0.10), 0 0 14px rgba(201, 168, 117, 0.18)'
          : 'inset 0 1px 0 rgba(245, 230, 204, 0.04)',
        transition:
          'background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {cat.icon && <span style={{ fontSize: 12 }}>{cat.icon}</span>}
      {cat.label}
    </button>
  );
}

/* ─── Main component ─── */

interface DiscoverPanelProps {
  stayId?: string | null;
  guestName?: string;
}

export default function DiscoverPanel({ stayId, guestName: _guestName = '' }: DiscoverPanelProps) {
  const { region } = useRegion();
  const { addItem } = useItinerary();
  
  const [selectedMapPlaceId, setSelectedMapPlaceId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('top-places');
  const [activePlacesCategory, setActivePlacesCategory] = useState<string | null | undefined>(undefined);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState<PlaceCard | null>(null);

  const [successToast, setSuccessToast] = useState<{
    placeName: string;
    dayValue: string;
    bookingUrl: string;
  } | null>(null);
  const [showSyncUpdateToast, setShowSyncUpdateToast] = useState(false);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<PlaceCard | null>(null);

  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [detailEvent, _setDetailEvent] = useState<EventCard | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [unknownPlace, _setUnknownPlace] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [addUnknownPlaceOpen, setAddUnknownPlaceOpen] = useState(false);

  const dataLoadedRef = useRef<boolean | null>(null);
  const regionLoadedRef = useRef<string | null>(null);

  /* Existing data hooks (UNTOUCHED) */
  const {
    categories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useDiscoverCategories();
  const {
    places: dbPlaces,
    hasMore: hasMorePlaces,
    loading: placesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useDiscoverPlaces();
  const { refetch: refetchInsights } = useLocalInsights();
  const {
    error: _eventsError,
    refetch: refetchEvents,
  } = useDiscoverEvents();
  useCurations(stayId);

  /* Initial load */
  if (dataLoadedRef.current == null) {
    dataLoadedRef.current = true;
    refetchCategories();
    refetchInsights();
    refetchPlaces('top-places', 'Top Places', {
      limit: PLACES_PAGE_SIZE,
      offset: 0,
      regionId: region?.id,
    });
    if (region?.id) refetchEvents(region.id);
  }

  /* Reload when region becomes available */
  if (region?.id && regionLoadedRef.current !== region.id) {
    regionLoadedRef.current = region.id;
    refetchPlaces('top-places', 'Top Places', {
      limit: PLACES_PAGE_SIZE,
      offset: 0,
      regionId: region.id,
    });
    refetchEvents(region.id);
  }

  /* DB places with fallback */
  const places = useMemo(
    () =>
      dbPlaces.length > 0
        ? dbPlaces
        : FALLBACK_PLACES_BY_CATEGORY[activeCategory] ?? [],
    [dbPlaces, activeCategory],
  );

  /* Filtered list (search) */
  const visiblePlaces = useMemo(() => {
    if (!searchQuery.trim()) return places;
    const q = searchQuery.toLowerCase();
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [places, searchQuery]);

  /* Handlers */

  const handleCategoryClick = useCallback(
    (item: CategoryItem) => {
      setActiveCategory(item.id);
      setActivePlacesCategory(item.placesCategory);
      refetchPlaces(item.id, item.label, {
        limit: PLACES_PAGE_SIZE,
        offset: 0,
        regionId: region?.id,
        placesCategory: item.placesCategory,
      });
    },
    [refetchPlaces, region?.id],
  );

  const handleShowMorePlaces = useCallback(() => {
    if (places.length >= MAX_DISCOVER_PLACES) return;
    const activeLabel =
      categories.find((c) => c.id === activeCategory)?.label ?? 'Places';
    refetchPlaces(activeCategory, activeLabel, {
      limit: PLACES_PAGE_SIZE,
      offset: places.length,
      append: true,
      regionId: region?.id,
      placesCategory: activePlacesCategory,
    });
  }, [
    places.length,
    categories,
    activeCategory,
    refetchPlaces,
    region?.id,
    activePlacesCategory,
  ]);

  const handleRetryPlaces = useCallback(() => {
    refetchPlaces(
      activeCategory,
      categories.find((c) => c.id === activeCategory)?.label ?? 'Places',
      {
        limit: PLACES_PAGE_SIZE,
        offset: 0,
        regionId: region?.id,
        placesCategory: activePlacesCategory,
      },
    );
  }, [
    refetchPlaces,
    activeCategory,
    categories,
    region?.id,
    activePlacesCategory,
  ]);

  const handleCardClick = useCallback((place: PlaceCard) => {
    setDetailPlace(place);
    setDetailDialogOpen(true);
  }, []);

  const handleConfirmAdd = useCallback(
    (placeId: string, day: string) => {
      const place =
        places.find((p) => p.id === placeId) ?? addingPlace;
      if (place) {
        const date =
          day && !isNaN(Date.parse(day)) ? new Date(day) : new Date();
        addItem({
          placeId: place.id,
          name: place.name,
          category: place.category,
          image: place.image,
          date,
          time: '10:00',
          durationHours: 2,
        });
        setSuccessToast({
          placeName: place.name,
          dayValue: day,
          bookingUrl: place.bookingUrl,
        });
      }
      setAddDialogOpen(false);
      setAddingPlace(null);
    },
    [places, addingPlace, addItem],
  );

  const handleDismissToast = useCallback(() => setSuccessToast(null), []);
  const handleDismissSyncUpdateToast = useCallback(
    () => setShowSyncUpdateToast(false),
    [],
  );

  /* Sync update toast */
  useEffect(() => {
    if (!region?.id) return;
    const storageKey = `${DISCOVER_VISITED_KEY_PREFIX}${region.id}`;
    const currentVisitTimestamp = Date.now();
    setShowSyncUpdateToast(false);

    const fetchSyncStatus = async () => {
      try {
        const response = await fetch(
          `/api/discovery/region-sync-status?regionId=${encodeURIComponent(region.id)}`,
        );
        if (!response.ok) return;
        const body = (await response.json()) as { last_synced_at?: string | null };
        const lastSyncedAt = body.last_synced_at;
        const lastVisitRaw = window.localStorage.getItem(storageKey);
        const lastVisitMs = lastVisitRaw ? Number(lastVisitRaw) : 0;
        if (lastSyncedAt && new Date(lastSyncedAt).getTime() > lastVisitMs) {
          setShowSyncUpdateToast(true);
        }
      } catch {
        // silent
      } finally {
        window.localStorage.setItem(storageKey, String(currentVisitTimestamp));
      }
    };
    void fetchSyncStatus();
  }, [region?.id]);

  /* Render */

  const sidebarHeading = `${visiblePlaces.length} ${
    visiblePlaces.length === 1 ? 'place' : 'places'
  } near you`;

  return (
    <>
      <style>{`
        .discover-shell {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--background);
          color: var(--text-primary);
          overflow: hidden;
        }
        .discover-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        @media (min-width: 900px) {
          .discover-grid {
            flex-direction: row;
            min-height: 0;
          }
          .discover-sidebar {
            width: 380px;
            max-width: 380px;
            flex-shrink: 0;
            height: 100%;
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .discover-map-wrap {
            flex: 1;
            height: 100%;
            min-height: 0;
            min-width: 0;
          }
        }
        @media (max-width: 899px) {
          .discover-sidebar {
            width: 100%;
            order: 2;
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }
          .discover-map-wrap {
            order: 1;
            height: 32vh;
            width: 100%;
            flex-shrink: 0;
            border-bottom: 1px solid var(--border);
          }
        }
        .discover-sidebar-header {
          padding: 20px 18px 14px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .discover-categories-row {
          padding: 12px 18px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          flex-shrink: 0;
          scrollbar-width: none;
          border-bottom: 1px solid var(--border-subtle);
        }
        .discover-categories-row::-webkit-scrollbar { display: none; }
        .discover-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 14px 14px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .discover-search-input {
          width: 100%;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          padding: 0 14px 0 38px;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
          box-shadow: inset 0 1px 0 rgba(245, 230, 204, 0.04);
        }
        .discover-search-input::placeholder {
          color: var(--text-muted);
        }
        .discover-search-input:focus {
          border-color: rgba(201, 168, 117, 0.45);
          box-shadow: inset 0 1px 0 rgba(245, 230, 204, 0.06), 0 0 0 3px rgba(201, 168, 117, 0.12);
        }
      `}</style>

      <div className="discover-shell">
        <div className="discover-grid">
          {/* ── SIDEBAR ── */}
          <aside className="discover-sidebar">
            {/* Header */}
            <div className="discover-sidebar-header">
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                Discover
              </p>
              <h2
                className={cormorant.className}
                style={{
                  margin: '6px 0 14px',
                  fontSize: 22,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {sidebarHeading}
              </h2>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="discover-search-input"
                  placeholder="Search places…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="discover-categories-row">
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    cat={cat}
                    active={cat.id === activeCategory}
                    onClick={() => handleCategoryClick(cat)}
                  />
                ))}
              </div>
            )}

            {/* Errors */}
            {(categoriesError || placesError) && (
              <div style={{ padding: '8px 14px', flexShrink: 0 }}>
                {categoriesError && (
                  <InlineError
                    message="Could not load categories"
                    onRetry={refetchCategories}
                  />
                )}
                {placesError && !categoriesError && (
                  <InlineError
                    message="Could not load places"
                    onRetry={handleRetryPlaces}
                  />
                )}
              </div>
            )}

            {/* Card list */}
            <div className="discover-list ss-stagger">
              {visiblePlaces.map((place) => (
                <DiscoverCard
                  key={place.id}
                  place={place}
                  onClick={() => handleCardClick(place)}
                />
              ))}

              {visiblePlaces.length === 0 && !placesLoading && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <p
                    className={cormorant.className}
                    style={{
                      margin: 0,
                      fontSize: 18,
                      color: 'var(--text-primary)',
                    }}
                  >
                    No places found
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Try a different category'}
                  </p>
                </div>
              )}

              {/* Load more */}
              {hasMorePlaces &&
                places.length < MAX_DISCOVER_PLACES &&
                !searchQuery && (
                  <button
                    type="button"
                    onClick={handleShowMorePlaces}
                    className="ss-pill"
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--text-muted)',
                      marginTop: 4,
                    }}
                  >
                    Load more
                  </button>
                )}
            </div>
          </aside>

          {/* ── MAP ── */}
          <div className="discover-map-wrap">
            <MapPlaceholder 
             stayId={stayId ?? null}
             onSelectPlace={(place) => setSelectedMapPlaceId(place.id)}
             selectedPlaceId={selectedMapPlaceId}
          />
            stayId={stayId ?? null} />
          </div>
        </div>

        {/* Add-to-day dialog */}
        <AddToDayDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          place={addingPlace}
          onConfirm={handleConfirmAdd}
        />

        {/* Place detail dialog */}
        <PlaceDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          place={detailPlace}
        />

        {/* Event detail dialog */}
        <EventDetailDialog
          open={eventDetailOpen}
          onOpenChange={setEventDetailOpen}
          event={detailEvent}
        />

        {/* Add unknown place dialog */}
        <AddUnknownPlaceDialog
          open={addUnknownPlaceOpen}
          onOpenChange={setAddUnknownPlaceOpen}
          place={unknownPlace}
        />

        {/* Toasts */}
        {successToast && (
          <SuccessToast
            placeName={successToast.placeName}
            dayValue={successToast.dayValue}
            bookingUrl={successToast.bookingUrl}
            onDismiss={handleDismissToast}
          />
        )}

        {showSyncUpdateToast && (
          <SyncUpdateToast onDismiss={handleDismissSyncUpdateToast} />
        )}
      </div>
    </>
  );
}
