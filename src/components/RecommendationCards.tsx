'use client';

import { useState } from 'react';
import { Place } from '@/types';

const places: Place[] = [
  {
    id: '1',
    name: 'Nobu Restaurant',
    category: 'Restaurants',
    distance: '0.3 mi',
    rating: 4.8,
    description: 'World-renowned Japanese-Peruvian fusion',
    aiRundown: "Nobu is the crown jewel of NYC dining—Chef Nobu Matsuhisa's legendary fusion cuisine awaits. We recommend the black cod with miso and the signature yellowtail jalapeño. Reservations are highly sought after; our concierge has secured priority access for hotel guests.",
    gradient: 'from-amber-900 to-red-900',
  },
  {
    id: '2',
    name: 'The Rooftop Bar',
    category: 'Bars & Drinks',
    distance: '0.1 mi',
    rating: 4.6,
    description: 'Craft cocktails with panoramic city views',
    aiRundown: 'Just steps from the hotel, The Rooftop Bar offers an unparalleled cocktail experience above the Manhattan skyline. The sommelier-curated champagne selection and the signature "Golden Hour" cocktail are not to be missed. Best enjoyed at sunset.',
    gradient: 'from-blue-900 to-purple-900',
  },
  {
    id: '3',
    name: 'Central Park',
    category: 'Activities',
    distance: '0.5 mi',
    rating: 4.9,
    description: "New York's iconic urban oasis",
    aiRundown: "Central Park in December is particularly magical—the Wollman Rink ice skating is in full swing and the holiday atmosphere is serene. We suggest the path along the Mall for the most scenic morning walk. Our concierge can arrange a private carriage ride.",
    gradient: 'from-green-900 to-teal-900',
  },
  {
    id: '4',
    name: 'Fifth Avenue Shopping',
    category: 'Shopping',
    distance: '0.2 mi',
    rating: 4.7,
    description: 'Luxury flagship stores and boutiques',
    aiRundown: "Fifth Avenue is the pinnacle of luxury retail—from Bergdorf Goodman's impeccable personal shopping service to the flagship stores of the world's finest houses. The hotel's concierge team has personal relationships with the store managers for VIP access.",
    gradient: 'from-pink-900 to-rose-900',
  },
  {
    id: '5',
    name: 'Le Bernardin',
    category: 'Restaurants',
    distance: '0.4 mi',
    rating: 4.9,
    description: 'Three Michelin star French seafood',
    aiRundown: "Chef Éric Ripert's three-Michelin-star temple of French seafood is widely considered the finest restaurant in New York. The tasting menu is a transcendent experience—langoustine, halibut, and tuna prepared with extraordinary precision. We have a longstanding relationship with the maitre d'.",
    gradient: 'from-slate-800 to-blue-950',
  },
  {
    id: '6',
    name: 'Bemelmans Bar',
    category: 'Bars & Drinks',
    distance: '0.3 mi',
    rating: 4.7,
    description: 'Classic New York cocktail institution',
    aiRundown: "Bemelmans Bar at The Carlyle is one of New York's most storied establishments—the Ludwig Bemelmans murals, live jazz piano, and the perfectly mixed Martinis create an atmosphere of effortless Old World glamour. Arrive early evening for the full experience.",
    gradient: 'from-yellow-900 to-orange-900',
  },
];

const tabs = ['All', 'Restaurants', 'Bars & Drinks', 'Activities', 'Shopping'];

interface RecommendationCardsProps {
  onSelectPlace: (place: Place) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? 'text-[#D4AF37]' : 'text-gray-700'}
          style={{ fontSize: '11px' }}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}</span>
    </div>
  );
}

export default function RecommendationCards({ onSelectPlace }: RecommendationCardsProps) {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All' ? places : places.filter((p) => p.category === activeTab);

  return (
    <div className="px-4 py-3">
      {/* Tabs */}
      <div className="flex items-center space-x-6 mb-3 border-b border-[#2A2A2A] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm pb-2 -mb-2 whitespace-nowrap border-b-2 transition-colors duration-200 ${
              activeTab === tab
                ? 'border-[#D4AF37] text-[#D4AF37] font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
        {filtered.map((place) => (
          <button
            key={place.id}
            onClick={() => onSelectPlace(place)}
            className="flex-shrink-0 w-48 bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#2A2A2A] hover:border-[#D4AF37] hover:border-opacity-50 hover:scale-[1.02] transition-all duration-200 text-left"
          >
            {/* Image placeholder */}
            <div className={`h-24 bg-gradient-to-br ${place.gradient} relative`}>
              <div className="absolute inset-0 bg-black bg-opacity-20" />
              <div className="absolute bottom-2 left-2">
                <span className="text-xs text-white bg-black bg-opacity-40 rounded-full px-2 py-0.5">{place.category}</span>
              </div>
            </div>
            {/* Info */}
            <div className="p-3">
              <h4 className="font-serif text-sm text-white mb-0.5 truncate">{place.name}</h4>
              <p className="text-xs text-gray-500 mb-1.5 truncate">{place.description}</p>
              <div className="flex items-center justify-between">
                <StarRating rating={place.rating} />
                <span className="text-xs text-gray-600">{place.distance}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
