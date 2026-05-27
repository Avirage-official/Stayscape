export interface StayInfoCardProps {
  guestTitle?: string | null;
  guestName?: string | null;
  hotelName?: string | null;
  roomLabel?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calcNightsRemaining(checkOut: string | null | undefined): number {
  if (!checkOut) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkout = new Date(checkOut);
  checkout.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((checkout.getTime() - today.getTime()) / 86400000));
}

export default function StayInfoCard({
  guestTitle,
  guestName,
  hotelName,
  roomLabel,
  checkIn,
  checkOut,
}: StayInfoCardProps) {
  const hasStay = !!(hotelName || checkIn || checkOut);
  const displayName = [guestTitle, guestName].filter(Boolean).join(' ') || null;
  const formattedCheckIn = formatDate(checkIn);
  const formattedCheckOut = formatDate(checkOut);
  const nightsRemaining = calcNightsRemaining(checkOut);

  if (!hasStay) {
    return (
      <div className="bg-[#1A1A1A] rounded-xl p-5 border-l-4 border-[#D4AF37]">
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Welcome back,</p>
          {displayName ? (
            <h2 className="font-serif text-lg text-white leading-tight">{displayName}</h2>
          ) : (
            <h2 className="font-serif text-lg text-white/40 leading-tight italic">No stay loaded</h2>
          )}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Your stay details will appear here once a booking is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5 border-l-4 border-[#D4AF37]">
      {/* Welcome */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Welcome back,</p>
        <h2 className="font-serif text-lg text-white leading-tight">
          {displayName ?? 'Valued Guest'}
        </h2>
      </div>

      {/* Hotel */}
      <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-[#2A2A2A]">
        <span className="text-[#D4AF37] text-base">✦</span>
        <div>
          <p className="text-sm font-medium text-gray-200">{hotelName ?? '—'}</p>
          {roomLabel && <p className="text-xs text-gray-500">{roomLabel}</p>}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">📅</span>
            <div>
              <p className="text-xs text-gray-500">Check-in</p>
              <p className="text-sm text-gray-200">{formattedCheckIn ?? '—'}</p>
            </div>
          </div>
          <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
            <path d="M0 4h18M15 1l3 3-3 3" stroke="#2A2A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">📅</span>
            <div>
              <p className="text-xs text-gray-500">Check-out</p>
              <p className="text-sm text-gray-200">{formattedCheckOut ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nights badge */}
      <div className="inline-flex items-center space-x-1.5 bg-[#D4AF37] bg-opacity-10 border border-[#D4AF37] border-opacity-30 rounded-full px-3 py-1">
        <span className="text-[#D4AF37] text-xs">◆</span>
        <span className="text-xs text-[#D4AF37] font-medium">
          {nightsRemaining === 1
            ? '1 night remaining'
            : nightsRemaining > 0
              ? `${nightsRemaining} nights remaining`
              : 'Stay complete'}
        </span>
      </div>
    </div>
  );
}
