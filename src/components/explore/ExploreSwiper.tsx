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
    dining: 'Dining',
    nightlife: 'Nightlife',
    shopping: 'Shopping',
    nature: 'Nature',
    historical: 'Historical',
    wellness: 'Wellness',
    family: 'Family',
    events: 'Events',
    localspots: 'Local Spots',
    topplaces: 'Top Places',
    local_spots: 'Local Spots',
    fun_places: 'Fun Places',
    top_places: 'Top Places',
    general: 'General',
    music: 'Music',
    arts: 'Arts',
    sports: 'Sports',
    food: 'Food & Drink',
    culture: 'Culture',
    outdoor: 'Outdoors',
  };
  return map[raw.toLowerCase()] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

const CAT_PALETTE: Record<string, [string, string, string]> = {
  dining:     ['#1C1108', '#E8C98A', 'rgba(232,201,138,0.12)'],
  nightlife:  ['#110B1F', '#B8A0E0', 'rgba(184,160,224,0.12)'],
  shopping:   ['#0E1A14', '#8ECFB0', 'rgba(142,207,176,0.12)'],
  nature:     ['#0B1A0D', '#92C97A', 'rgba(146,201,122,0.12)'],
  historical: ['#1A1208', '#D4A96A', 'rgba(212,169,106,0.12)'],
  wellness:   ['#0F1820', '#7EC8D8', 'rgba(126,200,216,0.12)'],
  family:     ['#1A100E', '#E8A080', 'rgba(232,160,128,0.12)'],
  events:     ['#1A0D10', '#E07898', 'rgba(224,120,152,0.12)'],
  music:      ['#120E1A', '#C0A8E8', 'rgba(192,168,232,0.12)'],
  arts:       ['#1A0E08', '#E8B870', 'rgba(232,184,112,0.12)'],
  sports:     ['#0A1418', '#70C0D8', 'rgba(112,192,216,0.12)'],
  food:       ['#1A1008', '#E8A850', 'rgba(232,168,80,0.12)'],
  culture:    ['#140A18', '#C890D8', 'rgba(200,144,216,0.12)'],
  outdoor:    ['#0A180C', '#78D090', 'rgba(120,208,144,0.12)'],
  local_spots:['#181408', '#D8C070', 'rgba(216,192,112,0.12)'],
  localspots: ['#181408', '#D8C070', 'rgba(216,192,112,0.12)'],
  top_places: ['#0E1018', '#90A8D8', 'rgba(144,168,216,0.12)'],
  topplaces:  ['#0E1018', '#90A8D8', 'rgba(144,168,216,0.12)'],
  fun_places: ['#1A0E14', '#E890B8', 'rgba(232,144,184,0.12)'],
  general:    ['#141414', '#C0C0C0', 'rgba(192,192,192,0.12)'],
};

const FALLBACK_PALETTE: [string, string, string] = ['#111010', '#C8C0B8', 'rgba(200,192,184,0.12)'];

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX'] as const;

