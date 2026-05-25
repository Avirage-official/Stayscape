'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import ExploreCard, { type ExploreSection, type ExploreItem } from './ExploreCard';
import ExploreDetailSheet from './ExploreDetailSheet';
import ExploreWebPanel, { type ExploreWebPanelHandle } from './ExploreWebPanel';
import type { RegionOption } from '@/app/dashboard/explore/page';
import type { ExploreView, DrillData, DrillCacheKey, DrillPlaceCard, DrillEventCard, AnimPhase } from '@/types/explore';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { getPlacesByRegionAndCategory } from '@/lib/supabase/places-repository';
import { getEventsByRegionAndCategory } from '@/lib/supabase/events-repository';

interface ExploreSwiperProps {
  sections: ExploreSection[];
  regions: RegionOption[];
  selectedRegionId: string | null;
  firstName: string | null;
  onPersonalise: () => void;
  isPersonalising: boolean;
  isRefreshing?: boolean;
  onRegionChange?: (regionId: string) => void;
}

type SelectedItem = {
  item: ExploreItem | DrillPlaceCard | DrillEventCard;
  contentType: ExploreSection['content_type'];
};

const AUTO_DRILL_SECTIONS = new Set(['made_for_you', 'happening_now', 'arias_picks']);

function categoryLabel(raw: string): string {
  const map: Record<string, string> = {
    dining: 'Dining', nightlife: 'Nightlife', shopping: 'Shopping',
    nature: 'Nature', historical: 'Historical', wellness: 'Wellness',
    family: 'Family', events: 'Events', local_spots: 'Local Spots',
    fun_places: 'Fun Places', top_places: 'Top Places',
  };
  return map[raw.toLowerCase()] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

const CAT_COLOR: Record<string, string> = {
  dining: '#FF6B35', nightlife: '#7B2FFF', shopping: '#FFD600',
  nature: '#00C853', historical: '#FF8F00', wellness: '#00BCD4',
  family: '#FF4081', events: '#E91E8C', local_spots: '#FFAB00',
  fun_places: '#F50057', top_places: '#2979FF',
};
const FALLBACK_COLOR = '#888880';

const CAT_GRADIENT: Record<string, string> = {
  dining:     'linear-gradient(145deg, #FF6B35 0%, #7A1E00 100%)',
  nightlife:  'linear-gradient(145deg, #3A0080 0%, #0D0020 100%)',
  shopping:   'linear-gradient(145deg, #FF8F00 0%, #3D2000 100%)',
  nature:     'linear-gradient(145deg, #006428 0%, #001A0A 100%)',
  historical: 'linear-gradient(145deg, #7A3800 0%, #1A0A00 100%)',
  wellness:   'linear-gradient(145deg, #006070 0%, #001A1F 100%)',
  family:     'linear-gradient(145deg, #8C0030 0%, #200008 100%)',
  events:     'linear-gradient(145deg, #7A0044 0%, #1A0010 100%)',
  local_spots:'linear-gradient(145deg, #6A4400 0%, #1A1000 100%)',
  fun_places: 'linear-gradient(145deg, #800028 0%, #1A0008 100%)',
  top_places: 'linear-gradient(145deg, #003A8C 0%, #000C20 100%)',
};
const FALLBACK_GRADIENT = 'linear-gradient(145deg, #2a2a2a 0%, #0a0a0a 100%)';

const CAT_VIBE: Record<string, string> = {
  dining: 'Eat well', nightlife: 'Stay out late', shopping: 'Treat yourself',
  nature: 'Get outside', historical: 'Old souls', wellness: 'Slow down',
  family: 'Bring the crew', events: "Don't miss it", local_spots: 'Like a local',
  fun_places: 'Good times', top_places: 'The good list',
};

function catImagePath(cat: string): string {
  if (cat === 'wellness') return '/explore/categories/wellness.jpg';
  return `/explore/categories/${cat}.jpg`;
}

function deriveCategories(items: (DrillPlaceCard | DrillEventCard)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!seen.has(item.category)) { seen.add(item.category); out.push(item.category); }
  }
  return out;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' });
}

function priceDots(level: number | null): string | null {
  if (!level) return null;
  return '$'.repeat(Math.min(level, 4));
}

