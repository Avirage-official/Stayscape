'use client';

import { useState, useRef, useCallback } from 'react';

/* ─── Design tokens (Discover page spec) ─── */
const COLORS = {
  bg: 'var(--discover-bg)',
  surface: 'var(--discover-surface)',
  card: 'var(--discover-card)',
  border: 'var(--discover-border)',
  gold: 'var(--discover-gold)',
  titleText: 'var(--discover-title)',
  bodyText: 'var(--discover-body)',
} as const;

/* ─── Category data ─── */

interface CategoryItem {
  id: string;
  label: string;
  icon: string;
}

const categories: CategoryItem[] = [
  { id: 'top-places', label: 'Top Places', icon: '⭐' },
  { id: 'historical', label: 'Historical', icon: '🏛' },
  { id: 'fun', label: 'Fun Places', icon: '🎡' },
  { id: 'shopping', label: 'Shopping', icon: '🛍' },
  { id: 'dining', label: 'Dining', icon: '🍽' },
  { id: 'local', label: 'Local Spots', icon: '📍' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'relaxation', label: 'Wellness', icon: '🧘' },
  { id: 'events', label: 'Events', icon: '🎭' },
];

/* ─── Place card data ─── */

interface PlaceCard {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  distance: string;
  gradient: string;
  bookingUrl: string;
}

