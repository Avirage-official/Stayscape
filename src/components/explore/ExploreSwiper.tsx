'use client';

import { useRef, useState, useCallback } from 'react';
import ExploreCard, { type ExploreSection, type ExploreItem } from './ExploreCard';
import ExploreDetailSheet from './ExploreDetailSheet';
import ExploreWebPanel from './ExploreWebPanel';
import type { RegionOption } from '@/app/dashboard/explore/page';

interface ExploreSwiperProps {
  sections: ExploreSection[];
  regions: RegionOption[];
  selectedRegionId: string | null;
  firstName: string | null;
  onRegionChange: (regionId: string) => void;
  onPersonalise: () => void;
  isPersonalising: boolean;
}

export default function ExploreSwiper({
  sections,
  regions,
  selectedRegionId,
  firstName,
  onRegionChange,
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
  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    if (index !== activeIndex) setActiveIndex(index);
  }

  const selectedRegion = regions.find((r) => r.id === selectedRegionId);
  const greeting = firstName ? `for ${firstName}` : 'for you';

  return (
    <div className="flex" style={{ height: 'calc(100dvh - 68px)' }}>
      {/* ── Mobile / Card track ─────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Top bar: greeting + region dropdown */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-5 pointer-events-none">
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase">
            Explore {greeting}
          </p>

          {/* Region dropdown — pointer-events back on */}
          {regions.length > 1 && (
            <div className="pointer-events-auto">
              <select
                value={selectedRegionId ?? ''}
                onChange={(e) => onRegionChange(e.target.value)}
                className="appearance-none bg-black/40 backdrop-blur-sm border border-white/20 text-white text-xs px-3 py-1.5 rounded-full cursor-pointer focus:outline-none focus:border-white/40 transition-colors"
                aria-label="Change region"
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id} className="bg-stone-900 text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {sections.map((section, i) => (
            <div
              key={section.id}
              className="w-full flex-shrink-0 snap-start"
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

      {/* ── Web panel (desktop only) ─────────────────────── */}
      <ExploreWebPanel
        sections={sections}
        regions={regions}
        selectedRegionId={selectedRegionId}
        activeIndex={activeIndex}
        onSectionChange={goTo}
        onItemClick={(item) => setSelectedItem(item)}
        onRegionChange={onRegionChange}
        onPersonalise={onPersonalise}
        isPersonalising={isPersonalising}
      />

      {/* ── Detail sheet ─────────────────────────────────── */}
      <ExploreDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
