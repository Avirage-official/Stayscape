'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
import CategoryCarouselCard from '@/components/discover/CategoryCarouselCard';
import HeroPlaceCard from '@/components/discover/HeroPlaceCard';
import UpcomingEventCard from '@/components/discover/UpcomingEventCard';
import InsightKnowledgeCard from '@/components/discover/InsightKnowledgeCard';
import AddToDayDialog from '@/components/discover/AddToDayDialog';
import AddUnknownPlaceDialog from '@/components/discover/AddUnknownPlaceDialog';
import { useItinerary } from '@/components/ItineraryContext';
import SuccessToast from '@/components/discover/SuccessToast';
import SyncUpdateToast from '@/components/discover/SyncUpdateToast';
import {
  PopularGuestCard,
  RegionalActivityCard,
  curatedItemToPlaceCard,
} from '@/components/discover/CuratedItemCard';
import MapPlaceholder from '@/components/MapPlaceholder';
import { sendChatMessage } from '@/lib/ai/chat';
import type { CuratedItem } from '@/types/pms';

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

/* ─── Main DiscoverPanel component ─── */

interface DiscoverPanelProps {
  stayId?: string | null;
  guestName?: string;
}

type PlacesTab = 'recommendations' | 'places' | 'images' | 'sources';
const MAX_ASSISTANT_MESSAGES = 8;
const MAX_VISIBLE_SOURCES = 8;
const PLACES_PAGE_SIZE = 10;
const MAX_DISCOVER_PLACES = 20;
const DISCOVER_VISITED_KEY_PREFIX = 'stayscape_discover_visited_';

