'use client';

import type { MapPlace } from '@/types';

interface MapFallbackProps {
  onSelectPlace?: (place: MapPlace) => void;
  selectedPlaceId?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MapFallback(_props: MapFallbackProps) {
  return (
    <div className="relative w-full h-full bg-[var(--map-bg)] overflow-hidden animate-fade-in rounded-[10px] ring-1 ring-[var(--gold)]/10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(25, 35, 50, 0.15) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(25, 35, 50, 0.15) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '52px 52px',
        }}
      />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
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
        <rect x="410" y="155" width="85" height="65" rx="6" fill="#0C1610" stroke="#13241A" strokeWidth="0.5" />
        <text x="452" y="192" textAnchor="middle" fill="#172E1F" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">CITY PARK</text>
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
        <line x1="200" y1="0" x2="200" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#141E2C" strokeWidth="8" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="100" y1="0" x2="100" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="500" y1="0" x2="500" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="700" y1="0" x2="700" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="150" x2="800" y2="150" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#141E2C" strokeWidth="8" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="75" x2="800" y2="75" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="225" x2="800" y2="225" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="375" x2="800" y2="375" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="525" x2="800" y2="525" stroke="#101822" strokeWidth="2.5" />
        <text x="400" y="296" textAnchor="middle" fill="#182535" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="0.18em">MAIN AVENUE</text>
        <text x="197" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 197, 260)">PARK BLVD</text>
        <text x="597" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 597, 260)">PARK AVE</text>
        <text x="750" y="296" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 57TH ST</text>
        <text x="50" y="148" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">W 59TH ST</text>
        <text x="750" y="448" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 55TH ST</text>
      </svg>

      <div className="absolute inset-0 bg-gradient-to-r from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-30 pointer-events-none" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-12 w-12 rounded-full bg-[var(--gold)]/6 animate-gentle-pulse" />
          <span className="absolute inline-flex h-7 w-7 rounded-full border border-[var(--gold)]/15" />
          <span className="absolute inline-flex h-5 w-5 rounded-full border border-[var(--gold)]/25" />
          <div className="relative w-3 h-3 rounded-full bg-[var(--gold)] shadow-[0_0_12px_rgba(201,168,76,0.5),0_0_4px_rgba(201,168,76,0.8)]" />
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-9 whitespace-nowrap">
        <div className="flex items-center space-x-2 bg-[var(--map-label-bg)] border border-[var(--gold)]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          <span className="text-[11px] font-medium tracking-[0.03em]" style={{ color: 'rgba(232,230,225,0.9)' }}>Your Location</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-4 flex flex-col gap-1.5">
        <button
          type="button"
          className="w-9 h-9 rounded-[7px] flex items-center justify-center text-base transition-all duration-200 cursor-pointer select-none"
          style={{
            background: 'var(--map-zoom-bg)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--map-zoom-border)',
            color: 'rgba(232,230,225,0.7)',
          }}
        >+</button>
        <button
          type="button"
          className="w-9 h-9 rounded-[7px] flex items-center justify-center text-base transition-all duration-200 cursor-pointer select-none"
          style={{
            background: 'var(--map-zoom-bg)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--map-zoom-border)',
            color: 'rgba(232,230,225,0.7)',
          }}
        >−</button>
      </div>

      <div className="absolute bottom-2 left-3 text-[8px] tracking-wide" style={{ color: 'rgba(107,114,128,0.5)' }}>
        © Stayscape Maps · <span style={{ opacity: 0.5 }}>preview</span>
      </div>
    </div>
  );
}
