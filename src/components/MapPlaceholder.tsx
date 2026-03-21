export default function MapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-[#0B0F14] overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30, 40, 55, 0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 40, 55, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* SVG street map — dark luxury palette */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {/* Neighborhood blocks — soft filled areas */}
        <rect x="105" y="80" width="90" height="65" rx="3" fill="#101820" />
        <rect x="210" y="80" width="80" height="65" rx="3" fill="#0F1720" />
        <rect x="310" y="80" width="80" height="65" rx="3" fill="#101820" />
        <rect x="410" y="80" width="80" height="65" rx="3" fill="#0F1720" />
        <rect x="510" y="80" width="80" height="65" rx="3" fill="#101820" />
        <rect x="610" y="80" width="80" height="65" rx="3" fill="#0F1720" />
        <rect x="710" y="80" width="80" height="65" rx="3" fill="#101820" />

        <rect x="105" y="160" width="90" height="55" rx="3" fill="#0F1720" />
        <rect x="210" y="160" width="80" height="55" rx="3" fill="#101820" />
        <rect x="310" y="160" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="510" y="160" width="80" height="55" rx="3" fill="#101820" />
        <rect x="610" y="160" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="710" y="160" width="80" height="55" rx="3" fill="#101820" />

        {/* Park area */}
        <rect x="410" y="155" width="85" height="65" rx="6" fill="#0E1A12" stroke="#15291B" strokeWidth="0.5" />
        <text x="452" y="192" textAnchor="middle" fill="#1B3322" fontSize="8" fontFamily="sans-serif" letterSpacing="0.08em">CENTRAL PARK</text>

        <rect x="105" y="235" width="90" height="55" rx="3" fill="#101820" />
        <rect x="210" y="235" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="310" y="235" width="80" height="55" rx="3" fill="#101820" />
        <rect x="410" y="235" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="510" y="235" width="80" height="55" rx="3" fill="#101820" />
        <rect x="610" y="235" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="710" y="235" width="80" height="55" rx="3" fill="#101820" />

        <rect x="105" y="310" width="90" height="55" rx="3" fill="#0F1720" />
        <rect x="210" y="310" width="80" height="55" rx="3" fill="#101820" />
        <rect x="310" y="310" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="410" y="310" width="80" height="55" rx="3" fill="#101820" />
        <rect x="510" y="310" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="610" y="310" width="80" height="55" rx="3" fill="#101820" />
        <rect x="710" y="310" width="80" height="55" rx="3" fill="#0F1720" />

        <rect x="105" y="385" width="90" height="55" rx="3" fill="#101820" />
        <rect x="210" y="385" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="310" y="385" width="80" height="55" rx="3" fill="#101820" />
        <rect x="410" y="385" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="510" y="385" width="80" height="55" rx="3" fill="#101820" />
        <rect x="610" y="385" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="710" y="385" width="80" height="55" rx="3" fill="#101820" />

        <rect x="105" y="460" width="90" height="55" rx="3" fill="#0F1720" />
        <rect x="210" y="460" width="80" height="55" rx="3" fill="#101820" />
        <rect x="310" y="460" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="410" y="460" width="80" height="55" rx="3" fill="#101820" />
        <rect x="510" y="460" width="80" height="55" rx="3" fill="#0F1720" />
        <rect x="610" y="460" width="80" height="55" rx="3" fill="#101820" />
        <rect x="710" y="460" width="80" height="55" rx="3" fill="#0F1720" />

        {/* Main avenues — subtle, refined */}
        <line x1="200" y1="0" x2="200" y2="600" stroke="#162030" strokeWidth="6" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#182438" strokeWidth="10" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="#162030" strokeWidth="6" />
        <line x1="100" y1="0" x2="100" y2="600" stroke="#131C28" strokeWidth="3" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#131C28" strokeWidth="3" />
        <line x1="500" y1="0" x2="500" y2="600" stroke="#131C28" strokeWidth="3" />
        <line x1="700" y1="0" x2="700" y2="600" stroke="#131C28" strokeWidth="3" />

        {/* Cross streets — elegant, soft */}
        <line x1="0" y1="150" x2="800" y2="150" stroke="#162030" strokeWidth="6" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#182438" strokeWidth="10" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#162030" strokeWidth="6" />
        <line x1="0" y1="75" x2="800" y2="75" stroke="#131C28" strokeWidth="3" />
        <line x1="0" y1="225" x2="800" y2="225" stroke="#131C28" strokeWidth="3" />
        <line x1="0" y1="375" x2="800" y2="375" stroke="#131C28" strokeWidth="3" />
        <line x1="0" y1="525" x2="800" y2="525" stroke="#131C28" strokeWidth="3" />

        {/* Street labels — subtle, uppercase */}
        <text x="400" y="296" textAnchor="middle" fill="#1E3040" fontSize="9" fontFamily="sans-serif" letterSpacing="0.15em">5TH AVENUE</text>
        <text x="197" y="260" textAnchor="middle" fill="#1E3040" fontSize="8" fontFamily="sans-serif" letterSpacing="0.1em" transform="rotate(-90, 197, 260)">MADISON AVE</text>
        <text x="597" y="260" textAnchor="middle" fill="#1E3040" fontSize="8" fontFamily="sans-serif" letterSpacing="0.1em" transform="rotate(-90, 597, 260)">PARK AVE</text>
        <text x="750" y="296" textAnchor="middle" fill="#1E3040" fontSize="8" fontFamily="sans-serif" letterSpacing="0.1em">E 57TH ST</text>
        <text x="50" y="148" textAnchor="middle" fill="#1E3040" fontSize="8" fontFamily="sans-serif" letterSpacing="0.1em">W 59TH ST</text>
        <text x="750" y="448" textAnchor="middle" fill="#1E3040" fontSize="8" fontFamily="sans-serif" letterSpacing="0.1em">E 55TH ST</text>

        {/* Minimal POI markers — tiny, tasteful dots */}
        <circle cx="350" cy="270" r="2.5" fill="#1A2A3A" />
        <circle cx="520" cy="340" r="2.5" fill="#1A2A3A" />
        <circle cx="280" cy="410" r="2.5" fill="#1A2A3A" />
        <circle cx="650" cy="200" r="2.5" fill="#1A2A3A" />
        <circle cx="450" cy="120" r="2.5" fill="#1A2A3A" />
      </svg>

      {/* Edge gradients — softer blending into panels */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14] via-transparent to-[#0B0F14] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14] via-transparent to-[#0B0F14] opacity-25 pointer-events-none" />

      {/* Selected business marker — refined glow with halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center">
          {/* Outer halo */}
          <span className="absolute inline-flex h-10 w-10 rounded-full bg-[#D4AF37]/10 animate-pulse" />
          {/* Mid glow ring */}
          <span className="absolute inline-flex h-6 w-6 rounded-full border border-[#D4AF37]/25" />
          {/* Core dot */}
          <div className="relative w-3.5 h-3.5 rounded-full bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.6),0_0_4px_rgba(212,175,55,0.9)]" />
        </div>
      </div>

      {/* Anchored business label — clean, minimal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-7 whitespace-nowrap">
        <div className="flex items-center space-x-1.5 bg-[#141A22]/95 border border-[#D4AF37]/20 rounded-md px-3 py-1.5 backdrop-blur-sm shadow-lg shadow-black/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <span className="text-[11px] font-medium text-gray-200 tracking-wide">The Grand Palace Hotel</span>
        </div>
      </div>

      {/* Zoom controls — refined */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-1">
        <button className="w-8 h-8 bg-[#141A22]/90 border border-[#1E2A3A] rounded-md text-gray-400 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all duration-200 flex items-center justify-center text-sm backdrop-blur-sm">+</button>
        <button className="w-8 h-8 bg-[#141A22]/90 border border-[#1E2A3A] rounded-md text-gray-400 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all duration-200 flex items-center justify-center text-sm backdrop-blur-sm">−</button>
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-4 left-4 text-[10px] text-gray-700">
        © Stayscape Maps
      </div>
    </div>
  );
}
