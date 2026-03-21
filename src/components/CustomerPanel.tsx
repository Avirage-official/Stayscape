'use client';

const customer = {
  name: 'James Anderson',
  title: 'Mr.',
  status: 'Checked In',
  loyaltyTier: 'Platinum Elite',
  memberSince: '2019',
  location: 'New York, NY',
  email: 'j.anderson@email.com',
  phone: '+1 (212) 555-0184',
  stayCount: 47,
  avatar: 'JA',
  checkIn: 'Dec 14, 2024',
  checkOut: 'Dec 19, 2024',
  room: 'Suite 1204',
  roomType: 'Deluxe Ocean View',
  guests: 2,
  reservationId: 'RES-2024-8741',
  reservationState: 'Confirmed',
  nightsRemaining: 5,
  preferences: [
    { icon: '🛏', label: 'High floor' },
    { icon: '🌡', label: '68°F room' },
    { icon: '☕', label: 'Oat milk' },
    { icon: '🧘', label: 'Morning yoga' },
    { icon: '🍷', label: 'Red wine' },
    { icon: '🚭', label: 'Non-smoking' },
  ],
  notes: [
    { type: 'alert' as const, text: 'Anniversary stay — Dec 17' },
    { type: 'note' as const, text: 'Prefers late checkout when available' },
    { type: 'note' as const, text: 'Allergic to shellfish — kitchen notified' },
  ],
  recentActivity: [
    { time: '2h ago', action: 'Spa reservation confirmed', detail: '4:00 PM today' },
    { time: '5h ago', action: 'Room service delivered', detail: 'Breakfast — Suite 1204' },
    { time: 'Yesterday', action: 'Concierge request', detail: 'Restaurant booking — Le Bernardin' },
    { time: '2 days ago', action: 'Check-in completed', detail: 'Suite 1204 · Deluxe Ocean View' },
  ],
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em] mb-2">
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="border-t border-[#1E1E1E] my-3" />;
}

export default function CustomerPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#111111]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1E1E1E]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
              <span className="text-sm font-medium text-[#D4AF37]">{customer.avatar}</span>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-100">{customer.title} {customer.name}</h2>
              <p className="text-[11px] text-gray-500">{customer.location}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {customer.status}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-0">
        {/* Profile Summary */}
        <div>
          <SectionLabel>Profile</SectionLabel>
          <div className="bg-[#161616] rounded-lg p-3 border border-[#1E1E1E]">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center space-x-1.5 text-[11px] text-[#D4AF37]">
                <span className="text-xs">◆</span>
                <span className="font-medium">{customer.loyaltyTier}</span>
              </span>
              <span className="text-[10px] text-gray-600">Since {customer.memberSince}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div>
                <span className="text-gray-500">Stays</span>
                <span className="text-gray-300 ml-1.5">{customer.stayCount}</span>
              </div>
              <div>
                <span className="text-gray-500">Guests</span>
                <span className="text-gray-300 ml-1.5">{customer.guests}</span>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Booking Block */}
        <div>
          <SectionLabel>Booking</SectionLabel>
          <div className="bg-[#161616] rounded-lg p-3 border border-[#1E1E1E]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] text-gray-400 font-mono">{customer.reservationId}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {customer.reservationState}
              </span>
            </div>
            <div className="flex items-center space-x-2 mb-2.5">
              <span className="text-xs text-[#D4AF37]">✦</span>
              <div>
                <p className="text-[12px] text-gray-200">{customer.roomType}</p>
                <p className="text-[11px] text-gray-500">{customer.room}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <p className="text-gray-500 text-[10px]">Check-in</p>
                <p className="text-gray-300">{customer.checkIn}</p>
              </div>
              <svg width="24" height="8" viewBox="0 0 24 8" fill="none" className="mx-2 flex-shrink-0">
                <path d="M0 4h20M17 1l3 3-3 3" stroke="#2A2A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-right">
                <p className="text-gray-500 text-[10px]">Check-out</p>
                <p className="text-gray-300">{customer.checkOut}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-center">
              <span className="inline-flex items-center space-x-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-2.5 py-1 text-[11px] text-[#D4AF37]">
                <span>◆</span>
                <span>{customer.nightsRemaining} nights remaining</span>
              </span>
            </div>
          </div>
        </div>

        <Divider />

        {/* Preferences */}
        <div>
          <SectionLabel>Preferences</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {customer.preferences.map((pref) => (
              <span
                key={pref.label}
                className="inline-flex items-center space-x-1 bg-[#161616] border border-[#1E1E1E] rounded-full px-2.5 py-1 text-[11px] text-gray-400"
              >
                <span className="text-xs">{pref.icon}</span>
                <span>{pref.label}</span>
              </span>
            ))}
          </div>
        </div>

        <Divider />

        {/* Notes & Alerts */}
        <div>
          <SectionLabel>Notes &amp; Alerts</SectionLabel>
          <div className="space-y-1.5">
            {customer.notes.map((note, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2 rounded-lg px-3 py-2 text-[11px] ${
                  note.type === 'alert'
                    ? 'bg-amber-500/8 border border-amber-500/15 text-amber-300'
                    : 'bg-[#161616] border border-[#1E1E1E] text-gray-400'
                }`}
              >
                <span className="mt-0.5 flex-shrink-0 text-[10px]">
                  {note.type === 'alert' ? '⚠' : '•'}
                </span>
                <span className="leading-relaxed">{note.text}</span>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* Recent Activity */}
        <div className="pb-4">
          <SectionLabel>Recent Activity</SectionLabel>
          <div className="space-y-0">
            {customer.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start space-x-3 py-2">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A] mt-1.5" />
                  {i < customer.recentActivity.length - 1 && (
                    <div className="w-px h-full bg-[#1E1E1E] mt-1" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-300 leading-snug">{activity.action}</p>
                  <p className="text-[10px] text-gray-600 leading-snug mt-0.5">{activity.detail}</p>
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0 ml-auto whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
