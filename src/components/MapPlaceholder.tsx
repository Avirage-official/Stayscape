'use client';

import { Place } from '@/types';

/* ─── Sample places with map coordinates ─── */

const mapPlaces: (Place & { cx: number; cy: number })[] = [
  {
    id: '1',
    name: 'Nobu Restaurant',
    category: 'Restaurants',
    distance: '0.3 mi',
    rating: 4.8,
    description: 'World-renowned Japanese-Peruvian fusion',
    aiRundown:
      "Nobu is the crown jewel of NYC dining—Chef Nobu Matsuhisa's legendary fusion cuisine awaits. We recommend the black cod with miso and the signature yellowtail jalapeño. Reservations are highly sought after; our concierge has secured priority access for hotel guests.",
    gradient: 'from-amber-900 to-red-900',
    bookingUrl: 'https://www.noburestaurants.com/new-york',
    cx: 350,
    cy: 270,
  },
  {
    id: '2',
    name: 'The Rooftop Bar',
    category: 'Bars & Drinks',
    distance: '0.1 mi',
    rating: 4.6,
    description: 'Craft cocktails with panoramic city views',
    aiRundown:
      'Just steps from the hotel, The Rooftop Bar offers an unparalleled cocktail experience above the Manhattan skyline. The sommelier-curated champagne selection and the signature "Golden Hour" cocktail are not to be missed. Best enjoyed at sunset.',
    gradient: 'from-blue-900 to-purple-900',
    bookingUrl: 'https://example.com/rooftop-bar',
    cx: 520,
    cy: 340,
  },
  {
    id: '3',
    name: 'Central Park',
    category: 'Activities',
    distance: '0.5 mi',
    rating: 4.9,
    description: "New York's iconic urban oasis",
    aiRundown:
      "Central Park in December is particularly magical—the Wollman Rink ice skating is in full swing and the holiday atmosphere is serene. We suggest the path along the Mall for the most scenic morning walk. Our concierge can arrange a private carriage ride.",
    gradient: 'from-green-900 to-teal-900',
    bookingUrl: 'https://www.centralparknyc.org',
    cx: 450,
    cy: 180,
  },
  {
    id: '4',
    name: 'Fifth Avenue Shopping',
    category: 'Shopping',
    distance: '0.2 mi',
    rating: 4.7,
    description: 'Luxury flagship stores and boutiques',
    aiRundown:
      "Fifth Avenue is the pinnacle of luxury retail—from Bergdorf Goodman's impeccable personal shopping service to the flagship stores of the world's finest houses. The hotel's concierge team has personal relationships with the store managers for VIP access.",
    gradient: 'from-pink-900 to-rose-900',
    bookingUrl: 'https://example.com/fifth-avenue',
    cx: 280,
    cy: 410,
  },
  {
    id: '5',
    name: 'Le Bernardin',
    category: 'Restaurants',
    distance: '0.4 mi',
    rating: 4.9,
    description: 'Three Michelin star French seafood',
    aiRundown:
      "Chef Éric Ripert's three-Michelin-star temple of French seafood is widely considered the finest restaurant in New York. The tasting menu is a transcendent experience—langoustine, halibut, and tuna prepared with extraordinary precision. We have a longstanding relationship with the maitre d'.",
    gradient: 'from-slate-800 to-blue-950',
    bookingUrl: 'https://www.le-bernardin.com',
    cx: 650,
    cy: 200,
  },
  {
    id: '6',
    name: 'Bemelmans Bar',
    category: 'Bars & Drinks',
    distance: '0.3 mi',
    rating: 4.7,
    description: 'Classic New York cocktail institution',
    aiRundown:
      "Bemelmans Bar at The Carlyle is one of New York's most storied establishments—the Ludwig Bemelmans murals, live jazz piano, and the perfectly mixed Martinis create an atmosphere of effortless Old World glamour. Arrive early evening for the full experience.",
    gradient: 'from-yellow-900 to-orange-900',
    bookingUrl: 'https://www.rosewoodhotels.com/en/the-carlyle-new-york/dining/bemelmans-bar',
    cx: 560,
    cy: 480,
  },
];

interface MapPlaceholderProps {
  onSelectPlace?: (place: Place) => void;
  selectedPlaceId?: string | null;
}

