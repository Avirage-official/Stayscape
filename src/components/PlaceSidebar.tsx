import { Place } from '@/types';

interface PlaceSidebarProps {
  selectedPlace: Place | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? 'text-[#D4AF37]' : 'text-gray-700'}
          style={{ fontSize: '14px' }}
        >
          ★
        </span>
      ))}
      <span className="text-sm text-gray-400 ml-1.5">{rating}</span>
    </div>
  );
}

export default function PlaceSidebar({ selectedPlace }: PlaceSidebarProps) {
  if (!selectedPlace) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-600">✦</span>
        </div>
        <h3 className="font-serif text-lg text-gray-400 mb-2">Explore the City</h3>
        <p className="text-sm text-gray-600 leading-relaxed">Select a place on the map to explore curated recommendations from your personal AI concierge.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A]">
      {/* Image header */}
      <div className={`h-40 bg-gradient-to-br ${selectedPlace.gradient} relative flex-shrink-0`}>
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1A1A1A] to-transparent">
          <span className="inline-block text-xs text-[#D4AF37] bg-[#D4AF37] bg-opacity-10 border border-[#D4AF37] border-opacity-30 rounded-full px-2.5 py-0.5 mb-2">
            {selectedPlace.category}
          </span>
          <h2 className="font-serif text-xl text-white">{selectedPlace.name}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Rating & Distance */}
        <div className="flex items-center justify-between">
          <StarRating rating={selectedPlace.rating} />
          <span className="flex items-center space-x-1 text-sm text-gray-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
            <span>{selectedPlace.distance}</span>
          </span>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed">{selectedPlace.description}</p>

        {/* Divider */}
        <div className="border-t border-[#2A2A2A]" />

        {/* AI Concierge */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-[#D4AF37] text-base">✦</span>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest">AI Concierge</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{selectedPlace.aiRundown}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2A2A2A]" />

        {/* Actions */}
        <div className="space-y-2.5 pb-4">
          <button className="w-full bg-[#D4AF37] text-black font-medium text-sm py-2.5 rounded-lg hover:bg-[#E8C84A] transition-colors">
            Book a Table
          </button>
          <button className="w-full border border-[#2A2A2A] text-gray-300 text-sm py-2.5 rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors flex items-center justify-center space-x-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            <span>Get Directions</span>
          </button>
          <button className="w-full border border-[#2A2A2A] text-gray-300 text-sm py-2.5 rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors flex items-center justify-center space-x-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Save to Favorites</span>
          </button>
        </div>
      </div>
    </div>
  );
}
