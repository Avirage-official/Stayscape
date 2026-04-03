'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import PlaceDetailDialog from '@/components/PlaceDetailDialog';
import {
  useDiscoverCategories,
  useDiscoverPlaces,
  useLocalInsights,
} from '@/hooks/useDiscoverData';
import {
  FALLBACK_PLACES_BY_CATEGORY,
  FALLBACK_STAY_DAYS,
  type CategoryItem,
  type PlaceCard,
  type InsightCard,
} from '@/lib/data/discover-fallback';

/* ─── Stay days ─── */
const stayDays = FALLBACK_STAY_DAYS;

/* ─── Star rating component ─── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--discover-gold)" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-[12px] font-medium text-[var(--discover-gold)]">{rating.toFixed(1)}</span>
    </span>
  );
}

/* ─── Category carousel card ─── */
function CategoryCarouselCard({
  item,
  active,
  onClick,
}: {
  item: CategoryItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-shrink-0 relative overflow-hidden rounded-2xl
        w-[130px] h-[100px] sm:w-[150px] sm:h-[110px]
        border transition-all duration-300 ease-out cursor-pointer
        group
        ${active
          ? 'border-[var(--discover-gold)] shadow-[0_0_24px_rgba(200,168,90,0.15)] scale-[1.03]'
          : 'border-[var(--discover-border)] hover:border-[var(--discover-gold)]/40 hover:shadow-[0_0_16px_rgba(200,168,90,0.08)]'
        }
      `}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${item.image})` }}
      />

      {/* Dark overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        active
          ? 'bg-gradient-to-t from-black/80 via-black/50 to-black/30'
          : 'bg-gradient-to-t from-black/75 via-black/45 to-black/25 group-hover:from-black/70 group-hover:via-black/40 group-hover:to-black/20'
      }`} />

      {/* Active glow indicator */}
      {active && (
        <div className="absolute inset-0 border-2 border-[var(--discover-gold)]/30 rounded-2xl" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-3">
        <span className="text-[18px] mb-0.5 drop-shadow-md">{item.icon}</span>
        <span className={`text-[12px] font-semibold tracking-wide leading-tight drop-shadow-md transition-colors duration-200 ${
          active ? 'text-[var(--discover-gold)]' : 'text-white/95'
        }`}>
          {item.label}
        </span>
        <span className="text-[10px] text-white/60 leading-tight mt-0.5">{item.subtitle}</span>
      </div>
    </button>
  );
}

