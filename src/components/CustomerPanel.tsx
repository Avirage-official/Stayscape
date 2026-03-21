'use client';

import { useState, useRef, useCallback } from 'react';

/* ─── Static guest data ─── */
const guest = {
  name: 'James Anderson',
  title: 'Mr.',
  status: 'Checked In' as const,
  avatar: 'JA',
  room: 'Suite 1204',
  roomType: 'Deluxe Ocean View',
  guests: 2,
  checkIn: 'Dec 14, 2024',
  checkOut: 'Dec 19, 2024',
  arrivalNote: 'Late arrival — airport transfer arranged',
  departureNote: 'Late checkout requested (2 PM)',
  housekeepingSchedule: [
    { day: 'Sat 14', clean: true },
    { day: 'Sun 15', clean: true },
    { day: 'Mon 16', clean: false },
    { day: 'Tue 17', clean: true },
    { day: 'Wed 18', clean: true },
    { day: 'Thu 19', clean: false },
  ],
};

const stayTimeline = [
  { day: 'Day 1', label: 'Arrival & check-in' },
  { day: 'Day 2', label: 'Spa & dining' },
  { day: 'Day 3', label: 'City excursion' },
  { day: 'Day 4', label: 'Anniversary dinner' },
  { day: 'Day 5', label: 'Leisure & shopping' },
  { day: 'Day 6', label: 'Departure' },
];

interface PreferenceGroup {
  category: string;
  chips: string[];
}

const preferenceGroups: PreferenceGroup[] = [
  {
    category: 'Dining',
    chips: [
      'Early breakfast',
      'Late breakfast',
      'Early dinner',
      'Late dinner',
      'In-house dining',
      'Room service',
    ],
  },
  {
    category: 'Stay Type',
    chips: [
      'Luxury',
      'Fun',
      'Shopping',
      'Business',
      'Family',
      'Solo',
      'Educational',
    ],
  },
  {
    category: 'Housekeeping',
    chips: [
      'Light cleanup',
      'Top-up',
      'Full service',
      'Morning clean',
      'Afternoon clean',
      'Laundry',
      'Shoe cleaning',
      'Ironing',
      'Pressing',
    ],
  },
];

const defaultSelected: Record<string, Set<string>> = {
  Dining: new Set(['Late breakfast', 'Late dinner', 'Room service']),
  'Stay Type': new Set(['Luxury']),
  Housekeeping: new Set(['Full service', 'Morning clean', 'Laundry', 'Ironing']),
};

/* ─── Sub-components ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] font-medium text-gray-500 uppercase tracking-[0.14em] mb-2.5 ml-0.5">
      {children}
    </h3>
  );
}

function PreferenceChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-[5px] rounded-[5px] text-[10px] border transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-[#C9A84C]/12 border-[#C9A84C]/30 text-[#C9A84C]'
          : 'bg-[#141414] border-[#1C1C1C] text-gray-500 hover:border-[#252525] hover:text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

function UpdatedStatus({ visible }: { visible: boolean }) {
  return (
    <div
      className={`flex items-center justify-center space-x-2 py-3 transition-all duration-500 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C9A84C]/12 border border-[#C9A84C]/25 gold-check-pulse">
        <svg
          width="8"
          height="8"
          viewBox="0 0 10 10"
          fill="none"
          className="text-[#C9A84C]"
        >
          <path
            d="M2 5.5L4 7.5L8 3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[10px] text-[#C9A84C]/70 tracking-wide">
        Guest Preferences Updated
      </span>
    </div>
  );
}

/* ─── Main component ─── */

