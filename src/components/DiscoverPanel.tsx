'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { sendChatMessage } from '@/lib/ai/chat';

/* ─── Inline error component ─── */

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5">
      <div className="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.2" strokeOpacity="0.6" />
          <path d="M6 3.5V6.5M6 8H6.01" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
        <span className="text-[10px] text-red-400/80">{message}</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="text-[10px] text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 px-2 py-1 rounded-lg transition-colors cursor-pointer ml-3 flex-shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

/* ─── Place row card (compact, left-panel style) ─── */

function PlaceRowCard({
  place,
  idx,
  onClick,
}: {
  place: PlaceCard;
  idx: number;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 64,
          height: 64,
          flexShrink: 0,
          borderRadius: 10,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.05)',
          position: 'relative',
        }}
      >
        {place.image && !imgError ? (
          <Image
            src={place.image}
            alt={place.name}
            fill
            sizes="64px"
            style={{ objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: 'rgba(255,255,255,0.20)',
            }}
          >
            {place.category.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.90)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 3,
          }}
        >
          {place.name}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          <span style={{ textTransform: 'capitalize' }}>{place.category}</span>
          {place.rating > 0 && (
            <>
              <span>·</span>
              <span style={{ color: 'rgba(193,127,58,0.70)' }}>★ {place.rating.toFixed(1)}</span>
            </>
          )}
        </div>
        {place.description && (
          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.30)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 4,
            }}
          >
            {place.description}
          </p>
        )}
      </div>
    </motion.div>
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
  const [hovered, setHovered] = useState(false);

  const style: import('react').CSSProperties = {
    height: 30,
    padding: '0 14px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.18s ease',
    display: 'flex',
    alignItems: 'center',
    ...(active
      ? {
          background: 'rgba(193,127,58,0.15)',
          border: '1px solid rgba(193,127,58,0.40)',
          color: 'var(--gold)',
        }
      : hovered
        ? {
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.70)',
          }
        : {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.45)',
          }),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {cat.icon && <span style={{ fontSize: 12, marginRight: 6 }}>{cat.icon}</span>}
      {cat.label}
    </button>
  );
}

/* ─── Main DiscoverPanel component ─── */

interface DiscoverPanelProps {
  stayId?: string | null;
  guestName?: string;
}

const MAX_ASSISTANT_MESSAGES = 8;
const MAX_VISIBLE_CHAT_MESSAGES = 3;
const PLACES_PAGE_SIZE = 10;
const MAX_DISCOVER_PLACES = 20;
const DISCOVER_VISITED_KEY_PREFIX = 'stayscape_discover_visited_';

