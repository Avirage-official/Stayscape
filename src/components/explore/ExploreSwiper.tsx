'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
const DOT_MAX = 12;

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
  if (min != null && max != null && min !== max) return `${sym}${min}\u2013${sym}${max}`;
  if (min != null) return `from ${sym}${min}`;
  if (max != null) return `up to ${sym}${max}`;
  return null;
}

function pad(n: number) {
  return String(n + 1).padStart(2, '0');
}

function L2Slideshow({ items, accentFg }: { items: (DrillPlaceCard | DrillEventCard)[]; accentFg: string }) {
  const images = useMemo(() => items.filter(item => !!item.image_url), [items]);
  const [layers, setLayers] = useState<{ idx: number; key: number; opacity: number }[]>(() => [{ idx: 0, key: 0, opacity: 1 }]);
  const keyRef = useRef(1);
  const currIdxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = (currIdxRef.current + 1) % images.length;
      currIdxRef.current = next;
      const k = keyRef.current++;
      setLayers(prev => [...prev.slice(-1), { idx: next, key: k, opacity: 0 }]);
      setTimeout(() => { setLayers(prev => prev.map(l => l.key === k ? { ...l, opacity: 1 } : l)); }, 50);
      setTimeout(() => { setLayers(prev => prev.length > 1 ? prev.slice(-1) : prev); }, 1100);
    }, 4200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [images.length]);

  if (images.length === 0) return <div style={{ width: '100%', height: '100%', background: 'rgba(250,248,245,0.02)' }} />;
  const currLayer = layers[layers.length - 1];
  const currItem = images[currLayer.idx];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0A0806' }}>
      {layers.map(layer => (
        <img key={layer.key} src={images[layer.idx].image_url!} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: layer.opacity, transition: 'opacity 1000ms ease' }} />
      ))}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(6,4,2,0.90) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: '28px', left: '24px', right: '24px', zIndex: 3 }}>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(1.3rem, 2.2vw, 1.9rem)', fontWeight: 800, color: '#FAF8F5', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.05, textTransform: 'uppercase' }}>{currItem.name}</h3>
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {images.slice(0, Math.min(images.length, 10)).map((_, i) => (
              <div key={i} style={{ width: i === currLayer.idx ? '18px' : '4px', height: '3px', borderRadius: '2px', background: i === currLayer.idx ? accentFg : 'rgba(250,248,245,0.28)', transition: 'width 320ms cubic-bezier(0.25,0,0,1), background 320ms ease' }} />
            ))}
            {images.length > 10 && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, color: 'rgba(250,248,245,0.3)', marginLeft: '3px' }}>+{images.length - 10}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExploreSwiper({
  sections, regions, selectedRegionId, firstName,
  onPersonalise, isPersonalising, isRefreshing, onRegionChange,
}: ExploreSwiperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [nudgeRegion, setNudgeRegion] = useState(false);
  const [openCityPicker, setOpenCityPicker] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pointerStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const panelT1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelT2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDrilledCityRef = useRef<string | null>(null);
  const restoredRef = useRef(false);

  // ── URL param helpers ─────────────────────────────────────────────────────
  // Encode nav state as ?s=sectionId&r=regionId&c=category so refresh restores position.
  const updateUrl = useCallback((s?: string, r?: string, c?: string) => {
    const p = new URLSearchParams();
    if (s) p.set('s', s);
    if (r) p.set('r', r);
    if (c) p.set('c', c);
    const qs = p.toString();
    router.replace(`/dashboard/explore${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [router]);

  // Restore nav state from URL params on first render (after data is available)
  useEffect(() => {
    if (restoredRef.current || !sections.length) return;
    restoredRef.current = true;
    const s = searchParams.get('s');
    const r = searchParams.get('r');
    const c = searchParams.get('c');
    if (!s) return;
    const sIdx = sections.findIndex(sec => sec.id === s);
    const validIdx = sIdx >= 0 ? sIdx : 0;
    const section = sections[validIdx];
    setActiveIndex(validIdx);
    if (!r) return;
    const region = regions.find(reg => reg.id === r);
    if (!region) return;
    setActiveRegion(region);
    lastDrilledCityRef.current = region.id;
    if (!c) {
      setView({ level: 1, sectionId: section.id });
      if (region.is_active !== false) void fetchDrillData(section.id, region, null);
    } else {
      setView({ level: 2, sectionId: section.id, region, category: c });
      if (region.is_active !== false) void fetchDrillData(section.id, region, c);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length]);

  // ── Carousel scroll handler ───────────────────────────────────────────────
  // All cards are equal-width so the active index is just scrollLeft / cardStep.
  const handleCarouselScroll = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const el = carouselRef.current;
      if (!el || !el.children.length) return;
      const cardStep = (el.children[0] as HTMLElement).offsetWidth + 10;
      const idx = Math.round(el.scrollLeft / cardStep);
      setCarouselIndex(Math.max(0, Math.min(idx, el.children.length - 1)));
    }, 80);
  }, []);

  useEffect(() => () => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
  }, []);

  // ── Programmatic navigation (dots / card tap) ────────────────────────────
  // All cards are equal-width so the scroll target is simply idx * cardStep.
  const scrollToCard = useCallback((idx: number) => {
    const el = carouselRef.current;
    if (!el || !el.children.length) return;
    const cardStep = (el.children[0] as HTMLElement).offsetWidth + 10;
    setCarouselIndex(idx);
    el.scrollTo({ left: idx * cardStep, behavior: 'smooth' });
  }, []);

  // ── Reset to card 0 when a new category is loaded ──────────────────────
  useEffect(() => {
    if (drillItems.length === 0) return;
    setCarouselIndex(0);
    const el = carouselRef.current;
    if (el) el.scrollLeft = 0;
  }, [drillItems]);

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
        updateUrl(targetSection.id, region.id);
        return;
      }
    }
    setView({ level: 0 }); setActiveRegion(null);
    updateUrl(targetSection?.id);
  }, [sections, selectedRegionId, regions, transitionPanel, fetchDrillData, updateUrl]);

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
    transitionPanel(() => {
      setView({ level: 1, sectionId: active.id });
      if (region.is_active !== false) void fetchDrillData(active.id, region, null);
    });
    updateUrl(active.id, region.id);
  }, [sections, activeIndex, transitionPanel, fetchDrillData, updateUrl]);

  const drillToCategory = useCallback((region: RegionOption, category: string) => {
    const active = sections[activeIndex];
    setCarouselIndex(0);
    transitionPanel(() => { setView({ level: 2, sectionId: active.id, region, category }); fetchDrillData(active.id, region, category); });
    updateUrl(active.id, region.id, category);
  }, [sections, activeIndex, transitionPanel, fetchDrillData, updateUrl]);

  const handleExplore = useCallback(() => {
    if (selectedRegionId) {
      const region = regions.find(r => r.id === selectedRegionId);
      if (region) drillToRegion(region);
    } else {
      setShowRegionSheet(true);
      setOpenCityPicker(true);
      setNudgeRegion(true);
      setTimeout(() => {
        setNudgeRegion(false);
        setOpenCityPicker(false);
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
      const sId = (view as Extract<ExploreView, { level: 1 }>).sectionId;
      setNextHeroImageUrl(sections[activeIndex]?.image_url ?? null);
      setTimeout(() => { setHeroImageUrl(sections[activeIndex]?.image_url ?? null); setNextHeroImageUrl(null); }, 680);
      transitionPanel(() => { setView({ level: 0 }); setDrillItems([]); setDrillCategories([]); setActiveRegion(null); });
      updateUrl(sId);
    } else if (view.level === 2) {
      const v = view as Extract<ExploreView, { level: 2 }>;
      transitionPanel(() => {
        setView({ level: 1, sectionId: v.sectionId });
        const allKey: DrillCacheKey = `${v.sectionId}:${v.region.id}:all`;
        const cached = cacheRef.current.get(allKey);
        if (cached) { setDrillItems(cached.items); setDrillCategories(cached.categories); }
        else { setDrillItems([]); setDrillCategories([]); fetchDrillData(v.sectionId, v.region, null); }
      });
      updateUrl(v.sectionId, v.region.id);
    }
  }, [view, sections, activeIndex, transitionPanel, fetchDrillData, updateUrl]);

  useEffect(() => {
    if (view.level === 0) setHeroImageUrl(sections[activeIndex]?.image_url ?? null);
  }, [activeIndex, sections, view.level]);

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
      return (
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.32)', textAlign: 'center', paddingTop: '60px', margin: '0 24px', lineHeight: 1.6 }}>
          We&rsquo;re still curating this city — check back soon, or explore somewhere nearby.
        </p>
      );
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
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'rgba(250,248,245,0.75)',
                      background: 'rgba(0,0,0,0.38)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '20px',
                      padding: '3px 8px',
                      whiteSpace: 'nowrap',
                    }}>{vibe}</span>
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

  // ─── Coming soon screen (inactive region drilled) ───────────────────────────
  function renderComingSoon() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center', gap: '18px', height: '100%', boxSizing: 'border-box' } as React.CSSProperties}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ height: '1px', background: 'rgba(193,127,58,0.5)', animation: 'csSweep 700ms cubic-bezier(0.16,1,0.3,1) both' }} />
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 500, color: '#FAF8F5', margin: 0, lineHeight: 1, letterSpacing: '-0.01em', animation: 'csRise 600ms 100ms cubic-bezier(0.16,1,0.3,1) both' }}>
            {activeRegion?.name}
          </h2>
          {activeRegion?.country_code && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(193,127,58,0.65)', margin: 0, animation: 'csRise 600ms 160ms cubic-bezier(0.16,1,0.3,1) both' }}>
              {activeRegion.country_code}
            </p>
          )}
          <div style={{ height: '1px', background: 'rgba(193,127,58,0.5)', animation: 'csSweep 700ms 60ms cubic-bezier(0.16,1,0.3,1) both' }} />
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', fontWeight: 400, color: 'rgba(250,248,245,0.36)', margin: 0, lineHeight: 1.75, maxWidth: '240px', animation: 'csRise 600ms 300ms cubic-bezier(0.16,1,0.3,1) both' }}>
          We&rsquo;re mapping this city.<br />Something worth finding<br />is on its way.
        </p>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(193,127,58,0.42)', animation: 'csBreath 2.8s 500ms ease-in-out infinite', marginTop: '4px' }} />
      </div>
    );
  }

  // ─── L2: Vertical editorial place list ──────────────────────────────────────
  function renderL2ItemList() {
    const v2 = view as Extract<ExploreView, { level: 2 }>;
    const isEvent = active?.id === 'happening_now';
    const catKey = v2.category?.toLowerCase();
    const accentFg = CAT_COLOR[catKey] ?? FALLBACK_COLOR;
    const catGradient = CAT_GRADIENT[catKey] ?? FALLBACK_GRADIENT;

    if (drillLoading) {
      return (
        <div style={{ padding: '14px 14px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', animation: `hsSkeleton 1.4s ${i * 0.08}s ease-in-out infinite` }}>
              <div style={{ height: '190px', background: 'rgba(250,248,245,0.05)' }} />
              <div style={{ height: '62px', background: 'rgba(250,248,245,0.03)', borderTop: '1px solid rgba(250,248,245,0.04)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '12px', width: '55%', borderRadius: '4px', background: 'rgba(250,248,245,0.07)' }} />
                <div style={{ height: '10px', width: '35%', borderRadius: '4px', background: 'rgba(250,248,245,0.04)' }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (drillItems.length === 0) {
      return (
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.32)', textAlign: 'center', paddingTop: '60px', margin: '0 24px', lineHeight: 1.6 }}>
          Nothing on the books just yet — our concierge is working on it.
        </p>
      );
    }

    function buildPrice(item: DrillPlaceCard | DrillEventCard): string | null {
      if (isEvent) {
        const ev = item as DrillEventCard;
        return fmtEventPrice(ev.price_min, ev.price_max, ev.currency);
      }
      return priceDots((item as DrillPlaceCard).price_level);
    }

    const total = drillItems.length;
    const noun = isEvent ? 'event' : 'place';

    return (
      <div style={{ padding: '14px 14px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Count header */}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.25)', margin: '0 2px 4px' }}>
          {total} {noun}{total !== 1 ? 's' : ''}
        </p>

        {drillItems.map((item, idx) => {
          const pl = item as DrillPlaceCard;
          const ev = item as DrillEventCard;
          const price = buildPrice(item);
          const vibeTag = !isEvent && pl.vibes?.[0] ? pl.vibes[0] : null;
          const metaLine = isEvent ? fmtDate(ev.start_date) : null;
          const hasImage = !!item.image_url;
          const secondaryText = isEvent
            ? fmtDate(ev.start_date)
            : (pl.address ?? pl.vibes?.[1] ?? null);

          return (
            <button
              key={item.id}
              onClick={() => drillToItem(item, active?.id ?? '')}
              style={{
                width: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(250,248,245,0.06)',
                cursor: 'pointer',
                background: 'rgba(250,248,245,0.03)',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                padding: 0,
                animation: `hsItemIn 360ms ${idx * 42}ms cubic-bezier(0.16,1,0.3,1) both`,
                transition: 'background 180ms ease, border-color 180ms ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
                touchAction: 'manipulation',
              } as React.CSSProperties}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(250,248,245,0.06)';
                e.currentTarget.style.borderColor = 'rgba(250,248,245,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(250,248,245,0.03)';
                e.currentTarget.style.borderColor = 'rgba(250,248,245,0.06)';
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: '190px', overflow: 'hidden', background: hasImage ? '#0A0806' : catGradient, flexShrink: 0 }}>
                {hasImage && (
                  <img
                    src={item.image_url!}
                    alt={item.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    loading={idx < 3 ? 'eager' : 'lazy'}
                  />
                )}
                {/* Bottom fade — just enough for legibility, not decorative */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(6,4,2,0.62) 0%, transparent 100%)', pointerEvents: 'none' }} />

                {/* Top-left: accent dot + vibe/date */}
                {(vibeTag ?? metaLine) && (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentFg, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '11px', fontWeight: 500, color: 'rgba(250,248,245,0.78)', background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '20px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      {vibeTag ?? metaLine}
                    </span>
                  </div>
                )}

                {/* Top-right: price — subdued frosted label */}
                {price && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(250,248,245,0.7)', background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '8px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                    {price}
                  </span>
                )}
              </div>

              {/* Info row */}
              <div style={{ padding: '12px 14px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 700, color: '#FAF8F5', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {item.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!isEvent && pl.rating && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: '#0A0806', background: accentFg, borderRadius: '4px', padding: '1px 5px', lineHeight: 1.6, flexShrink: 0 }}>
                        ★ {pl.rating.toFixed(1)}
                      </span>
                    )}
                    {isEvent && ev.is_featured && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentFg, flexShrink: 0 }}>
                        Featured
                      </span>
                    )}
                    {secondaryText && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 400, color: 'rgba(250,248,245,0.36)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {secondaryText}
                      </span>
                    )}
                  </div>
                </div>
                {/* Tap indicator */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.18)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── L2: Desktop single-column image card list (left panel) ─────────────────
  function renderL2CardList() {
    const v2 = view as Extract<ExploreView, { level: 2 }>;
    const isEvent = active?.id === 'happening_now';
    const catKey = v2.category?.toLowerCase();
    const accentFg = CAT_COLOR[catKey] ?? FALLBACK_COLOR;
    const catGradient = CAT_GRADIENT[catKey] ?? FALLBACK_GRADIENT;

    if (drillLoading) {
      return (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', animation: `hsSkeleton 1.4s ${i * 0.07}s ease-in-out infinite` }}>
              <div style={{ height: '140px', background: 'rgba(250,248,245,0.05)' }} />
              <div style={{ height: '56px', background: 'rgba(250,248,245,0.03)', borderTop: '1px solid rgba(250,248,245,0.04)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ height: '11px', width: '65%', borderRadius: '4px', background: 'rgba(250,248,245,0.07)' }} />
                <div style={{ height: '9px', width: '40%', borderRadius: '4px', background: 'rgba(250,248,245,0.04)' }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (drillItems.length === 0) {
      return (
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.32)', textAlign: 'center', paddingTop: '60px', margin: '0 24px', lineHeight: 1.6 }}>
          Nothing on the books just yet — our concierge is working on it.
        </p>
      );
    }

    function buildPrice(item: DrillPlaceCard | DrillEventCard): string | null {
      if (isEvent) {
        const ev = item as DrillEventCard;
        return fmtEventPrice(ev.price_min, ev.price_max, ev.currency);
      }
      return priceDots((item as DrillPlaceCard).price_level);
    }

    const total = drillItems.length;
    const noun = isEvent ? 'event' : 'place';

    return (
      <div style={{ padding: '12px 12px 32px' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.25)', margin: '0 2px 10px' }}>
          {total} {noun}{total !== 1 ? 's' : ''}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {drillItems.map((item, idx) => {
            const pl = item as DrillPlaceCard;
            const ev = item as DrillEventCard;
            const price = buildPrice(item);
            const vibeTag = !isEvent && pl.vibes?.[0] ? pl.vibes[0] : null;
            const metaLine = isEvent ? fmtDate(ev.start_date) : null;
            const hasImage = !!item.image_url;
            const secondaryText = isEvent
              ? fmtDate(ev.start_date)
              : (pl.address ?? pl.vibes?.[1] ?? null);

            return (
              <button
                key={item.id}
                onClick={() => drillToItem(item, active?.id ?? '')}
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid rgba(250,248,245,0.06)',
                  cursor: 'pointer',
                  background: 'rgba(250,248,245,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  padding: 0,
                  animation: `hsItemIn 360ms ${idx * 35}ms cubic-bezier(0.16,1,0.3,1) both`,
                  transition: 'background 180ms ease, border-color 180ms ease, transform 200ms ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
                  touchAction: 'manipulation',
                } as React.CSSProperties}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(250,248,245,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(250,248,245,0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(250,248,245,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(250,248,245,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '140px', overflow: 'hidden', background: hasImage ? '#0A0806' : catGradient, flexShrink: 0 }}>
                  {hasImage && (
                    <img
                      src={item.image_url!}
                      alt={item.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                      loading={idx < 4 ? 'eager' : 'lazy'}
                    />
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(6,4,2,0.65) 0%, transparent 100%)', pointerEvents: 'none' }} />
                  {(vibeTag ?? metaLine) && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: accentFg, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '10px', fontWeight: 500, color: 'rgba(250,248,245,0.78)', background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '20px', padding: '2px 7px', whiteSpace: 'nowrap' }}>
                        {vibeTag ?? metaLine}
                      </span>
                    </div>
                  )}
                  {price && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, color: 'rgba(250,248,245,0.7)', background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '7px', padding: '2px 7px', whiteSpace: 'nowrap' }}>
                      {price}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#FAF8F5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {item.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {!isEvent && pl.rating && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, color: '#0A0806', background: accentFg, borderRadius: '4px', padding: '1px 5px', lineHeight: 1.6, flexShrink: 0 }}>
                        ★ {pl.rating.toFixed(1)}
                      </span>
                    )}
                    {isEvent && ev.is_featured && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentFg, flexShrink: 0 }}>
                        Featured
                      </span>
                    )}
                    {secondaryText && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.36)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {secondaryText}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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

        {view.level === 1 && (
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', touchAction: 'pan-y pan-x' } as React.CSSProperties}>
            {activeRegion?.is_active === false ? renderComingSoon() : renderL1CategoryGrid()}
          </div>
        )}
        {view.level === 2 && (
          <>
            {/* Mobile: full image list */}
            <div className="block md:hidden" style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', touchAction: 'pan-y pan-x' } as React.CSSProperties}>
              {renderL2ItemList()}
            </div>
            {/* Desktop: card list left, slideshow right */}
            <div className="hidden md:flex" style={{ flex: 1, minHeight: 0, overflow: 'hidden' } as React.CSSProperties}>
              <div style={{ width: '46%', flexShrink: 0, overflowY: 'auto', scrollbarWidth: 'none', borderRight: '1px solid rgba(250,248,245,0.06)' } as React.CSSProperties}>
                {renderL2CardList()}
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <L2Slideshow key={`${v2?.region.id}:${v2?.category}`} items={drillItems} accentFg={catAccent ?? FALLBACK_COLOR} />
              </div>
            </div>
          </>
        )}
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
        style={{ position: 'absolute', inset: 0, zIndex: 10, paddingBottom: 80, boxSizing: 'border-box' }}
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
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.38)', margin: 0 }}>Where are you exploring first?</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 16px 32px', touchAction: 'pan-y' } as React.CSSProperties}>
              {regions.filter(r => r.is_active !== false).map(region => {
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
        @keyframes csSweep { from { width:0; opacity:0; } to { width:44px; opacity:1; } }
        @keyframes csRise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes csBreath { 0%,100% { transform:scale(0.75); opacity:0.22; } 50% { transform:scale(1.25); opacity:0.58; } }
        div::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}
