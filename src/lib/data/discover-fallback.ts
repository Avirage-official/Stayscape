/**
 * Fallback data for the Discover panel.
 * Extracted from DiscoverPanel.tsx and PlaceDetailDialog.tsx so it can be
 * reused across components, tests, and server-side logic without pulling in
 * React or 'use client'.
 */

/* ─── Interfaces ─── */

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  image: string;
  subtitle: string;
  /** Mapped from discovercategories.places_category — used to filter places.category. */
  places_category?: string | null;
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
    { id: 'tp-1', name: 'Central Park', category: 'Top Places', description: 'A sprawling 843-acre park in the heart of Manhattan with walking trails, lakes, and gardens.', rating: 4.9, distance: '0.5 mi', gradient: 'from-emerald-900/80 via-emerald-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'tp-2', name: 'Empire State Building', category: 'Top Places', description: 'Iconic Art Deco skyscraper with panoramic views of the city from the 86th floor.', rating: 4.8, distance: '0.8 mi', gradient: 'from-blue-900/80 via-blue-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'tp-3', name: 'Times Square', category: 'Top Places', description: 'Dazzling neon lights, Broadway theaters, and vibrant energy at every hour.', rating: 4.5, distance: '0.4 mi', gradient: 'from-purple-900/80 via-purple-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'tp-4', name: 'Brooklyn Bridge', category: 'Top Places', description: 'Walk across this iconic 1883 suspension bridge for stunning views of the skyline.', rating: 4.8, distance: '3.2 mi', gradient: 'from-slate-800/80 via-slate-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  historical: [
    { id: 'hi-1', name: 'Metropolitan Museum', category: 'Historical', description: 'Over 5,000 years of art from around the globe. One of the largest museums in the world.', rating: 4.9, distance: '0.6 mi', gradient: 'from-amber-900/80 via-amber-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1575384843394-f89e6e3c5c39?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'hi-2', name: 'Statue of Liberty', category: 'Historical', description: 'The iconic symbol of freedom standing on Liberty Island since 1886.', rating: 4.8, distance: '5.1 mi', gradient: 'from-teal-900/80 via-teal-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'hi-3', name: 'Ellis Island', category: 'Historical', description: 'Explore the gateway through which millions of immigrants entered America.', rating: 4.7, distance: '5.2 mi', gradient: 'from-stone-800/80 via-stone-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  fun: [
    { id: 'fu-1', name: 'Coney Island', category: 'Fun Places', description: 'Classic boardwalk amusement park with rides, games, and beachfront fun.', rating: 4.4, distance: '12 mi', gradient: 'from-yellow-900/80 via-yellow-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fu-2', name: 'Top of the Rock', category: 'Fun Places', description: 'Stunning 360-degree views of Central Park and the Manhattan skyline.', rating: 4.8, distance: '0.3 mi', gradient: 'from-sky-900/80 via-sky-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fu-3', name: 'Chelsea Market', category: 'Fun Places', description: 'A vibrant indoor marketplace with artisanal food vendors and unique shops.', rating: 4.6, distance: '1.8 mi', gradient: 'from-rose-900/80 via-rose-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  shopping: [
    { id: 'sh-1', name: 'Fifth Avenue', category: 'Shopping', description: 'The world-famous shopping street with flagship stores from top designers.', rating: 4.7, distance: '0.2 mi', gradient: 'from-fuchsia-900/80 via-fuchsia-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'sh-2', name: 'SoHo District', category: 'Shopping', description: 'Trendy neighborhood with designer boutiques, galleries, and cast-iron architecture.', rating: 4.6, distance: '2.5 mi', gradient: 'from-violet-900/80 via-violet-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'sh-3', name: 'Brooklyn Flea', category: 'Shopping', description: 'Weekly market featuring vintage clothing, antiques, and local artisan goods.', rating: 4.5, distance: '4.1 mi', gradient: 'from-amber-900/80 via-amber-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1555992457-b8fefdd09bb1?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  dining: [
    { id: 'di-1', name: 'Le Bernardin', category: 'Dining', description: 'Michelin three-star seafood restaurant with exquisite tasting menus.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/80 via-red-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'di-2', name: 'Nobu', category: 'Dining', description: 'Iconic fusion restaurant known for innovative dishes and premium ingredients.', rating: 4.8, distance: '0.3 mi', gradient: 'from-orange-900/80 via-orange-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'di-3', name: 'Peter Luger', category: 'Dining', description: 'Brooklyn institution serving USDA Prime dry-aged steaks since 1887.', rating: 4.7, distance: '3.8 mi', gradient: 'from-stone-800/80 via-stone-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'di-4', name: 'Eataly NYC', category: 'Dining', description: 'Vast Italian food hall with multiple restaurants, counters, and gourmet groceries.', rating: 4.6, distance: '1.2 mi', gradient: 'from-green-900/80 via-green-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  local: [
    { id: 'lo-1', name: 'Washington Square Park', category: 'Local Spots', description: 'Lively park known for its arch, fountain, street performers, and community feel.', rating: 4.6, distance: '2.1 mi', gradient: 'from-lime-900/80 via-lime-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'lo-2', name: 'East Village', category: 'Local Spots', description: 'Eclectic neighborhood with indie shops, diverse eateries, and vibrant nightlife.', rating: 4.5, distance: '2.8 mi', gradient: 'from-orange-900/80 via-orange-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'lo-3', name: 'Chinatown', category: 'Local Spots', description: 'Bustling neighborhood with authentic restaurants, shops, and cultural landmarks.', rating: 4.4, distance: '3.5 mi', gradient: 'from-red-900/80 via-red-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1470219556762-1fd5b55f7173?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  nature: [
    { id: 'na-1', name: 'The High Line', category: 'Nature', description: 'A 1.45-mile elevated linear park built on a historic freight rail line above Manhattan.', rating: 4.8, distance: '1.5 mi', gradient: 'from-emerald-900/80 via-emerald-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'na-2', name: 'Hudson River Park', category: 'Nature', description: 'A five-mile park along the Hudson with biking trails, piers, and sunset views.', rating: 4.7, distance: '1.2 mi', gradient: 'from-cyan-900/80 via-cyan-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'na-3', name: 'New York Botanical Garden', category: 'Nature', description: '250 acres of gardens, forests, and world-class exhibitions in the Bronx.', rating: 4.7, distance: '9.5 mi', gradient: 'from-teal-900/80 via-teal-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  family: [
    { id: 'fa-1', name: 'American Museum of Natural History', category: 'Family', description: 'Explore dinosaurs, ocean life, space, and cultures of the world.', rating: 4.8, distance: '0.7 mi', gradient: 'from-blue-900/80 via-blue-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fa-2', name: 'Central Park Zoo', category: 'Family', description: 'Compact zoo with sea lions, penguins, and a tropical rainforest exhibit.', rating: 4.5, distance: '0.4 mi', gradient: 'from-green-900/80 via-green-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'fa-3', name: 'Intrepid Museum', category: 'Family', description: 'Aircraft carrier museum with a space shuttle, submarine, and flight simulators.', rating: 4.6, distance: '1.1 mi', gradient: 'from-slate-800/80 via-slate-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1569183091671-696402586b9c?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  nightlife: [
    { id: 'ni-1', name: 'Bemelmans Bar', category: 'Nightlife', description: 'Elegant Art Deco bar in The Carlyle with live jazz and hand-painted murals.', rating: 4.7, distance: '0.3 mi', gradient: 'from-amber-900/80 via-amber-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ni-2', name: 'The Rooftop Bar', category: 'Nightlife', description: 'Panoramic city views with craft cocktails and a sophisticated atmosphere.', rating: 4.6, distance: '0.1 mi', gradient: 'from-indigo-900/80 via-indigo-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ni-3', name: 'Sleep No More', category: 'Nightlife', description: 'A groundbreaking immersive theatrical experience set in a transformed hotel.', rating: 4.8, distance: '1.6 mi', gradient: 'from-neutral-800/80 via-neutral-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1519214605650-76a613ee3245?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  relaxation: [
    { id: 're-1', name: 'Aire Ancient Baths', category: 'Wellness', description: 'A luxurious underground thermal bath experience inspired by ancient traditions.', rating: 4.9, distance: '2.3 mi', gradient: 'from-sky-900/80 via-sky-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 're-2', name: 'QC NY Spa', category: 'Wellness', description: 'Italian-inspired spa on Governors Island with harbor views and thermal rituals.', rating: 4.7, distance: '4.0 mi', gradient: 'from-teal-900/80 via-teal-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6f?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 're-3', name: 'The Spa at Mandarin Oriental', category: 'Wellness', description: 'Luxury spa with panoramic views, offering holistic treatments and relaxation.', rating: 4.8, distance: '0.6 mi', gradient: 'from-violet-900/80 via-violet-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
  events: [
    { id: 'ev-1', name: 'Broadway Shows', category: 'Events', description: 'World-renowned musicals and plays in the iconic Theater District.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/80 via-red-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ev-2', name: 'Madison Square Garden', category: 'Events', description: 'Legendary arena hosting concerts, sports, and special performances.', rating: 4.7, distance: '0.9 mi', gradient: 'from-orange-900/80 via-orange-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=500&fit=crop', bookingUrl: '#' },
    { id: 'ev-3', name: 'Lincoln Center', category: 'Events', description: 'World-class performing arts center with opera, ballet, symphony, and film.', rating: 4.8, distance: '0.7 mi', gradient: 'from-rose-900/80 via-rose-950/60 to-black/80', image: 'https://images.unsplash.com/photo-1520095972714-909e91b038e5?w=800&h=500&fit=crop', bookingUrl: '#' },
  ],
};

/* ─── Local insights ─── */

export const FALLBACK_LOCAL_INSIGHTS: InsightCard[] = [
  { id: 'ins-1', title: 'Language', subtitle: 'Communication', icon: '💬', content: 'English is the primary language. Spanish is widely spoken. Hotel staff typically speak multiple languages.' },
  { id: 'ins-2', title: 'Tipping', subtitle: 'Etiquette', icon: '💳', content: 'Standard tip: 18-20% at restaurants, $1-2 per drink at bars, $2-5 per day for housekeeping.' },
  { id: 'ins-3', title: 'Transport', subtitle: 'Getting around', icon: '🚇', content: 'MetroCard or OMNY tap for subway/bus. Yellow cabs and rideshare apps are everywhere. Walking is often fastest.' },
  { id: 'ins-4', title: 'Currency', subtitle: 'Money', icon: '💵', content: 'US Dollar (USD). Cards accepted almost everywhere. ATMs widely available. Some street vendors cash only.' },
  { id: 'ins-5', title: 'Weather', subtitle: 'December', icon: '🌡', content: 'Cold: 32-42°F (0-6°C). Dress in layers. Holiday markets and decorations throughout the city.' },
  { id: 'ins-6', title: 'Safety', subtitle: 'Stay aware', icon: '🛡', content: 'Generally safe in tourist areas. Stay alert in crowds. Keep valuables secure. Use well-lit streets at night.' },
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
    locationLine: 'Central Manhattan · New York',
    editorialDescription: 'Central Park is the green heart of Manhattan — 843 acres of winding paths, serene lakes, and sculpted gardens that offer a tranquil counterpoint to the city\'s relentless energy. Whether you\'re drawn to the quiet reflection of the Bethesda Fountain or the playful energy of the Sheep Meadow, the park reveals a different character with every visit.',
    thingsToDo: ['Walk the Jacqueline Kennedy Onassis Reservoir loop', 'Visit Bethesda Terrace and Fountain', 'Row a boat on The Lake', 'Explore the Conservatory Garden'],
    whatToLookOutFor: ['Street performers near Bethesda Fountain', 'Seasonal flower displays in the Shakespeare Garden', 'Red-tailed hawks nesting in winter months'],
    whatToBring: ['Comfortable walking shoes', 'A light jacket for breezy afternoons', 'A camera for the scenic views'],
    recommendedDuration: '2–4 hours',
    bestTimeToGo: 'Early morning or golden hour',
  },
  'tp-2': {
    locationLine: 'Midtown Manhattan · New York',
    editorialDescription: 'Rising 1,454 feet above Fifth Avenue, the Empire State Building remains one of the most recognizable structures on earth. The Art Deco masterpiece offers sweeping 360-degree views from the 86th-floor observatory, and the recently restored lobby is itself worth the visit — a cathedral of geometric marble and metalwork.',
    thingsToDo: ['Take in the 86th-floor open-air observation deck', 'Visit the Art Deco lobby exhibit', 'Catch the sunset for golden-hour views'],
    whatToLookOutFor: ['Tower lighting changes nightly — check the schedule', 'Clear days offer visibility up to 80 miles', 'The building\'s distinctive silhouette after dark'],
    whatToBring: ['Valid photo ID for security', 'A warm layer — the observation deck is open-air', 'Your best camera lens'],
    recommendedDuration: '1.5–2 hours',
    bestTimeToGo: 'Late afternoon into sunset',
  },
  'tp-3': {
    locationLine: 'Theater District · New York',
    editorialDescription: 'Times Square is sensory immersion at its most vivid — cascading LED displays, Broadway marquees, and the constant hum of millions of visitors from every corner of the world. It\'s best experienced on foot, at night, when the neon transforms the crossroads into something closer to art installation than intersection.',
    thingsToDo: ['Walk through the pedestrian plazas', 'Browse the TKTS booth for same-day Broadway tickets', 'People-watch from the red glass steps'],
    whatToLookOutFor: ['Costumed performers expecting tips for photos', 'Flash sales at the TKTS booth for matinees', 'The midnight countdown ball at One Times Square'],
    whatToBring: ['Comfortable shoes for walking on pavement', 'A secure bag — it gets crowded', 'Your sense of wonder'],
    recommendedDuration: '1–2 hours',
    bestTimeToGo: 'After dark for the full neon effect',
  },
  'tp-4': {
    locationLine: 'Lower Manhattan to Brooklyn · New York',
    editorialDescription: 'The Brooklyn Bridge is more than a crossing — it\'s a 1.1-mile promenade suspended between two of New York\'s most vibrant boroughs. Walking its wooden planks above the East River, framed by Gothic stone arches and steel cables, is one of the city\'s most iconic experiences. Start from Brooklyn for the best Manhattan skyline views.',
    thingsToDo: ['Walk the full span from Brooklyn to Manhattan', 'Photograph the skyline from the Brooklyn side', 'Explore DUMBO and Brooklyn Bridge Park after crossing'],
    whatToLookOutFor: ['Cyclists sharing the path — stay in the pedestrian lane', 'Best skyline photos come facing Manhattan (walk from Brooklyn)', 'Historic plaques embedded in the stone towers'],
    whatToBring: ['Comfortable walking shoes', 'Wind protection — it\'s breezy over the river', 'A camera with a wide-angle lens'],
    recommendedDuration: '1–2 hours',
    bestTimeToGo: 'Sunrise or sunset',
  },
  /* Historical */
  'hi-1': {
    locationLine: 'Upper East Side · New York',
    editorialDescription: 'The Metropolitan Museum of Art houses over two million works spanning 5,000 years of human creativity. From Egyptian temples to Impressionist masterworks, each gallery unfolds like a chapter of civilization\'s story. Give yourself permission to wander without a plan — the Met rewards curiosity above all.',
    thingsToDo: ['Visit the Temple of Dendur in the Egyptian Wing', 'Explore the European Paintings galleries', 'Walk through the rooftop garden in season'],
    whatToLookOutFor: ['The "pay what you wish" admission for NY residents', 'Friday and Saturday late hours with live music', 'Rotating special exhibitions'],
    whatToBring: ['Comfortable shoes — the museum is enormous', 'A light bag for security screening', 'A sketchbook if you\'re artistically inclined'],
    recommendedDuration: '3–5 hours',
    bestTimeToGo: 'Weekday mornings for fewer crowds',
  },
  'hi-2': {
    locationLine: 'Liberty Island · New York Harbor',
    editorialDescription: 'Lady Liberty has greeted arrivals to New York Harbor since 1886. Standing 305 feet from base to torch, she remains an enduring symbol of possibility. The pedestal museum tells her story from French gift to American icon, while the crown offers intimate views you\'ll remember forever.',
    thingsToDo: ['Visit the pedestal museum', 'Book a crown access ticket well in advance', 'Take the audio tour for historical context'],
    whatToLookOutFor: ['Crown tickets sell out months ahead', 'The ferry ride itself offers stunning harbor views', 'Security screening is airport-level — plan accordingly'],
    whatToBring: ['Valid photo ID', 'Sunscreen and water for outdoor wait times', 'Comfortable shoes for stair climbing'],
    recommendedDuration: '3–4 hours (including ferry)',
    bestTimeToGo: 'First ferry of the morning',
  },
  'hi-3': {
    locationLine: 'Upper New York Bay · New York Harbor',
    editorialDescription: 'Ellis Island processed over 12 million immigrants between 1892 and 1954. The restored main hall — with its soaring vaulted ceiling and tiled arches — is now a museum that traces the deeply personal stories of those who arrived seeking a new life. It\'s moving, beautifully curated, and impossible to forget.',
    thingsToDo: ['Tour the main immigration hall', 'Search for family names on the American Immigrant Wall of Honor', 'Watch the documentary film in the theater'],
    whatToLookOutFor: ['The free ranger-led tours are excellent', 'Allow time for the ferry schedule back', 'The hospital complex (hard hat tour) for the adventurous'],
    whatToBring: ['Family immigration records if you have them', 'Comfortable shoes', 'Tissues — it can be emotional'],
    recommendedDuration: '2–3 hours',
    bestTimeToGo: 'Morning, paired with Statue of Liberty',
  },
};

/**
 * Maps discovercategories.slug values to places.category values.
 * Used only as a fallback when discovercategories.places_category is
 * unavailable (i.e. when falling back to local dummy categories).
 * When categories come from the DB, places_category on CategoryItem
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