export default function MapPlaceholder({ onSelectPlace, selectedPlaceId }: MapPlaceholderProps) {
  return (
    <div className="relative w-full h-full bg-[#0A0E13] overflow-hidden animate-fade-in">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(25, 35, 50, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(25, 35, 50, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
        }}
      />

      {/* SVG street map */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {/* Neighborhood blocks */}
        <rect x="105" y="80" width="90" height="65" rx="4" fill="#0D1318" />
        <rect x="210" y="80" width="80" height="65" rx="4" fill="#0C1217" />
        <rect x="310" y="80" width="80" height="65" rx="4" fill="#0D1318" />
        <rect x="410" y="80" width="80" height="65" rx="4" fill="#0C1217" />
        <rect x="510" y="80" width="80" height="65" rx="4" fill="#0D1318" />
        <rect x="610" y="80" width="80" height="65" rx="4" fill="#0C1217" />
        <rect x="710" y="80" width="80" height="65" rx="4" fill="#0D1318" />

        <rect x="105" y="160" width="90" height="55" rx="4" fill="#0C1217" />
        <rect x="210" y="160" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="310" y="160" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="510" y="160" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="610" y="160" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="710" y="160" width="80" height="55" rx="4" fill="#0D1318" />

        {/* Park area */}
        <rect x="410" y="155" width="85" height="65" rx="6" fill="#0C1610" stroke="#13241A" strokeWidth="0.5" />
        <text x="452" y="192" textAnchor="middle" fill="#172E1F" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">CENTRAL PARK</text>

        <rect x="105" y="235" width="90" height="55" rx="4" fill="#0D1318" />
        <rect x="210" y="235" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="310" y="235" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="410" y="235" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="510" y="235" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="610" y="235" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="710" y="235" width="80" height="55" rx="4" fill="#0D1318" />

        <rect x="105" y="310" width="90" height="55" rx="4" fill="#0C1217" />
        <rect x="210" y="310" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="310" y="310" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="410" y="310" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="510" y="310" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="610" y="310" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="710" y="310" width="80" height="55" rx="4" fill="#0C1217" />

        <rect x="105" y="385" width="90" height="55" rx="4" fill="#0D1318" />
        <rect x="210" y="385" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="310" y="385" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="410" y="385" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="510" y="385" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="610" y="385" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="710" y="385" width="80" height="55" rx="4" fill="#0D1318" />

        <rect x="105" y="460" width="90" height="55" rx="4" fill="#0C1217" />
        <rect x="210" y="460" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="310" y="460" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="410" y="460" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="510" y="460" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="610" y="460" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="710" y="460" width="80" height="55" rx="4" fill="#0C1217" />

        {/* Main avenues */}
        <line x1="200" y1="0" x2="200" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#141E2C" strokeWidth="8" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="100" y1="0" x2="100" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="500" y1="0" x2="500" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="700" y1="0" x2="700" y2="600" stroke="#101822" strokeWidth="2.5" />

        {/* Cross streets */}
        <line x1="0" y1="150" x2="800" y2="150" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#141E2C" strokeWidth="8" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="75" x2="800" y2="75" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="225" x2="800" y2="225" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="375" x2="800" y2="375" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="525" x2="800" y2="525" stroke="#101822" strokeWidth="2.5" />

        {/* Street labels */}
        <text x="400" y="296" textAnchor="middle" fill="#182535" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="0.18em">5TH AVENUE</text>
        <text x="197" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 197, 260)">MADISON AVE</text>
        <text x="597" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 597, 260)">PARK AVE</text>
        <text x="750" y="296" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 57TH ST</text>
        <text x="50" y="148" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">W 59TH ST</text>
        <text x="750" y="448" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 55TH ST</text>

        {/* Clickable place markers */}
        {mapPlaces.map((place) => {
          const isSelected = selectedPlaceId === place.id;
          return (
            <g
              key={place.id}
              onClick={() => onSelectPlace?.(place)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              {/* Hover/hit area */}
              <circle cx={place.cx} cy={place.cy} r="14" fill="transparent" />
              {/* Outer glow for selected */}
              {isSelected && (
                <>
                  <circle cx={place.cx} cy={place.cy} r="12" fill="#C9A84C" opacity="0.06" className="animate-gentle-pulse" />
                  <circle cx={place.cx} cy={place.cy} r="7" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.25" />
                </>
              )}
              {/* Marker dot */}
              <circle
                cx={place.cx}
                cy={place.cy}
                r={isSelected ? '4' : '3'}
                fill={isSelected ? '#C9A84C' : '#1A2535'}
                stroke={isSelected ? '#C9A84C' : 'none'}
                strokeWidth="1"
                style={isSelected ? { filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.5))' } : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* Edge gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E13] via-transparent to-[#0A0E13] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E13] via-transparent to-[#0A0E13] opacity-30 pointer-events-none" />

      {/* Selected place label */}
      {selectedPlaceId && (() => {
        const activePlace = mapPlaces.find((p) => p.id === selectedPlaceId);
        if (!activePlace) return null;
        return (
          <div
            className="absolute whitespace-nowrap pointer-events-none"
            style={{
              left: `${(activePlace.cx / 800) * 100}%`,
              top: `${(activePlace.cy / 600) * 100}%`,
              transform: 'translate(-50%, 16px)',
            }}
          >
            <div className="flex items-center space-x-2 bg-[#111519] border border-[#C9A84C]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              <span className="text-[11px] font-medium text-gray-200 tracking-[0.03em]">{activePlace.name}</span>
              <span className="text-[9px] text-gray-600">·</span>
              <span className="text-[9px] text-gray-500">{activePlace.distance}</span>
            </div>
          </div>
        );
      })()}

      {/* Hotel marker — always visible when no place selected */}
      {!selectedPlaceId && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-12 w-12 rounded-full bg-[#C9A84C]/6 animate-gentle-pulse" />
              <span className="absolute inline-flex h-7 w-7 rounded-full border border-[#C9A84C]/15" />
              <span className="absolute inline-flex h-5 w-5 rounded-full border border-[#C9A84C]/25" />
              <div className="relative w-3 h-3 rounded-full bg-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.5),0_0_4px_rgba(201,168,76,0.8)]" />
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-8 whitespace-nowrap">
            <div className="flex items-center space-x-2 bg-[#111519] border border-[#C9A84C]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              <span className="text-[11px] font-medium text-gray-200 tracking-[0.03em]">The Grand Palace Hotel</span>
              <span className="text-[9px] text-gray-600">·</span>
              <span className="text-[9px] text-gray-500">0.2 mi</span>
            </div>
          </div>
        </>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-1">
        <button className="w-8 h-8 bg-[#111519] border border-[#1C2230] rounded-[5px] text-gray-400 hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-all duration-200 flex items-center justify-center text-sm shadow-soft">+</button>
        <button className="w-8 h-8 bg-[#111519] border border-[#1C2230] rounded-[5px] text-gray-400 hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-all duration-200 flex items-center justify-center text-sm shadow-soft">−</button>
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-4 left-4 text-[9px] text-gray-700 tracking-wide">
        © Stayscape Maps
      </div>
    </div>
  );
}
