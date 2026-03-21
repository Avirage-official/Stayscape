'use client';

import { useState, useRef, useCallback } from 'react';

/* ─── Category data ─── */

interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  type: 'location' | 'info';
}

const locationCategories: CategoryItem[] = [
  { id: 'top-places', label: 'Top Places', icon: '⭐', type: 'location' },
  { id: 'historical', label: 'Historical', icon: '🏛', type: 'location' },
  { id: 'fun', label: 'Fun Places', icon: '🎡', type: 'location' },
  { id: 'shopping', label: 'Shopping', icon: '🛍', type: 'location' },
  { id: 'dining', label: 'Dining', icon: '🍽', type: 'location' },
  { id: 'local', label: 'Local Spots', icon: '📍', type: 'location' },
  { id: 'nature', label: 'Nature', icon: '🌿', type: 'location' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', type: 'location' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙', type: 'location' },
  { id: 'relaxation', label: 'Wellness', icon: '🧘', type: 'location' },
  { id: 'events', label: 'Events', icon: '🎭', type: 'location' },
];

const infoCategories: CategoryItem[] = [
  { id: 'language', label: 'Local Language', icon: '🗣', type: 'info' },
  { id: 'phrases', label: 'Common Phrases', icon: '💬', type: 'info' },
  { id: 'meanings', label: 'Say & Mean', icon: '🔤', type: 'info' },
  { id: 'etiquette', label: 'Etiquette', icon: '🤝', type: 'info' },
  { id: 'culture', label: 'Culture', icon: '🎎', type: 'info' },
  { id: 'safety', label: 'Safety Tips', icon: '🛡', type: 'info' },
  { id: 'transport', label: 'Transport', icon: '🚇', type: 'info' },
  { id: 'currency', label: 'Currency', icon: '💱', type: 'info' },
  { id: 'weather', label: 'Weather', icon: '☀️', type: 'info' },
];

/* ─── Place & info card data ─── */

interface PlaceCard {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  rating: number;
  distance: string;
  gradient: string;
  bookingUrl: string;
}

interface InfoCard {
  id: string;
  title: string;
  content: string;
  detail: string;
}

