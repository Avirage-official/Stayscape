'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import ExploreCard, { type ExploreSection, type ExploreItem } from './ExploreCard';
import ExploreDetailSheet from './ExploreDetailSheet';
import ExploreWebPanel from './ExploreWebPanel';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
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
}

// selectedItem can be a full ExploreItem (L0 sections) or a slim drill card (L1-L3)
type SelectedItem = {
  item: ExploreItem | DrillPlaceCard | DrillEventCard;
  contentType: ExploreSection['content_type'];
};

const NUMERALS = ['I', 'II', 'III', 'IV'] as const;

function sectionShortLabel(id: string) {
  if (id === 'made_for_you') return 'Yours';
  if (id === 'in_your_world') return 'Nearby';
  if (id === 'happening_now') return 'Tonight';
  if (id === 'arias_picks') return 'Aria';
  return id;
}

function listLabel(ct: ExploreSection['content_type']) {
  if (ct === 'events') return 'Upcoming experiences';
  if (ct === 'regions') return 'Where to next';
  if (ct === 'properties') return 'Curated properties';
  return 'Worth your time';
}

function mobileItemMeta(item: ExploreItem, ct: ExploreSection['content_type']): string {
  if (ct === 'events') {
    const e = item as DiscoveryEventCard;
    const date = e.start_date
      ? new Date(e.start_date).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })
      : null;
    return [date, e.venue_name].filter(Boolean).join(' · ');
  }
  if (ct === 'regions') return (item as RegionOption).country_code ?? '';
  if (ct === 'properties') {
    const p = item as ExplorePropertyCard;
    const stars = p.star_rating ? '★'.repeat(p.star_rating) : null;
    const price = p.price_from != null ? `S$${p.price_from}` : null;
    return [stars, price].filter(Boolean).join(' · ');
  }
  const p = item as DiscoveryPlaceCard;
  const rating = p.rating ? `★ ${p.rating.toFixed(1)}` : null;
  const vibe = p.vibes?.[0] ?? null;
  return [rating, vibe].filter(Boolean).join(' · ');
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
}: ExploreSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const [view, setView] = useState<ExploreView>({ level: 0 });
  const [drillItems, setDrillItems] = useState<(DrillPlaceCard | DrillEventCard)[]>([]);
  const [drillCategories, setDrillCategories] = useState<string[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const cacheRef = useRef<Map<DrillCacheKey, DrillData>>(new Map());

  const [panelPhase, setPanelPhase] = useState<AnimPhase>('idle');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [nextHeroImageUrl, setNextHeroImageUrl] = useState<string | null>(null);

  // SelectedItem accepts both full ExploreItem (L0) and slim drill cards (L1-L3)
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionOption | null>(null);

  const pointerStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const panelT1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelT2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setView({ level: 0 });
      setDrillItems([]);
      setDrillCategories([]);
      setActiveIndex(Math.max(0, Math.min(sections.length - 1, index)));
    },
    [sections.length],
  );

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

  // No cast needed — SelectedItem accepts DrillPlaceCard | DrillEventCard directly
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
    if (view.level > 0) return;
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
  const isDrilled = view.level > 0;
  const displayHeroUrl = heroImageUrl ?? active?.image_url ?? null;

  const panelStyle: React.CSSProperties =
    panelPhase === 'exiting'
      ? { opacity: 0, transition: 'opacity 160ms ease-in' }
      : panelPhase === 'entering'
      ? { opacity: 1, animation: 'hsPanelIn 440ms 60ms cubic-bezier(0.25,0,0,1) both' }
      : {};

  /** Resolve the active region safely — never silently fall back to regions[0]. */
  function resolveRegion(): RegionOption | null {
    if (activeRegion) return activeRegion;
    if (selectedRegionId) return regions.find(r => r.id === selectedRegionId) ?? null;
    return null;
  }

  function renderNoRegionSelected() {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px 16px', textAlign: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.3)" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '16px', color: 'rgba(250,248,245,0.55)', lineHeight: 1.4 }}>
          Please select a region first
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.28)', lineHeight: 1.6 }}>
          Choose a destination above to explore what&apos;s nearby.
        </span>
      </div>
    );
  }

  function renderSkeleton() {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '48px', borderRadius: '12px', background: 'rgba(250,248,245,0.07)', animation: 'hsSkeleton 1.4s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  function renderMobileDrillContent() {
    if (active?.id === 'made_for_you') {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 16px', textAlign: 'center' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '18px', color: 'rgba(250,248,245,0.7)', lineHeight: 1.4 }}>
            Made for you
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.35)', lineHeight: 1.6 }}>
            Personalised recommendations are coming soon. Aria will curate places based on your stays and preferences.
          </span>
        </div>
      );
    }

    if (view.level === 1) {
      if (drillLoading) return renderSkeleton();
      if (drillCategories.length === 0) {
        return <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.25)', textAlign: 'center', padding: '24px 0', margin: 0 }}>Nothing to show here yet.</p>;
      }
      return (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {drillCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                const region = resolveRegion();
                if (!region) return;
                drillToCategory(region, cat);
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', marginBottom: '5px', background: 'rgba(250,248,245,0.06)', border: '1px solid rgba(250,248,245,0.08)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box', transition: 'background 160ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.06)'; }}
            >
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#FAF8F5' }}>{categoryLabel(cat)}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.25)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          ))}
        </div>
      );
    }

    if (view.level === 2) {
      if (drillLoading) return renderSkeleton();
      if (drillItems.length === 0) {
        return <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.25)', textAlign: 'center', padding: '24px 0', margin: 0 }}>Nothing on just yet.</p>;
      }
      return (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {drillItems.map((item) => {
            const isEvent = active?.id === 'happening_now';
            const ev = item as DrillEventCard;
            const pl = item as DrillPlaceCard;
            const meta = isEvent
              ? [fmtDate(ev.start_date), ev.venue_name].filter(Boolean).join(' · ')
              : pl.rating ? `★ ${pl.rating.toFixed(1)}` : null;
            return (
              <button
                key={item.id}
                onClick={() => drillToItem(item, active?.id ?? '')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 10px', marginBottom: '5px', background: 'rgba(250,248,245,0.06)', border: '1px solid rgba(250,248,245,0.08)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box', transition: 'background 160ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.06)'; }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(250,248,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    : <span style={{ color: 'rgba(250,248,245,0.4)', fontSize: '11px' }}>·</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#FAF8F5', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                  {meta && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.45)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</p>}
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.25)" strokeWidth={2} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            );
          })}
        </div>
      );
    }

    // Level 0 — no region selected guard
    if (!resolveRegion() && active?.content_type === 'regions') {
      // regions section: selecting a card IS how you pick a region, so show normally
    } else if (!resolveRegion() && active?.content_type !== 'regions' && (active?.items ?? []).length === 0) {
      return renderNoRegionSelected();
    }

    return (
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {active?.items.length === 0 && (
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.25)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
            {active.content_type === 'events' ? 'Nothing on just yet.' : 'More coming soon.'}
          </p>
        )}
        {active?.items.map((item) => {
          const name = 'name' in item ? item.name : '';
          const imageUrl = 'image_url' in item ? (item as { image_url: string | null }).image_url : null;
          const meta = mobileItemMeta(item, active.content_type);
          const isRegion = active.content_type === 'regions';
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isRegion) { drillToRegion(item as RegionOption); }
                else { setSelectedItem({ item, contentType: active.content_type }); }
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 10px', marginBottom: '5px', background: 'rgba(250,248,245,0.06)', border: '1px solid rgba(250,248,245,0.08)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box', transition: 'background 160ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.06)'; }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(250,248,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {imageUrl
                  ? <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  : <span style={{ color: 'rgba(250,248,245,0.4)', fontSize: '11px' }}>·</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#FAF8F5', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                {meta && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.45)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</p>}
              </div>
              {isRegion
                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.25)" strokeWidth={2} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                : null}
            </button>
          );
        })}
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
          <img
            src={displayHeroUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38, transition: 'opacity 680ms ease' }}
          />
        )}
        {nextHeroImageUrl && (
          <img
            src={nextHeroImageUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 680ms ease' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,13,11,0.55) 0%, rgba(14,13,11,0.82) 100%)' }} />
      </div>

      {/* Desktop web panel */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', bottom: '20px', zIndex: 10, ...panelStyle }}>
        <ExploreWebPanel
          sections={sections}
          regions={regions}
          activeIndex={activeIndex}
          activeRegion={activeRegion}
          onSectionChange={(i) => goTo(i)}
          onDrillRegion={drillToRegion}
          onPersonalise={onPersonalise}
          isPersonalising={isPersonalising}
        />
      </div>

      {/* Mobile content panel */}
      <div
        className="md:hidden"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'rgba(14,13,11,0.88)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(250,248,245,0.08)',
          borderRadius: '20px 20px 0 0',
          padding: '16px 14px 28px',
          maxHeight: '55vh',
          display: 'flex', flexDirection: 'column',
          ...panelStyle,
        }}
      >
        {/* Back + section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexShrink: 0 }}>
          {isDrilled && (
            <button
              onClick={navigateBack}
              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'rgba(250,248,245,0.55)', display: 'flex', alignItems: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.38)', margin: 0, flex: 1 }}>
            {view.level === 0
              ? listLabel(active?.content_type)
              : view.level === 1
              ? (activeRegion?.name ?? active?.label ?? '')
              : (view as Extract<ExploreView, { level: 2 }>).category
                ? categoryLabel((view as Extract<ExploreView, { level: 2 }>).category)
                : ''}
          </p>
          {/* Section numeral tabs */}
          {!isDrilled && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: i === activeIndex ? '#C17F3A' : 'rgba(250,248,245,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 180ms ease' }}
                >
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '13px', fontWeight: 600, color: i === activeIndex ? '#FAF8F5' : 'rgba(250,248,245,0.35)', lineHeight: 1 }}>
                    {NUMERALS[i]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drill content */}
        {renderMobileDrillContent()}
      </div>

      {/* Detail sheet */}
      {selectedItem && (
        <ExploreDetailSheet
          item={selectedItem.item}
          contentType={selectedItem.contentType}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
