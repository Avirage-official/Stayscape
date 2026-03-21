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
    <h3 className="text-[9px] font-medium text-gray-500 uppercase tracking-[0.14em] mb-2.5 ml-0.5">
      {children}
    </h3>
  );
}

export default function CustomerPanel() {
  return (
    <div className="flex h-full overflow-hidden bg-[#0F0F0F] animate-slide-in-left">
      {/* Thin vertical timeline rail */}
      <div className="w-[3px] flex-shrink-0 bg-gradient-to-b from-[#C9A84C]/20 via-[#C9A84C]/8 to-transparent" />

      {/* Main dossier content */}
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        {/* Guest Identity Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#1A1A1A]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-[7px] bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                <span className="text-[13px] font-medium text-[#C9A84C]">{customer.avatar}</span>
              </div>
              <div>
                <h2 className="text-[14px] font-medium text-gray-100 tracking-wide">{customer.title} {customer.name}</h2>
                <p className="text-[10px] text-gray-500 mt-0.5 tracking-wide">{customer.location}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center px-2 py-[3px] rounded-[4px] text-[9px] font-medium bg-emerald-500/8 text-emerald-400 border border-emerald-500/15 tracking-wide uppercase">
              {customer.status}
            </span>
            <span className="inline-flex items-center space-x-1 text-[10px] text-[#C9A84C]/80">
              <span className="text-[8px]">◆</span>
              <span>{customer.loyaltyTier}</span>
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Profile Summary */}
          <div className="animate-fade-in-up stagger-1">
            <SectionLabel>Profile</SectionLabel>
            <div className="bg-[#141414] rounded-[6px] p-3.5 border border-[#1C1C1C]">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[11px]">
                <div>
                  <span className="text-[9px] text-gray-600 uppercase tracking-wider block mb-0.5">Member Since</span>
                  <span className="text-gray-300">{customer.memberSince}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-600 uppercase tracking-wider block mb-0.5">Total Stays</span>
                  <span className="text-gray-300">{customer.stayCount}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-600 uppercase tracking-wider block mb-0.5">Contact</span>
                  <span className="text-gray-400 text-[10px]">{customer.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-600 uppercase tracking-wider block mb-0.5">Guests</span>
                  <span className="text-gray-300">{customer.guests}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Block */}
          <div className="animate-fade-in-up stagger-2">
            <SectionLabel>Current Booking</SectionLabel>
            <div className="bg-[#141414] rounded-[6px] p-3.5 border border-[#1C1C1C]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-gray-500 font-mono tracking-wider">{customer.reservationId}</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-500/8 px-1.5 py-[2px] rounded-[3px] border border-emerald-500/12">
                  {customer.reservationState}
                </span>
              </div>
              <div className="flex items-center space-x-2.5 mb-3 pb-3 border-b border-[#1C1C1C]">
                <span className="text-[10px] text-[#C9A84C]/70">✦</span>
                <div>
                  <p className="text-[12px] text-gray-200 font-medium">{customer.roomType}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{customer.room}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">In</p>
                  <p className="text-gray-300 text-[11px]">{customer.checkIn}</p>
                </div>
                <div className="flex items-center px-3">
                  <div className="w-8 h-px bg-[#222222]" />
                  <div className="w-1 h-1 rounded-full bg-[#C9A84C]/40 mx-1" />
                  <div className="w-8 h-px bg-[#222222]" />
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Out</p>
                  <p className="text-gray-300 text-[11px]">{customer.checkOut}</p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#1C1C1C] flex justify-center">
                <span className="text-[10px] text-[#C9A84C]/70 tracking-wide">
                  {customer.nightsRemaining} nights remaining
                </span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="animate-fade-in-up stagger-3">
            <SectionLabel>Preferences</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {customer.preferences.map((pref) => (
                <span
                  key={pref.label}
                  className="inline-flex items-center space-x-1 bg-[#141414] border border-[#1C1C1C] rounded-[5px] px-2.5 py-[5px] text-[10px] text-gray-400 hover:border-[#252525] transition-colors duration-200"
                >
                  <span className="text-[10px]">{pref.icon}</span>
                  <span>{pref.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Notes & Alerts */}
          <div className="animate-fade-in-up stagger-4">
            <SectionLabel>Notes &amp; Alerts</SectionLabel>
            <div className="space-y-1.5">
              {customer.notes.map((note, i) => (
                <div
                  key={i}
                  className={`flex items-start space-x-2.5 rounded-[5px] px-3 py-2.5 text-[11px] ${
                    note.type === 'alert'
                      ? 'bg-[#1A1608] border border-[#2A2010] text-amber-300/90'
                      : 'bg-[#141414] border border-[#1C1C1C] text-gray-400'
                  }`}
                >
                  <span className="mt-[1px] flex-shrink-0 text-[9px]">
                    {note.type === 'alert' ? '▲' : '·'}
                  </span>
                  <span className="leading-relaxed">{note.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity with timeline rail */}
          <div className="pb-5 animate-fade-in-up stagger-5">
            <SectionLabel>Recent Activity</SectionLabel>
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[4px] top-2 bottom-2 w-px bg-gradient-to-b from-[#222222] via-[#1C1C1C] to-transparent" />
              
              <div className="space-y-0">
                {customer.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start space-x-3.5 py-2 group">
                    <div className="relative flex-shrink-0 mt-1.5">
                      <div className={`w-[9px] h-[9px] rounded-full border ${
                        i === 0
                          ? 'bg-[#C9A84C]/20 border-[#C9A84C]/40'
                          : 'bg-[#1A1A1A] border-[#252525]'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-300 leading-snug">{activity.action}</p>
                      <p className="text-[10px] text-gray-600 leading-snug mt-0.5">{activity.detail}</p>
                    </div>
                    <span className="text-[9px] text-gray-600 flex-shrink-0 ml-auto whitespace-nowrap mt-0.5">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