const placesByCategory: Record<string, PlaceCard[]> = {
  'top-places': [
    { id: 'tp-1', name: 'Central Park', subtitle: 'Iconic Urban Oasis', description: 'A sprawling 843-acre park in the heart of Manhattan with walking trails, lakes, and gardens.', rating: 4.9, distance: '0.5 mi', gradient: 'from-emerald-900/60 to-teal-900/40', bookingUrl: '#' },
    { id: 'tp-2', name: 'Empire State Building', subtitle: 'Observation Deck', description: 'Iconic Art Deco skyscraper with panoramic views of the city from the 86th floor.', rating: 4.8, distance: '0.8 mi', gradient: 'from-blue-900/60 to-indigo-900/40', bookingUrl: '#' },
    { id: 'tp-3', name: 'Times Square', subtitle: 'The Crossroads of the World', description: 'Dazzling neon lights, Broadway theaters, and vibrant energy at every hour.', rating: 4.5, distance: '0.4 mi', gradient: 'from-purple-900/60 to-pink-900/40', bookingUrl: '#' },
    { id: 'tp-4', name: 'Brooklyn Bridge', subtitle: 'Historic Landmark', description: 'Walk across this iconic 1883 suspension bridge for stunning views of the skyline.', rating: 4.8, distance: '3.2 mi', gradient: 'from-slate-800/60 to-zinc-900/40', bookingUrl: '#' },
  ],
  historical: [
    { id: 'hi-1', name: 'Metropolitan Museum', subtitle: 'World-Class Art', description: 'Over 5,000 years of art from around the globe. One of the largest museums in the world.', rating: 4.9, distance: '0.6 mi', gradient: 'from-amber-900/60 to-orange-900/40', bookingUrl: '#' },
    { id: 'hi-2', name: 'Statue of Liberty', subtitle: 'National Monument', description: 'The iconic symbol of freedom standing on Liberty Island since 1886.', rating: 4.8, distance: '5.1 mi', gradient: 'from-teal-900/60 to-cyan-900/40', bookingUrl: '#' },
    { id: 'hi-3', name: 'Ellis Island', subtitle: 'Immigration Museum', description: 'Explore the gateway through which millions of immigrants entered America.', rating: 4.7, distance: '5.2 mi', gradient: 'from-stone-800/60 to-neutral-900/40', bookingUrl: '#' },
  ],
  fun: [
    { id: 'fu-1', name: 'Coney Island', subtitle: 'Amusement & Beach', description: 'Classic boardwalk amusement park with rides, games, and beachfront fun.', rating: 4.4, distance: '12 mi', gradient: 'from-yellow-900/60 to-orange-900/40', bookingUrl: '#' },
    { id: 'fu-2', name: 'Top of the Rock', subtitle: 'Observation Deck', description: 'Stunning 360-degree views of Central Park and the Manhattan skyline.', rating: 4.8, distance: '0.3 mi', gradient: 'from-sky-900/60 to-blue-900/40', bookingUrl: '#' },
    { id: 'fu-3', name: 'Chelsea Market', subtitle: 'Food Hall & Shopping', description: 'A vibrant indoor marketplace with artisanal food vendors and unique shops.', rating: 4.6, distance: '1.8 mi', gradient: 'from-rose-900/60 to-red-900/40', bookingUrl: '#' },
  ],
  shopping: [
    { id: 'sh-1', name: 'Fifth Avenue', subtitle: 'Luxury Shopping', description: 'The world-famous shopping street with flagship stores from top designers.', rating: 4.7, distance: '0.2 mi', gradient: 'from-fuchsia-900/60 to-purple-900/40', bookingUrl: '#' },
    { id: 'sh-2', name: 'SoHo District', subtitle: 'Boutique & Art', description: 'Trendy neighborhood with designer boutiques, galleries, and cast-iron architecture.', rating: 4.6, distance: '2.5 mi', gradient: 'from-violet-900/60 to-indigo-900/40', bookingUrl: '#' },
    { id: 'sh-3', name: 'Brooklyn Flea', subtitle: 'Vintage Market', description: 'Weekly market featuring vintage clothing, antiques, and local artisan goods.', rating: 4.5, distance: '4.1 mi', gradient: 'from-amber-900/60 to-yellow-900/40', bookingUrl: '#' },
  ],
  dining: [
    { id: 'di-1', name: 'Le Bernardin', subtitle: 'Fine French Dining', description: 'Michelin three-star seafood restaurant with exquisite tasting menus.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/60 to-rose-900/40', bookingUrl: '#' },
    { id: 'di-2', name: 'Nobu', subtitle: 'Japanese-Peruvian Fusion', description: 'Iconic fusion restaurant known for innovative dishes and premium ingredients.', rating: 4.8, distance: '0.3 mi', gradient: 'from-orange-900/60 to-amber-900/40', bookingUrl: '#' },
    { id: 'di-3', name: 'Peter Luger', subtitle: 'Legendary Steakhouse', description: 'Brooklyn institution serving USDA Prime dry-aged steaks since 1887.', rating: 4.7, distance: '3.8 mi', gradient: 'from-stone-800/60 to-red-900/40', bookingUrl: '#' },
    { id: 'di-4', name: 'Eataly NYC', subtitle: 'Italian Marketplace', description: 'Vast Italian food hall with multiple restaurants, counters, and gourmet groceries.', rating: 4.6, distance: '1.2 mi', gradient: 'from-green-900/60 to-emerald-900/40', bookingUrl: '#' },
  ],
  local: [
    { id: 'lo-1', name: 'Washington Square Park', subtitle: 'Greenwich Village Hub', description: 'Lively park known for its arch, fountain, street performers, and community feel.', rating: 4.6, distance: '2.1 mi', gradient: 'from-lime-900/60 to-green-900/40', bookingUrl: '#' },
    { id: 'lo-2', name: 'East Village', subtitle: 'Neighborhood Walk', description: 'Eclectic neighborhood with indie shops, diverse eateries, and vibrant nightlife.', rating: 4.5, distance: '2.8 mi', gradient: 'from-orange-900/60 to-red-900/40', bookingUrl: '#' },
    { id: 'lo-3', name: 'Chinatown', subtitle: 'Cultural District', description: 'Bustling neighborhood with authentic restaurants, shops, and cultural landmarks.', rating: 4.4, distance: '3.5 mi', gradient: 'from-red-900/60 to-amber-900/40', bookingUrl: '#' },
  ],
  nature: [
    { id: 'na-1', name: 'The High Line', subtitle: 'Elevated Park', description: 'A 1.45-mile elevated linear park built on a historic freight rail line above Manhattan.', rating: 4.8, distance: '1.5 mi', gradient: 'from-emerald-900/60 to-green-900/40', bookingUrl: '#' },
    { id: 'na-2', name: 'Hudson River Park', subtitle: 'Waterfront Trail', description: 'A five-mile park along the Hudson with biking trails, piers, and sunset views.', rating: 4.7, distance: '1.2 mi', gradient: 'from-cyan-900/60 to-blue-900/40', bookingUrl: '#' },
    { id: 'na-3', name: 'New York Botanical Garden', subtitle: 'Living Museum', description: '250 acres of gardens, forests, and world-class exhibitions in the Bronx.', rating: 4.7, distance: '9.5 mi', gradient: 'from-teal-900/60 to-emerald-900/40', bookingUrl: '#' },
  ],
  family: [
    { id: 'fa-1', name: 'American Museum of Natural History', subtitle: 'Science & Discovery', description: 'Explore dinosaurs, ocean life, space, and cultures of the world.', rating: 4.8, distance: '0.7 mi', gradient: 'from-blue-900/60 to-cyan-900/40', bookingUrl: '#' },
    { id: 'fa-2', name: 'Central Park Zoo', subtitle: 'Wildlife Experience', description: 'Compact zoo with sea lions, penguins, and a tropical rainforest exhibit.', rating: 4.5, distance: '0.4 mi', gradient: 'from-green-900/60 to-lime-900/40', bookingUrl: '#' },
    { id: 'fa-3', name: 'Intrepid Museum', subtitle: 'Sea, Air & Space', description: 'Aircraft carrier museum with a space shuttle, submarine, and flight simulators.', rating: 4.6, distance: '1.1 mi', gradient: 'from-slate-800/60 to-sky-900/40', bookingUrl: '#' },
  ],
  nightlife: [
    { id: 'ni-1', name: 'Bemelmans Bar', subtitle: 'Classic Cocktail Bar', description: 'Elegant Art Deco bar in The Carlyle with live jazz and hand-painted murals.', rating: 4.7, distance: '0.3 mi', gradient: 'from-amber-900/60 to-yellow-900/40', bookingUrl: '#' },
    { id: 'ni-2', name: 'The Rooftop Bar', subtitle: 'Sky Lounge', description: 'Panoramic city views with craft cocktails and a sophisticated atmosphere.', rating: 4.6, distance: '0.1 mi', gradient: 'from-indigo-900/60 to-purple-900/40', bookingUrl: '#' },
    { id: 'ni-3', name: 'Sleep No More', subtitle: 'Immersive Theater', description: 'A groundbreaking immersive theatrical experience set in a transformed hotel.', rating: 4.8, distance: '1.6 mi', gradient: 'from-neutral-800/60 to-zinc-900/40', bookingUrl: '#' },
  ],
  relaxation: [
    { id: 're-1', name: 'Aire Ancient Baths', subtitle: 'Thermal Spa', description: 'A luxurious underground thermal bath experience inspired by ancient traditions.', rating: 4.9, distance: '2.3 mi', gradient: 'from-sky-900/60 to-cyan-900/40', bookingUrl: '#' },
    { id: 're-2', name: 'QC NY Spa', subtitle: 'Governors Island', description: 'Italian-inspired spa on Governors Island with harbor views and thermal rituals.', rating: 4.7, distance: '4.0 mi', gradient: 'from-teal-900/60 to-sky-900/40', bookingUrl: '#' },
    { id: 're-3', name: 'The Spa at Mandarin Oriental', subtitle: 'Hotel Spa', description: 'Luxury spa with panoramic views, offering holistic treatments and relaxation.', rating: 4.8, distance: '0.6 mi', gradient: 'from-violet-900/60 to-purple-900/40', bookingUrl: '#' },
  ],
  events: [
    { id: 'ev-1', name: 'Broadway Shows', subtitle: 'Theater District', description: 'World-renowned musicals and plays in the iconic Theater District.', rating: 4.9, distance: '0.4 mi', gradient: 'from-red-900/60 to-pink-900/40', bookingUrl: '#' },
    { id: 'ev-2', name: 'Madison Square Garden', subtitle: 'Live Events', description: 'Legendary arena hosting concerts, sports, and special performances.', rating: 4.7, distance: '0.9 mi', gradient: 'from-orange-900/60 to-red-900/40', bookingUrl: '#' },
    { id: 'ev-3', name: 'Lincoln Center', subtitle: 'Performing Arts', description: 'World-class performing arts center with opera, ballet, symphony, and film.', rating: 4.8, distance: '0.7 mi', gradient: 'from-rose-900/60 to-pink-900/40', bookingUrl: '#' },
  ],
};

