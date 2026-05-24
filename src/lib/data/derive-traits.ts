/**
 * derive-traits.ts
 *
 * Pure function — takes a guest's onboarding profile answers and derives
 * a flat list of trait keys that describe their travel personality.
 * No DB calls. Safe to run server-side or client-side.
 *
 * Trait keys are consumed by trait-place-map.ts to resolve which
 * Stayscape place categories to surface for this traveller.
 */

export type ProfileAnswers = {
  novelty?:      'pioneer' | 'explorer' | 'homebody';
  vibe?:         string[];  // 'city' | 'culture' | 'nature' | 'beach'
  discovery?:    'word_of_mouth' | 'deep_research' | 'spontaneous' | 'curated_lists';
  food?:         'local_markets' | 'neighbourhood_gems' | 'destination_dining' | 'fuel_not_ritual';
  planning?:     'planner' | 'loose_plan' | 'first_day' | 'full_improv';
  spend?:        'value_first' | 'comfort_floor' | 'quality_always' | 'no_limits';
  dealbreakers?: string[];  // 'rushed' | 'crowds' | 'bad_food' | 'downtime' | 'overspending' | 'chaos'
};

export type TraitKey =
  | 'pioneer'
  | 'explorer'
  | 'homebody'
  | 'city_lover'
  | 'culture_seeker'
  | 'nature_lover'
  | 'beach_lover'
  | 'local_foodie'
  | 'destination_diner'
  | 'wellness_focused'
  | 'nightlife_lover'
  | 'planner'
  | 'spontaneous'
  | 'budget_conscious'
  | 'quality_focused'
  | 'crowd_averse'
  | 'slow_traveller';

/**
 * Derives a deduplicated list of TraitKeys from a guest's profile answers.
 * Returns traits in priority order (most defining first).
 */
export function deriveTraits(answers: ProfileAnswers): TraitKey[] {
  const traits = new Set<TraitKey>();

  // ── Novelty ──────────────────────────────────────────────
  if (answers.novelty === 'pioneer')  traits.add('pioneer');
  if (answers.novelty === 'explorer') traits.add('explorer');
  if (answers.novelty === 'homebody') traits.add('homebody');

  // ── Vibe ─────────────────────────────────────────────────
  for (const v of answers.vibe ?? []) {
    if (v === 'city')    traits.add('city_lover');
    if (v === 'culture') traits.add('culture_seeker');
    if (v === 'nature')  traits.add('nature_lover');
    if (v === 'beach')   traits.add('beach_lover');
  }

  // ── Discovery ────────────────────────────────────────────
  if (answers.discovery === 'word_of_mouth') traits.add('local_foodie');
  if (answers.discovery === 'spontaneous')   traits.add('spontaneous');
  if (answers.discovery === 'curated_lists') traits.add('quality_focused');

  // ── Food ─────────────────────────────────────────────────
  if (answers.food === 'local_markets')      traits.add('local_foodie');
  if (answers.food === 'neighbourhood_gems') traits.add('local_foodie');
  if (answers.food === 'destination_dining') traits.add('destination_diner');
  // 'fuel_not_ritual' → no food trait; deprioritise dining in map

  // ── Planning ─────────────────────────────────────────────
  if (answers.planning === 'planner')     traits.add('planner');
  if (answers.planning === 'full_improv') traits.add('spontaneous');
  if (answers.planning === 'loose_plan')  traits.add('explorer');

  // ── Spend ────────────────────────────────────────────────
  if (answers.spend === 'value_first')    traits.add('budget_conscious');
  if (answers.spend === 'quality_always') traits.add('quality_focused');
  if (answers.spend === 'no_limits')      traits.add('destination_diner');
  if (answers.spend === 'comfort_floor')  traits.add('explorer');

  // ── Dealbreakers ─────────────────────────────────────────
  if (answers.dealbreakers?.includes('crowds'))   traits.add('crowd_averse');
  if (answers.dealbreakers?.includes('rushed'))   traits.add('slow_traveller');
  if (answers.dealbreakers?.includes('downtime')) traits.add('planner');

  // ── Derived combinations ─────────────────────────────────
  // Spa / wellness: homebody + slow_traveller, or homebody alone
  if (traits.has('homebody') || traits.has('slow_traveller')) {
    traits.add('wellness_focused');
  }
  // Nightlife: city_lover + spontaneous
  if (traits.has('city_lover') && traits.has('spontaneous')) {
    traits.add('nightlife_lover');
  }

  return Array.from(traits);
}
