export default function MapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-[#0A0E13] overflow-hidden animate-fade-in">
      {/* Subtle grid background — refined and minimal */}
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

      {/* SVG street map — dark luxury palette with muted tones */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {/* Neighborhood blocks — very subtle filled areas */}
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

        {/* Park area — very subtle green */}
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

        {/* Main avenues — subtle, refined strokes */}
        <line x1="200" y1="0" x2="200" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#141E2C" strokeWidth="8" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="100" y1="0" x2="100" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="500" y1="0" x2="500" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="700" y1="0" x2="700" y2="600" stroke="#101822" strokeWidth="2.5" />

        {/* Cross streets — elegant, soft */}
        <line x1="0" y1="150" x2="800" y2="150" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#141E2C" strokeWidth="8" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="75" x2="800" y2="75" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="225" x2="800" y2="225" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="375" x2="800" y2="375" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="525" x2="800" y2="525" stroke="#101822" strokeWidth="2.5" />

        {/* Street labels — very subtle, uppercase */}
        <text x="400" y="296" textAnchor="middle" fill="#182535" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="0.18em">5TH AVENUE</text>
        <text x="197" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 197, 260)">MADISON AVE</text>
        <text x="597" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 597, 260)">PARK AVE</text>
        <text x="750" y="296" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 57TH ST</text>
        <text x="50" y="148" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">W 59TH ST</text>
        <text x="750" y="448" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 55TH ST</text>

        {/* Minimal POI markers — elegant, muted */}
        <circle cx="350" cy="270" r="2" fill="#1A2535" />
        <circle cx="520" cy="340" r="2" fill="#1A2535" />
        <circle cx="280" cy="410" r="2" fill="#1A2535" />
        <circle cx="650" cy="200" r="2" fill="#1A2535" />
        <circle cx="450" cy="120" r="2" fill="#1A2535" />
        <circle cx="180" cy="330" r="2" fill="#1A2535" />
        <circle cx="560" cy="480" r="2" fill="#1A2535" />
      </svg>

      {/* Edge gradients — seamless panel blending */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E13] via-transparent to-[#0A0E13] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E13] via-transparent to-[#0A0E13] opacity-30 pointer-events-none" />

      {/* Selected business marker — refined glow with elegant halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center">
          {/* Outer halo — soft, breathing */}
          <span className="absolute inline-flex h-12 w-12 rounded-full bg-[#C9A84C]/6 animate-gentle-pulse" />
          {/* Mid glow ring */}
          <span className="absolute inline-flex h-7 w-7 rounded-full border border-[#C9A84C]/15" />
          {/* Inner ring */}
          <span className="absolute inline-flex h-5 w-5 rounded-full border border-[#C9A84C]/25" />
          {/* Core dot */}
          <div className="relative w-3 h-3 rounded-full bg-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.5),0_0_4px_rgba(201,168,76,0.8)]" />
        </div>
      </div>

      {/* Anchored business label — clean, editorial */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-8 whitespace-nowrap">
        <div className="flex items-center space-x-2 bg-[#111519] border border-[#C9A84C]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
          <span className="text-[11px] font-medium text-gray-200 tracking-[0.03em]">The Grand Palace Hotel</span>
          <span className="text-[9px] text-gray-600">·</span>
          <span className="text-[9px] text-gray-500">0.2 mi</span>
        </div>
      </div>

      {/* Zoom controls — refined, solid panels */}
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
