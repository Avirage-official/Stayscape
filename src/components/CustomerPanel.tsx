'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { GuestPreference, PreferenceType } from '@/types/pms';

/* ─── Props ─── */

export interface CustomerPanelProps {
  stayId?: string | null;
  guestTitle?: string | null;
  guestName?: string | null;
  roomLabel?: string | null;
  roomType?: string | null;
  guestCount?: number | null;
  checkIn?: string | null;
  checkOut?: string | null;
  arrivalNote?: string | null;
  departureNote?: string | null;
}

/* ─── Helpers ─── */

function formatDateShort(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function generateHousekeepingSchedule(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
) {
  if (!checkIn || !checkOut) {
    // Fallback schedule
    return [
      { day: 'Sat 14', clean: true },
      { day: 'Sun 15', clean: true },
      { day: 'Mon 16', clean: false },
      { day: 'Tue 17', clean: true },
      { day: 'Wed 18', clean: true },
      { day: 'Thu 19', clean: false },
    ];
  }
  const days: { day: string; clean: boolean }[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  let i = 0;
  for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate().toString();
    days.push({ day: `${dayName} ${dayNum}`, clean: i % 3 !== 2 });
    i++;
  }
  return days.slice(0, 7); // cap at 7 days for display
}

function generateStayTimeline(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
) {
  if (!checkIn || !checkOut) {
    return [
      { day: 'Day 1', label: 'Arrival & check-in' },
      { day: 'Day 2', label: 'Spa & dining' },
      { day: 'Day 3', label: 'City excursion' },
      { day: 'Day 4', label: 'Anniversary dinner' },
      { day: 'Day 5', label: 'Leisure & shopping' },
      { day: 'Day 6', label: 'Departure' },
    ];
  }
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const midLabels = ['Explore & discover', 'Spa & dining', 'City excursion', 'Culture & art', 'Leisure & shopping'];
  const entries: { day: string; label: string }[] = [];
  for (let n = 0; n <= nights; n++) {
    let label: string;
    if (n === 0) label = 'Arrival & check-in';
    else if (n === nights) label = 'Departure';
    else label = midLabels[(n - 1) % midLabels.length];
    entries.push({ day: `Day ${n + 1}`, label });
  }
  return entries;
}

const CATEGORY_TO_PREFERENCE_TYPE: Record<string, PreferenceType> = {
  Dining: 'dining',
  'Stay Type': 'general',
  Housekeeping: 'room_service',
};

function preferenceTypeToCategory(type: PreferenceType): string | null {
  for (const [cat, pt] of Object.entries(CATEGORY_TO_PREFERENCE_TYPE)) {
    if (pt === type) return cat;
  }
  return null;
}

/* ─── Static preference options ─── */

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
    <h3 className="text-[9px] font-medium text-white/35 uppercase tracking-[0.18em] mb-2">
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
      className={`text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
        active
          ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/35 text-[#C9A84C]'
          : 'bg-white/5 border border-white/10 text-white/55 hover:text-white/80 hover:border-white/20'
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
      <span className="text-[#C9A84C]/70 text-[10px] tracking-wide">
        Guest Preferences Updated
      </span>
    </div>
  );
}

/* ─── Main component ─── */

export default function CustomerPanel({
  stayId,
  guestTitle,
  guestName,
  roomLabel,
  roomType,
  guestCount,
  checkIn,
  checkOut,
  arrivalNote,
  departureNote,
}: CustomerPanelProps) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const key of Object.keys(defaultSelected)) {
      init[key] = new Set(defaultSelected[key]);
    }
    return init;
  });

  const [showUpdated, setShowUpdated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userModifiedRef = useRef(false);

  // Fetch existing preferences on mount when stay is available
  useState(() => {
    if (!stayId) return;
    fetch(`/api/pms/preferences?stay_id=${stayId}`)
      .then((r) => r.json())
      .then(({ data }: { data: GuestPreference[] }) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const init: Record<string, Set<string>> = {};
        for (const pref of data) {
          const category = preferenceTypeToCategory(pref.preference_type);
          if (!category) continue;
          const chips = pref.preference_data?.selected_chips;
          if (Array.isArray(chips)) {
            init[category] = new Set(chips as string[]);
          }
        }
        if (Object.keys(init).length > 0) {
          setSelected(init);
        }
      })
      .catch(() => {});
  });

  // Debounced preference save — only fires after user modifies chips
  useEffect(() => {
    if (!stayId || !userModifiedRef.current) return;
    const timer = setTimeout(() => {
      Object.entries(selected).forEach(([category, chips]) => {
        const preferenceType = CATEGORY_TO_PREFERENCE_TYPE[category];
        if (!preferenceType) return;
        fetch('/api/pms/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stay_id: stayId,
            preference_type: preferenceType,
            preference_data: { selected_chips: Array.from(chips) },
          }),
        }).catch(() => {});
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [selected, stayId]);

  const toggleChip = useCallback(
    (category: string, chip: string) => {
      userModifiedRef.current = true;
      setSelected((prev) => {
        const set = new Set(prev[category] ?? []);
        if (set.has(chip)) {
          set.delete(chip);
        } else {
          set.add(chip);
        }
        return { ...prev, [category]: set };
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      setShowUpdated(true);
      timerRef.current = setTimeout(() => setShowUpdated(false), 2200);
    },
    [],
  );

  // Derived display values
  const displayName = guestName ?? null;
  const displayTitle = guestTitle ?? null;
  const displayRoom = roomLabel ?? null;
  const displayRoomType = roomType ?? null;
  const displayGuests = guestCount ?? null;
  const displayCheckIn = formatDateShort(checkIn);
  const displayCheckOut = formatDateShort(checkOut);
  const displayArrivalNote = arrivalNote ?? null;
  const displayDepartureNote = departureNote ?? null;
  const avatarInitials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'G';
  const housekeepingSchedule = generateHousekeepingSchedule(checkIn, checkOut);
  const stayTimeline = generateStayTimeline(checkIn, checkOut);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-slide-in-left">
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        {/* ── Room & Stay Summary ── */}
        <div className="px-4 pt-5 pb-4 border-b border-white/8">
          {/* Guest identity */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-medium text-[#C9A84C]">{avatarInitials}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] font-medium text-white tracking-wide">
                {displayTitle ? `${displayTitle} ${displayName ?? 'Guest'}` : (displayName ?? 'Valued Guest')}
              </h2>
              <p className="text-[10px] text-white/45 mt-0.5 tracking-wide">
                {[displayRoomType, displayGuests != null ? `${displayGuests} guest${displayGuests !== 1 ? 's' : ''}` : null]
                  .filter(Boolean)
                  .join(' · ') || 'Room details unavailable'}
              </p>
            </div>
          </div>

          {/* Status & room */}
          <div className="flex items-center space-x-2.5 mb-4">
            <span className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
              Checked In
            </span>
            {displayRoom && (
              <span className="text-[10px] text-white/60">{displayRoom}</span>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/8">
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Arrival</p>
                <p className="text-[11px] text-white/70">{displayCheckIn ?? '—'}</p>
              </div>
              <div className="flex items-center px-3">
                <div className="w-6 h-px bg-white/15" />
                <div className="w-1 h-1 rounded-full bg-[#C9A84C]/30 mx-1" />
                <div className="w-6 h-px bg-white/15" />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Departure</p>
                <p className="text-[11px] text-white/70">{displayCheckOut ?? '—'}</p>
              </div>
            </div>

            {/* Arrival / Departure notes */}
            {(displayArrivalNote || displayDepartureNote) && (
              <div className="mt-3 pt-2.5 border-t border-white/8 space-y-1.5">
                {displayArrivalNote && (
                  <p className="text-[10px] text-white/55 leading-snug">
                    <span className="text-[#C9A84C]/50 mr-1">↓</span>
                    {displayArrivalNote}
                  </p>
                )}
                {displayDepartureNote && (
                  <p className="text-[10px] text-white/55 leading-snug">
                    <span className="text-[#C9A84C]/50 mr-1">↑</span>
                    {displayDepartureNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-4 space-y-5 flex-1">
          {/* ── Housekeeping Schedule ── */}
          <div className="animate-fade-in-up stagger-1">
            <SectionLabel>Housekeeping Schedule</SectionLabel>
            <div className="flex gap-1.5">
              {housekeepingSchedule.map((d) => {
                const [dayName, dayNum] = d.day.split(' ');
                return (
                <div
                  key={d.day}
                  className={`flex-1 rounded-lg py-2 text-center border ${
                    d.clean
                      ? 'bg-white/5 border-white/8'
                      : 'bg-transparent border-white/5 opacity-40'
                  }`}
                >
                  <p className="text-[8px] text-white/30 uppercase tracking-wider leading-none mb-1">
                    {dayName}
                  </p>
                  <p className="text-[9px] text-white/50 leading-none mb-1.5">
                    {dayNum}
                  </p>
                  <span
                    className={`text-[10px] ${
                      d.clean ? 'text-emerald-400/70' : 'text-white/30'
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
                  className={`rounded-xl px-2.5 py-2 border ${
                    i < 2
                      ? 'bg-[#C9A84C]/8 border-[#C9A84C]/15'
                      : 'bg-white/[0.04] border-white/8'
                  }`}
                >
                  <p
                    className={`text-[9px] font-medium uppercase tracking-wider mb-0.5 ${
                      i < 2 ? 'text-[#C9A84C]/60' : 'text-white/30'
                    }`}
                  >
                    {entry.day}
                  </p>
                  <p className="text-white/60 text-[10px] leading-snug">{entry.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Updated status ── */}
        <div className="px-4 pb-3 flex-shrink-0">
          <UpdatedStatus visible={showUpdated} />
        </div>
      </div>
    </div>
  );
}
