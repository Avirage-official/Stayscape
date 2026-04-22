/**
 * Fallback data for the Discover panel.
 * Extracted from DiscoverPanel.tsx and PlaceDetailDialog.tsx so it can be
 * reused across components, tests, and server-side logic without pulling in
 * React or 'use client'.
 *
 * LOCATION SAFETY: All fallback content in this file MUST remain location-neutral
 * and city-generic. Do NOT hardcode any specific city, neighbourhood, or region name
 * (e.g. "New York", "Manhattan", "Singapore") unless the data is explicitly
 * region-bound and served only to that region. Fallback content is shown whenever
 * the DB returns empty or unavailable data, so it must be safe for any property
 * in any city.
 */

/* ─── Interfaces ─── */

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  image: string;
  subtitle: string;
  /** Mapped from discovercategories.places_category — used to filter places.category. */
  placesCategory?: string | null;
}

export interface PlaceCard {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  distance: string;
  gradient: string;
  image: string;
  bookingUrl: string;
}

export interface InsightCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  content: string;
}

export interface PlaceDetailExtra {
  locationLine: string;
  editorialDescription: string;
  thingsToDo: string[];
  whatToLookOutFor: string[];
  whatToBring: string[];
  recommendedDuration: string;
  bestTimeToGo: string;
}

/* ─── Categories ─── */

