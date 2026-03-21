'use client';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 h-[48px] bg-[#0C0C0C] border-b border-[#181818] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <span className="font-serif text-[17px] text-[#C9A84C] tracking-[0.04em]">Stayscape</span>
        <span className="hidden sm:inline text-[9px] text-gray-600 tracking-[0.18em] uppercase border-l border-[#1E1E1E] pl-3 font-light">Concierge</span>
      </div>

      {/* Minimal nav */}
      <nav className="hidden md:flex items-center space-x-6">
        <span className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors duration-200 tracking-wide">Guests</span>
        <span className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors duration-200 tracking-wide">Bookings</span>
        <span className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors duration-200 tracking-wide">Services</span>
      </nav>

      {/* Concierge operator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-[6px] h-[6px] rounded-full bg-emerald-500/70" />
          <span className="text-[10px] text-gray-500 hidden sm:inline">On Duty</span>
        </div>
        <div className="w-px h-4 bg-[#1E1E1E]" />
        <div className="flex items-center space-x-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-medium text-gray-300 tracking-wide">L. Marchand</div>
          </div>
          <div className="w-7 h-7 rounded-[6px] bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
            <span className="text-[10px] text-[#C9A84C] font-medium">LM</span>
          </div>
        </div>
      </div>
    </header>
  );
}
