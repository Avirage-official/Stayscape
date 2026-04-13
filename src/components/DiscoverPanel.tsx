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
import type { CuratedItem } from '@/types/pms';

/* ─── Main DiscoverPanel component ─── */

export default function DiscoverPanel({ stayId }: { stayId?: string | null }) {
  const { region } = useRegion();
  const [activeCategory, setActiveCategory] = useState<string>('top-places');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState<PlaceCard | null>(null);
  const [successToast, setSuccessToast] = useState<{ placeName: string; dayValue: string; bookingUrl: string } | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<PlaceCard | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<EventCard | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const dataLoadedRef = useRef<boolean | null>(null);

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
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--discover-bg)] discover-card-fade-in">

        {/* ── Compact header ── */}
        <div className="px-5 sm:px-8 pt-6 pb-4 flex-shrink-0 border-b border-[var(--discover-border)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[16px] text-[var(--discover-gold)]">✦</span>
                <h2 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-[var(--discover-title)]">
                  Discover
                </h2>
              </div>
      <p className="text-[12px] text-[var(--discover-body)] ml-[30px]">
                Curated places and local insights{region?.name ? ` for your ${region.name} stay` : ''}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="
                    w-8 h-8 rounded-lg flex items-center justify-center
                    border border-[var(--discover-border)]
                    bg-[var(--discover-card)]
                    text-[var(--discover-body)]
                    hover:border-[var(--discover-gold)]/40
                    hover:text-[var(--discover-title)]
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

        {/* ── Scrollable main content ── */}
        <ScrollArea className="flex-1">
          <div className="px-5 sm:px-8 py-6 space-y-8">

            {/* ── Category carousel ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                  Browse Categories
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollCarousel('left')}
                    className="
                      w-7 h-7 rounded-lg flex items-center justify-center
                      border border-[var(--discover-border)]
                      bg-[var(--discover-card)]
                      text-[var(--discover-body)]
                      hover:border-[var(--discover-gold)]/40
                      hover:text-[var(--discover-title)]
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
                      border border-[var(--discover-border)]
                      bg-[var(--discover-card)]
                      text-[var(--discover-body)]
                      hover:border-[var(--discover-gold)]/40
                      hover:text-[var(--discover-title)]
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
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory discover-slide-in"
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

            {/* ── Separator ── */}
            <div className="h-px bg-[var(--discover-border)]" />

            {/* ── Popular with Guests (recommended_places curation) ── */}
            {curations.recommended_places && curations.recommended_places.content.items.length > 0 && (
              <>
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                        Popular with Guests
                      </h3>
                      <p className="text-[10px] text-[var(--discover-body)]/60 mt-0.5">
                        Loved by previous guests
                      </p>
                    </div>
                    <span className="text-[10px] text-[var(--discover-gold)] flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--discover-gold)">
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

                {/* ── Separator ── */}
                <div className="h-px bg-[var(--discover-border)]" />
              </>
            )}

            {/* ── Place cards ── */}
            {places.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                    {categories.find((c) => c.id === activeCategory)?.label ?? 'Places'}
                  </h3>
                  <span className="text-[11px] text-[var(--discover-body)]">
                    {places.length} {places.length === 1 ? 'place' : 'places'}
                  </span>
                </div>

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
              </section>
            )}

            {/* ── Separator ── */}
            <div className="h-px bg-[var(--discover-border)]" />

            {/* ── Upcoming events carousel (only shown when events available) ── */}
            {events.length > 0 && (
              <>
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                      Upcoming Events
                    </h3>
                    <span className="text-[11px] text-[var(--discover-body)]">
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

                {/* ── Separator ── */}
                <div className="h-px bg-[var(--discover-border)]" />
              </>
            )}

            {/* ── Discover the Region (regional_activities curation) ── */}
            {curations.regional_activities && curations.regional_activities.content.items.length > 0 && (
              <>
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                        {region?.name ? `Discover ${region.name}` : 'Discover the Region'}
                      </h3>
                      <p className="text-[10px] text-[var(--discover-body)]/60 mt-0.5">
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

                {/* ── Separator ── */}
                <div className="h-px bg-[var(--discover-border)]" />
              </>
            )}

            {/* ── Local insights rail ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                  Local Insights
                </h3>
                <span className="text-[10px] text-[var(--discover-body)]">{region?.name ?? 'Local'}</span>
              </div>

              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
                {insights.map((insight) => (
                  <div key={insight.id} className="snap-start">
                    <InsightKnowledgeCard insight={insight} />
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom spacer */}
            <div className="h-4" />
          </div>
        </ScrollArea>

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