export const FALLBACK_CATEGORIES: CategoryItem[] = [
  { id: 'top-places', label: 'Top Places', icon: '⭐', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop', subtitle: 'Must-see landmarks' },
  { id: 'historical', label: 'Historical', icon: '🏛', image: 'https://images.unsplash.com/photo-1575384843394-f89e6e3c5c39?w=400&h=300&fit=crop', subtitle: 'Rich heritage' },
  { id: 'fun', label: 'Fun Places', icon: '🎡', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', subtitle: 'Entertainment' },
  { id: 'shopping', label: 'Shopping', icon: '🛍', image: 'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=400&h=300&fit=crop', subtitle: 'Retail therapy' },
  { id: 'dining', label: 'Dining', icon: '🍽', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', subtitle: 'Fine cuisine' },
  { id: 'local', label: 'Local Spots', icon: '📍', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop', subtitle: 'Hidden gems' },
  { id: 'nature', label: 'Nature', icon: '🌿', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', subtitle: 'Green escapes' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop', subtitle: 'All ages' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙', image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=300&fit=crop', subtitle: 'After dark' },
  { id: 'relaxation', label: 'Wellness', icon: '🧘', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop', subtitle: 'Rejuvenate' },
  { id: 'events', label: 'Events', icon: '🎭', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', subtitle: 'Live shows' },
];

/* ─── Places by category ─── */

export const FALLBACK_PLACES_BY_CATEGORY: Record<string, PlaceCard[]> = {
  'top-places': [
    { id: 'tp-1', name: 'City Park', category: 'Top Places', description: 'A sprawling urban park with walking trails, lakes, and gardens offering a peaceful escape from city life.', rating: 4.9, distance: '0.5 mi', gradient: 'from-emerald-900/80 via-emerald-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'tp-2', name: 'Iconic Tower', category: 'Top Places', description: 'A landmark tower offering panoramic views of the city skyline from its open-air observation deck.', rating: 4.8, distance: '0.8 mi', gradient: 'from-blue-900/80 via-blue-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'tp-3', name: 'Cultural Square', category: 'Top Places', description: 'A vibrant public square full of energy, entertainment, and the constant pulse of city life.', rating: 4.5, distance: '0.4 mi', gradient: 'from-purple-900/80 via-purple-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'tp-4', name: 'Historic Bridge', category: 'Top Places', description: 'Walk across this iconic suspension bridge for stunning views of the skyline and waterfront.', rating: 4.8, distance: '3.2 mi', gradient: 'from-slate-800/80 via-slate-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  historical: [
    { id: 'hi-1', name: 'City Art Museum', category: 'Historical', description: 'Thousands of years of art from around the globe, housed in one of the largest museums in the region.', rating: 4.9, distance: '0.6 mi', gradient: 'from-amber-900/80 via-amber-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1575384843394-f89e6e3c5c39?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'hi-2', name: 'National Monument', category: 'Historical', description: 'An enduring national symbol standing proud since its founding, rich with cultural and civic history.', rating: 4.8, distance: '5.1 mi', gradient: 'from-teal-900/80 via-teal-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'hi-3', name: 'Heritage Museum', category: 'Historical', description: 'Explore the personal stories and cultural artefacts that shaped the region\'s rich heritage.', rating: 4.7, distance: '5.2 mi', gradient: 'from-stone-800/80 via-stone-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  fun: [
    { id: 'fu-1', name: 'Seaside Park', category: 'Fun Places', description: 'Classic beachfront attractions with rides, games, and waterfront fun for all ages.', rating: 4.4, distance: '12 mi', gradient: 'from-yellow-900/80 via-yellow-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fu-2', name: 'Observation Deck', category: 'Fun Places', description: 'Stunning 360-degree views of the city skyline and surrounding landscape from the top.', rating: 4.8, distance: '0.3 mi', gradient: 'from-sky-900/80 via-sky-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fu-3', name: 'Food Market', category: 'Fun Places', description: 'A vibrant indoor marketplace with artisanal food vendors, local produce, and unique shops.', rating: 4.6, distance: '1.8 mi', gradient: 'from-rose-900/80 via-rose-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  shopping: [
    { id: 'sh-1', name: 'Luxury Shopping Avenue', category: 'Shopping', description: 'A world-class shopping street with flagship stores from the top international designers.', rating: 4.7, distance: '0.2 mi', gradient: 'from-fuchsia-900/80 via-fuchsia-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'sh-2', name: 'Designer District', category: 'Shopping', description: 'Trendy neighbourhood with designer boutiques, galleries, and distinctive local architecture.', rating: 4.6, distance: '2.5 mi', gradient: 'from-violet-900/80 via-violet-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'sh-3', name: 'Weekend Flea Market', category: 'Shopping', description: 'Weekly market featuring vintage finds, antiques, and one-of-a-kind local artisan goods.', rating: 4.5, distance: '4.1 mi', gradient: 'from-amber-900/80 via-amber-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555992457-b8fefdd09bb1?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  dining: [
    { id: 'di-1', name: 'Fine Dining Restaurant', category: 'Dining', description: 'Michelin-starred restaurant with exquisite tasting menus and impeccable service.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/80 via-red-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'di-2', name: 'Fusion Restaurant', category: 'Dining', description: 'Celebrated fusion cuisine known for innovative dishes and premium locally sourced ingredients.', rating: 4.8, distance: '0.3 mi', gradient: 'from-orange-900/80 via-orange-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'di-3', name: 'Classic Steakhouse', category: 'Dining', description: 'A beloved institution serving premium dry-aged cuts with timeless, no-frills style.', rating: 4.7, distance: '3.8 mi', gradient: 'from-stone-800/80 via-stone-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'di-4', name: 'Artisan Food Hall', category: 'Dining', description: 'Sprawling food hall with multiple restaurant counters, live cooking stations, and gourmet provisions.', rating: 4.6, distance: '1.2 mi', gradient: 'from-green-900/80 via-green-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  local: [
    { id: 'lo-1', name: 'City Square', category: 'Local Spots', description: 'Lively public square known for its architecture, fountain, street performers, and community atmosphere.', rating: 4.6, distance: '2.1 mi', gradient: 'from-lime-900/80 via-lime-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'lo-2', name: 'Eclectic Neighbourhood', category: 'Local Spots', description: 'A vibrant area with independent shops, diverse eateries, and a strong local character.', rating: 4.5, distance: '2.8 mi', gradient: 'from-orange-900/80 via-orange-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'lo-3', name: 'Cultural Quarter', category: 'Local Spots', description: 'Bustling area with authentic local restaurants, shops, and heritage cultural landmarks.', rating: 4.4, distance: '3.5 mi', gradient: 'from-red-900/80 via-red-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1470219556762-1fd5b55f7173?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  nature: [
    { id: 'na-1', name: 'Elevated Greenway', category: 'Nature', description: 'A scenic elevated park with curated gardens and city views, built on repurposed urban infrastructure.', rating: 4.8, distance: '1.5 mi', gradient: 'from-emerald-900/80 via-emerald-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'na-2', name: 'Riverside Park', category: 'Nature', description: 'A scenic waterfront park with cycling trails, leisure piers, and beautiful sunset views.', rating: 4.7, distance: '1.2 mi', gradient: 'from-cyan-900/80 via-cyan-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'na-3', name: 'Botanical Garden', category: 'Nature', description: 'Acres of curated gardens, forests, and world-class horticultural exhibitions.', rating: 4.7, distance: '9.5 mi', gradient: 'from-teal-900/80 via-teal-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  family: [
    { id: 'fa-1', name: 'Natural History Museum', category: 'Family', description: 'Explore dinosaurs, ocean life, space, and cultures from around the world under one roof.', rating: 4.8, distance: '0.7 mi', gradient: 'from-blue-900/80 via-blue-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fa-2', name: 'City Zoo', category: 'Family', description: 'A well-loved zoo with diverse animal habitats and memorable family-friendly experiences.', rating: 4.5, distance: '0.4 mi', gradient: 'from-green-900/80 via-green-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fa-3', name: 'Aviation Museum', category: 'Family', description: 'Fascinating museum featuring aircraft, space exhibits, and interactive flight simulators.', rating: 4.6, distance: '1.1 mi', gradient: 'from-slate-800/80 via-slate-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1569183091671-696402586b9c?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  nightlife: [
    { id: 'ni-1', name: 'Jazz Bar', category: 'Nightlife', description: 'An elegant bar with live jazz performances, hand-crafted cocktails, and a warm, intimate atmosphere.', rating: 4.7, distance: '0.3 mi', gradient: 'from-amber-900/80 via-amber-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ni-2', name: 'Rooftop Bar', category: 'Nightlife', description: 'Panoramic city views paired with craft cocktails and a sophisticated rooftop atmosphere.', rating: 4.6, distance: '0.1 mi', gradient: 'from-indigo-900/80 via-indigo-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ni-3', name: 'Immersive Theatre', category: 'Nightlife', description: 'A groundbreaking immersive theatrical experience set inside a fully transformed venue.', rating: 4.8, distance: '1.6 mi', gradient: 'from-neutral-800/80 via-neutral-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1519214605650-76a613ee3245?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  relaxation: [
    { id: 're-1', name: 'Ancient Thermal Baths', category: 'Wellness', description: 'A luxurious underground thermal bath experience inspired by centuries-old bathing traditions.', rating: 4.9, distance: '2.3 mi', gradient: 'from-sky-900/80 via-sky-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 're-2', name: 'Island Spa', category: 'Wellness', description: 'A serene spa retreat on a scenic island with waterfront views and therapeutic wellness rituals.', rating: 4.7, distance: '4.0 mi', gradient: 'from-teal-900/80 via-teal-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6f?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 're-3', name: 'Luxury Hotel Spa', category: 'Wellness', description: 'Premium spa facilities with panoramic views, holistic treatments, and complete relaxation.', rating: 4.8, distance: '0.6 mi', gradient: 'from-violet-900/80 via-violet-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  events: [
    { id: 'ev-1', name: 'Theatre District', category: 'Events', description: 'World-class stage productions, musicals, and performances in the cultural heart of the city.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/80 via-red-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ev-2', name: 'Sports & Entertainment Arena', category: 'Events', description: 'A major venue hosting concerts, sports events, and headline performances throughout the year.', rating: 4.7, distance: '0.9 mi', gradient: 'from-orange-900/80 via-orange-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ev-3', name: 'Performing Arts Centre', category: 'Events', description: 'A prestigious arts centre presenting opera, ballet, symphony, and international touring productions.', rating: 4.8, distance: '0.7 mi', gradient: 'from-rose-900/80 via-rose-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1520095972714-909e91b038e5?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
};

/* ─── Local insights ─── */

export const FALLBACK_LOCAL_INSIGHTS: InsightCard[] = [
  { id: 'ins-1', title: 'Language', subtitle: 'Communication', icon: '💬', content: 'Hotel staff typically speak English and local languages. A translation app can help navigate local signage and menus.' },
  { id: 'ins-2', title: 'Tipping', subtitle: 'Etiquette', icon: '💳', content: 'Tipping customs vary by region. Ask the concierge for local norms on restaurants, taxis, and housekeeping.' },
  { id: 'ins-3', title: 'Transport', subtitle: 'Getting around', icon: '🚇', content: 'Most destinations offer public transit, taxis, and rideshare apps. The concierge can recommend the best options near the hotel.' },
  { id: 'ins-4', title: 'Currency', subtitle: 'Money', icon: '💵', content: 'Use local currency for markets and small vendors. Cards are accepted at most hotels and restaurants. Check exchange rates before travelling.' },
  { id: 'ins-5', title: 'Weather', subtitle: 'Stay prepared', icon: '🌡', content: 'Pack layers and check local forecasts before heading out. The concierge can advise on seasonal conditions for your stay.' },
  { id: 'ins-6', title: 'Safety', subtitle: 'Stay aware', icon: '🛡', content: 'Stay alert in crowded areas. Keep valuables secure and use well-lit streets at night. The hotel concierge can flag any local safety considerations.' },
];

/* ─── Stay days ─── */

export const FALLBACK_STAY_DAYS = [
  { label: 'Day 1 · Dec 14', value: 'dec-14' },
  { label: 'Day 2 · Dec 15', value: 'dec-15' },
  { label: 'Day 3 · Dec 16', value: 'dec-16' },
  { label: 'Day 4 · Dec 17', value: 'dec-17' },
  { label: 'Day 5 · Dec 18', value: 'dec-18' },
  { label: 'Day 6 · Dec 19', value: 'dec-19' },
];

/* ─── Rich editorial place details (keyed by place id) ─── */

export const FALLBACK_PLACE_DETAILS: Record<string, PlaceDetailExtra> = {
  /* Top Places */
  'tp-1': {
    locationLine: 'Top Places · City Park',
    editorialDescription: 'The city park is the green heart of the urban landscape — acres of winding paths, serene lakes, and sculpted gardens that offer a tranquil counterpoint to the city\'s energy. Whether you\'re drawn to quiet reflection by the water or the playful atmosphere of the open meadows, the park reveals a different character with every visit.',
    thingsToDo: ['Walk the perimeter loop at sunrise', 'Find a quiet spot by the lake', 'Explore the formal gardens', 'Watch for local wildlife'],
    whatToLookOutFor: ['Street performers and musicians near popular gathering points', 'Seasonal flower displays and garden installations', 'Guided ranger walks during peak season'],
    whatToBring: ['Comfortable walking shoes', 'A light jacket for breezy afternoons', 'A camera for scenic views'],
    recommendedDuration: '2–4 hours',
    bestTimeToGo: 'Early morning or golden hour',
  },
  'tp-2': {
    locationLine: 'Top Places · Iconic Tower',
    editorialDescription: 'Rising high above the city, this landmark tower offers sweeping panoramic views from its open-air observation deck. The architecture is a masterpiece of its era, and the lobby alone is worth the visit — a soaring space of geometric detail and craftsmanship that set the tone for the experience above.',
    thingsToDo: ['Take in the open-air observation deck', 'Explore the lobby and architectural details', 'Catch the sunset for golden-hour views'],
    whatToLookOutFor: ['Clear days can offer remarkable long-distance visibility', 'Special seasonal lighting on the exterior after dark', 'Rotating historical exhibits in the lobby'],
    whatToBring: ['Valid photo ID for security', 'A warm layer — the observation deck can be breezy', 'Your best camera lens'],
    recommendedDuration: '1.5–2 hours',
    bestTimeToGo: 'Late afternoon into sunset',
  },
  'tp-3': {
    locationLine: 'Top Places · Cultural Square',
    editorialDescription: 'This cultural square is sensory immersion at its most vivid — bold public art, vibrant signage, and a constant hum of activity from visitors and locals alike. It\'s best experienced on foot, especially in the evening, when the lights transform the space into something closer to art installation than public square.',
    thingsToDo: ['Walk through the pedestrian plazas', 'Browse nearby entertainment and ticketing options', 'People-watch from the main viewing steps'],
    whatToLookOutFor: ['Costumed performers who may expect tips for photos', 'Flash ticket deals for same-day performances', 'Special seasonal installations or events'],
    whatToBring: ['Comfortable shoes for walking on pavement', 'A secure bag — it gets crowded', 'Your sense of wonder'],
    recommendedDuration: '1–2 hours',
    bestTimeToGo: 'After dark for the full atmosphere',
  },
  'tp-4': {
    locationLine: 'Top Places · Historic Bridge',
    editorialDescription: 'This iconic bridge is more than a crossing — it\'s a promenade suspended above the water, framed by elegant engineering and offering some of the city\'s most celebrated views. Walking its span is one of those experiences that never loses its sense of occasion, regardless of how many times you\'ve done it.',
    thingsToDo: ['Walk the full span for the best views', 'Photograph the skyline from the far side', 'Explore the neighbourhood at the bridge\'s end'],
    whatToLookOutFor: ['Cyclists sharing the path — stay in the pedestrian lane', 'The best skyline angles come from the far approach', 'Historic plaques and structural details on the towers'],
    whatToBring: ['Comfortable walking shoes', 'Wind protection — it\'s breezy over the water', 'A wide-angle lens for the span photos'],
    recommendedDuration: '1–2 hours',
    bestTimeToGo: 'Sunrise or sunset',
  },
  /* Historical */
  'hi-1': {
    locationLine: 'Historical · City Art Museum',
    editorialDescription: 'This city art museum houses works spanning thousands of years of human creativity. From ancient artefacts to modern masterworks, each gallery unfolds like a chapter of civilisation\'s story. Give yourself permission to wander without a strict plan — great museums reward curiosity above all.',
    thingsToDo: ['Visit the headline permanent collections', 'Explore the special exhibition galleries', 'Walk through the rooftop garden or terrace in season'],
    whatToLookOutFor: ['Discounted or free admission for local residents — check eligibility', 'Late-night opening hours on select evenings with live music', 'Rotating special exhibitions throughout the year'],
    whatToBring: ['Comfortable shoes — the museum is extensive', 'A light bag for security screening', 'A sketchbook if you\'re artistically inclined'],
    recommendedDuration: '3–5 hours',
    bestTimeToGo: 'Weekday mornings for fewer crowds',
  },
  'hi-2': {
    locationLine: 'Historical · National Monument',
    editorialDescription: 'This national monument has stood as an enduring symbol since its founding. The on-site museum tells its story with depth and care, while accessing the upper levels offers intimate views you\'ll remember long after your visit. Book in advance — popular access tiers sell out well ahead.',
    thingsToDo: ['Visit the on-site museum', 'Book upper-level access tickets well in advance', 'Take the audio tour for historical context'],
    whatToLookOutFor: ['Premium access tickets sell out months ahead — plan early', 'The approach journey itself often offers excellent views', 'Security screening is thorough — allow extra time'],
    whatToBring: ['Valid photo ID', 'Sunscreen and water for outdoor sections', 'Comfortable shoes for stair climbing'],
    recommendedDuration: '3–4 hours',
    bestTimeToGo: 'First entry of the morning',
  },
  'hi-3': {
    locationLine: 'Historical · Heritage Museum',
    editorialDescription: 'This heritage museum traces the deeply personal stories of those who shaped the region\'s identity. The restored main hall is now a beautifully curated space that brings history to life through photographs, personal effects, and immersive storytelling. It is moving, meticulously presented, and impossible to forget.',
    thingsToDo: ['Tour the main heritage hall', 'Search for family or regional connections in the records', 'Watch the documentary film in the theatre'],
    whatToLookOutFor: ['Free guided tours offered by knowledgeable rangers — excellent value', 'Allow time for the return journey depending on location', 'Special access tours for specialist interests'],
    whatToBring: ['Any relevant personal or family records if you have them', 'Comfortable shoes', 'Tissues — it can be an emotional experience'],
    recommendedDuration: '2–3 hours',
    bestTimeToGo: 'Morning, ideally paired with nearby attractions',
  },
};

/**
 * Maps discovercategories.slug values to places.category values.
 * Used only as a fallback when discovercategories.places_category is
 * unavailable (i.e. when falling back to local dummy categories).
 * When categories come from the DB, placesCategory on CategoryItem
 * is used directly and this mapping is bypassed.
 *
 * Values must match the actual places.category column in the database:
 *   top-places  → topplaces
 *   local-spots → localspots
 *   local       → localspots  (fallback category slug)
 *   (others match directly)
 *
 * Categories that map to null have no equivalent places.category in the
 * live DB ('fun', 'historical', 'family', 'relaxation', 'events' are
 * fallback-only categories not present in discovercategories). A null
 * mapping means no category filter is applied and all active places are
 * returned — the UI then shows whatever the DB has.
 */
export const CATEGORY_SLUG_TO_PLACES_CATEGORY: Record<string, string | null> = {
  'top-places': 'topplaces',
  'dining': 'dining',
  'nature': 'nature',
  'nightlife': 'nightlife',
  'shopping': 'shopping',
  'fun': null,        // fallback-only category; no DB equivalent
  'historical': null, // fallback-only category; no DB equivalent
  'local': 'localspots',
  'local-spots': 'localspots',
  'family': null,     // fallback-only category; no DB equivalent
  'relaxation': null, // fallback-only category; no DB equivalent
  'events': null,     // fallback-only category; no DB equivalent
};
