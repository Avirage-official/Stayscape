/**
 * trait-place-map.ts
 *
 * Maps TraitKeys → Stayscape place categories to weight for this traveller.
 *
 * `primary`   — show first, weight heavily
 * `secondary` — show if primary results are sparse
 * `exclude`   — never surface for this trait combination
 *
 * Stayscape categories (from geoapify.ts):
 *   dining | nightlife | fun_places | family | historical |
 *   nature | wellness | top_places | shopping | local_spots
 */

import type { TraitKey } from './derive-traits';

export type StayscapeCategory =
  | 'dining'
  | 'nightlife'
  | 'fun_places'
  | 'family'
  | 'historical'
  | 'nature'
  | 'wellness'
  | 'top_places'
  | 'shopping'
  | 'local_spots';

export type TraitCategoryWeights = {
  primary:   StayscapeCategory[];
  secondary: StayscapeCategory[];
  exclude:   StayscapeCategory[];
};

const TRAIT_MAP: Record<TraitKey, TraitCategoryWeights> = {
  pioneer: {
    primary:   ['local_spots', 'nature', 'historical'],
    secondary: ['fun_places', 'top_places'],
    exclude:   ['shopping'],
  },
  explorer: {
    primary:   ['top_places', 'historical', 'local_spots'],
    secondary: ['nature', 'dining', 'fun_places'],
    exclude:   [],
  },
  homebody: {
    primary:   ['dining', 'wellness', 'local_spots'],
    secondary: ['shopping', 'nature'],
    exclude:   ['nightlife', 'fun_places'],
  },
  city_lover: {
    primary:   ['top_places', 'dining', 'shopping'],
    secondary: ['nightlife', 'fun_places', 'local_spots'],
    exclude:   [],
  },
  culture_seeker: {
    primary:   ['historical', 'top_places', 'local_spots'],
    secondary: ['dining', 'nature'],
    exclude:   ['shopping'],
  },
  nature_lover: {
    primary:   ['nature', 'local_spots'],
    secondary: ['top_places', 'wellness'],
    exclude:   ['shopping', 'nightlife'],
  },
  beach_lover: {
    primary:   ['nature', 'wellness'],
    secondary: ['dining', 'local_spots'],
    exclude:   ['shopping', 'historical'],
  },
  local_foodie: {
    primary:   ['dining', 'local_spots'],
    secondary: ['top_places', 'historical'],
    exclude:   [],
  },
  destination_diner: {
    primary:   ['dining', 'top_places'],
    secondary: ['local_spots', 'nightlife'],
    exclude:   [],
  },
  wellness_focused: {
    primary:   ['wellness', 'nature'],
    secondary: ['local_spots', 'dining'],
    exclude:   ['nightlife', 'fun_places'],
  },
  nightlife_lover: {
    primary:   ['nightlife', 'dining'],
    secondary: ['fun_places', 'local_spots'],
    exclude:   [],
  },
  planner: {
    primary:   ['top_places', 'historical', 'fun_places'],
    secondary: ['dining', 'shopping'],
    exclude:   [],
  },
  spontaneous: {
    primary:   ['local_spots', 'fun_places', 'dining'],
    secondary: ['nightlife', 'nature'],
    exclude:   [],
  },
  budget_conscious: {
    primary:   ['local_spots', 'nature', 'historical'],
    secondary: ['dining', 'top_places'],
    exclude:   ['wellness', 'shopping'],
  },
  quality_focused: {
    primary:   ['top_places', 'dining', 'wellness'],
    secondary: ['historical', 'local_spots'],
    exclude:   [],
  },
  crowd_averse: {
    primary:   ['nature', 'local_spots', 'wellness'],
    secondary: ['historical', 'dining'],
    exclude:   ['fun_places', 'shopping', 'top_places'],
  },
  slow_traveller: {
    primary:   ['wellness', 'dining', 'local_spots'],
    secondary: ['nature', 'historical'],
    exclude:   ['fun_places', 'nightlife'],
  },
};

/**
 * Given a list of derived traits, returns a merged, deduplicated priority
 * list of Stayscape categories for the `made_for_you` section.
 *
 * Categories that appear in any trait's `exclude` list and NOT in any
 * trait's `primary` are dropped entirely.
 *
 * Returns { ordered: StayscapeCategory[] } — primary categories first,
 * then secondary, with exclusions applied.
 */
export function resolveCategoriesForTraits(traits: TraitKey[]): {
  ordered: StayscapeCategory[];
} {
  const primarySet   = new Set<StayscapeCategory>();
  const secondarySet = new Set<StayscapeCategory>();
  const excludeSet   = new Set<StayscapeCategory>();

  for (const trait of traits) {
    const weights = TRAIT_MAP[trait];
    if (!weights) continue;
    weights.primary.forEach((c)   => primarySet.add(c));
    weights.secondary.forEach((c) => secondarySet.add(c));
    weights.exclude.forEach((c)   => excludeSet.add(c));
  }

  // A category in exclude is only truly excluded if it
  // never appeared in any primary list
  const hardExcludes = new Set(
    [...excludeSet].filter((c) => !primarySet.has(c)),
  );

  const primary = [...primarySet].filter((c) => !hardExcludes.has(c));
  const secondary = [...secondarySet].filter(
    (c) => !hardExcludes.has(c) && !primarySet.has(c),
  );

  return { ordered: [...primary, ...secondary] };
}

/**
 * Convenience: returns just the top N categories for a quick query.
 */
export function topCategoriesForTraits(
  traits: TraitKey[],
  limit = 4,
): StayscapeCategory[] {
  return resolveCategoriesForTraits(traits).ordered.slice(0, limit);
}
