'use client';

import { useRef, useState, useCallback } from 'react';
import ExploreCard, { type ExploreSection, type ExploreItem } from './ExploreCard';
import ExploreDetailSheet from './ExploreDetailSheet';
import ExploreWebPanel from './ExploreWebPanel';

interface ExploreSwiperProps {
  sections: ExploreSection[];
  firstName: string | null;
  onPersonalise: () => void;
  isPersonalising: boolean;
}

export default function ExploreSwiper({
  sections,
  firstName,
  onPersonalise,
  isPersonalising,
}: ExploreSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(sections.length - 1, index));
      setActiveIndex(clamped);
      trackRef.current?.scrollTo({
        left: clamped * (trackRef.current.offsetWidth),
        behavior: 'smooth',
      });
    },
    [sections.length],
  );

  // Touch/pointer drag handlers
  function handlePointerDown(e: React.PointerEvent) {
    startXRef.current = e.clientX;
    isDraggingRef.current = false;
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startXRef.current === null) return;
    if (Math.abs(e.clientX - startXRef.current) > 5) isDraggingRef.current = true;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (startXRef.current === null) return;
    const delta = e.clientX - startXRef.current;
    startXRef.current = null;
    if (!isDraggingRef.current) return;
    if (delta < -50) goTo(activeIndex + 1);
    else if (delta > 50) goTo(activeIndex - 1);
  }

  // Scroll-snap sync — update active index when user natively scrolls
  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    if (index !== activeIndex) setActiveIndex(index);
  }

  const greeting = firstName ? `for ${firstName}` : 'for you';

  return (
    <div
      className="flex"
      style={{ height: 'calc(100dvh - 68px)' }}
    >
      {/* ── Mobile / Card track ────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Greeting */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase">
            Explore {greeting}
          </p>
        </div>

        {/* Pagination dots */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
          {sections.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to section ${i + 1}`}
              className={`rounded-full transition-all duration-300 pointer-events-auto ${
                i === activeIndex
                  ? 'w-5 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/30'
              }`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        {/* Card track — scroll-snap */}
        <div
          ref={trackRef}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {sections.map((section, i) => (
            <div
              key={section.id}
              className="w-full flex-shrink-0 snap-start relative"
              style={{ minWidth: '100%' }}
            >
              <ExploreCard
                section={section}
                isActive={i === activeIndex}
                onItemClick={(item) => setSelectedItem(item)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Web panel (desktop only) ───────────────────────── */}
      <ExploreWebPanel
        sections={sections}
        activeIndex={activeIndex}
        onSectionChange={goTo}
        onItemClick={(item) => setSelectedItem(item)}
        onPersonalise={onPersonalise}
        isPersonalising={isPersonalising}
      />

      {/* ── Detail sheet (mobile + desktop) ───────────────── */}
      <ExploreDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
