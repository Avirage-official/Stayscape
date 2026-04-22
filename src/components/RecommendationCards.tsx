'use client';

import { useState } from 'react';
import { Place } from '@/types';

const places: Place[] = [
  {
    id: '1',
    name: 'Fine Dining Restaurant',
    category: 'Restaurants',
    distance: '0.3 mi',
    rating: 4.8,
    description: 'Award-winning cuisine with impeccable seasonal ingredients',
    aiRundown: "This acclaimed restaurant is celebrated for its inventive tasting menus and meticulous sourcing. The chef's signature dishes rotate with the seasons — reservations are highly sought after, and our concierge has arranged priority access for hotel guests.",
    gradient: 'from-amber-900 to-red-900',
  },
  {
    id: '2',
    name: 'Rooftop Bar',
    category: 'Bars & Drinks',
    distance: '0.1 mi',
    rating: 4.6,
    description: 'Craft cocktails with panoramic city views',
    aiRundown: 'Just steps from the hotel, the rooftop bar offers an unparalleled cocktail experience above the city skyline. The curated champagne selection and the signature house cocktail are not to be missed. Best enjoyed at sunset.',
    gradient: 'from-blue-900 to-purple-900',
  },
  {
    id: '3',
    name: 'City Park',
    category: 'Activities',
    distance: '0.5 mi',
    rating: 4.9,
    description: 'An iconic urban park offering a peaceful green escape',
    aiRundown: "The city park is a serene retreat from the pace of urban life. The tree-lined paths and waterside walks are particularly peaceful in the morning. Our concierge can suggest the best routes and any seasonal highlights during your stay.",
    gradient: 'from-green-900 to-teal-900',
  },
  {
    id: '4',
    name: 'Luxury Shopping District',
    category: 'Shopping',
    distance: '0.2 mi',
    rating: 4.7,
    description: 'Flagship stores and luxury boutiques',
    aiRundown: "The nearby luxury shopping district brings together the world's finest retail houses. The hotel's concierge team has personal relationships with store managers and can arrange VIP access and personal shopping appointments on request.",
    gradient: 'from-pink-900 to-rose-900',
  },
  {
    id: '5',
    name: 'Michelin-Starred Seafood',
    category: 'Restaurants',
    distance: '0.4 mi',
    rating: 4.9,
    description: 'Three Michelin star seafood and tasting menus',
    aiRundown: "This three-Michelin-star destination is considered one of the finest restaurants in the region. The tasting menu is a transcendent experience — each course is prepared with extraordinary precision. We have a longstanding relationship with the maître d'.",
    gradient: 'from-slate-800 to-blue-950',
  },
  {
    id: '6',
    name: 'Jazz Bar',
    category: 'Bars & Drinks',
    distance: '0.3 mi',
    rating: 4.7,
    description: 'Classic cocktail institution with live jazz',
    aiRundown: "One of the neighbourhood's most storied establishments — hand-painted murals, live jazz piano, and perfectly mixed Martinis create an atmosphere of effortless old-world glamour. Arrive early evening for the full experience.",
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