const placesByCategory: Record<string, PlaceCard[]> = {
  'top-places': [
    { id: 'tp-1', name: 'Central Park', category: 'Top Places', description: 'A sprawling 843-acre park in the heart of Manhattan with walking trails, lakes, and gardens.', rating: 4.9, distance: '0.5 mi', gradient: 'from-emerald-900/60 to-teal-900/40', bookingUrl: '#' },
    { id: 'tp-2', name: 'Empire State Building', category: 'Top Places', description: 'Iconic Art Deco skyscraper with panoramic views of the city from the 86th floor.', rating: 4.8, distance: '0.8 mi', gradient: 'from-blue-900/60 to-indigo-900/40', bookingUrl: '#' },
    { id: 'tp-3', name: 'Times Square', category: 'Top Places', description: 'Dazzling neon lights, Broadway theaters, and vibrant energy at every hour.', rating: 4.5, distance: '0.4 mi', gradient: 'from-purple-900/60 to-pink-900/40', bookingUrl: '#' },
    { id: 'tp-4', name: 'Brooklyn Bridge', category: 'Top Places', description: 'Walk across this iconic 1883 suspension bridge for stunning views of the skyline.', rating: 4.8, distance: '3.2 mi', gradient: 'from-slate-800/60 to-zinc-900/40', bookingUrl: '#' },
  ],
  historical: [
    { id: 'hi-1', name: 'Metropolitan Museum', category: 'Historical', description: 'Over 5,000 years of art from around the globe. One of the largest museums in the world.', rating: 4.9, distance: '0.6 mi', gradient: 'from-amber-900/60 to-orange-900/40', bookingUrl: '#' },
    { id: 'hi-2', name: 'Statue of Liberty', category: 'Historical', description: 'The iconic symbol of freedom standing on Liberty Island since 1886.', rating: 4.8, distance: '5.1 mi', gradient: 'from-teal-900/60 to-cyan-900/40', bookingUrl: '#' },
    { id: 'hi-3', name: 'Ellis Island', category: 'Historical', description: 'Explore the gateway through which millions of immigrants entered America.', rating: 4.7, distance: '5.2 mi', gradient: 'from-stone-800/60 to-neutral-900/40', bookingUrl: '#' },
  ],
  fun: [
    { id: 'fu-1', name: 'Coney Island', category: 'Fun Places', description: 'Classic boardwalk amusement park with rides, games, and beachfront fun.', rating: 4.4, distance: '12 mi', gradient: 'from-yellow-900/60 to-orange-900/40', bookingUrl: '#' },
    { id: 'fu-2', name: 'Top of the Rock', category: 'Fun Places', description: 'Stunning 360-degree views of Central Park and the Manhattan skyline.', rating: 4.8, distance: '0.3 mi', gradient: 'from-sky-900/60 to-blue-900/40', bookingUrl: '#' },
    { id: 'fu-3', name: 'Chelsea Market', category: 'Fun Places', description: 'A vibrant indoor marketplace with artisanal food vendors and unique shops.', rating: 4.6, distance: '1.8 mi', gradient: 'from-rose-900/60 to-red-900/40', bookingUrl: '#' },
  ],
  shopping: [
    { id: 'sh-1', name: 'Fifth Avenue', category: 'Shopping', description: 'The world-famous shopping street with flagship stores from top designers.', rating: 4.7, distance: '0.2 mi', gradient: 'from-fuchsia-900/60 to-purple-900/40', bookingUrl: '#' },
    { id: 'sh-2', name: 'SoHo District', category: 'Shopping', description: 'Trendy neighborhood with designer boutiques, galleries, and cast-iron architecture.', rating: 4.6, distance: '2.5 mi', gradient: 'from-violet-900/60 to-indigo-900/40', bookingUrl: '#' },
    { id: 'sh-3', name: 'Brooklyn Flea', category: 'Shopping', description: 'Weekly market featuring vintage clothing, antiques, and local artisan goods.', rating: 4.5, distance: '4.1 mi', gradient: 'from-amber-900/60 to-yellow-900/40', bookingUrl: '#' },
  ],
  dining: [
    { id: 'di-1', name: 'Le Bernardin', category: 'Dining', description: 'Michelin three-star seafood restaurant with exquisite tasting menus.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/60 to-rose-900/40', bookingUrl: '#' },
    { id: 'di-2', name: 'Nobu', category: 'Dining', description: 'Iconic fusion restaurant known for innovative dishes and premium ingredients.', rating: 4.8, distance: '0.3 mi', gradient: 'from-orange-900/60 to-amber-900/40', bookingUrl: '#' },
    { id: 'di-3', name: 'Peter Luger', category: 'Dining', description: 'Brooklyn institution serving USDA Prime dry-aged steaks since 1887.', rating: 4.7, distance: '3.8 mi', gradient: 'from-stone-800/60 to-red-900/40', bookingUrl: '#' },
    { id: 'di-4', name: 'Eataly NYC', category: 'Dining', description: 'Vast Italian food hall with multiple restaurants, counters, and gourmet groceries.', rating: 4.6, distance: '1.2 mi', gradient: 'from-green-900/60 to-emerald-900/40', bookingUrl: '#' },
  ],
  local: [
    { id: 'lo-1', name: 'Washington Square Park', category: 'Local Spots', description: 'Lively park known for its arch, fountain, street performers, and community feel.', rating: 4.6, distance: '2.1 mi', gradient: 'from-lime-900/60 to-green-900/40', bookingUrl: '#' },
    { id: 'lo-2', name: 'East Village', category: 'Local Spots', description: 'Eclectic neighborhood with indie shops, diverse eateries, and vibrant nightlife.', rating: 4.5, distance: '2.8 mi', gradient: 'from-orange-900/60 to-red-900/40', bookingUrl: '#' },
    { id: 'lo-3', name: 'Chinatown', category: 'Local Spots', description: 'Bustling neighborhood with authentic restaurants, shops, and cultural landmarks.', rating: 4.4, distance: '3.5 mi', gradient: 'from-red-900/60 to-amber-900/40', bookingUrl: '#' },
  ],
  nature: [
    { id: 'na-1', name: 'The High Line', category: 'Nature', description: 'A 1.45-mile elevated linear park built on a historic freight rail line above Manhattan.', rating: 4.8, distance: '1.5 mi', gradient: 'from-emerald-900/60 to-green-900/40', bookingUrl: '#' },
    { id: 'na-2', name: 'Hudson River Park', category: 'Nature', description: 'A five-mile park along the Hudson with biking trails, piers, and sunset views.', rating: 4.7, distance: '1.2 mi', gradient: 'from-cyan-900/60 to-blue-900/40', bookingUrl: '#' },
    { id: 'na-3', name: 'New York Botanical Garden', category: 'Nature', description: '250 acres of gardens, forests, and world-class exhibitions in the Bronx.', rating: 4.7, distance: '9.5 mi', gradient: 'from-teal-900/60 to-emerald-900/40', bookingUrl: '#' },
  ],
  family: [
    { id: 'fa-1', name: 'American Museum of Natural History', category: 'Family', description: 'Explore dinosaurs, ocean life, space, and cultures of the world.', rating: 4.8, distance: '0.7 mi', gradient: 'from-blue-900/60 to-cyan-900/40', bookingUrl: '#' },
    { id: 'fa-2', name: 'Central Park Zoo', category: 'Family', description: 'Compact zoo with sea lions, penguins, and a tropical rainforest exhibit.', rating: 4.5, distance: '0.4 mi', gradient: 'from-green-900/60 to-lime-900/40', bookingUrl: '#' },
    { id: 'fa-3', name: 'Intrepid Museum', category: 'Family', description: 'Aircraft carrier museum with a space shuttle, submarine, and flight simulators.', rating: 4.6, distance: '1.1 mi', gradient: 'from-slate-800/60 to-sky-900/40', bookingUrl: '#' },
  ],
  nightlife: [
    { id: 'ni-1', name: 'Bemelmans Bar', category: 'Nightlife', description: 'Elegant Art Deco bar in The Carlyle with live jazz and hand-painted murals.', rating: 4.7, distance: '0.3 mi', gradient: 'from-amber-900/60 to-yellow-900/40', bookingUrl: '#' },
    { id: 'ni-2', name: 'The Rooftop Bar', category: 'Nightlife', description: 'Panoramic city views with craft cocktails and a sophisticated atmosphere.', rating: 4.6, distance: '0.1 mi', gradient: 'from-indigo-900/60 to-purple-900/40', bookingUrl: '#' },
    { id: 'ni-3', name: 'Sleep No More', category: 'Nightlife', description: 'A groundbreaking immersive theatrical experience set in a transformed hotel.', rating: 4.8, distance: '1.6 mi', gradient: 'from-neutral-800/60 to-zinc-900/40', bookingUrl: '#' },
  ],
  relaxation: [
    { id: 're-1', name: 'Aire Ancient Baths', category: 'Wellness', description: 'A luxurious underground thermal bath experience inspired by ancient traditions.', rating: 4.9, distance: '2.3 mi', gradient: 'from-sky-900/60 to-cyan-900/40', bookingUrl: '#' },
    { id: 're-2', name: 'QC NY Spa', category: 'Wellness', description: 'Italian-inspired spa on Governors Island with harbor views and thermal rituals.', rating: 4.7, distance: '4.0 mi', gradient: 'from-teal-900/60 to-sky-900/40', bookingUrl: '#' },
    { id: 're-3', name: 'The Spa at Mandarin Oriental', category: 'Wellness', description: 'Luxury spa with panoramic views, offering holistic treatments and relaxation.', rating: 4.8, distance: '0.6 mi', gradient: 'from-violet-900/60 to-purple-900/40', bookingUrl: '#' },
  ],
  events: [
    { id: 'ev-1', name: 'Broadway Shows', category: 'Events', description: 'World-renowned musicals and plays in the iconic Theater District.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/60 to-pink-900/40', bookingUrl: '#' },
    { id: 'ev-2', name: 'Madison Square Garden', category: 'Events', description: 'Legendary arena hosting concerts, sports, and special performances.', rating: 4.7, distance: '0.9 mi', gradient: 'from-orange-900/60 to-red-900/40', bookingUrl: '#' },
    { id: 'ev-3', name: 'Lincoln Center', category: 'Events', description: 'World-class performing arts center with opera, ballet, symphony, and film.', rating: 4.8, distance: '0.7 mi', gradient: 'from-rose-900/60 to-pink-900/40', bookingUrl: '#' },
  ],
};