/* ─── Hero place card ─── */
function HeroPlaceCard({
  place,
  onAdd,
  onClick,
  isFirst,
  idx,
}: {
  place: PlaceCard;
  onAdd: (placeId: string) => void;
  onClick: () => void;
  isFirst: boolean;
  idx: number;
}) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-[var(--discover-border)]
        transition-all duration-300 ease-out cursor-pointer
        group discover-card-fade-in discover-hover-lift
        ${isFirst ? 'h-[280px] sm:h-[320px]' : 'h-[220px] sm:h-[260px]'}
      `}
      style={{ animationDelay: `${idx * 0.08}s` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${place.image})` }}
      />

      {/* Cinematic gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${place.gradient}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Content positioned at bottom */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
        {/* Category badge + distance */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm font-medium">
            {place.category}
          </Badge>
          <span className="text-[11px] text-white/60">{place.distance}</span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-white tracking-tight leading-tight mb-1.5 drop-shadow-lg ${
          isFirst ? 'text-[22px] sm:text-[26px]' : 'text-[18px] sm:text-[20px]'
        }`}>
          {place.name}
        </h3>

        {/* Description */}
        <p className={`text-white/70 leading-relaxed mb-3 line-clamp-2 ${
          isFirst ? 'text-[13px] sm:text-[14px] max-w-[480px]' : 'text-[12px] sm:text-[13px] max-w-[400px]'
        }`}>
          {place.description}
        </p>

        {/* Rating + Add button */}
        <div className="flex items-center justify-between">
          <StarRating rating={place.rating} />
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onAdd(place.id); }}
            className="
              border-[var(--discover-gold)]/60 text-[var(--discover-gold)]
              bg-[var(--discover-gold)]/10 backdrop-blur-sm
              hover:bg-[var(--discover-gold)]/20 hover:border-[var(--discover-gold)]
              rounded-lg text-[12px] h-8 px-4
              transition-all duration-200
            "
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1">
              <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Insight knowledge card ─── */
function InsightKnowledgeCard({ insight }: { insight: InsightCard }) {
  return (
    <div className="
      flex-shrink-0 w-[200px] sm:w-[220px]
      rounded-xl border border-[var(--discover-border)]
      bg-[var(--discover-card)] p-4
      transition-all duration-300 ease-out
      hover:border-[var(--discover-gold)]/30
      hover:bg-[var(--discover-active-card)]
      discover-hover-lift group
    ">
      <div className="flex items-start gap-3 mb-2.5">
        <span className="
          flex items-center justify-center w-9 h-9 rounded-lg
          bg-[var(--discover-gold-8)] border border-[var(--discover-gold-15)]
          text-[16px] flex-shrink-0
          transition-all duration-300
          group-hover:bg-[var(--discover-gold-12)]
        ">
          {insight.icon}
        </span>
        <div className="min-w-0">
          <h4 className="text-[13px] font-semibold text-[var(--discover-title)] leading-tight">{insight.title}</h4>
          <p className="text-[10px] text-[var(--discover-body)] mt-0.5">{insight.subtitle}</p>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--discover-body)]">{insight.content}</p>
    </div>
  );
}

/* ─── Add-to-day dialog ─── */
function AddToDayDialog({
  open,
  onOpenChange,
  place,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: PlaceCard | null;
  onConfirm: (placeId: string, day: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const handleConfirm = useCallback(() => {
    if (place && selectedDay) {
      onConfirm(place.id, selectedDay);
      setSelectedDay(null);
    }
  }, [place, selectedDay, onConfirm]);

  const handleOpenChange = useCallback((value: boolean) => {
    if (!value) setSelectedDay(null);
    onOpenChange(value);
  }, [onOpenChange]);

  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[380px] sm:max-w-[420px] rounded-2xl bg-[var(--discover-surface)] border-[var(--discover-border)] p-0 overflow-hidden">
        {/* Place preview header */}
        <div className="relative h-[140px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${place.image})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${place.gradient}`} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm mb-1.5">
              {place.category}
            </Badge>
            <h3 className="text-[18px] font-semibold text-white tracking-tight drop-shadow-lg">{place.name}</h3>
          </div>
        </div>

        <div className="p-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[14px] text-[var(--discover-title)]">Schedule this activity</DialogTitle>
            <DialogDescription className="text-[12px] text-[var(--discover-body)]">
              Choose a day within your stay to add this to your itinerary.
            </DialogDescription>
          </DialogHeader>

          {/* Day selector grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {stayDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDay(day.value)}
                className={`
                  px-3 py-2.5 rounded-xl text-[11px] font-medium
                  border transition-all duration-200 cursor-pointer
                  ${selectedDay === day.value
                    ? 'border-[var(--discover-gold)] bg-[var(--discover-gold-12)] text-[var(--discover-gold)] shadow-[0_0_12px_rgba(200,168,90,0.1)]'
                    : 'border-[var(--discover-border)] bg-[var(--discover-card)] text-[var(--discover-body)] hover:border-[var(--discover-gold)]/40 hover:text-[var(--discover-title)]'
                  }
                `}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleConfirm}
              disabled={!selectedDay}
              className="flex-1 h-10 rounded-xl text-[12px] font-semibold bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confirm
            </Button>
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="h-10 rounded-xl text-[12px] text-[var(--discover-body)] hover:text-[var(--discover-title)] px-4"
              >
                Cancel
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Success toast after adding ─── */
function SuccessToast({
  placeName,
  dayValue,
  bookingUrl,
  onDismiss,
}: {
  placeName: string;
  dayValue: string;
  bookingUrl: string;
  onDismiss: () => void;
}) {
  const dayLabel = stayDays.find((d) => d.value === dayValue)?.label ?? dayValue;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 discover-card-fade-in">
      <div className="
        flex items-center gap-3 px-5 py-3.5
        rounded-2xl border border-[var(--discover-gold)]/25
        bg-[var(--discover-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      ">
        <span className="
          flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0
          bg-[var(--discover-gold-12)] border border-[var(--discover-gold-25)]
        ">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="var(--discover-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--discover-title)]">{placeName}</p>
          <p className="text-[11px] text-[var(--discover-body)]">Added to {dayLabel}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-[var(--discover-gold)] hover:underline whitespace-nowrap"
          >
            Book →
          </a>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[var(--discover-body)] hover:text-[var(--discover-title)] transition-colors cursor-pointer p-1"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main DiscoverPanel component ─── */

export default function DiscoverPanel() {
  const [activeCategory, setActiveCategory] = useState<string>('top-places');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState<PlaceCard | null>(null);
  const [successToast, setSuccessToast] = useState<{ placeName: string; dayValue: string; bookingUrl: string } | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<PlaceCard | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const dataLoadedRef = useRef<boolean | null>(null);

  // DB-first hooks with dummy fallback
  const { categories, refetch: refetchCategories } = useDiscoverCategories();
  const { places: dbPlaces, refetch: refetchPlaces } = useDiscoverPlaces();
  const { insights, refetch: refetchInsights } = useLocalInsights();

  // Trigger initial data load once (using null-check pattern for eslint refs rule)
  if (dataLoadedRef.current == null) {
    dataLoadedRef.current = true;
    refetchCategories();
    refetchInsights();
    refetchPlaces('top-places', 'Top Places');
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

  const handleConfirmAdd = useCallback((placeId: string, day: string) => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setSuccessToast({ placeName: place.name, dayValue: day, bookingUrl: place.bookingUrl });
    }
    setAddDialogOpen(false);
    setAddingPlace(null);
  }, [places]);

  const handleDismissToast = useCallback(() => {
    setSuccessToast(null);
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
                Curated places and local insights for your New York stay
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

            {/* ── Local insights rail ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                  Local Insights
                </h3>
                <span className="text-[10px] text-[var(--discover-body)]">New York City</span>
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
