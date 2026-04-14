'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CustomerStay } from '@/types/customer';
import type { StayCuration, CuratedItem } from '@/types/pms';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;
const MS_PER_DAY = 86400000;

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function nightsBetween(a: string, b: string): number {
  return Math.max(
    0,
    Math.round((parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / MS_PER_DAY),
  );
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = parseLocalDate(dateStr);
  return Math.round((target.getTime() - now.getTime()) / MS_PER_DAY);
}

function formatLongDate(iso: string): string {
  const d = parseLocalDate(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Human-feel countdown label — not robotic. */
function countdownLabel(checkIn: string): string {
  const d = daysUntil(checkIn);
  if (d < 0) return 'In progress';
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d <= 7) return `In ${d} days`;
  if (d <= 30) {
    const weeks = Math.floor(d / 7);
    return weeks === 1 ? 'Next week' : `In ${weeks} weeks`;
  }
  const months = Math.floor(d / 30);
  return months === 1 ? 'Next month' : `In ${months} months`;
}

/* ─── Curated place highlights — editorial, human-curated feel ─── */

/** Editor's pick mini-cards shown inside the reveal. */
function PlaceHighlight({
  item,
  idx,
  delay,
}: {
  item: CuratedItem;
  idx: number;
  delay: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  /* Muted category colours — intentionally restrained, not rainbow AI. */
  const tones: Record<string, string> = {
    dining: 'border-rose-500/20',
    restaurant: 'border-rose-500/20',
    food: 'border-amber-500/20',
    bar: 'border-violet-500/20',
    cafe: 'border-amber-500/20',
    nature: 'border-emerald-500/20',
    park: 'border-emerald-500/20',
    beach: 'border-teal-500/20',
    culture: 'border-indigo-500/20',
    museum: 'border-indigo-500/20',
    landmark: 'border-stone-400/20',
    activity: 'border-sky-500/20',
    wellness: 'border-purple-500/20',
    spa: 'border-purple-500/20',
  };

  const toneDots: Record<string, string> = {
    dining: 'bg-rose-400/70',
    restaurant: 'bg-rose-400/70',
    food: 'bg-amber-400/70',
    bar: 'bg-violet-400/70',
    cafe: 'bg-amber-400/70',
    nature: 'bg-emerald-400/70',
    park: 'bg-emerald-400/70',
    beach: 'bg-teal-400/70',
    culture: 'bg-indigo-400/70',
    museum: 'bg-indigo-400/70',
    landmark: 'bg-stone-400/70',
    activity: 'bg-sky-400/70',
    wellness: 'bg-purple-400/70',
    spa: 'bg-purple-400/70',
  };

  const key = item.category?.toLowerCase() ?? '';
  const borderTone =
    Object.entries(tones).find(([k]) => key.includes(k))?.[1] ??
    'border-white/[0.08]';
  const dotTone =
    Object.entries(toneDots).find(([k]) => key.includes(k))?.[1] ??
    'bg-white/40';

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: { duration: 0.5, ease: REVEAL_EASE, delay: delay + idx * 0.06 },
      };

  return (
    <motion.div
      className={`
        flex items-start gap-3 p-3.5 rounded-xl
        bg-white/[0.04] border ${borderTone}
        hover:bg-white/[0.07] transition-colors duration-300
      `}
      {...motionProps}
    >
      <span
        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotTone}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-white/85 font-medium leading-tight mb-0.5">
          {item.name}
        </p>
        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-1">
          {item.description}
        </p>
        {(item.time_of_day || item.duration) && (
          <div className="flex items-center gap-2 mt-1.5">
            {item.time_of_day && (
              <span className="text-[10px] text-white/30 uppercase tracking-wider">
                {item.time_of_day}
              </span>
            )}
            {item.time_of_day && item.duration && (
              <span className="w-px h-2.5 bg-white/10" />
            )}
            {item.duration && (
              <span className="text-[10px] text-white/30">{item.duration}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   StayCardReveal — the full-screen cinematic detail overlay.
   
   A premium reveal that opens from the dashboard without 
   navigating. Shows stay details, curated local highlights,
   and quick navigation — like opening a personal travel 
   magazine spread for that stay.
   ═══════════════════════════════════════════════════════════════ */

interface StayCardRevealProps {
  stay: CustomerStay;
  open: boolean;
  onClose: () => void;
  onViewBooking: () => void;
}

export default function StayCardReveal({
  stay,
  open,
  onClose,
  onViewBooking,
}: StayCardRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const [curations, setCurations] = useState<StayCuration[]>([]);
  const fetchedForRef = useRef<string | null>(null);

  /* Fetch curations for the stay when overlay opens.
     We only call setState inside the async .then() callback — not
     synchronously in the effect body — so the linter is satisfied. */
  useEffect(() => {
    if (!open || fetchedForRef.current === stay.id) return;
    fetchedForRef.current = stay.id;

    fetch(`/api/curations?stay_id=${encodeURIComponent(stay.id)}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data: StayCuration[] }) => {
        setCurations(json.data ?? []);
      })
      .catch(() => {
        /* Allow re-fetch on next open by clearing the ref on failure. */
        fetchedForRef.current = null;
        setCurations([]);
      });
  }, [open, stay.id]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, handleEscape]);

  /* Extract curated highlight items (max 4, feels hand-picked). */
  const recommendedPlaces =
    curations.find((c) => c.curation_type === 'recommended_places')?.content
      ?.items ?? [];
  const regionalActivities =
    curations.find((c) => c.curation_type === 'regional_activities')?.content
      ?.items ?? [];
  const highlights = [...recommendedPlaces, ...regionalActivities].slice(0, 4);

  /* Stay detail data. */
  const nights = nightsBetween(stay.check_in, stay.check_out);
  const countdown = countdownLabel(stay.check_in);

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-400',
    paid: 'bg-emerald-400',
    booked: 'bg-[var(--gold)]',
    checked_in: 'bg-emerald-400',
    active: 'bg-emerald-400',
    pending: 'bg-amber-400',
    cancelled: 'bg-red-400',
  };
  const dotColor =
    statusColors[stay.status?.toLowerCase()] ?? 'bg-white/30';

  /* Variants */
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.45, ease: REVEAL_EASE },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
    },
  };

  const panelVariants = prefersReducedMotion
    ? { hidden: {}, visible: {}, exit: {} }
    : {
        hidden: { opacity: 0, y: 40, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.55, ease: REVEAL_EASE, delay: 0.05 },
        },
        exit: {
          opacity: 0,
          y: 20,
          scale: 0.98,
          transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const },
        },
      };

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.7, ease: REVEAL_EASE, delay },
        };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-lg"
            onClick={onClose}
            role="button"
            tabIndex={-1}
            aria-label="Close stay details"
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              background:
                'linear-gradient(165deg, rgba(18,16,14,0.97) 0%, rgba(10,9,8,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* ── Hotel image hero (if available) ── */}
            {stay.property?.image_url && (
              <div className="relative h-[200px] sm:h-[220px] overflow-hidden">
                <Image
                  src={stay.property.image_url}
                  alt={stay.property.name ?? 'Hotel'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 576px"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(18,16,14,0.15) 0%, rgba(18,16,14,0.55) 50%, rgba(18,16,14,0.98) 100%)',
                  }}
                />

                {/* Close button over image */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all duration-300 cursor-pointer"
                  aria-label="Close"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Countdown chip */}
                <motion.div
                  className="absolute top-4 left-4 z-10"
                  {...fadeIn(0.15)}
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[11px] text-white/80 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    {countdown}
                  </span>
                </motion.div>
              </div>
            )}

            {/* No image — show close button in-panel */}
            {!stay.property?.image_url && (
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <motion.span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-white/70 font-medium"
                  {...fadeIn(0.1)}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  {countdown}
                </motion.span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.10] transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── Scrollable content ── */}
            <div className="overflow-y-auto max-h-[calc(92vh-200px)] sm:max-h-[calc(85vh-220px)] scrollbar-hide">
              <div className="px-6 sm:px-8 pb-8">
                {/* ── Hotel Name + Address ── */}
                <motion.div
                  className={stay.property?.image_url ? '-mt-2 mb-6' : 'mb-6'}
                  {...fadeIn(0.2)}
                >
                  <h2 className="font-serif text-[28px] sm:text-[32px] text-white leading-[1.15] mb-1.5">
                    {stay.property?.name ?? 'Your Stay'}
                  </h2>
                  {stay.property?.address && (
                    <p className="text-[13px] text-white/40 leading-relaxed">
                      {stay.property.address}
                    </p>
                  )}
                </motion.div>

                {/* ── Stay details grid — editorial, not tabular ── */}
                <motion.div
                  className="grid grid-cols-2 gap-4 mb-7"
                  {...fadeIn(0.3)}
                >
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.14em] mb-1">
                      Check-in
                    </p>
                    <p className="text-[14px] text-white/80 font-medium">
                      {formatLongDate(stay.check_in)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.14em] mb-1">
                      Check-out
                    </p>
                    <p className="text-[14px] text-white/80 font-medium">
                      {formatLongDate(stay.check_out)}
                    </p>
                  </div>
                </motion.div>

                {/* ── Metadata row ── */}
                <motion.div
                  className="flex flex-wrap items-center gap-3 mb-8"
                  {...fadeIn(0.38)}
                >
                  {nights > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/55">
                      <NightIcon />
                      {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                  )}
                  {stay.room_type && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/55">
                      <RoomIcon />
                      {stay.room_type}
                    </span>
                  )}
                  {stay.guests != null && stay.guests > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/55">
                      <GuestIcon />
                      {stay.guests} {stay.guests === 1 ? 'guest' : 'guests'}
                    </span>
                  )}
                </motion.div>

                {/* ── Curated highlights ── */}
                {highlights.length > 0 && (
                  <div className="mb-8">
                    <motion.div
                      className="flex items-center gap-2 mb-4"
                      {...fadeIn(0.44)}
                    >
                      <span className="text-[10px] text-[var(--gold)]/60 uppercase tracking-[0.18em] font-medium">
                        Nearby highlights
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {highlights.map((item, i) => (
                        <PlaceHighlight
                          key={`${item.name}-${i}`}
                          item={item}
                          idx={i}
                          delay={0.5}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Quick actions ── */}
                <motion.div className="mb-3" {...fadeIn(0.6)}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] text-white/30 uppercase tracking-[0.18em] font-medium">
                      Quick access
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <ActionTile
                      label="Map"
                      href="/app"
                      icon={<MapIcon />}
                    />
                    <ActionTile
                      label="Discover"
                      href="/app"
                      icon={<CompassIcon />}
                    />
                    <ActionTile
                      label="Itinerary"
                      href="/app"
                      icon={<CalendarIcon />}
                    />
                  </div>
                </motion.div>

                {/* ── View full booking CTA ── */}
                <motion.div
                  className="pt-5 mt-4 border-t border-white/[0.05]"
                  {...fadeIn(0.7)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewBooking();
                    }}
                    className="
                      w-full flex items-center justify-center gap-2.5
                      h-[3rem] rounded-xl
                      bg-white/[0.06] border border-white/[0.08]
                      text-[13px] text-white/65 font-medium tracking-wide
                      hover:bg-white/[0.10] hover:border-white/[0.14] hover:text-white/85
                      transition-all duration-300 cursor-pointer
                    "
                  >
                    View full booking
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/40"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function ActionTile({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        group flex flex-col items-center gap-2 py-4 rounded-xl
        bg-white/[0.03] border border-white/[0.06]
        hover:bg-white/[0.07] hover:border-[var(--gold)]/20
        transition-all duration-300
      "
      style={{ textDecoration: 'none' }}
    >
      <span className="text-white/35 group-hover:text-[var(--gold)]/70 transition-colors duration-300">
        {icon}
      </span>
      <span className="text-[11px] text-white/45 group-hover:text-white/65 font-medium tracking-wide transition-colors duration-300">
        {label}
      </span>
    </Link>
  );
}

/* ─── Icons ─── */

function NightIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function RoomIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