/* ─── Stay days (matching customer check-in / check-out) ─── */
const stayDays = [
  { label: 'Day 1 · Dec 14', value: 'dec-14' },
  { label: 'Day 2 · Dec 15', value: 'dec-15' },
  { label: 'Day 3 · Dec 16', value: 'dec-16' },
  { label: 'Day 4 · Dec 17', value: 'dec-17' },
  { label: 'Day 5 · Dec 18', value: 'dec-18' },
  { label: 'Day 6 · Dec 19', value: 'dec-19' },
];

/* ─── Sub-components ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3 ml-0.5"
      style={{ color: COLORS.bodyText }}
    >
      {children}
    </h3>
  );
}

function CategoryCard({
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
      className="flex-shrink-0 flex flex-col items-center justify-center w-[88px] h-[88px] rounded-[18px] border transition-all duration-200 cursor-pointer"
      style={{
        background: active ? 'var(--discover-active-card)' : COLORS.card,
        borderColor: active ? COLORS.gold : COLORS.border,
      }}
    >
      <span className="text-[22px] mb-1.5">{item.icon}</span>
      <span
        className="text-[10px] font-medium tracking-wide transition-colors duration-200"
        style={{ color: active ? COLORS.gold : COLORS.bodyText }}
      >
        {item.label}
      </span>
    </button>
  );
}

function DayPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (day: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="discover-card-fade-in">
      <div
        className="rounded-[12px] border p-3 mt-2"
        style={{ background: COLORS.surface, borderColor: COLORS.border }}
      >
        <p className="text-[10px] mb-2.5" style={{ color: COLORS.bodyText }}>
          Choose a day for this activity:
        </p>
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {stayDays.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => onSelect(day.value)}
              className="px-2 py-[6px] rounded-[8px] text-[10px] border transition-all duration-200 cursor-pointer"
              style={{
                borderColor: COLORS.border,
                background: COLORS.card,
                color: COLORS.bodyText,
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] transition-colors duration-200 cursor-pointer"
          style={{ color: COLORS.bodyText }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function BookingConfirmation({
  placeName,
  day,
  bookingUrl,
  onDone,
}: {
  placeName: string;
  day: string;
  bookingUrl: string;
  onDone: () => void;
}) {
  const dayLabel = stayDays.find((d) => d.value === day)?.label ?? day;
  return (
    <div className="discover-card-fade-in">
      <div
        className="rounded-[12px] border p-3 mt-2"
        style={{ background: 'var(--discover-gold-5)', borderColor: 'var(--discover-gold-20)' }}
      >
        <div className="flex items-start space-x-2 mb-3">
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: 'var(--discover-gold-12)', border: '1px solid var(--discover-gold-25)' }}
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ color: COLORS.gold }}>
              <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-medium" style={{ color: COLORS.titleText }}>{placeName}</p>
            <p className="text-[10px] mt-0.5" style={{ color: COLORS.bodyText }}>Scheduled for {dayLabel}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-[6px] rounded-[8px] text-[10px] font-medium transition-colors duration-200"
            style={{ background: COLORS.gold, color: COLORS.bg }}
          >
            Book on Partner Site →
          </a>
          <button
            type="button"
            onClick={onDone}
            className="px-3 py-[6px] rounded-[8px] text-[10px] border transition-all duration-200 cursor-pointer"
            style={{ borderColor: COLORS.border, color: COLORS.bodyText }}
          >
            Done
          </button>
        </div>
        <p className="text-[9px] mt-2" style={{ color: COLORS.bodyText }}>
          After booking, you can add the exact time to your itinerary timeline.
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export default function DiscoverPanel() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [confirmedPlace, setConfirmedPlace] = useState<{ id: string; day: string } | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = useCallback((item: CategoryItem) => {
    if (activeCategory === item.id) {
      setActiveCategory(null);
    } else {
      setActiveCategory(item.id);
    }
    setAddingPlaceId(null);
    setConfirmedPlace(null);
  }, [activeCategory]);

  const handleAddClick = useCallback((placeId: string) => {
    setAddingPlaceId(placeId);
    setConfirmedPlace(null);
  }, []);

  const handleDaySelect = useCallback((placeId: string, day: string) => {
    setConfirmedPlace({ id: placeId, day });
    setAddingPlaceId(null);
  }, []);

  const handleDone = useCallback(() => {
    setConfirmedPlace(null);
  }, []);

  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const places = activeCategory ? (placesByCategory[activeCategory] ?? []) : [];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden discover-card-fade-in"
      style={{ background: COLORS.bg }}
    >
      {/* ── Top label row ── */}
      <div
        className="px-4 sm:px-6 pt-5 pb-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center space-x-2.5 mb-1">
          <span className="text-[14px]" style={{ color: COLORS.gold }}>✦</span>
          <h2
            className="text-[14px] font-bold tracking-wide"
            style={{ color: COLORS.titleText }}
          >
            Discover
          </h2>
        </div>
        <p className="text-[11px] ml-[22px]" style={{ color: COLORS.bodyText }}>
          Browse curated places and local insights for your stay
        </p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-5 space-y-6">
        {/* ── Category carousel ── */}
        <div>
          <SectionLabel>Places to Explore</SectionLabel>
          <div className="relative group/carousel">
            {/* Left scroll button */}
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
              style={{
                background: 'var(--discover-bg-overlay)',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.bodyText,
              }}
              aria-label="Scroll left"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              ref={carouselRef}
              className="flex space-x-2.5 overflow-x-auto scrollbar-hide py-1 px-1 discover-slide-in"
            >
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  item={cat}
                  active={activeCategory === cat.id}
                  onClick={() => handleCategoryClick(cat)}
                />
              ))}
            </div>

            {/* Right scroll button */}
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
              style={{
                background: 'var(--discover-bg-overlay)',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.bodyText,
              }}
              aria-label="Scroll right"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Stacked place cards ── */}
        {activeCategory && places.length > 0 && (
          <div>
            <SectionLabel>
              {categories.find((c) => c.id === activeCategory)?.label ?? 'Results'}
            </SectionLabel>
            <div className="space-y-3">
              {places.map((place, idx) => (
                <div
                  key={place.id}
                  className="flex flex-col sm:flex-row sm:h-[180px] rounded-[16px] border overflow-hidden discover-hover-lift discover-card-fade-in"
                  style={{
                    background: COLORS.card,
                    borderColor: COLORS.border,
                    animationDelay: `${idx * 0.06}s`,
                  }}
                >
                  {/* Image area — top on mobile, left on desktop */}
                  <div
                    className={`h-32 sm:h-auto sm:w-[180px] flex-shrink-0 bg-gradient-to-br ${place.gradient}`}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.15)' }}
                    >
                      <span className="text-[32px] opacity-40">
                        {categories.find((c) => c.id === activeCategory)?.icon ?? '📍'}
                      </span>
                    </div>
                  </div>

                  {/* Text area — right side */}
                  <div className="flex-1 flex flex-col justify-between p-4 min-w-0">
                    <div>
                      {/* Title */}
                      <h4
                        className="text-[14px] font-medium truncate mb-1.5"
                        style={{ color: COLORS.titleText }}
                      >
                        {place.name}
                      </h4>

                      {/* Category tag + rating + distance */}
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mb-2">
                        <span
                          className="text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-[4px]"
                          style={{
                            color: COLORS.gold,
                            background: 'var(--discover-gold-8)',
                            border: '1px solid var(--discover-gold-15)',
                          }}
                        >
                          {place.category}
                        </span>
                        <span className="text-[11px]" style={{ color: COLORS.gold }}>
                          ★ {place.rating.toFixed(1)}
                        </span>
                        <span className="text-[10px]" style={{ color: COLORS.bodyText }}>
                          {place.distance}
                        </span>
                      </div>

                      {/* One-line description */}
                      <p
                        className="text-[11px] leading-relaxed line-clamp-1"
                        style={{ color: COLORS.bodyText }}
                      >
                        {place.description}
                      </p>
                    </div>

                    {/* Action area — lower left */}
                    <div className="mt-auto pt-2">
                      {confirmedPlace?.id === place.id ? (
                        <BookingConfirmation
                          placeName={place.name}
                          day={confirmedPlace.day}
                          bookingUrl={place.bookingUrl}
                          onDone={handleDone}
                        />
                      ) : addingPlaceId === place.id ? (
                        <DayPicker
                          onSelect={(day) => handleDaySelect(place.id, day)}
                          onCancel={() => setAddingPlaceId(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddClick(place.id)}
                          className="flex items-center space-x-1.5 px-3 py-[5px] rounded-[8px] text-[10px] font-medium border transition-all duration-200 cursor-pointer"
                          style={{
                            borderColor: COLORS.gold,
                            color: COLORS.gold,
                            background: 'transparent',
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 2V8M2 5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!activeCategory && (
          <div className="flex flex-col items-center justify-center py-12 discover-card-fade-in">
            <div
              className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-3"
              style={{
                background: 'var(--discover-gold-8)',
                border: '1px solid var(--discover-gold-15)',
              }}
            >
              <span className="text-[20px]">✦</span>
            </div>
            <p className="text-[12px] font-medium mb-1" style={{ color: COLORS.bodyText }}>
              Select a category
            </p>
            <p className="text-[10px] text-center max-w-[240px]" style={{ color: COLORS.bodyText }}>
              Browse places to visit for your stay
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
