/**
 * Persona derivation from onboarding answers.
 *
 * This is a pure function that takes the raw user profile answers
 * and returns a stable persona score vector (0–1 per persona),
 * without touching the database.
 */

export type NoveltyValue = 'pioneer' | 'explorer' | 'homebody' | null;
export type DiscoveryValue = 'word_of_mouth' | 'deep_research' | 'spontaneous' | 'curated_lists' | null;
export type FoodValue = 'local_markets' | 'neighbourhood_gems' | 'destination_dining' | 'fuel_not_ritual' | null;
export type PlanningValue = 'planner' | 'loose_plan' | 'first_day' | 'full_improv' | null;
export type SpendValue = 'value_first' | 'comfort_floor' | 'quality_always' | 'no_limits' | null;

export interface PersonaInput {
  novelty: NoveltyValue;
  discovery: DiscoveryValue;
  food: FoodValue;
  planning: PlanningValue;
  spend: SpendValue;
  vibes: string[];
  trip_type: string | null;
  guestcount: number | null;
}

export interface PersonaScores {
  cartographer: number;
  epicurean: number;
  archivist: number;
  retreatist: number;
  cosmopolitan: number;
  expeditionist: number;
  bon_vivant: number;
  gatherer: number;
}

function hasVibe(vibes: string[] | null | undefined, target: string): boolean {
  if (!vibes || vibes.length === 0) return false;
  return vibes.some((v) => v.toLowerCase() === target.toLowerCase());
}

export function derivePersonaScores(input: PersonaInput): PersonaScores {
  const { novelty, discovery, food, planning, spend, vibes, trip_type, guestcount } = input;

  let cartographer = 0;
  let epicurean = 0;
  let archivist = 0;
  let retreatist = 0;
  let cosmopolitan = 0;
  let expeditionist = 0;
  let bon_vivant = 0;
  let gatherer = 0;

  // Cartographer — explorer
  if (novelty === 'pioneer') cartographer += 0.45;
  if (novelty === 'explorer') cartographer += 0.3;
  if (discovery === 'spontaneous') cartographer += 0.35;
  if (discovery === 'word_of_mouth') cartographer += 0.2;
  ['offbeat', 'quirky', 'local', 'scenic', 'adventurous'].forEach((v) => {
    if (hasVibe(vibes, v)) cartographer += 0.05;
  });
  if (cartographer > 1) cartographer = 1;

  // Epicurean — foodie
  if (food === 'local_markets' || food === 'neighbourhood_gems' || food === 'destination_dining') {
    epicurean += 0.5;
  }
  if (food === 'fuel_not_ritual') epicurean += 0.3;
  if (discovery === 'word_of_mouth') epicurean += 0.2;
  if (discovery === 'curated_lists') epicurean += 0.1;
  ['foodie', 'wine_bar', 'craft_cocktails', 'neighbourhood_gem'].forEach((v) => {
    if (hasVibe(vibes, v)) epicurean += 0.05;
  });
  if (spend === 'quality_always' || spend === 'no_limits') epicurean += 0.1;
  if (epicurean > 1) epicurean = 1;

  // Archivist — culturalist
  if (discovery === 'curated_lists') archivist += 0.25;
  if (discovery === 'deep_research') archivist += 0.15;
  ['cultural', 'historic', 'museum', 'art', 'architecture'].forEach((v) => {
    if (hasVibe(vibes, v)) archivist += 0.08;
  });
  if (novelty === 'explorer') archivist += 0.1;
  if (novelty === 'homebody') archivist += 0.1;
  if (archivist > 1) archivist = 1;

  // Retreatist — rejuvenator
  ['quiet', 'calm', 'wellness', 'nature', 'spa', 'sunset'].forEach((v) => {
    if (hasVibe(vibes, v)) retreatist += 0.09;
  });
  if (planning === 'loose_plan') retreatist += 0.15;
  if (planning === 'planner') retreatist += 0.1;
  if (spend === 'comfort_floor' || spend === 'quality_always') retreatist += 0.15;
  if (novelty === 'homebody') retreatist += 0.15;
  if (retreatist > 1) retreatist = 1;

  // Cosmopolitan — social
  ['buzzy', 'nightlife', 'social', 'bar_hopping', 'rooftop'].forEach((v) => {
    if (hasVibe(vibes, v)) cosmopolitan += 0.09;
  });
  if (discovery === 'word_of_mouth') cosmopolitan += 0.15;
  if (discovery === 'spontaneous') cosmopolitan += 0.1;
  if (spend === 'comfort_floor') cosmopolitan += 0.1;
  if (spend === 'quality_always' || spend === 'no_limits') cosmopolitan += 0.1;
  if (planning === 'full_improv') cosmopolitan += 0.1;
  if (cosmopolitan > 1) cosmopolitan = 1;

  // Expeditionist — adventurer
  if (novelty === 'pioneer') expeditionist += 0.4;
  if (discovery === 'spontaneous') expeditionist += 0.15;
  if (discovery === 'curated_lists') expeditionist += 0.1;
  ['adventurous', 'outdoors', 'hiking', 'water_sports', 'day_trip'].forEach((v) => {
    if (hasVibe(vibes, v)) expeditionist += 0.05;
  });
  // 'spontaneous' is a DiscoveryValue, not a PlanningValue — use first_day / full_improv here
  if (planning === 'first_day' || planning === 'full_improv') {
    expeditionist += 0.1;
  }
  if (expeditionist > 1) expeditionist = 1;

  // Bon Vivant — luxe
  if (spend === 'quality_always') bon_vivant += 0.3;
  if (spend === 'no_limits') bon_vivant += 0.45;
  ['luxury', 'design', 'fine_dining', 'cocktail_bar', 'hotel_bar'].forEach((v) => {
    if (hasVibe(vibes, v)) bon_vivant += 0.07;
  });
  if (food === 'destination_dining' || food === 'neighbourhood_gems') bon_vivant += 0.2;
  if (bon_vivant > 1) bon_vivant = 1;

  // Gatherer — family / group
  if (trip_type === 'family') gatherer += 0.45;
  if (!trip_type && guestcount !== null && guestcount >= 3) gatherer += 0.25;
  ['family_friendly', 'kid_friendly', 'multi_gen', 'group'].forEach((v) => {
    if (hasVibe(vibes, v)) gatherer += 0.075;
  });
  if (planning === 'planner') gatherer += 0.15;
  if (spend === 'value_first' || spend === 'comfort_floor') gatherer += 0.1;
  if (gatherer > 1) gatherer = 1;

  const scores: PersonaScores = {
    cartographer,
    epicurean,
    archivist,
    retreatist,
    cosmopolitan,
    expeditionist,
    bon_vivant,
    gatherer,
  };

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore <= 0) {
    return {
      cartographer: 0,
      epicurean: 0,
      archivist: 0,
      retreatist: 0,
      cosmopolitan: 0,
      expeditionist: 0,
      bon_vivant: 0,
      gatherer: 0,
    };
  }

  return {
    cartographer: cartographer / maxScore,
    epicurean: epicurean / maxScore,
    archivist: archivist / maxScore,
    retreatist: retreatist / maxScore,
    cosmopolitan: cosmopolitan / maxScore,
    expeditionist: expeditionist / maxScore,
    bon_vivant: bon_vivant / maxScore,
    gatherer: gatherer / maxScore,
  };
}
