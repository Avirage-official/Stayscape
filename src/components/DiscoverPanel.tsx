'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/* ─── Category data ─── */

interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  image: string;
  subtitle: string;
}

const categories: CategoryItem[] = [
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

/* ─── Place card data ─── */

interface PlaceCard {
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

const placesByCategory: Record<string, PlaceCard[]> = {
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

/* ─── Local insight data ─── */

interface InsightCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  content: string;
}

const localInsights: InsightCard[] = [
  { id: 'ins-1', title: 'Language', subtitle: 'Communication', icon: '💬', content: 'English is the primary language. Spanish is widely spoken. Hotel staff typically speak multiple languages.' },
  { id: 'ins-2', title: 'Tipping', subtitle: 'Etiquette', icon: '💳', content: 'Standard tip: 18-20% at restaurants, $1-2 per drink at bars, $2-5 per day for housekeeping.' },
  { id: 'ins-3', title: 'Transport', subtitle: 'Getting around', icon: '🚇', content: 'MetroCard or OMNY tap for subway/bus. Yellow cabs and rideshare apps are everywhere. Walking is often fastest.' },
  { id: 'ins-4', title: 'Currency', subtitle: 'Money', icon: '💵', content: 'US Dollar (USD). Cards accepted almost everywhere. ATMs widely available. Some street vendors cash only.' },
  { id: 'ins-5', title: 'Weather', subtitle: 'December', icon: '🌡', content: 'Cold: 32-42°F (0-6°C). Dress in layers. Holiday markets and decorations throughout the city.' },
  { id: 'ins-6', title: 'Safety', subtitle: 'Stay aware', icon: '🛡', content: 'Generally safe in tourist areas. Stay alert in crowds. Keep valuables secure. Use well-lit streets at night.' },
];

/* ─── Stay days ─── */
const stayDays = [
  { label: 'Day 1 · Dec 14', value: 'dec-14' },
  { label: 'Day 2 · Dec 15', value: 'dec-15' },
  { label: 'Day 3 · Dec 16', value: 'dec-16' },
  { label: 'Day 4 · Dec 17', value: 'dec-17' },
  { label: 'Day 5 · Dec 18', value: 'dec-18' },
  { label: 'Day 6 · Dec 19', value: 'dec-19' },
];

/* ─── Star rating component ─── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--discover-gold)" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-[12px] font-medium text-[var(--discover-gold)]">{rating.toFixed(1)}</span>
    </span>
  );
}

/* ─── Category carousel card ─── */
function CategoryCarouselCard({
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
      className={`
        flex-shrink-0 relative overflow-hidden rounded-2xl
        w-[130px] h-[100px] sm:w-[150px] sm:h-[110px]
        border transition-all duration-300 ease-out cursor-pointer
        group
        ${active
          ? 'border-[var(--discover-gold)] shadow-[0_0_24px_rgba(200,168,90,0.15)] scale-[1.03]'
          : 'border-[var(--discover-border)] hover:border-[var(--discover-gold)]/40 hover:shadow-[0_0_16px_rgba(200,168,90,0.08)]'
        }
      `}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${item.image})` }}
      />

      {/* Dark overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        active
          ? 'bg-gradient-to-t from-black/80 via-black/50 to-black/30'
          : 'bg-gradient-to-t from-black/75 via-black/45 to-black/25 group-hover:from-black/70 group-hover:via-black/40 group-hover:to-black/20'
      }`} />

      {/* Active glow indicator */}
      {active && (
        <div className="absolute inset-0 border-2 border-[var(--discover-gold)]/30 rounded-2xl" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-3">
        <span className="text-[18px] mb-0.5 drop-shadow-md">{item.icon}</span>
        <span className={`text-[12px] font-semibold tracking-wide leading-tight drop-shadow-md transition-colors duration-200 ${
          active ? 'text-[var(--discover-gold)]' : 'text-white/95'
        }`}>
          {item.label}
        </span>
        <span className="text-[10px] text-white/60 leading-tight mt-0.5">{item.subtitle}</span>
      </div>
    </button>
  );
}

/* ─── Hero place card ─── */
function HeroPlaceCard({
  place,
  onAdd,
  isFirst,
  idx,
}: {
  place: PlaceCard;
  onAdd: (placeId: string) => void;
  isFirst: boolean;
  idx: number;
}) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-[var(--discover-border)]
        transition-all duration-300 ease-out
        group discover-card-fade-in discover-hover-lift
        ${isFirst ? 'h-[280px] sm:h-[320px]' : 'h-[220px] sm:h-[260px]'}
      `}
      style={{ animationDelay: `${idx * 0.08}s` }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${place.image})` }}
      />

      {/* Cinematic gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${place.gradient}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Content positioned at bottom */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
        {/* Category badge + distance */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm font-medium">
            {place.category}
          </Badge>
          <span className="text-[11px] text-white/60">{place.distance}</span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-white tracking-tight leading-tight mb-1.5 drop-shadow-lg ${
          isFirst ? 'text-[22px] sm:text-[26px]' : 'text-[18px] sm:text-[20px]'
        }`}>
          {place.name}
        </h3>

        {/* Description */}
        <p className={`text-white/70 leading-relaxed mb-3 line-clamp-2 ${
          isFirst ? 'text-[13px] sm:text-[14px] max-w-[480px]' : 'text-[12px] sm:text-[13px] max-w-[400px]'
        }`}>
          {place.description}
        </p>

        {/* Rating + Add button */}
        <div className="flex items-center justify-between">
          <StarRating rating={place.rating} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdd(place.id)}
            className="
              border-[var(--discover-gold)]/60 text-[var(--discover-gold)]
              bg-[var(--discover-gold)]/10 backdrop-blur-sm
              hover:bg-[var(--discover-gold)]/20 hover:border-[var(--discover-gold)]
              rounded-lg text-[12px] h-8 px-4
              transition-all duration-200
            "
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1">
              <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Insight knowledge card ─── */
function InsightKnowledgeCard({ insight }: { insight: InsightCard }) {
  return (
    <div className="
      flex-shrink-0 w-[200px] sm:w-[220px]
      rounded-xl border border-[var(--discover-border)]
      bg-[var(--discover-card)] p-4
      transition-all duration-300 ease-out
      hover:border-[var(--discover-gold)]/30
      hover:bg-[var(--discover-active-card)]
      discover-hover-lift group
    ">
      <div className="flex items-start gap-3 mb-2.5">
        <span className="
          flex items-center justify-center w-9 h-9 rounded-lg
          bg-[var(--discover-gold-8)] border border-[var(--discover-gold-15)]
          text-[16px] flex-shrink-0
          transition-all duration-300
          group-hover:bg-[var(--discover-gold-12)]
        ">
          {insight.icon}
        </span>
        <div className="min-w-0">
          <h4 className="text-[13px] font-semibold text-[var(--discover-title)] leading-tight">{insight.title}</h4>
          <p className="text-[10px] text-[var(--discover-body)] mt-0.5">{insight.subtitle}</p>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--discover-body)]">{insight.content}</p>
    </div>
  );
}

/* ─── Add-to-day dialog ─── */
function AddToDayDialog({
  open,
  onOpenChange,
  place,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: PlaceCard | null;
  onConfirm: (placeId: string, day: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const handleConfirm = useCallback(() => {
    if (place && selectedDay) {
      onConfirm(place.id, selectedDay);
      setSelectedDay(null);
    }
  }, [place, selectedDay, onConfirm]);

  const handleOpenChange = useCallback((value: boolean) => {
    if (!value) setSelectedDay(null);
    onOpenChange(value);
  }, [onOpenChange]);

  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[380px] sm:max-w-[420px] rounded-2xl bg-[var(--discover-surface)] border-[var(--discover-border)] p-0 overflow-hidden">
        {/* Place preview header */}
        <div className="relative h-[140px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${place.image})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${place.gradient}`} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-md border-white/25 text-white/90 bg-white/10 backdrop-blur-sm mb-1.5">
              {place.category}
            </Badge>
            <h3 className="text-[18px] font-semibold text-white tracking-tight drop-shadow-lg">{place.name}</h3>
          </div>
        </div>

        <div className="p-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[14px] text-[var(--discover-title)]">Schedule this activity</DialogTitle>
            <DialogDescription className="text-[12px] text-[var(--discover-body)]">
              Choose a day within your stay to add this to your itinerary.
            </DialogDescription>
          </DialogHeader>

          {/* Day selector grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {stayDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDay(day.value)}
                className={`
                  px-3 py-2.5 rounded-xl text-[11px] font-medium
                  border transition-all duration-200 cursor-pointer
                  ${selectedDay === day.value
                    ? 'border-[var(--discover-gold)] bg-[var(--discover-gold-12)] text-[var(--discover-gold)] shadow-[0_0_12px_rgba(200,168,90,0.1)]'
                    : 'border-[var(--discover-border)] bg-[var(--discover-card)] text-[var(--discover-body)] hover:border-[var(--discover-gold)]/40 hover:text-[var(--discover-title)]'
                  }
                `}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleConfirm}
              disabled={!selectedDay}
              className="flex-1 h-10 rounded-xl text-[12px] font-semibold bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confirm
            </Button>
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="h-10 rounded-xl text-[12px] text-[var(--discover-body)] hover:text-[var(--discover-title)] px-4"
              >
                Cancel
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Success toast after adding ─── */
function SuccessToast({
  placeName,
  dayValue,
  bookingUrl,
  onDismiss,
}: {
  placeName: string;
  dayValue: string;
  bookingUrl: string;
  onDismiss: () => void;
}) {
  const dayLabel = stayDays.find((d) => d.value === dayValue)?.label ?? dayValue;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 discover-card-fade-in">
      <div className="
        flex items-center gap-3 px-5 py-3.5
        rounded-2xl border border-[var(--discover-gold)]/25
        bg-[var(--discover-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      ">
        <span className="
          flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0
          bg-[var(--discover-gold-12)] border border-[var(--discover-gold-25)]
        ">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="var(--discover-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--discover-title)]">{placeName}</p>
          <p className="text-[11px] text-[var(--discover-body)]">Added to {dayLabel}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-[var(--discover-gold)] hover:underline whitespace-nowrap"
          >
            Book →
          </a>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[var(--discover-body)] hover:text-[var(--discover-title)] transition-colors cursor-pointer p-1"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main DiscoverPanel component ─── */

export default function DiscoverPanel() {
  const [activeCategory, setActiveCategory] = useState<string>('top-places');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState<PlaceCard | null>(null);
  const [successToast, setSuccessToast] = useState<{ placeName: string; dayValue: string; bookingUrl: string } | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = useCallback((item: CategoryItem) => {
    setActiveCategory(item.id);
  }, []);

  const handleAddClick = useCallback((placeId: string) => {
    const allPlaces = Object.values(placesByCategory).flat();
    const place = allPlaces.find((p) => p.id === placeId) ?? null;
    setAddingPlace(place);
    setAddDialogOpen(true);
  }, []);

  const handleConfirmAdd = useCallback((placeId: string, day: string) => {
    const allPlaces = Object.values(placesByCategory).flat();
    const place = allPlaces.find((p) => p.id === placeId);
    if (place) {
      setSuccessToast({ placeName: place.name, dayValue: day, bookingUrl: place.bookingUrl });
    }
    setAddDialogOpen(false);
    setAddingPlace(null);
  }, []);

  const handleDismissToast = useCallback(() => {
    setSuccessToast(null);
  }, []);

  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 280;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const places = placesByCategory[activeCategory] ?? [];

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--discover-bg)] discover-card-fade-in">

        {/* ── Compact header ── */}
        <div className="px-5 sm:px-8 pt-6 pb-4 flex-shrink-0 border-b border-[var(--discover-border)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[16px] text-[var(--discover-gold)]">✦</span>
                <h2 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-[var(--discover-title)]">
                  Discover
                </h2>
              </div>
              <p className="text-[12px] text-[var(--discover-body)] ml-[30px]">
                Curated places and local insights for your New York stay
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="
                    w-8 h-8 rounded-lg flex items-center justify-center
                    border border-[var(--discover-border)]
                    bg-[var(--discover-card)]
                    text-[var(--discover-body)]
                    hover:border-[var(--discover-gold)]/40
                    hover:text-[var(--discover-title)]
                    transition-all duration-200 cursor-pointer
                  "
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search places</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Scrollable main content ── */}
        <ScrollArea className="flex-1">
          <div className="px-5 sm:px-8 py-6 space-y-8">

            {/* ── Category carousel ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                  Browse Categories
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollCarousel('left')}
                    className="
                      w-7 h-7 rounded-lg flex items-center justify-center
                      border border-[var(--discover-border)]
                      bg-[var(--discover-card)]
                      text-[var(--discover-body)]
                      hover:border-[var(--discover-gold)]/40
                      hover:text-[var(--discover-title)]
                      transition-all duration-200 cursor-pointer
                    "
                    aria-label="Scroll categories left"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel('right')}
                    className="
                      w-7 h-7 rounded-lg flex items-center justify-center
                      border border-[var(--discover-border)]
                      bg-[var(--discover-card)]
                      text-[var(--discover-body)]
                      hover:border-[var(--discover-gold)]/40
                      hover:text-[var(--discover-title)]
                      transition-all duration-200 cursor-pointer
                    "
                    aria-label="Scroll categories right"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory discover-slide-in"
              >
                {categories.map((cat) => (
                  <div key={cat.id} className="snap-start">
                    <CategoryCarouselCard
                      item={cat}
                      active={activeCategory === cat.id}
                      onClick={() => handleCategoryClick(cat)}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ── Separator ── */}
            <div className="h-px bg-[var(--discover-border)]" />

            {/* ── Place cards ── */}
            {places.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                    {categories.find((c) => c.id === activeCategory)?.label ?? 'Places'}
                  </h3>
                  <span className="text-[11px] text-[var(--discover-body)]">
                    {places.length} {places.length === 1 ? 'place' : 'places'}
                  </span>
                </div>

                <div className="space-y-4">
                  {places.map((place, idx) => (
                    <HeroPlaceCard
                      key={place.id}
                      place={place}
                      onAdd={handleAddClick}
                      isFirst={idx === 0}
                      idx={idx}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Separator ── */}
            <div className="h-px bg-[var(--discover-border)]" />

            {/* ── Local insights rail ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--discover-body)]">
                  Local Insights
                </h3>
                <span className="text-[10px] text-[var(--discover-body)]">New York City</span>
              </div>

              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
                {localInsights.map((insight) => (
                  <div key={insight.id} className="snap-start">
                    <InsightKnowledgeCard insight={insight} />
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom spacer */}
            <div className="h-4" />
          </div>
        </ScrollArea>

        {/* ── Add-to-day dialog ── */}
        <AddToDayDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          place={addingPlace}
          onConfirm={handleConfirmAdd}
        />

        {/* ── Success toast ── */}
        {successToast && (
          <SuccessToast
            placeName={successToast.placeName}
            dayValue={successToast.dayValue}
            bookingUrl={successToast.bookingUrl}
            onDismiss={handleDismissToast}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