const infoByCategory: Record<string, InfoCard[]> = {
  language: [
    { id: 'ln-1', title: 'Official Language', content: 'English is the primary language. Over 200 languages are spoken across the city.', detail: 'Spanish is the second most common language, followed by Chinese, Russian, and French Creole.' },
    { id: 'ln-2', title: 'Language Diversity', content: 'NYC is one of the most linguistically diverse cities in the world.', detail: 'You can hear dozens of languages just walking through neighborhoods like Jackson Heights, Flushing, and Brighton Beach.' },
  ],
  phrases: [
    { id: 'ph-1', title: 'Hailing a Cab', content: '"Taxi!" — Raise your hand with arm extended to flag down a yellow cab.', detail: 'Available cabs have their roof light on. If the light is off, the cab is occupied.' },
    { id: 'ph-2', title: 'Ordering Coffee', content: '"Can I get a regular coffee?" — In NYC, regular means with milk and sugar.', detail: 'At delis and bodegas, "regular" coffee always comes with cream and sugar unless specified otherwise.' },
    { id: 'ph-3', title: 'Subway Direction', content: '"Uptown" means north, "Downtown" means south. "Crosstown" means east-west.', detail: 'Always check if you need the Uptown or Downtown platform before entering the subway station.' },
  ],
  meanings: [
    { id: 'me-1', title: '"The City"', content: 'When locals say "the city," they almost always mean Manhattan.', detail: 'Even people living in Brooklyn or Queens refer to Manhattan as "the city."' },
    { id: 'me-2', title: '"Standing on Line"', content: 'New Yorkers say "on line" instead of "in line" when waiting in a queue.', detail: 'This is a distinctive New York English phrase — you will hear it everywhere.' },
    { id: 'me-3', title: '"Bodega"', content: 'A small convenience store or deli, found on nearly every block.', detail: 'Bodegas are the heart of NYC neighborhoods, open late and serving sandwiches, snacks, and essentials.' },
  ],
  etiquette: [
    { id: 'et-1', title: 'Walking Pace', content: 'Walk with purpose and keep to the right on sidewalks. Do not stop abruptly.', detail: 'New Yorkers walk fast. If you need to check your phone or a map, step to the side.' },
    { id: 'et-2', title: 'Subway Etiquette', content: 'Let people exit before boarding. Move to the center of the car.', detail: 'Do not lean on the poles, block doors, or play music without headphones.' },
    { id: 'et-3', title: 'Tipping', content: 'Tip 18–20% at restaurants, $1–2 per drink at bars, and $1–2 per bag for bellhops.', detail: 'Tipping is expected and is a significant part of service workers\u2019 income.' },
  ],
  culture: [
    { id: 'cu-1', title: 'Melting Pot', content: 'NYC is one of the most culturally diverse cities on Earth with 200+ nationalities represented.', detail: 'Each borough and neighborhood has its own distinct cultural identity and community.' },
    { id: 'cu-2', title: 'Art & Museums', content: 'Home to 80+ museums including The Met, MoMA, and the Guggenheim.', detail: 'Many museums offer pay-what-you-wish admission or free hours on specific days.' },
    { id: 'cu-3', title: 'Food Culture', content: 'NYC is a food capital — from Michelin-starred restaurants to $1 pizza slices.', detail: 'Dollar pizza slices, halal carts, and bagel shops are essential NYC food experiences.' },
  ],
  safety: [
    { id: 'sa-1', title: 'General Safety', content: 'NYC is one of the safest large cities. Stay aware of your surroundings in crowds.', detail: 'Avoid displaying expensive items in crowded areas. Keep bags zipped and in front of you on the subway.' },
    { id: 'sa-2', title: 'Emergency Numbers', content: 'Dial 911 for emergencies. For non-emergencies, dial 311.', detail: '311 can help with noise complaints, city services, and general information.' },
    { id: 'sa-3', title: 'Late Night', content: 'Stick to well-lit, populated areas late at night. Use rideshare apps for late returns.', detail: 'The subway runs 24/7 but can be less frequent late at night. Rideshare is often more comfortable.' },
  ],
  transport: [
    { id: 'tr-1', title: 'Subway System', content: 'The MTA subway is the fastest way around. A single ride is $2.90 with OMNY tap-to-pay.', detail: 'Use Apple Pay, Google Pay, or a contactless card to tap and ride. Weekly unlimited passes are also available.' },
    { id: 'tr-2', title: 'Yellow Cabs', content: 'Iconic yellow taxis are available throughout Manhattan. Hail from the curb.', detail: 'Taxis use meters. Expect a base fare plus per-mile charges. Tip 15–20% of the fare.' },
    { id: 'tr-3', title: 'Walking', content: 'Manhattan is very walkable. Most attractions in Midtown are within walking distance.', detail: 'One avenue block is about 750 feet. One street block is about 264 feet (roughly 20 per mile).' },
  ],
  currency: [
    { id: 'cy-1', title: 'US Dollar', content: 'The currency is the US Dollar (USD). Credit cards are accepted almost everywhere.', detail: 'Some small vendors and food carts may be cash-only. ATMs are widely available.' },
    { id: 'cy-2', title: 'Tipping Culture', content: 'Tips are expected: 18–20% at restaurants, 15–20% for taxis, $1–2 per drink at bars.', detail: 'Many restaurants add automatic gratuity for groups of 6 or more.' },
    { id: 'cy-3', title: 'Contactless Payment', content: 'Apple Pay, Google Pay, and contactless cards are widely accepted including on the subway.', detail: 'The OMNY system on subways and buses accepts any contactless payment method.' },
  ],
  weather: [
    { id: 'we-1', title: 'Current Season', content: 'December is winter in NYC. Expect temperatures between 30–45°F (−1 to 7°C).', detail: 'Layer up with a warm coat, scarf, and gloves. Indoor attractions are well-heated.' },
    { id: 'we-2', title: 'Best Time to Visit', content: 'Fall (Sep–Nov) and Spring (Apr–Jun) offer the best weather and fewer crowds.', detail: 'December is popular for holiday markets, Rockefeller tree, and New Year\u2019s Eve celebrations.' },
    { id: 'we-3', title: 'Holiday Season', content: 'December features holiday markets, ice skating, and stunning window displays along Fifth Avenue.', detail: 'Visit the Rockefeller Center tree, Bryant Park Winter Village, and the Union Square Holiday Market.' },
  ],
};

