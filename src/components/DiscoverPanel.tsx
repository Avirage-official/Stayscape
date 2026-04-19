'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import SuccessToast from '@/components/discover/SuccessToast';
import {
  PopularGuestCard,
  RegionalActivityCard,
  curatedItemToPlaceCard,
} from '@/components/discover/CuratedItemCard';
import MapPlaceholder from '@/components/MapPlaceholder';
import { getAssistantResponse } from '@/components/assistant/assistant-responses';
import type { CuratedItem } from '@/types/pms';

/* ─── Main DiscoverPanel component ─── */

interface DiscoverPanelProps {
  stayId?: string | null;
  guestName?: string;
}

type PlacesTab = 'recommendations' | 'places' | 'images' | 'sources';
const MAX_ASSISTANT_MESSAGES = 8;
const MAX_VISIBLE_SOURCES = 8;

export default function DiscoverPanel({ stayId, guestName = '' }: DiscoverPanelProps) {
  const { region } = useRegion();
  const [activeCategory, setActiveCategory] = useState<string>('top-places');
  const [activePlacesTab, setActivePlacesTab] = useState<PlacesTab>('recommendations');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState<PlaceCard | null>(null);
  const [successToast, setSuccessToast] = useState<{ placeName: string; dayValue: string; bookingUrl: string } | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<PlaceCard | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<EventCard | null>(null);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const dataLoadedRef = useRef<boolean | null>(null);
  const assistantIdRef = useRef(0);

  // DB-first hooks with dummy fallback
  const { categories, refetch: refetchCategories } = useDiscoverCategories();
  const { places: dbPlaces, refetch: refetchPlaces } = useDiscoverPlaces();
  const { insights, refetch: refetchInsights } = useLocalInsights();
  const { events, refetch: refetchEvents } = useDiscoverEvents();
  const { curations } = useCurations(stayId);

  // Trigger initial data load once (using null-check pattern for eslint refs rule)
  if (dataLoadedRef.current == null) {
    dataLoadedRef.current = true;
    refetchCategories();
    refetchInsights();
    refetchPlaces('top-places', 'Top Places');
    if (region?.id) refetchEvents(region.id);
  }

  // Use DB places if available, otherwise fall back to hardcoded
  const places = useMemo(
    () => dbPlaces.length > 0 ? dbPlaces : (FALLBACK_PLACES_BY_CATEGORY[activeCategory] ?? []),
    [dbPlaces, activeCategory],
  );

  const handleCategoryClick = useCallback((item: CategoryItem) => {
    setActiveCategory(item.id);
    refetchPlaces(item.id, item.label);
  }, [refetchPlaces]);

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
    setAddingPlace(curatedItemToPlaceCard(item, idx));
    setAddDialogOpen(true);
  }, []);

  const handleConfirmAdd = useCallback((placeId: string, day: string) => {
    const place = places.find((p) => p.id === placeId) ?? addingPlace;
    if (place) {
      setSuccessToast({ placeName: place.name, dayValue: day, bookingUrl: place.bookingUrl });
    }
    setAddDialogOpen(false);
    setAddingPlace(null);
  }, [places, addingPlace]);

  const handleDismissToast = useCallback(() => {
    setSuccessToast(null);
  }, []);

  const handleEventCardClick = useCallback((event: EventCard) => {
    setDetailEvent(event);
    setEventDetailOpen(true);
  }, []);

  const sendAssistantMessage = useCallback((text?: string) => {
    const messageText = (text ?? assistantInput).trim();
    if (!messageText) return;

    const userMessageId = `discover-user-${assistantIdRef.current + 1}`;
    const assistantMessageId = `discover-assistant-${assistantIdRef.current + 2}`;
    assistantIdRef.current += 2;

    const userMessage = {
      id: userMessageId,
      role: 'user' as const,
      text: messageText,
    };
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant' as const,
      text: getAssistantResponse(messageText),
    };
    setAssistantMessages((prev) => [...prev, userMessage, assistantMessage].slice(-MAX_ASSISTANT_MESSAGES));
    setAssistantInput('');
  }, [assistantInput]);

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
        <div className="relative hidden lg:flex lg:w-[55%] border-r border-white/10">
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
                  onClick={() => sendAssistantMessage(`Tell me about ${placeName}`)}
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
            </div>

            <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-3 py-2 focus-within:border-[#C9A84C]/30">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAssistantMessage();
                  }
                }}
                placeholder="Ask the assistant..."
                aria-label="Ask discover assistant"
                className="text-[11px] text-white placeholder-white/35 bg-transparent focus:outline-none flex-1"
              />
              <button
                type="button"
                onClick={() => sendAssistantMessage()}
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
        <div className="flex-1 lg:w-[45%] min-h-0 flex flex-col bg-black/70">
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

          <ScrollArea className="flex-1">
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
          </ScrollArea>
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

        {/* ── Success toast ── */}
        {successToast && (
          <SuccessToast
            placeName={successToast.placeName}
            dayValue={successToast.dayValue}
            bookingUrl={successToast.bookingUrl}
            onDismiss={handleDismissToast}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
