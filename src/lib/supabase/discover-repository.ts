/**
 * Supabase data-access layer for Discover content.
 *
 * Queries the expected tables (discovercategories, discoveritems,
 * discoveritemtips, discoveritemlinks, localinsights) and returns
 * data in the shapes consumed by the existing Discover UI.
 *
 * If the Supabase client is unavailable or a table returns no rows,
 * callers should fall back to the local dummy data.
 */

import { getSupabaseBrowser } from '@/lib/supabase/client';
import type {
  CategoryItem,
  PlaceCard,
  InsightCard,
  PlaceDetailExtra,
} from '@/lib/data/discover-fallback';

/* ── Raw DB row types (match expected table columns) ──── */

interface DbDiscoverCategory {
  id: string;
  label: string;
  icon: string;
  image: string;
  subtitle: string;
  sort_order?: number;
  is_active?: boolean;
}

interface DbDiscoverItem {
  id: string;
  category_id: string;
  title: string;
  shortdescription: string;
  fulldescription?: string;
  locationname?: string;
  distancekm?: number;
  ratingvalue?: number;
  recommendeddurationhours?: string;
  besttimetogo?: string;
  imageurl?: string;
  websiteurl?: string;
  gradient?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

interface DbDiscoverItemTip {
  id: string;
  discoveritemid: string;
  tip: string;
  tip_type: string;
  sort_order?: number;
}

interface DbDiscoverItemLink {
  id: string;
  discoveritemid: string;
  label: string;
  url: string;
  sort_order?: number;
}

interface DbLocalInsight {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  content: string;
  sort_order?: number;
  is_active?: boolean;
}

/* ── Shape transformers ─────────────────────────────────── */

function toCategory(row: DbDiscoverCategory): CategoryItem {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    image: row.image,
    subtitle: row.subtitle,
  };
}

function toPlaceCard(row: DbDiscoverItem, categoryLabel: string): PlaceCard {
  return {
    id: row.id,
    name: row.title,
    category: categoryLabel,
    description: row.shortdescription,
    rating: row.ratingvalue ?? 0,
    distance: row.distancekm != null ? `${row.distancekm} mi` : '',
    gradient: row.gradient ?? 'from-slate-800/80 via-slate-950/60 to-black/80',
    image: row.imageurl ?? '',
    bookingUrl: row.websiteurl ?? '#',
  };
}

function toInsight(row: DbLocalInsight): InsightCard {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    icon: row.icon,
    content: row.content,
  };
}

function groupTips(
  tips: DbDiscoverItemTip[],
): { thingsToDo: string[]; whatToLookOutFor: string[]; whatToBring: string[] } {
  const thingsToDo: string[] = [];
  const whatToLookOutFor: string[] = [];
  const whatToBring: string[] = [];

  for (const t of tips) {
    switch (t.tip_type) {
      case 'things_to_do':
        thingsToDo.push(t.tip);
        break;
      case 'what_to_look_out_for':
        whatToLookOutFor.push(t.tip);
        break;
      case 'what_to_bring':
        whatToBring.push(t.tip);
        break;
      default:
        thingsToDo.push(t.tip);
    }
  }

  return { thingsToDo, whatToLookOutFor, whatToBring };
}

/* ── Public query functions ─────────────────────────────── */

/**
 * Fetch all active discover categories.
 * Returns null if the table is missing or the client is unavailable.
 */
export async function fetchCategories(): Promise<CategoryItem[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('discovercategories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) return null;

  return (data as DbDiscoverCategory[])
    .filter((r) => r.is_active !== false)
    .map(toCategory);
}

/**
 * Fetch discover items for a given category id.
 * Returns null if the table is missing or empty.
 */
export async function fetchItemsByCategory(
  categoryId: string,
  categoryLabel: string,
): Promise<PlaceCard[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('discoveritems')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('ratingvalue', { ascending: false });

  if (error || !data || data.length === 0) return null;

  return (data as DbDiscoverItem[]).map((row) =>
    toPlaceCard(row, categoryLabel),
  );
}

/**
 * Fetch all discover items across all categories.
 * Returns null if the table is missing or empty.
 */
export async function fetchAllItems(): Promise<PlaceCard[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('discoveritems')
    .select('*')
    .eq('is_active', true)
    .order('ratingvalue', { ascending: false });

  if (error || !data || data.length === 0) return null;

  return (data as DbDiscoverItem[]).map((row) =>
    toPlaceCard(row, ''),
  );
}

/**
 * Fetch local insights.
 * Returns null if the table is missing or empty.
 */
export async function fetchLocalInsights(): Promise<InsightCard[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from('localinsights')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) return null;

  return (data as DbLocalInsight[])
    .filter((r) => r.is_active !== false)
    .map(toInsight);
}

/**
 * Fetch full detail for a single discover item including tips and links.
 * Returns null if the item is not found.
 */
export async function fetchItemDetail(
  itemId: string,
): Promise<{ item: DbDiscoverItem; detail: PlaceDetailExtra; links: DbDiscoverItemLink[] } | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  // Fetch item
  const { data: itemData, error: itemErr } = await sb
    .from('discoveritems')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemErr || !itemData) return null;

  const item = itemData as DbDiscoverItem;

  // Fetch tips
  const { data: tipsData } = await sb
    .from('discoveritemtips')
    .select('*')
    .eq('discoveritemid', itemId)
    .order('sort_order', { ascending: true });

  const tips = (tipsData ?? []) as DbDiscoverItemTip[];
  const grouped = groupTips(tips);

  // Fetch links
  const { data: linksData } = await sb
    .from('discoveritemlinks')
    .select('*')
    .eq('discoveritemid', itemId)
    .order('sort_order', { ascending: true });

  const links = (linksData ?? []) as DbDiscoverItemLink[];

  const detail: PlaceDetailExtra = {
    locationLine: item.locationname ?? '',
    editorialDescription: item.fulldescription ?? item.shortdescription,
    thingsToDo: grouped.thingsToDo,
    whatToLookOutFor: grouped.whatToLookOutFor,
    whatToBring: grouped.whatToBring,
    recommendedDuration: item.recommendeddurationhours ?? '1–3 hours',
    bestTimeToGo: item.besttimetogo ?? 'Morning or late afternoon',
  };

  return { item, detail, links };
}