export default function DiscoverPanel({ stayId, guestName = '' }: DiscoverPanelProps) {
  const { region } = useRegion();
  const [activeCategory, setActiveCategory] = useState<string>('top-places');
  const [activePlacesCategory, setActivePlacesCategory] = useState<string | null | undefined>(undefined);
  const [activePlacesTab, setActivePlacesTab] = useState<PlacesTab>('recommendations');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState<PlaceCard | null>(null);
  const [successToast, setSuccessToast] = useState<{ placeName: string; dayValue: string; bookingUrl: string } | null>(null);
  const [showSyncUpdateToast, setShowSyncUpdateToast] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<PlaceCard | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<EventCard | null>(null);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [unknownPlace, setUnknownPlace] = useState<{
    name: string; address: string; lat: number; lng: number;
  } | null>(null);
  const [addUnknownPlaceOpen, setAddUnknownPlaceOpen] = useState(false);

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
  const { insights, refetch: refetchInsights } = useLocalInsights();
  const {
    events,
    error: eventsError,
    refetch: refetchEvents,
  } = useDiscoverEvents();
  const { curations } = useCurations(stayId);
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

  const handleAddClick = useCallback((placeId: string) => {
    const place = places.find((p) => p.id === placeId) ?? null;
    setAddingPlace(place);
    setAddDialogOpen(true);
  }, [places]);

  const handleAddCuratedItem = useCallback((item: CuratedItem, idx: number) => {
    const matchedPlace = item.place_id ? places.find((place) => place.id === item.place_id) : null;
    setAddingPlace(matchedPlace ?? curatedItemToPlaceCard(item, idx));
    setAddDialogOpen(true);
  }, [places]);

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

  const handleEventCardClick = useCallback((event: EventCard) => {
    setDetailEvent(event);
    setEventDetailOpen(true);
  }, []);

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

    const reply = await sendChatMessage(messageText, stayId);

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
  }, [assistantInput, isAssistantLoading, stayId]);

  const placeNameChips = useMemo(
    () => places.slice(0, 4).map((place) => place.name),
    [places],
  );

  const getSafeBackgroundImage = useCallback((imageUrl: string | undefined) => {
    if (!imageUrl) return 'none';
    try {
      const parsed = new URL(imageUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'none';
      if (/[\\()"'\n\r]/.test(parsed.href)) return 'none';
      return `url("${parsed.href}")`;
    } catch {
      return 'none';
    }
  }, []);

  const getSourceLabel = useCallback((sourceUrl: string | undefined) => {
    if (!sourceUrl) return 'Local source unavailable';
    try {
      return new URL(sourceUrl).host;
    } catch {
      return sourceUrl;
    }
  }, []);

  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 280;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="flex-1 flex min-h-0 overflow-hidden discover-card-fade-in">
        {/* Left column ─ map + floating chat widget */}
        <div className="relative flex w-full h-[45vh] lg:h-auto lg:w-[55%] border-b lg:border-b-0 lg:border-r border-white/10">
          <MapPlaceholder stayId={stayId ?? null} />

          <div className="absolute top-6 left-6 w-[340px] max-w-[calc(100%-3rem)] bg-black/80 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
            <h3 className="font-serif text-[18px] text-white/90 mb-1">
              {guestName ? `Welcome, ${guestName}` : 'Discover Concierge'}
            </h3>
            <p className="text-[11px] text-white/55 mb-3">
              Ask about places on the map or tap a place chip.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {placeNameChips.map((placeName) => (
                <button
                  key={placeName}
                  type="button"
                  onClick={() => void sendAssistantMessage(`Tell me about ${placeName}`)}
                  className="text-[10px] text-white/70 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 hover:bg-white/15 transition-colors cursor-pointer"
                >
                  {placeName}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-[130px] overflow-y-auto scrollbar-hide mb-3 pr-1">
              {assistantMessages.length === 0 ? (
                <p className="text-[10px] text-white/45">Try: “Best restaurants nearby?”</p>
              ) : (
                assistantMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`text-[10px] leading-relaxed rounded-lg px-2.5 py-1.5 ${
                      message.role === 'user' ? 'bg-white/10 text-white/85' : 'bg-[#C9A84C]/12 text-white/75'
                    }`}
                  >
                    {message.text}
                  </div>
                ))
              )}
              {isAssistantLoading && (
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <span className="text-[10px] text-[#C9A84C] animate-pulse">✶</span>
                  <span className="text-[9px] text-white/40 animate-pulse">
                    Thinking…
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-3 py-2 focus-within:border-[#C9A84C]/30">
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
                placeholder="Ask the assistant..."
                aria-label="Ask discover assistant"
                className="text-[11px] text-white placeholder-white/35 bg-transparent focus:outline-none flex-1"
              />
              <button
                type="button"
                onClick={() => void sendAssistantMessage()}
                disabled={isAssistantLoading}
                className="text-white/40 hover:text-[#C9A84C] transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 14-7-4 7 4 7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 lg:w-[45%] min-h-0 lg:min-h-full flex flex-col bg-black/70">
          <div className="px-5 sm:px-8 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-[16px] text-[var(--gold)]">✦</span>
                  <h2 className="text-[18px] sm:text-[20px] font-serif tracking-tight text-white/90">
                    Discover
                  </h2>
                </div>
                <p className="text-[13px] text-white/60 ml-[30px]">
                  Curated places and local insights{region?.name ? ` for your ${region.name} stay` : ''}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="
                      w-8 h-8 rounded-lg flex items-center justify-center
                      border border-white/10
                      bg-white/[0.07]
                      text-white/60
                      hover:bg-white/[0.12]
                      hover:text-white/90
                      transition-all duration-200 cursor-pointer
                    "
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search places</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-5 sm:px-8 py-6 space-y-8">
              {/* ── Categories carousel ── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                    Browse Categories
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      className="
                        w-7 h-7 rounded-lg flex items-center justify-center
                        border border-white/10
                        bg-white/[0.07]
                        text-white/60
                        hover:bg-white/[0.12]
                        hover:text-white/90
                        transition-all duration-200 cursor-pointer
                      "
                      aria-label="Scroll categories left"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      className="
                        w-7 h-7 rounded-lg flex items-center justify-center
                        border border-white/10
                        bg-white/[0.07]
                        text-white/60
                        hover:bg-white/[0.12]
                        hover:text-white/90
                        transition-all duration-200 cursor-pointer
                      "
                      aria-label="Scroll categories right"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {categoriesError && (
                    <InlineError message="Couldn't load categories" onRetry={refetchCategories} />
                  )}
                  {categories.map((cat) => (
                    <div key={cat.id} className="snap-start">
                      <CategoryCarouselCard
                        item={cat}
                        active={activeCategory === cat.id}
                        onClick={() => handleCategoryClick(cat)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Places section with tabs ── */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                    {categories.find((c) => c.id === activeCategory)?.label ?? 'Places'}
                  </h3>
                  <span className="text-[11px] text-white/50">
                    {places.length} {places.length === 1 ? 'place' : 'places'}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {(['recommendations', 'places', 'images', 'sources'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivePlacesTab(tab)}
                      className={`text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                        activePlacesTab === tab
                          ? 'text-[#C9A84C] border-[#C9A84C]/60 bg-[#C9A84C]/10'
                          : 'text-white/60 border-white/15 hover:text-white/85'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activePlacesTab === 'recommendations' && (
                  <div className="space-y-6">
                    {curations.recommended_places && curations.recommended_places.content.items.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                              Popular with Guests
                            </h3>
                            <p className="text-[11px] text-white/40 mt-0.5">
                              Loved by previous guests
                            </p>
                          </div>
                          <span className="text-[11px] text-[var(--gold)] flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Highly recommended
                          </span>
                        </div>

                        <div className="space-y-4">
                          {curations.recommended_places.content.items.map((item, idx) => (
                            <PopularGuestCard
                              key={`popular-${idx}`}
                              item={item}
                              idx={idx}
                              onAdd={(curatedItem) => handleAddCuratedItem(curatedItem, idx)}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {eventsError && (
                      <section>
                        <InlineError
                          message="Couldn't load events right now"
                          onRetry={() => region?.id && refetchEvents(region.id)}
                        />
                      </section>
                    )}
                    {events.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                            Upcoming Events
                          </h3>
                          <span className="text-[11px] text-white/50">
                            {events.length} {events.length === 1 ? 'event' : 'events'}
                          </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
                          {events.map((event) => (
                            <div key={event.id} className="snap-start">
                              <UpcomingEventCard
                                event={event}
                                onClick={() => handleEventCardClick(event)}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {curations.regional_activities && curations.regional_activities.content.items.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                              {region?.name ? `Discover ${region.name}` : 'Discover the Region'}
                            </h3>
                            <p className="text-[11px] text-white/40 mt-0.5">
                              {curations.regional_activities.content.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x discover-slide-in">
                          {curations.regional_activities.content.items.map((item, idx) => (
                            <div key={`regional-${idx}`} className="snap-start">
                              <RegionalActivityCard
                                item={item}
                                idx={idx}
                                onAdd={(curatedItem) => handleAddCuratedItem(curatedItem, idx)}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                          Local Insights
                        </h3>
                        <span className="text-[11px] text-white/50">{region?.name ?? 'Local'}</span>
                      </div>

                      <div
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {insights.map((insight) => (
                          <div key={insight.id} className="snap-start flex-shrink-0">
                            <InsightKnowledgeCard insight={insight} />
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {activePlacesTab === 'places' && (
                  <div className="space-y-4">
                    {placesError && (
                      <InlineError
                        message="Couldn't load places right now"
                        onRetry={handleRetryPlaces}
                      />
                    )}
                    {placesLoading && places.length === 0 && (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-24 rounded-2xl bg-white/[0.04] border border-white/8 animate-pulse"
                          />
                        ))}
                      </div>
                    )}
                    {places.map((place, idx) => (
                      <HeroPlaceCard
                        key={place.id}
                        place={place}
                        onAdd={handleAddClick}
                        onClick={() => handleCardClick(place)}
                        isFirst={idx === 0}
                        idx={idx}
                      />
                    ))}

                    {(places.length > PLACES_PAGE_SIZE || hasMorePlaces) && (
                      <p className="text-[11px] text-white/45 text-center">
                        Showing {Math.min(places.length, MAX_DISCOVER_PLACES)}
                        {hasMorePlaces ? ` (max ${MAX_DISCOVER_PLACES})` : ''}
                      </p>
                    )}

                    {hasMorePlaces && places.length < MAX_DISCOVER_PLACES && (
                      <div className="pt-1 flex justify-center">
                        <button
                          type="button"
                          onClick={handleShowMorePlaces}
                          className="
                            text-[11px] uppercase tracking-[0.12em] px-4 py-2 rounded-lg border
                            border-white/20 bg-black/40 text-white/75
                            hover:text-[#C9A84C] hover:border-[#C9A84C]/60 hover:bg-[#C9A84C]/10
                            transition-colors cursor-pointer
                          "
                        >
                          Show more
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activePlacesTab === 'images' && (
                  <div className="grid grid-cols-2 gap-3">
                    {places.map((place) => (
                      <button
                        key={`${place.id}-image`}
                        type="button"
                        onClick={() => handleCardClick(place)}
                        className="relative rounded-xl overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-colors text-left cursor-pointer"
                      >
                        <div
                          className="w-full h-28 bg-cover bg-center"
                          style={{ backgroundImage: getSafeBackgroundImage(place.image) }}
                          aria-label={`Image of ${place.name}`}
                          role="img"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                        <span className="absolute bottom-2 left-2 text-[10px] text-white/85">{place.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {activePlacesTab === 'sources' && (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] text-white/65">
                      Sources are collected from curated recommendations and local discovery feeds.
                    </div>
                    {places.slice(0, MAX_VISIBLE_SOURCES).map((place) => (
                      <div key={`${place.id}-source`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <p className="text-[11px] text-white/85">{place.name}</p>
                        <p className="text-[10px] text-white/50 mt-0.5">{getSourceLabel(place.bookingUrl)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="h-4" />
            </div>
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