export default function CustomerPanel() {
  const [selected, setSelected] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const key of Object.keys(defaultSelected)) {
      init[key] = new Set(defaultSelected[key]);
    }
    return init;
  });

  const [showUpdated, setShowUpdated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleChip = useCallback(
    (category: string, chip: string) => {
      setSelected((prev) => {
        const next = { ...prev };
        const set = new Set(prev[category] ?? []);
        if (set.has(chip)) {
          set.delete(chip);
        } else {
          set.add(chip);
        }
        next[category] = set;
        return next;
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      setShowUpdated(true);
      timerRef.current = setTimeout(() => setShowUpdated(false), 2200);
    },
    [],
  );

  return (
    <div className="flex h-full overflow-hidden bg-[#0F0F0F] animate-slide-in-left">
      {/* Thin vertical accent rail */}
      <div className="w-[3px] flex-shrink-0 bg-gradient-to-b from-[#C9A84C]/20 via-[#C9A84C]/8 to-transparent" />

      {/* Main dossier content */}
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        {/* ── Room & Stay Summary ── */}
        <div className="px-5 pt-5 pb-4 border-b border-[#1A1A1A]">
          {/* Guest identity */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-11 h-11 rounded-[7px] bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[13px] font-medium text-[#C9A84C]">{guest.avatar}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] font-medium text-gray-100 tracking-wide">
                {guest.title} {guest.name}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5 tracking-wide">
                {guest.roomType} · {guest.guests} guests
              </p>
            </div>
          </div>

          {/* Status & room */}
          <div className="flex items-center space-x-2.5 mb-4">
            <span className="inline-flex items-center px-2 py-[3px] rounded-[4px] text-[9px] font-medium bg-emerald-500/8 text-emerald-400 border border-emerald-500/15 tracking-wide uppercase">
              {guest.status}
            </span>
            <span className="text-[10px] text-gray-400">{guest.room}</span>
          </div>

          {/* Dates */}
          <div className="bg-[#141414] rounded-[6px] p-3.5 border border-[#1C1C1C]">
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Arrival</p>
                <p className="text-gray-300">{guest.checkIn}</p>
              </div>
              <div className="flex items-center px-3">
                <div className="w-6 h-px bg-[#222222]" />
                <div className="w-1 h-1 rounded-full bg-[#C9A84C]/40 mx-1" />
                <div className="w-6 h-px bg-[#222222]" />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Departure</p>
                <p className="text-gray-300">{guest.checkOut}</p>
              </div>
            </div>

            {/* Arrival / Departure notes */}
            <div className="mt-3 pt-2.5 border-t border-[#1C1C1C] space-y-1.5">
              <p className="text-[10px] text-gray-500 leading-snug">
                <span className="text-[#C9A84C]/50 mr-1">↓</span>
                {guest.arrivalNote}
              </p>
              <p className="text-[10px] text-gray-500 leading-snug">
                <span className="text-[#C9A84C]/50 mr-1">↑</span>
                {guest.departureNote}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 flex-1">
          {/* ── Housekeeping Schedule ── */}
          <div className="animate-fade-in-up stagger-1">
            <SectionLabel>Housekeeping Schedule</SectionLabel>
            <div className="flex gap-1.5">
              {guest.housekeepingSchedule.map((d) => {
                const [dayName, dayNum] = d.day.split(' ');
                return (
                <div
                  key={d.day}
                  className={`flex-1 rounded-[5px] py-2 text-center border ${
                    d.clean
                      ? 'bg-[#141414] border-[#1C1C1C]'
                      : 'bg-[#141414]/50 border-[#1A1A1A]/50'
                  }`}
                >
                  <p className="text-[8px] text-gray-600 uppercase tracking-wider leading-none mb-1">
                    {dayName}
                  </p>
                  <p className="text-[9px] text-gray-500 leading-none mb-1.5">
                    {dayNum}
                  </p>
                  <span
                    className={`text-[10px] ${
                      d.clean ? 'text-emerald-400/80' : 'text-gray-600'
                    }`}
                  >
                    {d.clean ? '✓' : '—'}
                  </span>
                </div>
                );
              })}
            </div>
          </div>

          {/* ── Preferences ── */}
          {preferenceGroups.map((group, gi) => (
            <div
              key={group.category}
              className={`animate-fade-in-up stagger-${gi + 2}`}
            >
              <SectionLabel>{group.category}</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {group.chips.map((chip) => (
                  <PreferenceChip
                    key={chip}
                    label={chip}
                    active={selected[group.category]?.has(chip) ?? false}
                    onClick={() => toggleChip(group.category, chip)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ── Stay Timeline ── */}
          <div className="animate-fade-in-up stagger-5">
            <SectionLabel>Stay Timeline</SectionLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {stayTimeline.map((entry, i) => (
                <div
                  key={entry.day}
                  className={`rounded-[5px] px-2.5 py-2 border ${
                    i < 2
                      ? 'bg-[#C9A84C]/5 border-[#C9A84C]/15'
                      : 'bg-[#141414] border-[#1C1C1C]'
                  }`}
                >
                  <p
                    className={`text-[9px] font-medium uppercase tracking-wider mb-0.5 ${
                      i < 2 ? 'text-[#C9A84C]/70' : 'text-gray-600'
                    }`}
                  >
                    {entry.day}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-snug">{entry.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Updated status ── */}
        <div className="px-5 pb-3 flex-shrink-0">
          <UpdatedStatus visible={showUpdated} />
        </div>
      </div>
    </div>
  );
}