function deriveCategories(items: (DrillPlaceCard | DrillEventCard)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      out.push(item.category);
    }
  }
  return out;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default function ExploreSwiper({
  sections,
  regions,
  selectedRegionId,
  firstName,
  onPersonalise,
  isPersonalising,
  isRefreshing,
  onRegionChange,
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

  const pointerStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const panelT1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelT2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDrilledCityRef = useRef<string | null>(null);

  const fetchDrillData = useCallback(async (
    sectionId: string,
    region: RegionOption,
    category: string | null,
  ) => {
    const cacheKey: DrillCacheKey = `${sectionId}:${region.id}:${category ?? 'all'}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setDrillItems(cached.items);
      setDrillCategories(cached.categories);
      return;
    }
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
      setDrillItems(items);
      setDrillCategories(categories);
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
      fn();
      setPanelPhase('entering');
      panelT2Ref.current = setTimeout(() => setPanelPhase('idle'), 500);
    }, 160);
  }, []);

  useEffect(() => {
    return () => {
      if (panelT1Ref.current) clearTimeout(panelT1Ref.current);
      if (panelT2Ref.current) clearTimeout(panelT2Ref.current);
    };
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const safeIndex = Math.max(0, Math.min(sections.length - 1, index));
      const targetSection = sections[safeIndex];
      setDrillItems([]);
      setDrillCategories([]);
      setActiveIndex(safeIndex);
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
      setView({ level: 0 });
      setActiveRegion(null);
    },
    [sections, selectedRegionId, regions, transitionPanel, fetchDrillData],
  );

  useEffect(() => {
    if (!selectedRegionId || !sections.length) return;
    if (lastDrilledCityRef.current === selectedRegionId) return;
    const active = sections[activeIndex];
    if (!active || !AUTO_DRILL_SECTIONS.has(active.id)) return;
    const region = regions.find(r => r.id === selectedRegionId);
    if (!region) return;
    lastDrilledCityRef.current = selectedRegionId;
    cacheRef.current.clear();
    setDrillItems([]);
    setDrillCategories([]);
    setActiveRegion(region);
    setView({ level: 1, sectionId: active.id });
    void fetchDrillData(active.id, region, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegionId, sections]);

  const drillToRegion = useCallback((region: RegionOption) => {
    const active = sections[activeIndex];
    setActiveRegion(region);
    setNextHeroImageUrl(region.image_url ?? null);
    setTimeout(() => {
      setHeroImageUrl(region.image_url ?? null);
      setNextHeroImageUrl(null);
    }, 680);
    transitionPanel(() => {
      setView({ level: 1, sectionId: active.id });
      fetchDrillData(active.id, region, null);
    });
  }, [sections, activeIndex, transitionPanel, fetchDrillData]);

  const drillToCategory = useCallback((region: RegionOption, category: string) => {
    const active = sections[activeIndex];
    transitionPanel(() => {
      setView({ level: 2, sectionId: active.id, region, category });
      fetchDrillData(active.id, region, category);
    });
  }, [sections, activeIndex, transitionPanel, fetchDrillData]);

  const drillToItem = useCallback((item: DrillPlaceCard | DrillEventCard, sectionId: string) => {
    const contentType = sectionId === 'happening_now' ? 'events' : 'places';
    setSelectedItem({ item, contentType });
  }, []);

  const navigateBack = useCallback(() => {
    if (view.level === 0) return;
    if (view.level === 1) {
      setNextHeroImageUrl(sections[activeIndex]?.image_url ?? null);
      setTimeout(() => {
        setHeroImageUrl(sections[activeIndex]?.image_url ?? null);
        setNextHeroImageUrl(null);
      }, 680);
      transitionPanel(() => {
        setView({ level: 0 });
        setDrillItems([]);
        setDrillCategories([]);
        setActiveRegion(null);
      });
    } else if (view.level === 2) {
      const v = view as Extract<ExploreView, { level: 2 }>;
      transitionPanel(() => {
        setView({ level: 1, sectionId: v.sectionId });
        const allKey: DrillCacheKey = `${v.sectionId}:${v.region.id}:all`;
        const cached = cacheRef.current.get(allKey);
        if (cached) {
          setDrillItems(cached.items);
          setDrillCategories(cached.categories);
        } else {
          setDrillItems([]);
          setDrillCategories([]);
          fetchDrillData(v.sectionId, v.region, null);
        }
      });
    }
  }, [view, sections, activeIndex, transitionPanel, fetchDrillData]);

  useEffect(() => {
    if (view.level === 0) {
      setHeroImageUrl(sections[activeIndex]?.image_url ?? null);
    }
  }, [activeIndex, sections, view.level]);

  function handlePointerDown(e: React.PointerEvent) {
    if (view.level > 0 || showRegionSheet) return;
    pointerStartX.current = e.clientX;
    isDragging.current = false;
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (pointerStartX.current !== null && Math.abs(e.clientX - pointerStartX.current) > 6) {
      isDragging.current = true;
    }
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (pointerStartX.current === null) return;
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
    panelPhase === 'exiting'
      ? { opacity: 0, transition: 'opacity 160ms ease-in' }
      : panelPhase === 'entering'
      ? { opacity: 1, animation: 'hsPanelIn 440ms 60ms cubic-bezier(0.25,0,0,1) both' }
      : {};

  // ─── L1: 3x3 editorial square category grid ───────────────────────────────
  function renderL1CategoryGrid() {
    if (drillLoading) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', padding: '3px' }}>
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <div key={i} style={{ aspectRatio: '1 / 1', borderRadius: '4px', background: 'rgba(250,248,245,0.05)', animation: `hsSkeleton 1.4s ${i * 0.08}s ease-in-out infinite` }} />
          ))}
        </div>
      );
    }
    if (drillCategories.length === 0) {
      return (
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '17px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', paddingTop: '44px', margin: 0 }}>
          Nothing to explore here yet.
        </p>
      );
    }
    const countMap: Record<string, number> = {};
    for (const item of drillItems) {
      countMap[item.category] = (countMap[item.category] ?? 0) + 1;
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', padding: '3px' }}>
        {drillCategories.map((cat, idx) => {
          const [bg, fg, numeralColor] = CAT_PALETTE[cat.toLowerCase()] ?? FALLBACK_PALETTE;
          const label = categoryLabel(cat);
          const numeral = ROMAN[idx] ?? String(idx + 1);
          const count = countMap[cat];
          return (
            <button
              key={cat}
              onClick={() => { if (activeRegion) drillToCategory(activeRegion, cat); }}
              style={{ aspectRatio: '1 / 1', background: bg, border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '14px 13px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', transition: 'filter 200ms ease' } as React.CSSProperties}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; }}
            >
              <span aria-hidden="true" style={{ position: 'absolute', top: '-4px', right: '6px', fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(52px, 8vw, 72px)', fontWeight: 700, lineHeight: 1, color: numeralColor, pointerEvents: 'none', userSelect: 'none', letterSpacing: '-0.04em' }}>
                {numeral}
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '11px', color: fg, opacity: 0.55, lineHeight: 1, letterSpacing: '0.06em', zIndex: 1 }}>
                {numeral}
              </span>
              <div style={{ zIndex: 1, width: '100%' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(16px, 2.8vw, 22px)', fontWeight: 600, color: fg, margin: 0, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
                  {label}
                </p>
                {count != null && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: fg, opacity: 0.4, margin: '4px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {count} {count === 1 ? 'place' : 'places'}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── L2: Featured hero + editorial strip list ─────────────────────────────
  function renderL2ItemList() {
    const v2 = view as Extract<ExploreView, { level: 2 }>;
    const isEvent = active?.id === 'happening_now';
    const [,accentFg] = CAT_PALETTE[v2.category?.toLowerCase()] ?? FALLBACK_PALETTE;

    if (drillLoading) {
      return (
        <div style={{ padding: '0 0 28px' }}>
          {/* Featured skeleton */}
          <div style={{ height: '200px', background: 'rgba(250,248,245,0.05)', animation: 'hsSkeleton 1.4s ease-in-out infinite', marginBottom: '1px' }} />
          {/* Strip skeletons */}
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: '72px', background: 'rgba(250,248,245,0.04)', borderBottom: '1px solid rgba(250,248,245,0.06)', animation: `hsSkeleton 1.4s ${0.1 + i * 0.08}s ease-in-out infinite` }} />
          ))}
        </div>
      );
    }

    if (drillItems.length === 0) {
      return (
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '17px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', paddingTop: '44px', margin: 0 }}>
          Nothing on just yet.
        </p>
      );
    }

    const [featured, ...rest] = drillItems;

    function buildMeta(item: DrillPlaceCard | DrillEventCard): string | null {
      if (isEvent) {
        const ev = item as DrillEventCard;
        return [fmtDate(ev.start_date), ev.venue_name].filter(Boolean).join(' · ');
      }
      const pl = item as DrillPlaceCard;
      return pl.rating ? `★ ${pl.rating.toFixed(1)}` : null;
    }

    return (
      <div style={{ paddingBottom: '32px' }}>

        {/* ── Featured card ─────────────────────────────────────────────── */}
        <button
          onClick={() => drillToItem(featured, active?.id ?? '')}
          style={{
            display: 'block', width: '100%', border: 'none', padding: 0,
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
            height: '200px', background: 'rgba(250,248,245,0.06)',
            marginBottom: '1px',
            animation: 'hsItemIn 420ms 0ms cubic-bezier(0.25,0,0,1) both',
          } as React.CSSProperties}
          onMouseEnter={e => { const img = e.currentTarget.querySelector('.l2-feat-img') as HTMLElement | null; if (img) img.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { const img = e.currentTarget.querySelector('.l2-feat-img') as HTMLElement | null; if (img) img.style.transform = 'scale(1)'; }}
        >
          {/* Image */}
          {featured.image_url ? (
            <img
              src={featured.image_url}
              alt={featured.name}
              className="l2-feat-img"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms cubic-bezier(0.25,0,0,1)' }}
              loading="eager"
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,248,245,0.04)' }} />
          )}

          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.38) 55%, transparent 100%)' }} />

          {/* Featured label — top left */}
          <div style={{ position: 'absolute', top: '14px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: accentFg,
              background: 'rgba(10,8,6,0.55)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px',
              borderRadius: '2px',
            }}>Featured</span>
          </div>

          {/* Text — bottom left */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px 18px' }}>
            {buildMeta(featured) && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: accentFg, opacity: 0.85, margin: '0 0 5px', letterSpacing: '0.04em' }}>
                {buildMeta(featured)}
              </p>
            )}
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '26px', fontWeight: 600, color: '#FAF8F5', margin: 0, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {featured.name}
            </h3>
          </div>
        </button>

        {/* ── Item count rule ────────────────────────────────────────────── */}
        {rest.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px 10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(250,248,245,0.07)' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.28)', whiteSpace: 'nowrap' }}>
              {rest.length} more
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(250,248,245,0.07)' }} />
          </div>
        )}

        {/* ── Compact strip list ─────────────────────────────────────────── */}
        <div>
          {rest.map((item, idx) => {
            const meta = buildMeta(item);
            const hasImage = !!item.image_url;
            const delay = `${(idx + 1) * 30}ms`;

            return (
              <button
                key={item.id}
                onClick={() => drillToItem(item, active?.id ?? '')}
                style={{
                  display: 'flex', alignItems: 'center',
                  width: '100%', boxSizing: 'border-box',
                  padding: '0', border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(250,248,245,0.06)',
                  transition: 'background 160ms ease',
                  animation: `hsItemIn 380ms ${delay} cubic-bezier(0.25,0,0,1) both`,
                } as React.CSSProperties}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,127,58,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Square thumbnail */}
                <div style={{ width: '72px', height: '72px', flexShrink: 0, overflow: 'hidden', background: 'rgba(250,248,245,0.06)', borderRadius: '0' }}>
                  {hasImage
                    ? <img src={item.image_url!} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    : (
                      // No-image: amber left-bar text tile
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `2px solid ${accentFg}`, background: 'rgba(250,248,245,0.03)' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '11px', color: 'rgba(250,248,245,0.2)', textAlign: 'center', padding: '0 6px', lineHeight: 1.2 }}>
                          {item.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                    )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0, padding: '0 14px 0 16px', textAlign: 'left' }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px', fontWeight: 500,
                    color: 'rgba(250,248,245,0.88)',
                    margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'color 160ms ease',
                  }}>{item.name}</p>
                  {meta && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.38)', margin: '3px 0 0', letterSpacing: '0.02em' }}>
                      {meta}
                    </p>
                  )}
                </div>

                {/* Index numeral — right edge */}
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '13px', color: 'rgba(250,248,245,0.14)', paddingRight: '18px', flexShrink: 0, letterSpacing: '0.04em' }}>
                  {String(idx + 2).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Left drill canvas shell ───────────────────────────────────────────────
  function renderLeftDrillCanvas() {
    const v2 = view.level === 2 ? (view as Extract<ExploreView, { level: 2 }>) : null;
    const regionName = activeRegion?.name ?? '';
    const catLabel = v2 ? categoryLabel(v2.category) : '';

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,11,8,0.90)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...panelStyle }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', flexShrink: 0, borderBottom: '1px solid rgba(250,248,245,0.07)' }}>
          <button
            onClick={navigateBack}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px', color: 'rgba(250,248,245,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(250,248,245,0.75)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250,248,245,0.4)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {v2 ? `${sectionShortLabel(active?.id ?? '')} / ${regionName}` : sectionShortLabel(active?.id ?? '')}
            </span>
          </button>

          {view.level === 1 && (
            <>
              {activeRegion?.country_code && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(193,127,58,0.85)', margin: '0 0 5px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {activeRegion.country_code}
                </p>
              )}
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '34px', fontWeight: 500, color: '#FAF8F5', margin: 0, lineHeight: 1.05 }}>
                {regionName}
              </h2>
            </>
          )}

          {view.level === 2 && v2 && (
            <>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(193,127,58,0.85)', margin: '0 0 5px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {regionName}
              </p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '30px', fontWeight: 500, color: '#FAF8F5', margin: 0, lineHeight: 1.1 }}>
                {catLabel}
              </h2>
            </>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {view.level === 1 && renderL1CategoryGrid()}
          {view.level === 2 && renderL2ItemList()}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0E0D0B' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Hero background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {displayHeroUrl && (
          <img src={displayHeroUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38, transition: 'opacity 680ms ease' }} />
        )}
        {nextHeroImageUrl && (
          <img src={nextHeroImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 680ms ease' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,13,11,0.55) 0%, rgba(14,13,11,0.82) 100%)' }} />
      </div>

      {/* Mobile */}
      <div className="block md:hidden" style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        {view.level === 0 ? (
          <>
            <ExploreCard key={active.id} section={active} sections={sections} activeIndex={activeIndex} onSectionChange={goTo} />
            <p style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 20, fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.45)', margin: 0, pointerEvents: 'none' }}>
              Explore {greeting}
            </p>
            <button
              onClick={() => setShowRegionSheet(true)}
              style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(14,11,8,0.52)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(250,248,245,0.14)', borderRadius: '20px', padding: '7px 11px 7px 9px', cursor: 'pointer' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(193,127,58,0.85)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.75)' }}>
                {regions.find(r => r.id === selectedRegionId)?.name ?? 'Select city'}
              </span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.4)" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </>
        ) : (
          renderLeftDrillCanvas()
        )}
        {isRefreshing && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'rgba(8,5,2,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C17F3A', boxShadow: '0 0 16px rgba(193,127,58,0.7)', animation: 'ecPulse 1.1s ease-in-out infinite' }} />
          </div>
        )}
      </div>

      {/* Mobile region sheet */}
      {showRegionSheet && (
        <div className="block md:hidden" style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
          <div onClick={() => setShowRegionSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(18,14,10,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: '1px solid rgba(250,248,245,0.1)', borderRadius: '20px 20px 0 0', maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '32px', height: '4px', background: 'rgba(250,248,245,0.18)', borderRadius: '2px' }} />
            </div>
            <div style={{ padding: '8px 24px 14px', borderBottom: '1px solid rgba(250,248,245,0.07)', flexShrink: 0 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.38)', margin: 0 }}>Select your city</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 16px 32px' }}>
              {regions.map(region => {
                const isSelected = region.id === selectedRegionId;
                return (
                  <button
                    key={region.id}
                    onClick={() => { onRegionChange?.(region.id); setShowRegionSheet(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 10px', marginBottom: '5px', width: '100%', background: isSelected ? 'rgba(193,127,58,0.14)' : 'rgba(250,248,245,0.05)', border: `1px solid ${isSelected ? 'rgba(193,127,58,0.5)' : 'rgba(250,248,245,0.08)'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' } as React.CSSProperties}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(250,248,245,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {region.image_url
                        ? <img src={region.image_url} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        : <span style={{ color: 'rgba(250,248,245,0.35)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>{region.country_code ?? '—'}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#FAF8F5' : 'rgba(250,248,245,0.8)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region.name}</p>
                      {region.country_code && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: isSelected ? 'rgba(193,127,58,0.7)' : 'rgba(250,248,245,0.32)', margin: '2px 0 0' }}>{region.country_code}</p>
                      )}
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

      {/* Desktop */}
      <div className="hidden md:flex" style={{ position: 'absolute', inset: 0, zIndex: 10, padding: '12px', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>
          {view.level === 0 ? (
            <>
              <ExploreCard key={active.id} section={active} sections={sections} activeIndex={activeIndex} onSectionChange={goTo} />
              <p style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 20, fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.45)', margin: 0, pointerEvents: 'none' }}>
                Explore {greeting}
              </p>
            </>
          ) : (
            renderLeftDrillCanvas()
          )}
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
        @keyframes hsPanelIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hsSkeleton { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.14; } }
        @keyframes ecPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.5; } }
        @keyframes hsItemIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
