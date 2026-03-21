export default function MapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-[#0D1117] overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(42, 42, 42, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(42, 42, 42, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* SVG street map */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {/* Main avenues */}
        <line x1="200" y1="0" x2="200" y2="600" stroke="#1E2A3A" strokeWidth="8" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#1E2A3A" strokeWidth="12" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="#1E2A3A" strokeWidth="8" />
        <line x1="100" y1="0" x2="100" y2="600" stroke="#161E2A" strokeWidth="4" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#161E2A" strokeWidth="4" />
        <line x1="500" y1="0" x2="500" y2="600" stroke="#161E2A" strokeWidth="4" />
        <line x1="700" y1="0" x2="700" y2="600" stroke="#161E2A" strokeWidth="4" />

        {/* Cross streets */}
        <line x1="0" y1="150" x2="800" y2="150" stroke="#1E2A3A" strokeWidth="8" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#1E2A3A" strokeWidth="12" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#1E2A3A" strokeWidth="8" />
        <line x1="0" y1="75" x2="800" y2="75" stroke="#161E2A" strokeWidth="4" />
        <line x1="0" y1="225" x2="800" y2="225" stroke="#161E2A" strokeWidth="4" />
        <line x1="0" y1="375" x2="800" y2="375" stroke="#161E2A" strokeWidth="4" />
        <line x1="0" y1="525" x2="800" y2="525" stroke="#161E2A" strokeWidth="4" />

        {/* Park area */}
        <rect x="120" y="170" width="160" height="120" rx="4" fill="#0F1F12" stroke="#1A3020" strokeWidth="1" />
        <text x="200" y="237" textAnchor="middle" fill="#1E3A24" fontSize="11" fontFamily="sans-serif">CENTRAL PARK</text>

        {/* Block fills */}
        <rect x="210" y="160" width="80" height="60" rx="2" fill="#131820" />
        <rect x="310" y="160" width="80" height="60" rx="2" fill="#131820" />
        <rect x="510" y="160" width="80" height="60" rx="2" fill="#131820" />
        <rect x="610" y="160" width="80" height="60" rx="2" fill="#131820" />
        <rect x="210" y="310" width="80" height="60" rx="2" fill="#131820" />
        <rect x="310" y="310" width="80" height="60" rx="2" fill="#131820" />
        <rect x="410" y="310" width="80" height="60" rx="2" fill="#131820" />
        <rect x="510" y="310" width="80" height="60" rx="2" fill="#131820" />
        <rect x="610" y="310" width="80" height="60" rx="2" fill="#131820" />

        {/* Street labels */}
        <text x="400" y="295" textAnchor="middle" fill="#2A3A4A" fontSize="10" fontFamily="sans-serif">5TH AVENUE</text>
        <text x="195" y="260" textAnchor="middle" fill="#2A3A4A" fontSize="9" fontFamily="sans-serif" transform="rotate(-90, 195, 260)">W 57TH ST</text>
        <text x="795" y="302" textAnchor="end" fill="#2A3A4A" fontSize="10" fontFamily="sans-serif">E 57TH ST</text>
      </svg>

      {/* Edge gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A] opacity-40 pointer-events-none" />

      {/* Hotel marker */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Ping animation */}
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-8 w-8 rounded-full bg-[#D4AF37] opacity-30 animate-ping" />
          <span className="absolute inline-flex h-5 w-5 rounded-full bg-[#D4AF37] opacity-20 animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="relative w-4 h-4 rounded-full bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
        </div>
      </div>

      {/* Hotel label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-6 whitespace-nowrap">
        <div className="flex items-center space-x-1.5 bg-[#1A1A1A] bg-opacity-90 border border-[#D4AF37] border-opacity-30 rounded-full px-3 py-1.5 backdrop-blur-sm">
          <span className="text-[#D4AF37] text-xs">📍</span>
          <span className="text-xs font-medium text-gray-200 font-sans">The Grand Palace Hotel</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-1">
        <button className="w-8 h-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors flex items-center justify-center text-lg font-light">+</button>
        <button className="w-8 h-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors flex items-center justify-center text-lg font-light">−</button>
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-4 left-4 text-[10px] text-gray-600">
        © Stayscape Maps
      </div>
    </div>
  );
}