export default function DiscoverPanel({ stayId, guestName = '' }: DiscoverPanelProps) {
  const { region } = useRegion();
  const [activeCategory, setActiveCategory] = useState<string>('top-places');
  const [activePlacesCategory, setActivePlacesCategory] = useState<string | null | undefined>(undefined);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState<PlaceCard | null>(null);
  const [successToast, setSuccessToast] = useState<{ placeName: string; dayValue: string; bookingUrl: string } | null>(null);
  const [showSyncUpdateToast, setShowSyncUpdateToast] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<PlaceCard | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [detailEvent, _setDetailEvent] = useState<EventCard | null>(null);
  const [mobileDiscoverTab, setMobileDiscoverTab] = useState<'explore' | 'map'>('explore');
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [unknownPlace, _setUnknownPlace] = useState<{
    name: string; address: string; lat: number; lng: number;
  } | null>(null);
  const [addUnknownPlaceOpen, setAddUnknownPlaceOpen] = useState(false);
  // New UI states
  const [chatExpanded, setChatExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const dataLoadedRef = useRef<boolean | null>(null);
  const regionLoadedRef = useRef<string | null>(null);
  const assistantIdRef = useRef(0);

  // DB-first hooks with dummy fallback
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
  const { insights: _insights, refetch: refetchInsights } = useLocalInsights();
  const {
    events: _events,
    error: _eventsError,
    refetch: refetchEvents,
  } = useDiscoverEvents();
  const { curations: _curations } = useCurations(stayId);
  const { addItem } = useItinerary();

  // Trigger initial data load once (using null-check pattern for eslint refs rule)
  if (dataLoadedRef.current == null) {
    dataLoadedRef.current = true;
    refetchCategories();
    refetchInsights();
    refetchPlaces('top-places', 'Top Places', { limit: PLACES_PAGE_SIZE, offset: 0, regionId: region?.id });
    if (region?.id) refetchEvents(region.id);
  }

  // Re-load places when region becomes available after initial render
  if (region?.id && regionLoadedRef.current !== region.id) {
    regionLoadedRef.current = region.id;
    refetchPlaces('top-places', 'Top Places', { limit: PLACES_PAGE_SIZE, offset: 0, regionId: region.id });
    refetchEvents(region.id);
  }

  // Use DB places if available, otherwise fall back to hardcoded
  const places = useMemo(
    () => dbPlaces.length > 0 ? dbPlaces : (FALLBACK_PLACES_BY_CATEGORY[activeCategory] ?? []),
    [dbPlaces, activeCategory],
  );

  const handleCategoryClick = useCallback((item: CategoryItem) => {
    setActiveCategory(item.id);
    setActivePlacesCategory(item.placesCategory);
    refetchPlaces(item.id, item.label, { limit: PLACES_PAGE_SIZE, offset: 0, regionId: region?.id, placesCategory: item.placesCategory });
  }, [refetchPlaces, region?.id]);

  const handleShowMorePlaces = useCallback(() => {
    if (places.length >= MAX_DISCOVER_PLACES) return;
    const activeLabel = categories.find((c) => c.id === activeCategory)?.label ?? 'Places';
    refetchPlaces(activeCategory, activeLabel, {
      limit: PLACES_PAGE_SIZE,
      offset: places.length,
      append: true,
      regionId: region?.id,
      placesCategory: activePlacesCategory,
    });
  }, [places.length, categories, activeCategory, refetchPlaces, region?.id, activePlacesCategory]);

  const handleRetryPlaces = useCallback(() => {
    refetchPlaces(
      activeCategory,
      categories.find((c) => c.id === activeCategory)?.label ?? 'Places',
      { limit: PLACES_PAGE_SIZE, offset: 0, regionId: region?.id, placesCategory: activePlacesCategory },
    );
  }, [refetchPlaces, activeCategory, categories, region?.id, activePlacesCategory]);

  const handleCardClick = useCallback((place: PlaceCard) => {
    setDetailPlace(place);
    setDetailDialogOpen(true);
  }, []);

  const handleConfirmAdd = useCallback((placeId: string, day: string) => {
    const place = places.find((p) => p.id === placeId) ?? addingPlace;
    if (place) {
      const date = day && !isNaN(Date.parse(day)) ? new Date(day) : new Date();
      addItem({
        placeId: place.id,
        name: place.name,
        category: place.category,
        image: place.image,
        date,
        time: '10:00',
        durationHours: 2,
      });
      setSuccessToast({ placeName: place.name, dayValue: day, bookingUrl: place.bookingUrl });
    }
    setAddDialogOpen(false);
    setAddingPlace(null);
  }, [places, addingPlace, addItem]);

  const handleDismissToast = useCallback(() => {
    setSuccessToast(null);
  }, []);

  const handleDismissSyncUpdateToast = useCallback(() => {
    setShowSyncUpdateToast(false);
  }, []);

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
        const lastVisitMs = lastVisitRaw ? Number(lastVisitRaw) : null;

        if (lastSyncedAt) {
          const syncedAtMs = new Date(lastSyncedAt).getTime();
          if (
            Number.isFinite(syncedAtMs)
            && syncedAtMs > (lastVisitMs ?? 0)
          ) {
            setShowSyncUpdateToast(true);
          }
        }
      } finally {
        window.localStorage.setItem(storageKey, String(currentVisitTimestamp));
      }
    };

    void fetchSyncStatus();
  }, [region?.id]);

  const sendAssistantMessage = useCallback(async (text?: string) => {
    const messageText = (text ?? assistantInput).trim();
    if (!messageText || isAssistantLoading) return;

    const userMessageId = `discover-user-${assistantIdRef.current + 1}`;
    assistantIdRef.current += 1;

    const userMessage = {
      id: userMessageId,
      role: 'user' as const,
      text: messageText,
    };
    setAssistantMessages((prev) =>
      [...prev, userMessage].slice(-MAX_ASSISTANT_MESSAGES)
    );
    setAssistantInput('');
    setIsAssistantLoading(true);

    const reply = await sendChatMessage(
      messageText,
      stayId,
      assistantMessages.map((m) => ({ role: m.role, text: m.text })),
      'discovery',
    );

    const assistantMessageId = `discover-assistant-${assistantIdRef.current + 1}`;
    assistantIdRef.current += 1;

    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant' as const,
      text: reply,
    };
    setAssistantMessages((prev) =>
      [...prev, assistantMessage].slice(-MAX_ASSISTANT_MESSAGES)
    );
    setIsAssistantLoading(false);
  }, [assistantInput, assistantMessages, isAssistantLoading, stayId]);

  // Scroll chat messages to bottom when new messages arrive
  useEffect(() => {
    if (chatExpanded && chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [assistantMessages, chatExpanded]);

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile sub-tabs — pill style, hidden on lg+ */}
        <div className="lg:hidden flex-shrink-0 flex items-center gap-2 px-4 h-11 bg-black/50 border-b border-white/10">
          {(['explore', 'map'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileDiscoverTab(tab)}
              className="h-6 px-3.5 rounded-full text-[10px] font-medium uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer border"
              style={
                mobileDiscoverTab === tab
                  ? {
                      background: 'rgba(193,127,58,0.15)',
                      color: '#C17F3A',
                      borderColor: 'rgba(193,127,58,0.40)',
                    }
                  : {
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.50)',
                      borderColor: 'rgba(255,255,255,0.15)',
                    }
              }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content: panel left + map right */}
        <div
          className="flex-1 flex overflow-hidden"
          style={{ background: 'var(--discover-bg)' }}
        >
          {/* ───── LEFT PANEL ───── */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-col h-full ${
              mobileDiscoverTab === 'explore' ? 'flex' : 'hidden'
            } lg:flex`}
            style={{
              width: 340,
              flexShrink: 0,
              background: '#0F0E0C',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
            {/* A. HEADER */}
            <div
              style={{
                height: 56,
                flexShrink: 0,
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: 15,
                    fontStyle: 'italic',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.2,
                  }}
                >
                  {region?.name ?? (guestName ? `${guestName}'s Stay` : 'Your Stay')}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: 'var(--gold)',
                    marginTop: 2,
                  }}
                >
                  Discover
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => { setSearchOpen((v) => !v); setSearchQuery(''); }}
                    style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
                    aria-label="Toggle search"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Search places</p></TooltipContent>
              </Tooltip>
            </div>

            {/* Search input (slides down when searchOpen) */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 44, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search places…"
                    autoFocus
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      padding: '0 12px',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.80)',
                      outline: 'none',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* B. CATEGORIES STRIP */}
            <div
              style={{
                flexShrink: 0,
                padding: '14px 20px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {categoriesError && (
                <InlineError message="Couldn't load categories" onRetry={refetchCategories} />
              )}
              <div
                ref={carouselRef}
                className="scrollbar-hide"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 8,
                  overflowX: 'auto',
                }}
              >
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    cat={cat}
                    active={activeCategory === cat.id}
                    onClick={() => handleCategoryClick(cat)}
                  />
                ))}
              </div>
            </div>

            {/* C. PLACES LIST */}
            <div
              className="scrollbar-hide"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 0,
              }}
            >
              {/* Count line */}
              <div
                style={{
                  padding: '14px 20px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'rgba(255,255,255,0.40)',
                  }}
                >
                  {categories.find((c) => c.id === activeCategory)?.label ?? 'Places'}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                  {places.length} {places.length === 1 ? 'place' : 'places'}
                </span>
              </div>

              {/* Error */}
              {placesError && (
                <div style={{ padding: '0 20px 10px' }}>
                  <InlineError
                    message="Couldn't load places right now"
                    onRetry={handleRetryPlaces}
                  />
                </div>
              )}

              {/* Loading skeleton */}
              {placesLoading && places.length === 0 && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        className="animate-pulse"
                        style={{
                          width: 64,
                          height: 64,
                          flexShrink: 0,
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)',
                        }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="animate-pulse" style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '70%' }} />
                        <div className="animate-pulse" style={{ height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '50%' }} />
                        <div className="animate-pulse" style={{ height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '85%' }} />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Place cards */}
              {(searchQuery.trim()
                ? places.filter((p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : places
              ).map((place, idx) => (
                <PlaceRowCard
                  key={place.id}
                  place={place}
                  idx={idx}
                  onClick={() => handleCardClick(place)}
                />
              ))}

              {/* Show more */}
              {hasMorePlaces && places.length < MAX_DISCOVER_PLACES && (
                <button
                  type="button"
                  onClick={handleShowMorePlaces}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px 20px',
                    textAlign: 'center',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.30)',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.30)'; }}
                >
                  Load more places
                </button>
              )}
            </div>

            {/* D. AI CHAT SECTION */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                flexShrink: 0,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(10,8,6,0.60)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Chat header row */}
              <div
                style={{
                  height: 40,
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: 'var(--gold)',
                      marginRight: 8,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    AI Concierge
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatExpanded((v) => !v)}
                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 4, display: 'flex', alignItems: 'center' }}
                  aria-label={chatExpanded ? 'Collapse chat' : 'Expand chat'}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.40)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: chatExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Messages area (expanded only) */}
              <AnimatePresence>
                {chatExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 160, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden', flexShrink: 0 }}
                  >
                    <div
                      ref={chatMessagesRef}
                      className="scrollbar-hide"
                      style={{
                        height: 160,
                        overflowY: 'auto',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {assistantMessages.length === 0 && (
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', alignSelf: 'center', marginTop: 'auto' }}>
                          Ask about this area...
                        </p>
                      )}
                      {assistantMessages.slice(-MAX_VISIBLE_CHAT_MESSAGES).map((message) => (
                        <div
                          key={message.id}
                          style={{
                            ...(message.role === 'user'
                              ? {
                                  alignSelf: 'flex-end',
                                  maxWidth: '75%',
                                  background: 'rgba(193,127,58,0.15)',
                                  border: '1px solid rgba(193,127,58,0.20)',
                                  borderRadius: '12px 12px 2px 12px',
                                }
                              : {
                                  alignSelf: 'flex-start',
                                  maxWidth: '85%',
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '2px 12px 12px 12px',
                                }),
                            padding: '8px 12px',
                            fontSize: 13,
                            color: message.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.70)',
                            lineHeight: 1.5,
                          }}
                        >
                          {message.text}
                        </div>
                      ))}
                      {isAssistantLoading && (
                        <div
                          style={{
                            alignSelf: 'flex-start',
                            display: 'flex',
                            gap: 4,
                            padding: '10px 12px',
                          }}
                        >
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="animate-bounce"
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: 999,
                                background: 'rgba(255,255,255,0.25)',
                                animationDelay: `${i * 0.15}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input row */}
              <div
                style={{
                  height: 48,
                  padding: '0 16px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendAssistantMessage();
                    }
                  }}
                  onFocus={() => setChatExpanded(true)}
                  placeholder="Ask about this area..."
                  aria-label="Ask discover assistant"
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    padding: '0 12px',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.80)',
                    outline: 'none',
                    transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocusCapture={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(193,127,58,0.40)';
                    (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(193,127,58,0.10)';
                  }}
                  onBlurCapture={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.10)';
                    (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => void sendAssistantMessage()}
                  disabled={isAssistantLoading}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: 'rgba(193,127,58,0.15)',
                    border: '1px solid rgba(193,127,58,0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(193,127,58,0.25)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(193,127,58,0.15)'; }}
                  aria-label="Send message"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* ───── MAP AREA ───── */}
          <div
            className={`relative overflow-hidden ${
              mobileDiscoverTab === 'map' ? 'flex flex-1' : 'hidden lg:flex'
            } lg:flex-1`}
            style={{ height: '100%' }}
          >
            <MapPlaceholder stayId={stayId ?? null} />
          </div>
        </div>

        {/* ── Add-to-day dialog ── */}
        <AddToDayDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          place={addingPlace}
          onConfirm={handleConfirmAdd}
        />

        {/* ── Place detail dialog ── */}
        <PlaceDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          place={detailPlace}
        />

        {/* ── Event detail dialog ── */}
        <EventDetailDialog
          open={eventDetailOpen}
          onOpenChange={setEventDetailOpen}
          event={detailEvent}
        />

        {/* ── Add unknown place dialog ── */}
        <AddUnknownPlaceDialog
          open={addUnknownPlaceOpen}
          onOpenChange={setAddUnknownPlaceOpen}
          place={unknownPlace}
        />

        {/* ── Success toast ── */}
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
    </TooltipProvider>
  );
}
