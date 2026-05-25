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
  const carouselRef = useRef<HTMLDivElement>(null);
  // ref to trigger the city nudge in the web panel
  const triggerCityNudgeRef = useRef<(() => void) | null>(null);

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

  // When Explore button is clicked: drill in if city set, else nu