function fmtEventPrice(min: number | null, max: number | null, currency: string | null): string | null {
  if (min == null && max == null) return null;
  const sym = currency === 'SGD' ? 'S$' : currency === 'USD' ? '$' : (currency ?? '$');
  if (min != null && max != null && min !== max) return `${sym}${min}\u2013${sym}${max}`;
  if (min != null) return `from ${sym}${min}`;
  if (max != null) return `up to ${sym}${max}`;
  return null;
}

export default function ExploreSwiper({
  sections, regions, selectedRegionId, firstName,
  onPersonalise, isPersonalising, isRefreshing, onRegionChange,
}: ExploreSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [view, setView] = useState<ExploreView>({ level: 0 });
  const [drillItems, setDrillItems] = useState<(DrillPlaceCard | DrillEventCard)[]>([]);
  const [drillCategories, setDrillCategories] = useState<string[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const cacheRef = useRef<Map<DrillCacheKey, DrillData>>(new Map());
  const [panelPhase, setPanelPhase] = useState<AnimPhase>('idle');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionOption | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  // ref to ExploreWebPanel — used to trigger the city nudge from outside
  const webPanelRef = useRef<ExploreWebPanelHandle | null>(null);

  const pointerStartX = useRef<number | null>(null);
  const panelT1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelT2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDrilledCityRef = useRef<string | null>(null);

  const fetchDrillData = useCallback(async (sectionId: string, region: RegionOption, category: string | null) => {
    const cacheKey: DrillCacheKey = `${sectionId}:${region.id}:${category ?? 'all'}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) { setDrillItems(cached.items); setDrillCategories(cached.categories); return; }
    setDrillLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Supabase unavailable');
      let items: (DrillPlaceCard | DrillEventCard)[] = [];
      if (sectionId === 'happening_now') {
        items = await getEventsByRegionAndCategory(supabase, region.id, category);
      } else {
        items = await getPlacesByRegionAndCategory(supabase, region.id, category);
      }
      const categories = deriveCategories(items);
      const data: DrillData = { items, categories, fetchedAt: new Date().toISOString() };
      cacheRef.current.set(cacheKey, data);
      setDrillItems(items); setDrillCategories(categories);
    } catch (err) {
      console.error('[ExploreSwiper] drill fetch failed', err);
    } finally {
      setDrillLoading(false);
    }
  }, []);

  const transitionPanel = useCallback((fn: () => void) => {
    if (panelT1Ref.current) clearTimeout(panelT1Ref.current);
    if (panelT2Ref.current) clearTimeout(panelT2Ref.current);
    setPanelPhase('exiting');
    panelT1Ref.current = setTimeout(() => {
      fn(); setPanelPhase('entering');
      panelT2Ref.current = setTimeout(() => setPanelPhase('idle'), 500);
    }, 160);
  }, []);

  useEffect(() => () => {
    if (panelT1Ref.current) clearTimeout(panelT1Ref.current);
    if (panelT2Ref.current) clearTimeout(panelT2Ref.current);
  }, []);

  const goTo = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(sections.length - 1, index));
    const targetSection = sections[safeIndex];
    setDrillItems([]); setDrillCategories([]); setActiveIndex(safeIndex);
    if (AUTO_DRILL_SECTIONS.has(targetSection?.id) && selectedRegionId) {
      const region = regions.find(r => r.id === selectedRegionId);
      if (region) {
        lastDrilledCityRef.current = selectedRegionId;
        setActiveRegion(region);
        transitionPanel(() => {
          setView({ level: 1, sectionId: targetSection.id });
          void fetchDrillData(targetSection.id, region, null);
        });
        return;
      }
    }
    setView({ level: 0 }); setActiveRegion(null);
  }, [sections, selectedRegionId, regions, transitionPanel, fetchDrillData]);

  // When Explore button clicked: nudge city if not set, else drill in
  const handleExploreClick = useCallback(() => {
    if (!selectedRegionId) {
      webPanelRef.current?.triggerCityNudge();
      return;
    }
    const section = sections[activeIndex];
    if (!section) return;
    if (AUTO_DRILL_SECTIONS.has(section.id)) {
      const region = regions.find(r => r.id === selectedRegionId);
      if (!region) return;
      lastDrilledCityRef.current = selectedRegionId;
      setActiveRegion(region);
      transitionPanel(() => {
        setView({ level: 1, sectionId: section.id });
        void fetchDrillData(section.id, region, null);
      });
    } else {
      setView({ level: 0 }); setActiveRegion(null);
    }
  }, [activeIndex, sections, selectedRegionId, regions, transitionPanel, fetchDrillData]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (pointerStartX.current == null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goTo(activeIndex + 1);
    else goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  // Sync region changes: if a new region is selected on an auto-drill section, re-drill
  useEffect(() => {
    if (!selectedRegionId) return;
    const section = sections[activeIndex];
    if (!section) return;
    if (!AUTO_DRILL_SECTIONS.has(section.id)) return;
    if (lastDrilledCityRef.current === selectedRegionId) return;
    const region = regions.find(r => r.id === selectedRegionId);
    if (!region) return;
    lastDrilledCityRef.current = selectedRegionId;
    setActiveRegion(region);
    transitionPanel(() => {
      setView({ level: 1, sectionId: section.id });
      void fetchDrillData(section.id, region, null);
    });
  }, [selectedRegionId, activeIndex, sections, regions, transitionPanel, fetchDrillData]);

  // Safe category access — view.level 2/3 both have .category per ExploreView type
  type ViewL2 = Extract<ExploreView, { level: 2 }>;
  const filteredDrillItems = view.level >= 2
    ? drillItems.filter(i => i.category === (view as ViewL2).category)
    : drillItems;

  const panelOpacity = panelPhase === 'exiting' ? 0 : 1;
  const panelTranslateY = panelPhase === 'exiting' ? 12 : panelPhase === 'entering' ? 8 : 0;

  return (
    <div
      style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* ── Left: hero card ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
        <ExploreCard
          section={sections[activeIndex]}
          sections={sections}
          activeIndex={activeIndex}
          onSectionChange={goTo}
          onExploreClick={handleExploreClick}
        />

        {/* Drill overlay */}
        {view.level >= 1 && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 30,
              opacity: panelOpacity,
              transform: `translateY(${panelTranslateY}px)`,
              transition: 'opacity 300ms ease, transform 300ms ease',
              background: 'rgba(6,4,2,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex', flexDirection: 'column',
              padding: '28px 24px 24px',
              overflowY: 'auto', scrollbarWidth: 'none',
            }}
          >
            {/* Back button */}
            <button
              onClick={() => { setView({ level: 0 }); setActiveRegion(null); setDrillItems([]); setDrillCategories([]); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 20px', color: 'rgba(250,248,245,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>

            {/* Section + region header */}
            <div style={{ marginBottom: '20px' }}>
              {activeRegion && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C17F3A', margin: '0 0 6px' }}>
                  {activeRegion.name}
                </p>
              )}
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 600, color: '#FAF8F5', margin: 0, lineHeight: 1.1 }}>
                {sections[activeIndex]?.title}
              </h2>
            </div>

            {/* Loading */}
            {drillLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(250,248,245,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(193,127,58,0.3)', borderTopColor: '#C17F3A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Loading…
              </div>
            )}

            {/* L1: category grid */}
            {!drillLoading && view.level === 1 && drillCategories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                {drillCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (view.level === 1 && activeRegion) {
                        transitionPanel(() => {
                          setView({ level: 2, sectionId: view.sectionId, region: activeRegion, category: cat });
                          setCarouselIndex(0);
                        });
                      }
                    }}
                    style={{
                      position: 'relative', borderRadius: '14px', overflow: 'hidden',
                      border: 'none', cursor: 'pointer', padding: 0,
                      aspectRatio: '1 / 1',
                      background: CAT_GRADIENT[cat] ?? FALLBACK_GRADIENT,
                    }}
                  >
                    <img
                      src={catImagePath(cat)}
                      alt={cat}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', textAlign: 'left' }}>
                      <div style={{ width: '24px', height: '2px', background: CAT_COLOR[cat] ?? FALLBACK_COLOR, marginBottom: '6px', borderRadius: '2px' }} />
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#FAF8F5', margin: '0 0 2px', letterSpacing: '0.02em' }}>{categoryLabel(cat)}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(250,248,245,0.5)', margin: 0 }}>{CAT_VIBE[cat] ?? ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* L1: no items */}
            {!drillLoading && view.level === 1 && drillCategories.length === 0 && (
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '16px', color: 'rgba(250,248,245,0.3)', textAlign: 'center', marginTop: '40px' }}>
                Nothing here yet for {activeRegion?.name ?? 'this region'}.
              </p>
            )}

            {/* L2: carousel */}
            {!drillLoading && view.level === 2 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <button
                    onClick={() => {
                      if (view.level === 2) {
                        transitionPanel(() => setView({ level: 1, sectionId: view.sectionId }));
                      }
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(250,248,245,0.45)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    {categoryLabel(view.category)}
                  </button>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(250,248,245,0.08)' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.28)' }}>{filteredDrillItems.length} places</span>
                </div>

                {filteredDrillItems.length === 0 && (
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.28)', textAlign: 'center', marginTop: '32px' }}>Nothing here yet.</p>
                )}

                {filteredDrillItems.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <div
                      ref={carouselRef}
                      style={{ display: 'flex', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px', scrollSnapType: 'x mandatory' }}
                      onScroll={e => {
                        const el = e.currentTarget;
                        const cardW = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 14 : 200;
                        setCarouselIndex(Math.round(el.scrollLeft / cardW));
                      }}
                    >
                      {filteredDrillItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem({ item, contentType: sections[activeIndex].content_type })}
                          style={{
                            flexShrink: 0, width: '180px', borderRadius: '16px', overflow: 'hidden',
                            border: '1px solid rgba(250,248,245,0.1)', background: 'rgba(250,248,245,0.06)',
                            cursor: 'pointer', padding: 0, textAlign: 'left', scrollSnapAlign: 'start',
                            transition: 'border-color 160ms ease, background 160ms ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(193,127,58,0.4)'; e.currentTarget.style.background = 'rgba(250,248,245,0.10)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(250,248,245,0.1)'; e.currentTarget.style.background = 'rgba(250,248,245,0.06)'; }}
                        >
                          <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: 'rgba(250,248,245,0.06)' }}>
                            {item.image_url
                              ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                              : <div style={{ width: '100%', height: '100%', background: CAT_GRADIENT[item.category] ?? FALLBACK_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ width: '28px', height: '2px', background: CAT_COLOR[item.category] ?? FALLBACK_COLOR, borderRadius: '2px' }} />
                                </div>}
                          </div>
                          <div style={{ padding: '12px 12px 14px' }}>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#FAF8F5', margin: '0 0 4px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</p>
                            {'city' in item && item.city && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.38)', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.city}</p>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {'price_level' in item && priceDots(item.price_level) && (
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#C17F3A', fontWeight: 600 }}>{priceDots(item.price_level)}</span>
                              )}
                              {'rating' in item && item.rating != null && (
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.55)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#C17F3A" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                  {item.rating.toFixed(1)}
                                </span>
                              )}
                              {'start_date' in item && item.start_date && (
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(250,248,245,0.42)', letterSpacing: '0.03em' }}>{fmtDate(item.start_date)}</span>
                              )}
                              {'price_min' in item && fmtEventPrice(item.price_min, item.price_max, item.currency) && (
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#C17F3A', fontWeight: 600 }}>{fmtEventPrice(item.price_min, item.price_max, item.currency)}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {filteredDrillItems.length > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '12px' }}>
                        {filteredDrillItems.map((_, i) => (
                          <div key={i} style={{ width: i === carouselIndex ? '16px' : '5px', height: '3px', borderRadius: '2px', background: i === carouselIndex ? '#C17F3A' : 'rgba(250,248,245,0.2)', transition: 'width 240ms ease, background 240ms ease' }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Right: web panel (desktop only) ── */}
      <ExploreWebPanel
        ref={webPanelRef}
        sections={sections}
        regions={regions}
        activeIndex={activeIndex}
        activeRegion={activeRegion}
        selectedRegionId={selectedRegionId}
        onSectionChange={goTo}
        onDrillRegion={(region) => {
          setActiveRegion(region);
          transitionPanel(() => {
            setView({ level: 1, sectionId: sections[activeIndex].id });
            void fetchDrillData(sections[activeIndex].id, region, null);
          });
        }}
        onRegionChange={onRegionChange}
        onPersonalise={onPersonalise}
        isPersonalising={isPersonalising}
        onItemClick={(item, contentType) => setSelectedItem({ item, contentType })}
      />

      {/* ── Detail sheet ── */}
      {selectedItem && (
        <ExploreDetailSheet
          item={selectedItem.item}
          contentType={selectedItem.contentType}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
