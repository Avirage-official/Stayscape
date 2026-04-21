/**
 * Supabase data-access layer for Discover content.
 *
 * Queries the expected tables (discovercategories, discoveritems,
 * discoveritemtips, discoveritemlinks, localinsights) and returns
 * data in the shapes consumed by the existing Discover UI.
 *
 * If the Supabase client is unavailable or a table returns no rows,
 * callers should fall back to the local dummy data.
 *
 * Enum-backed columns (values are DB-controlled, not exhaustive in TS):
 *   discovercategories.categorytype  → CategoryType
 *   discoveritems.itemtype           → ItemType
 *   discoveritemtips.tiptype         → TipType (known: things_to_do,
 *                                       what_to_look_out_for, what_to_bring)
 *   discoveritemlinks.linktype       → LinkType
 *   localinsights.insighttype        → InsightType
 *   discoveritems.status / localinsights.status → ContentStatus
 */

import { getSupabaseBrowser } from '@/lib/supabase/client';
import { gradientForCategory } from '@/lib/supabase/places-repository';
import type {
  CategoryItem,
  PlaceCard,
  InsightCard,
  PlaceDetailExtra,
} from '@/lib/data/discover-fallback';

import type {
  ContentStatus,
  CategoryType,
  ItemType,
  TipType,
  LinkType,
  InsightType,
} from '@/types/enums';

/* ── Raw DB row types (match expected table columns) ──── */

interface DbDiscoverCategory {
  id: string;
  propertyid: string | null;
  slug: string;
  name: string;
  categorytype: CategoryType;
  iconname: string | null;
  imageurl: string | null;
  sortorder: number;
  isactive: boolean;
  createdat: string;
  updatedat: string;
  subtitle: string;
}

interface DbDiscoverItem {
  id: string;
  propertyid: string | null;
  categoryid: string;
  itemtype: ItemType;
  title: string;
  shortdescription: string;
  fulldescription: string | null;
  locationname: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location: unknown | null;
  distancekm: number | null;
  ratingvalue: number | null;
  ratingcount: number | null;
  recommendeddurationhours: number | null;
  besttimetogo: string | null;
  imageurl: string | null;
  thumbnailurl: string | null;
  websiteurl: string | null;
  isfeatured: boolean;
  isbookable: boolean;
  status: ContentStatus;
  sortorder: number;
  sourceprovider: string | null;
  sourceid: string | null;
  sourcesyncedat: string | null;
  createdat: string;
  updatedat: string;
  gradient: string | null;
}

interface DbDiscoverItemTip {
  id: string;
  discoveritemid: string;
  tiptype: TipType;
  content: string;
  sortorder: number;
  createdat: string;
  updatedat: string;
}

interface DbDiscoverItemLink {
  id: string;
  discoveritemid: string;
  linktype: LinkType;
  label: string;
  url: string;
  sortorder: number;
  createdat: string;
  updatedat: string;
}

interface DbLocalInsight {
  id: string;
  propertyid: string | null;
  categoryid: string | null;
  title: string;
  insighttype: InsightType;
  summary: string;
  body: string;
  iconname: string | null;
  imageurl: string | null;
  sortorder: number;
  status: ContentStatus;
  createdat: string;
  updatedat: string;
}

/* ── Shape transformers ─────────────────────────────────── */

function toCategory(row: DbDiscoverCategory): CategoryItem {
  return {
    id: row.id,
    label: row.name,
    icon: row.iconname ?? '',
    image: row.imageurl ?? '',
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
    subtitle: row.summary,
    icon: row.iconname ?? '',
    content: row.body,
  };
}

function groupTips(
  tips: DbDiscoverItemTip[],
): { thingsToDo: string[]; whatToLookOutFor: string[]; whatToBring: string[] } {
  const thingsToDo: string[] = [];
  const whatToLookOutFor: string[] = [];
  const whatToBring: string[] = [];

  for (const t of tips) {
    switch (t.tiptype) {
      case 'things_to_do':
        thingsToDo.push(t.content);
        break;
      case 'what_to_look_out_for':
        whatToLookOutFor.push(t.content);
        break;
      case 'what_to_bring':
        whatToBring.push(t.content);
        break;
      default:
        thingsToDo.push(t.content);
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
    .order('sortorder', { ascending: true });

  if (error || !data || data.length === 0) return null;

  return (data as DbDiscoverCategory[])
    .filter((r) => r.isactive !== false)
    .map(toCategory);
}

/**
 * Fetch discover items for a given category id.
 * Returns null if the table is missing or empty.
 */
export async function fetchItemsByCategory(
  categoryId: string,
  categoryLabel: string,
  limit = 10,
  offset = 0,
): Promise<PlaceCard[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const safeOffset = Math.max(offset, 0);

  const { data, error } = await sb
    .from('discoveritems')
    .select('*')
    .eq('categoryid', categoryId)
    .eq('status', 'published')
    .order('ratingvalue', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

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
    .eq('status', 'published')
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
    .eq('status', 'published')
    .order('sortorder', { ascending: true });

  if (error || !data || data.length === 0) return null;

  return (data as DbLocalInsight[]).map(toInsight);
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
    .order('sortorder', { ascending: true });

  const tips = (tipsData ?? []) as DbDiscoverItemTip[];
  const grouped = groupTips(tips);

  // Fetch links
  const { data: linksData } = await sb
    .from('discoveritemlinks')
    .select('*')
    .eq('discoveritemid', itemId)
    .order('sortorder', { ascending: true });

  const links = (linksData ?? []) as DbDiscoverItemLink[];

  const detail: PlaceDetailExtra = {
    locationLine: item.locationname ?? '',
    editorialDescription: item.fulldescription ?? item.shortdescription,
    thingsToDo: grouped.thingsToDo,
    whatToLookOutFor: grouped.whatToLookOutFor,
    whatToBring: grouped.whatToBring,
    recommendedDuration: item.recommendeddurationhours != null ? String(item.recommendeddurationhours) : '1–3 hours',
    bestTimeToGo: item.besttimetogo ?? 'Morning or late afternoon',
  };

  return { item, detail, links };
}

/**
 * Fetch places from the `places` table and transform them into the
 * same `PlaceCard` shape used by the Discover panel.
 *
 * This allows the Discover panel to show both curated editorial items
 * (from `discoveritems`) AND synced geo-data places side-by-side.
 *
 * NOTE: In the future, the `discoveritems` table could be deprecated in
 * favour of using `places` + a curation layer (e.g. `stay_curations`)
 * as the single source of truth for all discoverable content.
 * (There is no `curated_collections` table in the current schema.)
 *
 * @param regionId  Optional region filter — pass to scope results to a
 *                  specific region; omit for all active places.
 * @param limit     Maximum number of items to return (default 10, max 21).
 * @param offset    Result offset for pagination (default 0).
 * @param category  Optional places.category filter.
 */
export async function fetchPlacesAsDiscoverItems(
  regionId?: string,
  limit = 10,
  offset = 0,
  category?: string,
): Promise<PlaceCard[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const safeLimit = Math.min(Math.max(limit, 1), 21);
  const safeOffset = Math.max(offset, 0);

  let query = sb
    .from('places')
    .select('id, name, category, description, rating, image_url, booking_url')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (regionId) query = query.eq('region_id', regionId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  return (data as Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    rating: number | null;
    image_url: string | null;
    booking_url: string | null;
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    rating: row.rating ?? 0,
    distance: '',
    gradient: gradientForCategory(row.category),
    image: row.image_url ?? '',
    bookingUrl: row.booking_url ?? '#',
  }));
}
