'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { CustomerStay } from '@/types/customer';
import type { GuestPreference, PreferenceType } from '@/types/pms';
import MapPlaceholder from '@/components/MapPlaceholder';
import { ItineraryProvider } from '@/components/ItineraryContext';
import { RegionProvider } from '@/lib/context/region-context';
import { getStaySelectedRegion } from '@/components/guest-lounge/stay-region';
import DiscoverPanel from '@/components/DiscoverPanel';
import ItineraryPanel from '@/components/ItineraryPanel';

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

const MS_PER_DAY = 86400000;

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function nightsBetween(a: string, b: string): number {
  return Math.max(
    0,
    Math.round(
      (parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / MS_PER_DAY,
    ),
  );
}

function formatLongDate(iso: string): string {
  const d = parseLocalDate(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ═══════════════════════════════════════════════════════════════
   Preferences logic (extracted from CustomerPanel)
   ═══════════════════════════════════════════════════════════════ */

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
    chips: ['Luxury', 'Fun', 'Shopping', 'Business', 'Family', 'Solo', 'Educational'],
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

/* ═══════════════════════════════════════════════════════════════
   Amenities data
   ═══════════════════════════════════════════════════════════════ */

const amenityCategories = [
  {
    label: 'Bathroom',
    icon: '🛁',
    items: ['Rain shower', 'Bathtub', 'Luxury toiletries', 'Heated floors', 'Towel warmer'],
  },
  {
    label: 'Bedroom',
    icon: '🛏',
    items: ['King bed', 'Premium linens', 'Blackout curtains', 'Smart TV', 'Minibar'],
  },
  {
    label: 'Services',
    icon: '✦',
    items: ['24h Concierge', 'Room service', 'Laundry', 'Airport transfer', 'Spa access'],
  },
  {
    label: 'Dining',
    icon: '🍽',
    items: ['Breakfast included', 'Restaurant', 'Bar & lounge', 'Poolside dining', 'Private dining'],
  },
];

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-[10px] font-medium text-white/30 uppercase tracking-[0.18em]">
        {children}
      </h3>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
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
          ? 'bg-[var(--gold)]/12 border-[var(--gold)]/30 text-[var(--gold)]'
          : 'bg-white/[0.04] border-white/[0.07] text-white/40 hover:border-white/[0.14] hover:text-white/60'
      }`}
    >
      {label}
    </button>
  );
}

function UpdatedStatus({ visible }: { visible: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--gold)]/12 border border-[var(--gold)]/25">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-[var(--gold)]">
          <path
            d="M2 5.5L4 7.5L8 3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[11px] text-[var(--gold)]/70 tracking-wide">
        Guest Preferences Updated
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export interface StayDetailViewProps {
  stay: CustomerStay;
  onBack: () => void;
}

export default function StayDetailView({ stay, onBack }: StayDetailViewProps) {
  const prefersReducedMotion = useReducedMotion();

  /* ─ Tab state ─ */
  const [activeTab, setActiveTab] = useState<'overview' | 'discover' | 'itinerary'>('overview');

  /* ─ Preferences state ─ */
  const [selected, setSelected] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const key of Object.keys(defaultSelected)) {
      init[key] = new Set(defaultSelected[key]);
    }
    return init;
  });
  const [showUpdated, setShowUpdated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userModifiedRef = useRef(false);

  /* Load existing preferences */
  useState(() => {
    if (!stay.id) return;
    fetch(`/api/pms/preferences?stay_id=${stay.id}`)
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

  /* Debounced auto-save */
  useEffect(() => {
    if (!stay.id || !userModifiedRef.current) return;
    const timer = setTimeout(() => {
      Object.entries(selected).forEach(([category, chips]) => {
        const preferenceType = CATEGORY_TO_PREFERENCE_TYPE[category];
        if (!preferenceType) return;
        fetch('/api/pms/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stay_id: stay.id,
            preference_type: preferenceType,
            preference_data: { selected_chips: Array.from(chips) },
          }),
        }).catch(() => {});
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [selected, stay.id]);

  const toggleChip = useCallback((category: string, chip: string) => {
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
  }, []);

  const handleSubmitPreferences = useCallback(async () => {
    if (!stay.id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        Object.entries(selected).map(([category, chips]) => {
          const preferenceType = CATEGORY_TO_PREFERENCE_TYPE[category];
          if (!preferenceType) return Promise.resolve();
          return fetch('/api/pms/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stay_id: stay.id,
              preference_type: preferenceType,
              preference_data: { selected_chips: Array.from(chips) },
            }),
          });
        }),
      );
      if (updatedTimerRef.current) clearTimeout(updatedTimerRef.current);
      setShowUpdated(true);
      updatedTimerRef.current = setTimeout(() => setShowUpdated(false), 3000);
    } catch {
      // silent fail
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, stay.id, isSubmitting]);

  /* ─ Amenities carousel state ─ */
  const [activeAmenityIdx, setActiveAmenityIdx] = useState(0);

  /* ─ Derived values ─ */
  const nights = nightsBetween(stay.check_in, stay.check_out);
  const propertyName = stay.property?.name ?? 'Your Stay';
  const address = stay.property?.address ?? null;
  const imageUrl = stay.property?.image_url ?? null;
  const stayRegion = getStaySelectedRegion(stay);

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-400',
    paid: 'bg-emerald-400',
    booked: 'bg-[var(--gold)]',
    checked_in: 'bg-emerald-400',
    active: 'bg-emerald-400',
    pending: 'bg-amber-400',
    cancelled: 'bg-red-400',
  };
  const dotColor = statusColors[stay.status?.toLowerCase()] ?? 'bg-white/30';

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const, delay },
        };

  return (
    <RegionProvider initialRegion={stayRegion ?? undefined}>
      <ItineraryProvider stayId={stay.id}>
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      {/* ── Top bar: Back button ── */}
      <div
        className="sticky top-0 z-30 flex items-center px-5 sm:px-8 lg:px-12 h-14 border-b"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors duration-200 cursor-pointer group"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform duration-200"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 5 5 12 12 19" />
          </svg>
          <span className="text-[13px] font-medium">Back</span>
        </button>

        <div className="flex-1 flex justify-center">
          <p className="text-[13px] text-white/30 font-medium truncate max-w-xs">
            {propertyName}
          </p>
        </div>

        {/* Status pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-white/50">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span className="capitalize">{stay.status}</span>
        </span>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="sticky top-14 z-20 flex items-center px-5 sm:px-8 h-[42px] border-b gap-6"
        role="tablist"
        aria-label="Stay sections"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {(['overview', 'discover', 'itinerary'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            id={`tab-${tab}`}
            className={`h-full flex items-center text-[11px] tracking-[0.14em] uppercase font-medium border-b-2 transition-colors duration-200 cursor-pointer ${
              activeTab === tab
                ? 'text-[var(--gold)] border-[var(--gold)]'
                : 'text-white/45 border-transparent hover:text-white/75'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview tab: Two-column layout ── */}
      {activeTab === 'overview' && (
      <div
        role="tabpanel"
        id="tabpanel-overview"
        aria-labelledby="tab-overview"
        className="flex flex-col lg:flex-row lg:h-[calc(100vh-3.5rem-42px)]"
      >

        {/* ══════════════════════
            LEFT COLUMN
            ══════════════════════ */}
        <div className="lg:w-[58%] lg:overflow-y-auto lg:sticky lg:top-[calc(3.5rem+42px)] lg:h-[calc(100vh-3.5rem-42px)] flex-shrink-0">

          {/* Hero image */}
          <motion.div
            className="relative w-full"
            style={{ height: imageUrl ? '55vh' : '30vh', minHeight: 240, maxHeight: 520 }}
            {...fadeIn(0)}
          >
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt={propertyName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  priority
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.45) 60%, rgba(10,10,10,0.92) 100%)',
                  }}
                />
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(10,10,10,0.95) 100%)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/10"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}

            {/* Property name overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-7 pt-16">
              <motion.h1
                className="font-serif text-[28px] sm:text-[34px] lg:text-[38px] text-white leading-[1.15] mb-1"
                {...fadeIn(0.12)}
              >
                {propertyName}
              </motion.h1>
              {address && (
                <motion.p
                  className="text-[13px] text-white/50"
                  {...fadeIn(0.2)}
                >
                  {address}
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Map / Discover section */}
          <motion.div
            className="mx-5 sm:mx-8 my-6 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            {...fadeIn(0.25)}
          >
            {/* Map header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-[10px] text-[var(--gold)]/60 uppercase tracking-[0.18em] font-medium mb-0.5">
                  Location
                </p>
                <h3 className="text-[15px] text-white/80 font-medium">
                  Discover your city
                </h3>
              </div>
              <Link
                href="/app"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[11px] text-[var(--gold)] hover:bg-[var(--gold)]/18 transition-colors duration-200"
              >
                Explore
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            <div className="relative h-[260px] sm:h-[320px] overflow-hidden rounded-b-2xl">
              <MapPlaceholder stayId={stay.id} />
            </div>
          </motion.div>
        </div>

        {/* ══════════════════════
            RIGHT COLUMN
            ══════════════════════ */}
        <div
          className="lg:w-[42%] lg:overflow-y-auto flex-shrink-0 border-l border-white/[0.06]"
        >
          <div className="px-5 sm:px-8 py-7 space-y-8">

            {/* ── Property Header ── */}
            <motion.div {...fadeIn(0.05)}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="font-serif text-[24px] sm:text-[28px] text-white/90 leading-[1.2] mb-1">
                    {propertyName}
                  </h2>
                  {address && (
                    <p className="text-[13px] text-white/40">{address}</p>
                  )}
                </div>
                {/* Rating */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.18)',
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-[var(--gold)]"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-[12px] font-medium text-[var(--gold)]">4.8</span>
                </div>
              </div>
            </motion.div>

            {/* ── Stay Details ── */}
            <motion.div {...fadeIn(0.12)}>
              <SectionHeading>Stay Details</SectionHeading>

              {/* Date grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.14em] mb-1.5">
                    Check-in
                  </p>
                  <p className="text-[14px] text-white/80 font-medium leading-snug">
                    {formatLongDate(stay.check_in)}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.14em] mb-1.5">
                    Check-out
                  </p>
                  <p className="text-[14px] text-white/80 font-medium leading-snug">
                    {formatLongDate(stay.check_out)}
                  </p>
                </div>
              </div>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-2">
                {nights > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-white/50"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                )}
                {stay.room_type && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-white/50"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {stay.room_type}
                  </span>
                )}
                {stay.guests != null && stay.guests > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-white/50"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {stay.guests} {stay.guests === 1 ? 'guest' : 'guests'}
                  </span>
                )}
              </div>
            </motion.div>

            {/* ── Guest Preferences ── */}
            <motion.div {...fadeIn(0.22)}>
              <SectionHeading>Guest Preferences</SectionHeading>

              <div className="space-y-5">
                {preferenceGroups.map((group) => (
                  <div key={group.category}>
                    <p className="text-[9px] font-medium text-white/25 uppercase tracking-[0.15em] mb-2">
                      {group.category}
                    </p>
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
              </div>

              {/* Submit + status row */}
              <div className="mt-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSubmitPreferences}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-medium tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50"
                  style={{
                    background: isSubmitting
                      ? 'rgba(201,168,76,0.08)'
                      : 'rgba(201,168,76,0.14)',
                    border: '1px solid rgba(201,168,76,0.28)',
                    color: 'var(--gold)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Submit Preferences
                    </>
                  )}
                </button>
                <UpdatedStatus visible={showUpdated} />
              </div>
            </motion.div>

            {/* ── Quick Actions ── */}
            <motion.div {...fadeIn(0.32)}>
              <SectionHeading>Quick Actions</SectionHeading>

              <div className="grid grid-cols-3 gap-2.5">
                <Link
                  href="/app"
                  className="group flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/30 group-hover:text-[var(--gold)]/60 transition-colors duration-300"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-[10px] text-white/35 group-hover:text-white/60 font-medium tracking-wide transition-colors duration-300">
                    Itinerary
                  </span>
                </Link>

                <Link
                  href="/app"
                  className="group flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/30 group-hover:text-[var(--gold)]/60 transition-colors duration-300"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                  <span className="text-[10px] text-white/35 group-hover:text-white/60 font-medium tracking-wide transition-colors duration-300">
                    Discover
                  </span>
                </Link>

                <Link
                  href="/app"
                  className="group flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/30 group-hover:text-[var(--gold)]/60 transition-colors duration-300"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-[10px] text-white/35 group-hover:text-white/60 font-medium tracking-wide transition-colors duration-300">
                    Map
                  </span>
                </Link>
              </div>
            </motion.div>

            {/* ── Amenities ── */}
            <motion.div {...fadeIn(0.4)}>
              <SectionHeading>Amenities</SectionHeading>

              {/* Horizontal scroll amenity cards */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {amenityCategories.map((cat, i) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setActiveAmenityIdx(i)}
                    className="flex-shrink-0 w-[150px] rounded-xl p-4 text-left transition-all duration-300 cursor-pointer"
                    style={{
                      background:
                        activeAmenityIdx === i
                          ? 'rgba(201,168,76,0.07)'
                          : 'rgba(255,255,255,0.03)',
                      border:
                        activeAmenityIdx === i
                          ? '1px solid rgba(201,168,76,0.22)'
                          : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="text-xl mb-2">{cat.icon}</div>
                    <p
                      className={`text-[12px] font-medium mb-2 ${
                        activeAmenityIdx === i ? 'text-[var(--gold)]' : 'text-white/60'
                      }`}
                    >
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-white/30 leading-relaxed line-clamp-2">
                      {cat.items.slice(0, 2).join(' · ')}
                    </p>
                  </button>
                ))}
              </div>

              {/* Amenity item list */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {amenityCategories[activeAmenityIdx].items.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-[5px] text-[11px] text-white/50"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {amenityCategories.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveAmenityIdx(i)}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      width: activeAmenityIdx === i ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      background:
                        activeAmenityIdx === i
                          ? 'rgba(201,168,76,0.7)'
                          : 'rgba(255,255,255,0.15)',
                    }}
                    aria-label={`Amenity category ${i + 1}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Bottom spacing */}
            <div className="h-8" />
          </div>
        </div>
      </div>
      )}

      {/* ── Discover tab ── */}
      {activeTab === 'discover' && (
        <div
          role="tabpanel"
          id="tabpanel-discover"
          aria-labelledby="tab-discover"
          className="flex h-[calc(100vh-3.5rem-42px)] min-h-0 flex-col overflow-hidden"
        >
          <DiscoverPanel stayId={stay.id} />
        </div>
      )}

      {/* ── Itinerary tab ── */}
      {activeTab === 'itinerary' && (
        <div
          role="tabpanel"
          id="tabpanel-itinerary"
          aria-labelledby="tab-itinerary"
          className="flex flex-col min-h-0 h-[calc(100vh-3.5rem-42px)] overflow-hidden"
        >
          <ItineraryPanel />
        </div>
      )}
    </div>
      </ItineraryProvider>
    </RegionProvider>
  );
}
