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
  onRegionChange: (regionId: string) => void;
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

function fmtPrice(min: number | null, max: number | null, currency: string | null): string | null {
  if (min == null && max == null) return null;
  const sym = currency === 'SGD' ? 'S$' : currency === 'USD' ? '$' : (currency ?? '');
  if (min != null && max != null && min !== max) return `${sym}${min}–${sym}${max}`;
  return `From ${sym}${min ?? max}`;
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
  onRegionChange,
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

  const pointerStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

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
    setPanelPhase('exiting');
    const t = setTimeout(() => {
      fn();
      setPanelPhase('entering');
      const t2 = setTimeout(() => setPanelPhase('idle'), 500);
      return () => clearTimeout(t2);
    }, 160);
    return () => clearTimeout(t);
  }, []);

  const drillToRegion = useCallback((region: RegionOption) => {
    const active = sections[activeIndex];
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
        }
      });
    }
  }, [view, sections, activeIndex, transitionPanel]);

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

  function renderMobileDrillContent() {
    if (active?.id === 'made_for_you') {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 16px' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '18px', color: 'rgba(250,248,245,0.7)', textAlign: 'center', lineHeight: 1.4 }}>
            Your curation is on its way.
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.35)', textAlign: 'center', lineHeight: 1.6 }}>
            Aria will start tailoring places once your travel profile is complete.
          </span>
          <button style={{ marginTop: '8px', background: 'none', border: '1px solid rgba(193,127,58,0.4)', borderRadius: '8px', padding: '8px 18px', color: '#C17F3A', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', cursor: 'pointer', letterSpacing: '0.05em' }}>
            Complete your profile →
          </button>
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
                const region = regions.find(r => r.id === selectedRegionId) ?? regions[0];
                if (region) drillToCategory(region, cat);
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
                  : <span style={{ color: 'rgba(250,248,245,0.4)', fontSize: '11px' }}>{isRegion ? ((item as RegionOption).country_code ?? '—') : '·'}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#FAF8F5', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                {meta && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.45)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</p>}
              </div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.25)" strokeWidth={2} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          );
        })}
      </div>
    );
  }

  function renderSkeleton() {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: '52px', borderRadius: '12px', background: 'rgba(250,248,245,0.06)', animation: `hsSkeletonPulse 1.4s ${i * 0.15}s ease-in-out infinite` }} />
        ))}
      </div>
    );
  }

  function mobilePanelHeader() {
    if (view.level === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0, marginBottom: '10px' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.4)', margin: 0 }}>
            {active ? listLabel(active.content_type) : ''}
          </p>
          {(active?.items.length ?? 0) > 0 && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(250,248,245,0.25)', letterSpacing: '0.04em' }}>
              {active.items.length} curated
            </span>
          )}
        </div>
      );
    }
    const v1 = view as Extract<ExploreView, { level: 1 }>;
    const breadcrumb = view.level === 2
      ? categoryLabel((view as Extract<ExploreView, { level: 2 }>).category ?? '')
      : null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginBottom: '10px' }}>
        <button
          onClick={navigateBack}
          style={{ background: 'none', border: 'none', padding: '2px 6px 2px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(250,248,245,0.45)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Back</span>
        </button>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(250,248,245,0.25)' }}>/</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, color: 'rgba(250,248,245,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {breadcrumb ?? sectionShortLabel(v1.sectionId)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{ height: 'calc(100dvh - 68px)', position: 'relative', padding: '12px', gap: '12px', boxSizing: 'border-box', overflow: 'hidden', background: '#0E0B08' }}
    >
      {displayHeroUrl && (
        <img key={displayHeroUrl} src={displayHeroUrl} alt="" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, animation: 'hsDissolve 680ms cubic-bezier(0.25,0,0,1) both' }}
        />
      )}
      {nextHeroImageUrl && (
        <img key={`next-${nextHeroImageUrl}`} src={nextHeroImageUrl} alt="" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, animation: 'hsDissolve 680ms cubic-bezier(0.25,0,0,1) both' }}
        />
      )}

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(8,5,2,0.72) 0%, rgba(14,11,8,0.55) 60%, rgba(8,5,2,0.78) 100%)' }} />

      <div className="flex flex-col md:flex-row" style={{ position: 'relative', zIndex: 3, flex: 1, minHeight: 0, gap: '12px', display: 'flex' }}>
        <div
          className="flex-shrink-0 md:flex-1 h-[44dvh] md:h-full"
          style={{ position: 'relative', userSelect: 'none', borderRadius: '20px', overflow: 'hidden', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <ExploreCard
            key={active.id}
            section={active}
            sections={view.level === 0 ? sections : undefined}
            activeIndex={view.level === 0 ? activeIndex : undefined}
            onSectionChange={view.level === 0 ? goTo : undefined}
            drillView={view}
            onBack={isDrilled ? navigateBack : undefined}
          />

          {isRefreshing && (
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'rgba(8,5,2,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', animation: 'hsDissolve 200ms ease both' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C17F3A', boxShadow: '0 0 16px rgba(193,127,58,0.7)', animation: 'ecPulse 1.1s ease-in-out infinite' }} />
            </div>
          )}

          {!isDrilled && (
            <p style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 20, fontFamily: "'DM Sans', sans-serif", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.45)', margin: 0, pointerEvents: 'none' }}>
              Explore {greeting}
            </p>
          )}
        </div>

        <div className="flex flex-col md:hidden" style={{ flex: 1, minHeight: 0, gap: '10px', overflow: 'hidden' }}>
          {view.level === 0 && (
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {sections.map((s, i) => {
                const isActive = i === activeIndex;
                return (
                  <button key={s.id} onClick={() => goTo(i)}
                    style={{ flex: 1, background: isActive ? '#C17F3A' : 'rgba(250,248,245,0.1)', border: `1px solid ${isActive ? '#C17F3A' : 'rgba(250,248,245,0.15)'}`, borderRadius: '12px', padding: '9px 4px', cursor: 'pointer', transition: 'all 200ms ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', fontWeight: 600, color: isActive ? '#FAF8F5' : 'rgba(250,248,245,0.5)', lineHeight: 1 }}>{NUMERALS[i]}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', letterSpacing: '0.07em', textTransform: 'uppercase', color: isActive ? 'rgba(250,248,245,0.9)' : 'rgba(250,248,245,0.35)' }}>{sectionShortLabel(s.id)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0, background: 'rgba(250,248,245,0.07)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(250,248,245,0.12)', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...panelStyle }}>
            {mobilePanelHeader()}
            {renderMobileDrillContent()}
            {view.level === 0 && (
              <button
                onClick={onPersonalise}
                disabled={isPersonalising}
                style={{ flexShrink: 0, marginTop: '10px', width: '100%', height: '40px', borderRadius: '11px', background: '#C17F3A', color: '#FAF8F5', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', border: 'none', cursor: isPersonalising ? 'not-allowed' : 'pointer', opacity: isPersonalising ? 0.55 : 1, transition: 'opacity 180ms ease', boxShadow: '0 4px 12px rgba(193,127,58,0.25)' }}
              >
                {isPersonalising ? 'Refreshing…' : 'Curate for me'}
              </button>
            )}
          </div>
        </div>

        <ExploreWebPanel
          sections={sections}
          regions={regions}
          selectedRegionId={selectedRegionId}
          activeIndex={activeIndex}
          onSectionChange={goTo}
          onItemClick={(item) => setSelectedItem({ item, contentType: active.content_type })}
          onRegionChange={onRegionChange}
          onPersonalise={onPersonalise}
          isPersonalising={isPersonalising}
          drillView={view}
          drillItems={drillItems}
          drillCategories={drillCategories}
          drillLoading={drillLoading}
          panelPhase={panelPhase}
          onDrillRegion={drillToRegion}
          onDrillCategory={(region, cat) => drillToCategory(region, cat)}
          onDrillItem={drillToItem}
          onBack={navigateBack}
        />
      </div>

      <ExploreDetailSheet
        item={selectedItem?.item ?? null}
        contentType={selectedItem?.contentType ?? null}
        onClose={() => setSelectedItem(null)}
      />

      <style>{`
        @keyframes hsDissolve {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hsReveal {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hsPanelIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hsSkeletonPulse {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.13; }
        }
        @keyframes ecFadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ecSlideUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ecPulse    { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.5; } }
      `}</style>
    </div>
  );
}