/* ─── Stay days (matching customer check-in / check-out) ─── */
const stayDays = [
  { label: 'Day 1 · Dec 14', value: 'dec-14' },
  { label: 'Day 2 · Dec 15', value: 'dec-15' },
  { label: 'Day 3 · Dec 16', value: 'dec-16' },
  { label: 'Day 4 · Dec 17', value: 'dec-17' },
  { label: 'Day 5 · Dec 18', value: 'dec-18' },
  { label: 'Day 6 · Dec 19', value: 'dec-19' },
];

/* ─── Sub-components ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] font-medium text-gray-500 uppercase tracking-[0.14em] mb-3 ml-0.5">
      {children}
    </h3>
  );
}

function CategoryPill({
  item,
  active,
  onClick,
}: {
  item: CategoryItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center justify-center w-[82px] h-[72px] rounded-[8px] border transition-all duration-200 cursor-pointer group ${
        active
          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/35 shadow-gold-glow'
          : 'bg-[#141414] border-[#1C1C1C] hover:border-[#2A2A2A] hover:bg-[#181818]'
      }`}
    >
      <span className="text-[20px] mb-1 transition-transform duration-200 group-hover:scale-110">
        {item.icon}
      </span>
      <span
        className={`text-[9px] font-medium tracking-wide transition-colors duration-200 ${
          active ? 'text-[#C9A84C]' : 'text-gray-400 group-hover:text-gray-300'
        }`}
      >
        {item.label}
      </span>
    </button>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-[10px] text-[#C9A84C]/80">
      {'★'.repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? '½' : ''}
      <span className="text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function DayPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (day: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-fade-in-up">
      <div className="bg-[#111111] rounded-[6px] border border-[#1C1C1C] p-3 mt-2">
        <p className="text-[10px] text-gray-400 mb-2.5">Choose a day for this activity:</p>
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {stayDays.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => onSelect(day.value)}
              className="px-2 py-[6px] rounded-[5px] text-[10px] border border-[#1C1C1C] bg-[#141414] text-gray-400 hover:border-[#C9A84C]/30 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 transition-all duration-200 cursor-pointer"
            >
              {day.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors duration-200 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function BookingConfirmation({
  placeName,
  day,
  bookingUrl,
  onDone,
}: {
  placeName: string;
  day: string;
  bookingUrl: string;
  onDone: () => void;
}) {
  const dayLabel = stayDays.find((d) => d.value === day)?.label ?? day;
  return (
    <div className="animate-fade-in-up">
      <div className="bg-[#C9A84C]/5 rounded-[6px] border border-[#C9A84C]/20 p-3 mt-2">
        <div className="flex items-start space-x-2 mb-3">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C9A84C]/12 border border-[#C9A84C]/25 flex-shrink-0 mt-0.5">
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-[#C9A84C]">
              <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] text-gray-200 font-medium">{placeName}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Scheduled for {dayLabel}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-[6px] rounded-[5px] text-[10px] font-medium bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#D4B85C] transition-colors duration-200"
          >
            Book on Partner Site →
          </a>
          <button
            type="button"
            onClick={onDone}
            className="px-3 py-[6px] rounded-[5px] text-[10px] border border-[#1C1C1C] text-gray-500 hover:text-gray-300 hover:border-[#2A2A2A] transition-all duration-200 cursor-pointer"
          >
            Done
          </button>
        </div>
        <p className="text-[9px] text-gray-600 mt-2">
          After booking, you can add the exact time to your itinerary timeline.
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export default function DiscoverPanel() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeCategoryType, setActiveCategoryType] = useState<'location' | 'info' | null>(null);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [confirmedPlace, setConfirmedPlace] = useState<{ id: string; day: string } | null>(null);

  const locationScrollRef = useRef<HTMLDivElement>(null);
  const infoScrollRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = useCallback((item: CategoryItem) => {
    if (activeCategory === item.id) {
      setActiveCategory(null);
      setActiveCategoryType(null);
    } else {
      setActiveCategory(item.id);
      setActiveCategoryType(item.type);
    }
    setAddingPlaceId(null);
    setConfirmedPlace(null);
  }, [activeCategory]);

  const handleAddClick = useCallback((placeId: string) => {
    setAddingPlaceId(placeId);
    setConfirmedPlace(null);
  }, []);

  const handleDaySelect = useCallback((placeId: string, day: string) => {
    setConfirmedPlace({ id: placeId, day });
    setAddingPlaceId(null);
  }, []);

  const handleDone = useCallback(() => {
    setConfirmedPlace(null);
  }, []);

  const scrollCarousel = useCallback((ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 200;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const places = activeCategory ? (placesByCategory[activeCategory] ?? []) : [];
  const infos = activeCategory ? (infoByCategory[activeCategory] ?? []) : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0C0C0C] animate-fade-in">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-3 border-b border-[#1A1A1A] flex-shrink-0">
        <div className="flex items-center space-x-2.5 mb-1">
          <span className="text-[14px] text-[#C9A84C]">✦</span>
          <h2 className="text-[14px] font-medium text-gray-100 tracking-wide">Discover</h2>
        </div>
        <p className="text-[11px] text-gray-500 ml-[22px]">
          Browse curated places and local insights for your stay
        </p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-5">
        {/* ── Location categories carousel ── */}
        <div>
          <SectionLabel>Places to Explore</SectionLabel>
          <div className="relative group/carousel">
            {/* Left scroll button */}
            <button
              type="button"
              onClick={() => scrollCarousel(locationScrollRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#0C0C0C]/90 border border-[#222222] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-[#333333] transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
              aria-label="Scroll left"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              ref={locationScrollRef}
              className="flex space-x-2 overflow-x-auto scrollbar-hide py-1 px-1"
            >
              {locationCategories.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  item={cat}
                  active={activeCategory === cat.id}
                  onClick={() => handleCategoryClick(cat)}
                />
              ))}
            </div>

            {/* Right scroll button */}
            <button
              type="button"
              onClick={() => scrollCarousel(locationScrollRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#0C0C0C]/90 border border-[#222222] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-[#333333] transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
              aria-label="Scroll right"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Information categories carousel ── */}
        <div>
          <SectionLabel>Local Insights</SectionLabel>
          <div className="relative group/carousel">
            <button
              type="button"
              onClick={() => scrollCarousel(infoScrollRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#0C0C0C]/90 border border-[#222222] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-[#333333] transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
              aria-label="Scroll left"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              ref={infoScrollRef}
              className="flex space-x-2 overflow-x-auto scrollbar-hide py-1 px-1"
            >
              {infoCategories.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  item={cat}
                  active={activeCategory === cat.id}
                  onClick={() => handleCategoryClick(cat)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCarousel(infoScrollRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#0C0C0C]/90 border border-[#222222] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-[#333333] transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
              aria-label="Scroll right"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Results: Place cards ── */}
        {activeCategory && activeCategoryType === 'location' && places.length > 0 && (
          <div className="animate-fade-in-up">
            <SectionLabel>
              {locationCategories.find((c) => c.id === activeCategory)?.label ?? 'Results'}
            </SectionLabel>
            <div className="space-y-2.5">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-[#141414] rounded-[6px] border border-[#1C1C1C] overflow-hidden hover-lift"
                >
                  {/* Gradient header */}
                  <div className={`h-[64px] bg-gradient-to-r ${place.gradient} relative`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <span className="text-[8px] uppercase tracking-widest text-white/60 bg-black/30 px-1.5 py-0.5 rounded-[3px]">
                        {place.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-3.5 pb-3 -mt-1">
                    <h4 className="font-serif text-[13px] text-gray-100 mb-0.5">{place.name}</h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <StarRating rating={place.rating} />
                      <span className="text-[9px] text-gray-600">·</span>
                      <span className="text-[10px] text-gray-500">{place.distance}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                      {place.description}
                    </p>

                    {/* Action area */}
                    {confirmedPlace?.id === place.id ? (
                      <BookingConfirmation
                        placeName={place.name}
                        day={confirmedPlace.day}
                        bookingUrl={place.bookingUrl}
                        onDone={handleDone}
                      />
                    ) : addingPlaceId === place.id ? (
                      <DayPicker
                        onSelect={(day) => handleDaySelect(place.id, day)}
                        onCancel={() => setAddingPlaceId(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddClick(place.id)}
                        className="flex items-center space-x-1.5 px-3 py-[6px] rounded-[5px] text-[10px] font-medium border border-[#C9A84C]/25 text-[#C9A84C] hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/40 transition-all duration-200 cursor-pointer"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 2V8M2 5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results: Info cards ── */}
        {activeCategory && activeCategoryType === 'info' && infos.length > 0 && (
          <div className="animate-fade-in-up">
            <SectionLabel>
              {infoCategories.find((c) => c.id === activeCategory)?.label ?? 'Information'}
            </SectionLabel>
            <div className="space-y-2.5">
              {infos.map((info) => (
                <InfoCardComponent key={info.id} info={info} />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!activeCategory && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="w-12 h-12 rounded-[8px] bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center mb-3">
              <span className="text-[20px]">✦</span>
            </div>
            <p className="text-[12px] text-gray-400 font-medium mb-1">Select a category</p>
            <p className="text-[10px] text-gray-600 text-center max-w-[240px]">
              Browse places to visit or learn about local culture and customs for your stay
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Info card with expandable detail ─── */

function InfoCardComponent({ info }: { info: InfoCard }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#141414] rounded-[6px] border border-[#1C1C1C] p-3.5 hover-lift">
      <h4 className="text-[12px] font-medium text-gray-200 mb-1.5">{info.title}</h4>
      <p className="text-[10px] text-gray-400 leading-relaxed">{info.content}</p>

      {expanded && (
        <p className="text-[10px] text-gray-500 leading-relaxed mt-2 pt-2 border-t border-[#1C1C1C] animate-fade-in-up">
          {info.detail}
        </p>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-[10px] text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors duration-200 cursor-pointer"
      >
        {expanded ? 'Show less' : 'Learn more →'}
      </button>
    </div>
  );
}
