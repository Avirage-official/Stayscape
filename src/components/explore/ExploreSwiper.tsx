'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import ExploreCard, { type ExploreSection, type ExploreItem } from './ExploreCard';
import ExploreDetailSheet from './ExploreDetailSheet';
import ExploreWebPanel from './ExploreWebPanel';
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

function sectionShortLabel(id: string) {
  if (id === 'made_for_you') return 'Yours';
  if (id === 'in_your_world') return 'Nearby';
  if (id === 'happening_now') return 'Tonight';
  if (id === 'arias_picks') return 'Aria';
  return id;
}

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
  if (min != null && max != null && min !== max) return `${sym}${min}–${sym}${max}`;
  if (min != null) return `from ${sym}${min}`;
  if (max != null) return `up to ${sym}${max}`;
  return null;
}

function pad(n: number) {
  return String(n + 1).padStart(2, '0');
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
  const [showRegionSheet, setShowRegionSheet] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [nextHeroImageUrl, setNextHeroImageUrl] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionOption | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  // nudgeRegion: still used for the mobile city-button border highlight
  const [nudgeRegion, setNudgeRegion] = useState(false);
  // openCityPicker: tells the desktop web panel to open its city dropdown
  const [openCityPicker, setOpenCityPicker] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // L0 swipe state — only used on the section hero, never on drill levels
  const pointerStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
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

  useEffect(() => {
    if (!selectedRegionId || !sections.length) return;
    if (lastDrilledCityRef.current === selectedRegionId) return;
    const active = sections[activeIndex];
    if (!active || !AUTO_DRILL_SECTIONS.has(active.id)) return;
    const region = regions.find(r => r.id === selectedRegionId);
    if (!region) return;
    lastDrilledCityRef.current = selectedRegionId;
    cacheRef.current.clear();
    setDrillItems([]); setDrillCategories([]);
    setActiveRegion(region);
    setView({ level: 1, sectionId: active.id });
    void fetchDrillData(active.id, region, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegionId, sections]);

  const drillToRegion = useCallback((region: RegionOption) => {
    const active = sections[activeIndex];
    setActiveRegion(region);
    setNextHeroImageUrl(region.image_url ?? null);
    setTimeout(() => { setHeroImageUrl(region.image_url ?? null); setNextHeroImageUrl(null); }, 680);
    transitionPanel(() => { setView({ level: 1, sectionId: active.id }); fetchDrillData(active.id, region, null); });
  }, [sections, activeIndex, transitionPanel, fetchDrillData]);

  const drillToCategory = useCallback((region: RegionOption, category: string) => {
    const active = sections[activeIndex];
    setCarouselIndex(0);
    transitionPanel(() => { setView({ level: 2, sectionId: active.id, region, category }); fetchDrillData(active.id, region, category); });
  }, [sections, activeIndex, transitionPanel, fetchDrillData]);

  const handleExplore = useCallback(() => {
    if (selectedRegionId) {
      // City already selected — drill straight in
      const region = regions.find(r => r.id === selectedRegionId);
      if (region) drillToRegion(region);
    } else {
      // No city selected — open the picker directly so the guest knows what to do.
      // Mobile: open the bottom sheet. Desktop: open the city dropdown in the side panel.
      setShowRegionSheet(true);          // mobile bottom sheet
      setOpenCityPicker(true);           // desktop dropdown (resets via useEffect in panel)
      setNudgeRegion(true);              // keep the mobile city button highlighted
      setTimeout(() => {
        setNudgeRegion(false);
        setOpenCityPicker(false);        // reset so future prop changes are reactive
      }, 2000);
    }
  }, [selectedRegionId, regions, drillToRegion]);

  const drillToItem = useCallback((item: DrillPlaceCard | DrillEventCard, sectionId: string) => {
    const contentType = sectionId === 'happening_now' ? 'events' : 'places';
    setSelectedItem({ item, contentType });
  }, []);

  const navigateBack = useCallback(() => {
    if (view.level === 0) return;
    if (view.level === 1) {
      setNextHeroImageUrl(sections[activeIndex]?.image_url ?? null);
      setTimeout(() => { setHeroImageUrl(sections[activeIndex]?.image_url ?? null); setNextHeroImageUrl(null); }, 680);
      transitionPanel(() => { setView({ level: 0 }); setDrillItems([]); setDrillCategories([]); setActiveRegion(null); });
    } else if (view.level === 2) {
      const v = view as Extract<ExploreView, { level: 2 }>;
      transitionPanel(() => {
        setView({ level: 1, sectionId: v.sectionId });
        const allKey: DrillCacheKey = `${v.sectionId}:${v.region.id}:all`;
        const cached = cacheRef.current.get(allKey);
        if (cached) { setDrillItems(cached.items); setDrillCategories(cached.categories); }
        else { setDrillItems([]); setDrillCategories([]); fetchDrillData(v.sectionId, v.region, null); }
      });
    }
  }, [view, sections, activeIndex, transitionPanel, fetchDrillData]);

  useEffect(() => {
    if (view.level === 0) setHeroImageUrl(sections[activeIndex]?.image_url ?? null);
  }, [activeIndex, sections, view.level]);

  // ─── L0 swipe handlers — ONLY fire when at root section level ──────────────
  function handlePointerDown(e: React.PointerEvent) {
    if (view.level > 0 || showRegionSheet) return;
    pointerStartX.current = e.clientX;
    isDragging.current = false;
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (view.level > 0 || pointerStartX.current === null) return;
    if (Math.abs(e.clientX - pointerStartX.current) > 6) isDragging.current = true;
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (view.level > 0 || pointerStartX.current === null) return;
    const delta = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (!isDragging.current) return;
    if (delta < -50) goTo(activeIndex + 1);
    else if (delta > 50) goTo(activeIndex - 1);
  }

  const active = sections[activeIndex];
  const greeting = firstName ? `for ${firstName}` : 'for you';
  const displayHeroUrl = heroImageUrl ?? active?.image_url ?? null;
  const panelStyle: React.CSSProperties =
    panelPhase === 'exiting' ? { opacity: 0, transition: 'opacity 160ms ease-in' }
    : panelPhase === 'entering' ? { opacity: 1, animation: 'hsPanelIn 440ms 60ms cubic-bezier(0.25,0,0,1) both' }
    : {};

  // ─── L1: Spotlight category grid ────────────────────────────────────────────
  function renderL1CategoryGrid() {
    if (drillLoading) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '16px' }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ aspectRatio: '3 / 4', borderRadius: '16px', background: 'rgba(250,248,245,0.06)', animation: `hsSkeleton 1.4s ${i * 0.07}s ease-in-out infinite` }} />
          ))}
        </div>
      );
    }
    if (drillCategories.length === 0) {
      return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', paddingTop: '60px', margin: 0 }}>Nothing to explore here yet.</p>;
    }

    const countMap: Record<string, number> = {};
    for (const item of drillItems) countMap[item.category] = (countMap[item.category] ?? 0) + 1;

    return (
      <div style={{ padding: '16px 16px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {drillCategories.map((cat, idx) => {
            const accentColor = CAT_COLOR[cat.toLowerCase()] ?? FALLBACK_COLOR;
            const gradient = CAT_GRADIENT[cat.toLowerCase()] ?? FALLBACK_GRADIENT;
            const label = categoryLabel(cat);
            const vibe = CAT_VIBE[cat.toLowerCase()] ?? '';
            const count = countMap[cat] ?? 0;
            const imgSrc = catImagePath(cat.toLowerCase());
            const isFeature = idx === 0;

            return (
              <button
                key={cat}
                onClick={() => { if (activeRegion) drillToCategory(activeRegion, cat); }}
                style={{
                  gridColumn: isFeature ? '1 / -1' : 'auto',
                  aspectRatio: isFeature ? '21 / 9' : '3 / 4',
                  border: 'none',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  background: gradient,
                  animation: `hsCatIn 400ms ${idx * 35}ms cubic-bezier(0.16,1,0.3,1) both`,
                  transition: 'transform 220ms cubic-bezier(0.25,0,0,1), box-shadow 220ms ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
                  touchAction: 'manipulation',
                } as React.CSSProperties}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.025)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.45)';
                }}
              >
                <img
                  src={imgSrc}
                  alt={label}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  loading={idx < 3 ? 'eager' : 'lazy'}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,4,2,0.88) 0%, rgba(6,4,2,0.2) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}`, flexShrink: 0 }} />
                  {vibe && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: '#FAF8F5', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '3px 8px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{vibe}</span>
                  )}
                </div>
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, color: '#0A0806', background: accentColor, borderRadius: '20px', padding: '3px 9px', lineHeight: 1.4 }}>{count}</span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isFeature ? '20px 20px' : '14px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isFeature ? 'clamp(1.4rem, 3vw, 2rem)' : 'clamp(1rem, 2.5vw, 1.4rem)', fontWeight: 800, color: '#FAF8F5', margin: 0, lineHeight: 1.0, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>{label}</h3>
                  <div style={{ width: isFeature ? '32px' : '26px', height: isFeature ? '32px' : '26px', borderRadius: '50%', background: 'rgba(250,248,245,0.15)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── L2: Centred tall spotlight carousel ────────────────────────────────────
  function renderL2ItemList() {
    const v2 = view as Extract<ExploreView, { level: 2 }>;
    const isEvent = active?.id === 'happening_now';
    const catKey = v2.category?.toLowerCase();
    const accentFg = CAT_COLOR[catKey] ?? FALLBACK_COLOR;
    const catGradient = CAT_GRADIENT[catKey] ?? FALLBACK_GRADIENT;

    if (drillLoading) {
      return (
        <div style={{ padding: '16px', display: 'flex', gap: '10px', overflow: 'hidden' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ flex: i === 1 ? '0 0 72%' : '0 0 18%', height: '380px', borderRadius: '20px', background: 'rgba(250,248,245,0.05)', animation: `hsSkeleton 1.4s ${i * 0.1}s ease-in-out infinite` }} />
          ))}
        </div>
      );
    }

    if (drillItems.length === 0) {
      return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', paddingTop: '60px', margin: 0 }}>Nothing on just yet.</p>;
    }

    function buildPrice(item: DrillPlaceCard | DrillEventCard): string | null {
      if (isEvent) {
        const ev = item as DrillEventCard;
        return fmtEventPrice(ev.price_min, ev.price_max, ev.currency);
      }
      return priceDots((item as DrillPlaceCard).price_level);
    }

    const total = drillItems.length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', padding: '0 20px 12px' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#FAF8F5', letterSpacing: '0.04em' }}>{pad(carouselIndex)}</span>
          <div style={{ position: 'relative', width: '36px', height: '1px', background: 'rgba(250,248,245,0.18)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '1px', background: accentFg, width: `${((carouselIndex + 1) / Math.min(total, 6)) * 100}%`, transition: 'width 340ms cubic-bezier(0.25,0,0,1)' }} />
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 400, color: 'rgba(250,248,245,0.35)', letterSpacing: '0.04em' }}>{pad(Math.min(total, 6) - 1)}</span>
        </div>

        <div
          ref={carouselRef}
          onScroll={() => {
            const el = carouselRef.current;
            if (!el) return;
            const cardW = el.clientWidth * 0.72 + 12;
            setCarouselIndex(Math.round(el.scrollLeft / cardW));
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            gap: '10px',
            padding: '0 14% 0',
            scrollbarWidth: 'none',
          } as React.CSSProperties}
        >
          {drillItems.slice(0, 6).map((item, idx) => {
            const isActive = idx === carouselIndex;
            const price = buildPrice(item);
            const pl = item as DrillPlaceCard;
            const ev = item as DrillEventCard;
            const vibeTag = !isEvent && pl.vibes?.[0] ? pl.vibes[0] : null;
            const metaLine = isEvent ? fmtDate(ev.start_date) : null;
            const hasImage = !!item.image_url;

            return (
              <button
                key={item.id}
                onClick={() => drillToItem(item, active?.id ?? '')}
                style={{
                  flex: `0 0 ${isActive ? '72%' : '18%'}`,
                  height: isActive ? '380px' : '320px',
                  scrollSnapAlign: 'center',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  background: hasImage ? 'rgba(20,16,12,1)' : catGradient,
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.45,
                  transition: 'flex 400ms cubic-bezier(0.16,1,0.3,1), height 400ms cubic-bezier(0.16,1,0.3,1), opacity 400ms ease',
                  boxShadow: isActive ? '0 16px 48px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.3)',
                  touchAction: 'manipulation',
                } as React.CSSProperties}
              >
                {hasImage && (
                  <img src={item.image_url!} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', transform: isActive ? 'scale(1)' : 'scale(1.06)', transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1)' }} loading={idx === 0 ? 'eager' : 'lazy'} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,4,2,0.92) 0%, rgba(6,4,2,0.3) 45%, transparent 100%)', pointerEvents: 'none' }} />

                {isActive && (
                  <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentFg, boxShadow: `0 0 10px ${accentFg}`, flexShrink: 0 }} />
                    {(vibeTag ?? metaLine) && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: '#FAF8F5', background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '3px 9px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{vibeTag ?? metaLine}</span>
                    )}
                  </div>
                )}

                {isActive && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                      <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 800, color: '#FAF8F5', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{item.name}</h3>
                      {price && (
                        <>
                          <div style={{ width: '1px', height: '14px', background: 'rgba(250,248,245,0.35)', flexShrink: 0 }} />
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: accentFg, whiteSpace: 'nowrap', flexShrink: 0 }}>{price}</span>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!isEvent && pl.rating && (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, color: '#0A0806', background: accentFg, borderRadius: '5px', padding: '2px 6px', lineHeight: 1.5, flexShrink: 0 }}>★ {pl.rating.toFixed(1)}</span>
                      )}
                      {isEvent && ev.is_featured && (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accentFg }}>Featured</span>
                      )}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={2} style={{ flexShrink: 0 }}>
                        {isEvent
                          ? <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
                          : <><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></>}
                      </svg>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 500, color: accentFg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isEvent ? fmtDate(ev.start_date) : (pl.address ?? pl.vibes?.[1] ?? '')}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {drillItems.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingTop: '16px' }}>
            {drillItems.slice(0, 6).map((_, i) => (
              <div key={i} style={{ width: i === carouselIndex ? '18px' : '5px', height: '5px', borderRadius: '3px', background: i === carouselIndex ? accentFg : 'rgba(250,248,245,0.2)', transition: 'width 260ms cubic-bezier(0.25,0,0,1), background 260ms ease' }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Drill canvas shell ──────────────────────────────────────────────────────
  function renderLeftDrillCanvas() {
    const v2 = view.level === 2 ? (view as Extract<ExploreView, { level: 2 }>) : null;
    const regionName = activeRegion?.name ?? '';
    const catLabel = v2 ? categoryLabel(v2.category) : '';
    const catAccent = v2 ? (CAT_COLOR[v2.category?.toLowerCase()] ?? FALLBACK_COLOR) : null;

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(12,9,6,0.94)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        borderRadius: '20px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        touchAction: 'auto',
        ...panelStyle,
      } as React.CSSProperties}>
        <div style={{ padding: '24px 24px 16px', flexShrink: 0, borderBottom: '1px solid rgba(250,248,245,0.07)' }}>
          <button
            onClick={navigateBack}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px', color: 'rgba(250,248,245,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(250,248,245,0.75)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250,248,245,0.4)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {v2 ? `${sectionShortLabel(active?.id ?? '')} / ${regionName}` : sectionShortLabel(active?.id ?? '')}
            </span>
          </button>

          {view.level === 1 && (
            <>
              {activeRegion?.country_code && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(193,127,58,0.85)', margin: '0 0 6px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{activeRegion.country_code}</p>
              )}
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#FAF8F5', margin: 0, lineHeight: 0.95, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>{regionName}</h2>
            </>
          )}

          {view.level === 2 && v2 && (
            <>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: catAccent ?? 'rgba(193,127,58,0.85)', margin: '0 0 6px', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.9 }}>{regionName}</p>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, color: '#FAF8F5', margin: 0, lineHeight: 0.95, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>{catLabel}</h2>
            </>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', touchAction: 'pan-y' } as React.CSSProperties}>
          {view.level === 1 && renderL1CategoryGrid()}
          {view.level === 2 && renderL2ItemList()}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        overflow: 'hidden', background: '#0A0806',
        touchAction: view.level === 0 && !showRegionSheet ? 'none' : 'auto',
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* ambient background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {displayHeroUrl && <img src={displayHeroUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.32, transition: 'opacity 680ms ease' }} />}
        {nextHeroImageUrl && <img src={nextHeroImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 680ms ease' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,8,6,0.6) 0%, rgba(10,8,6,0.88) 100%)' }} />
      </div>

      {/* ── Mobile ── */}
      <div
        className="block md:hidden"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          paddingBottom: 80,
          boxSizing: 'border-box',
        }}
      >
        {view.level === 0 ? (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', background: 'linear-gradient(to bottom, rgba(10,8,6,0.72) 0%, transparent 100%)', pointerEvents: 'none' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.45)', margin: 0 }}>Explore {greeting}</p>
              <button
                onClick={() => setShowRegionSheet(true)}
                style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(14,11,8,0.60)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${nudgeRegion ? 'rgba(193,127,58,0.80)' : 'rgba(250,248,245,0.22)'}`, borderRadius: '20px', padding: '7px 12px 7px 10px', cursor: 'pointer', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', boxShadow: nudgeRegion ? '0 0 0 3px rgba(193,127,58,0.30)' : 'none' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(193,127,58,0.9)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 500, color: nudgeRegion ? 'rgba(250,248,245,0.95)' : 'rgba(250,248,245,0.82)', whiteSpace: 'nowrap' }}>
                  {regions.find(r => r.id === selectedRegionId)?.name ?? 'Select city'}
                </span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.45)" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <ExploreCard key={active.id} section={active} sections={sections} activeIndex={activeIndex} onSectionChange={goTo} onExplore={handleExplore} />
          </>
        ) : renderLeftDrillCanvas()}

        {isRefreshing && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'rgba(8,5,2,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C17F3A', boxShadow: '0 0 16px rgba(193,127,58,0.7)', animation: 'ecPulse 1.1s ease-in-out infinite' }} />
          </div>
        )}
      </div>

      {/* ── Mobile region sheet ── */}
      {showRegionSheet && (
        <div className="block md:hidden" style={{ position: 'absolute', inset: 0, zIndex: 50, touchAction: 'auto' } as React.CSSProperties}>
          <div onClick={() => setShowRegionSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(18,14,10,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: '1px solid rgba(250,248,245,0.1)', borderRadius: '20px 20px 0 0', maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '32px', height: '4px', background: 'rgba(250,248,245,0.18)', borderRadius: '2px' }} />
            </div>
            <div style={{ padding: '8px 24px 14px', borderBottom: '1px solid rgba(250,248,245,0.07)', flexShrink: 0 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.38)', margin: 0 }}>Select your city</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 16px 32px', touchAction: 'pan-y' } as React.CSSProperties}>
              {regions.map(region => {
                const isSelected = region.id === selectedRegionId;
                return (
                  <button
                    key={region.id}
                    onClick={() => { onRegionChange?.(region.id); setShowRegionSheet(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 10px', marginBottom: '5px', width: '100%', background: isSelected ? 'rgba(193,127,58,0.14)' : 'rgba(250,248,245,0.05)', border: `1px solid ${isSelected ? 'rgba(193,127,58,0.5)' : 'rgba(250,248,245,0.08)'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box', touchAction: 'manipulation' } as React.CSSProperties}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(250,248,245,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {region.image_url
                        ? <img src={region.image_url} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        : <span style={{ color: 'rgba(250,248,245,0.35)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>{region.country_code ?? '—'}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#FAF8F5' : 'rgba(250,248,245,0.8)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region.name}</p>
                      {region.country_code && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: isSelected ? 'rgba(193,127,58,0.7)' : 'rgba(250,248,245,0.32)', margin: '2px 0 0' }}>{region.country_code}</p>}
                    </div>
                    {isSelected
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(193,127,58,0.9)" strokeWidth={2.5} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.2)" strokeWidth={2} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop ── */}
      <div className="hidden md:flex" style={{ position: 'absolute', inset: 0, zIndex: 10, padding: '12px', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>
          {view.level === 0 ? (
            <>
              <ExploreCard key={active.id} section={active} sections={sections} activeIndex={activeIndex} onSectionChange={goTo} onExplore={handleExplore} />
              <p style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 20, fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.45)', margin: 0, pointerEvents: 'none' }}>Explore {greeting}</p>
            </>
          ) : renderLeftDrillCanvas()}

          {isRefreshing && (
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'rgba(8,5,2,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C17F3A', boxShadow: '0 0 16px rgba(193,127,58,0.7)', animation: 'ecPulse 1.1s ease-in-out infinite' }} />
            </div>
          )}
        </div>

        <ExploreWebPanel
          sections={sections}
          regions={regions}
          activeIndex={activeIndex}
          activeRegion={activeRegion}
          selectedRegionId={selectedRegionId}
          onSectionChange={(i) => goTo(i)}
          onDrillRegion={drillToRegion}
          onRegionChange={onRegionChange}
          onPersonalise={onPersonalise}
          isPersonalising={isPersonalising}
          nudgeCity={nudgeRegion}
          openCityPicker={openCityPicker}
          onItemClick={(item, contentType) => setSelectedItem({ item, contentType })}
        />
      </div>

      {selectedItem && (
        <ExploreDetailSheet
          item={selectedItem.item}
          contentType={selectedItem.contentType}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <style>{`
        @keyframes hsPanelIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes hsSkeleton { 0%,100% { opacity:0.06; } 50% { opacity:0.14; } }
        @keyframes ecPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.6); opacity:0.5; } }
        @keyframes hsItemIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes hsCatIn { from { opacity:0; transform:translateY(10px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes hsNudge { 0%,100% { box-shadow: none; } 50% { box-shadow: 0 0 0 3px rgba(193,127,58,0.55), 0 4px 16px rgba(193,127,58,0.25); } }
        @keyframes hsFadeIn { from { opacity:0; } to { opacity:1; } }
        div::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}
