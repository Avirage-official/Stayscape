export default function StayInfoCard() {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5 border-l-4 border-[#D4AF37]">
      {/* Welcome */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Welcome back,</p>
        <h2 className="font-serif text-lg text-white leading-tight">Mr. James Anderson</h2>
      </div>

      {/* Hotel */}
      <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-[#2A2A2A]">
        <span className="text-[#D4AF37] text-base">✦</span>
        <div>
          <p className="text-sm font-medium text-gray-200">The Grand Palace Hotel</p>
          <p className="text-xs text-gray-500">Suite 1204 · Deluxe Ocean View</p>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">📅</span>
            <div>
              <p className="text-xs text-gray-500">Check-in</p>
              <p className="text-sm text-gray-200">Dec 14, 2024</p>
            </div>
          </div>
          <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
            <path d="M0 4h18M15 1l3 3-3 3" stroke="#2A2A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">📅</span>
            <div>
              <p className="text-xs text-gray-500">Check-out</p>
              <p className="text-sm text-gray-200">Dec 19, 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nights badge */}
      <div className="inline-flex items-center space-x-1.5 bg-[#D4AF37] bg-opacity-10 border border-[#D4AF37] border-opacity-30 rounded-full px-3 py-1">
        <span className="text-[#D4AF37] text-xs">◆</span>
        <span className="text-xs text-[#D4AF37] font-medium">5 nights remaining</span>
      </div>
    </div>
  );
}
