'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CustomerStay } from '@/types/customer';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

/* ─── Helpers ─── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function getStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'paid') return status;
  if (s === 'booked') return 'Booked';
  if (s === 'checked_in' || s === 'active') return 'Checked In';
  return status;
}

/* ═══════════════════════════════════════════════════════════════════
   BOOKED STATE — immersive cinematic arrival into your stay.
   Booking details are woven into the hero composition as overlays,
   not stacked in dashboard cards.
   ═══════════════════════════════════════════════════════════════════ */

function BookedState({
  stay,
  onAddStay,
}: {
  stay: CustomerStay;
  onAddStay: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const nights = nightsBetween(stay.check_in, stay.check_out);
  const statusLabel = getStatusLabel(stay.status);

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.9, ease: REVEAL_EASE, delay },
        };

  return (
    <div className="h-full flex flex-col">
      {/* ── Hotel hero image overlay (if image exists) ── */}
      {stay.property?.image_url && (
        <div className="absolute inset-0 z-0">
          <Image
            src={stay.property.image_url}
            alt={stay.property.name ?? 'Hotel'}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Deep overlay for readability — cinematic gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.50) 40%, rgba(0,0,0,0.72) 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.35) 100%)',
            }}
          />
        </div>
      )}

      {/* ── Centered editorial booking content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-10 pb-28 sm:pb-32">
        {/* Status whisper */}
        <motion.div
          className="flex items-center gap-2 mb-6 sm:mb-8"
          {...fadeIn(0.5)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
          <span className="text-[11px] text-white/50 uppercase tracking-[0.22em] font-medium">
            {statusLabel}
          </span>
        </motion.div>

        {/* Hotel name — serif hero */}
        <motion.h1
          className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white text-center leading-[1.1] mb-3"
          style={{ letterSpacing: '-0.01em' }}
          {...fadeIn(0.6)}
        >
          {stay.property?.name ?? 'Your Stay'}
        </motion.h1>

        {/* Destination */}
        {stay.property?.address && (
          <motion.p
            className="text-[15px] sm:text-[16px] text-white/45 text-center mb-8 sm:mb-10"
            {...fadeIn(0.75)}
          >
            {stay.property.address}
          </motion.p>
        )}

        {/* Stay dates — elegant metadata row */}
        <motion.div
          className="flex items-center gap-3 sm:gap-5 text-white/40 text-[12px] sm:text-[13px] tracking-[0.06em] mb-10 sm:mb-14"
          {...fadeIn(0.9)}
        >
          <span className="text-white/60">{formatShortDate(stay.check_in)}</span>
          <span className="text-white/20">—</span>
          <span className="text-white/60">{formatShortDate(stay.check_out)}</span>
          {nights > 0 && (
            <>
              <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
              <span>
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </>
          )}
          {stay.room_type && (
            <>
              <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
              <span>{stay.room_type}</span>
            </>
          )}
          {stay.guests != null && (
            <>
              <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
              <span>
                {stay.guests} {stay.guests === 1 ? 'guest' : 'guests'}
              </span>
            </>
          )}
        </motion.div>

        {/* Concierge actions — refined, minimal, not card-like */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 sm:gap-4"
          {...fadeIn(1.05)}
        >
          <ConciergeActionPill label="Open Map" href="/app" icon={<MapIcon />} />
          <ConciergeActionPill label="Explore Nearby" href="/app" icon={<CompassIcon />} />
          <ConciergeActionPill label="Itinerary" href="/app" icon={<CalendarIcon />} />
          <ConciergeActionPill label="Add Stay" onClick={onAddStay} icon={<PlusIcon />} />
        </motion.div>
      </div>

      {/* ── Bottom stay details — ultra-subtle, editorial strip ── */}
      <motion.div
        className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center px-6 z-10"
        {...fadeIn(1.3)}
      >
        <div className="flex items-center gap-3 sm:gap-5 text-white/25 text-[11px] sm:text-[12px] tracking-[0.14em] uppercase">
          <span>{formatDate(stay.check_in)}</span>
          <span className="w-px h-3 bg-white/10" aria-hidden="true" />
          <span>{formatDate(stay.check_out)}</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NO-BOOKING STATE — pre-stay concierge scene.
   Cinematic background, editorial content zones, not card grids.
   ═══════════════════════════════════════════════════════════════════ */

function NoBookingState({ onAddStay }: { onAddStay: () => void }) {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.9, ease: REVEAL_EASE, delay },
        };

  return (
    <div className="h-full flex flex-col items-center overflow-y-auto scrollbar-hide">
      {/* ── Hero section — centered concierge invitation ── */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center text-center px-6 sm:px-10 pt-28 sm:pt-32 pb-14 sm:pb-20 min-h-[60vh]">
        <motion.p
          className="text-[11px] text-[var(--gold)]/70 uppercase tracking-[0.25em] font-medium mb-6"
          {...fadeIn(0.5)}
        >
          Your next journey
        </motion.p>

        <motion.h1
          className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white text-center leading-[1.1] mb-4"
          style={{ letterSpacing: '-0.01em' }}
          {...fadeIn(0.65)}
        >
          Begin your stay
        </motion.h1>

        <motion.p
          className="text-[15px] sm:text-[16px] text-white/40 text-center max-w-md mb-10 sm:mb-14 leading-relaxed"
          {...fadeIn(0.8)}
        >
          Add your upcoming hotel stay to unlock your personal concierge
          and a tailored guest experience.
        </motion.p>

        <motion.button
          type="button"
          onClick={onAddStay}
          className="inline-flex items-center gap-2.5 h-[3.25rem] px-10 rounded-2xl bg-white/[0.10] border border-white/[0.12] text-white text-[14px] font-medium tracking-wide backdrop-blur-sm hover:bg-white/[0.16] hover:border-white/20 transition-all duration-400 cursor-pointer"
          {...fadeIn(0.95)}
        >
          <PlusIcon />
          Add Your Stay
        </motion.button>
      </div>

      {/* ── Pathway zones — editorial, not card-grid ── */}
      <div className="w-full max-w-3xl px-6 sm:px-10 pb-16 sm:pb-24 space-y-0">
        {/* Subtle divider */}
        <motion.div
          className="flex justify-center mb-14 sm:mb-20"
          {...fadeIn(1.1)}
        >
          <div className="h-px w-16 bg-white/10" />
        </motion.div>

        {/* ── Book a Hotel ── */}
        <motion.section className="mb-14 sm:mb-18" {...fadeIn(1.2)}>
          <p className="text-[11px] text-white/25 uppercase tracking-[0.22em] font-medium mb-3">
            Book a hotel
          </p>
          <p className="text-[14px] sm:text-[15px] text-white/35 mb-6 max-w-md leading-relaxed">
            Browse trusted platforms to find and reserve your perfect stay.
          </p>
          <div className="flex flex-wrap gap-3">
            <EditorialLink label="Booking.com" href="https://www.booking.com" />
            <EditorialLink label="Hotels.com" href="https://www.hotels.com" />
            <EditorialLink label="Agoda" href="https://www.agoda.com" />
          </div>
        </motion.section>

        {/* ── Check Flights ── */}
        <motion.section className="mb-14 sm:mb-18" {...fadeIn(1.35)}>
          <p className="text-[11px] text-white/25 uppercase tracking-[0.22em] font-medium mb-3">
            Check flights
          </p>
          <p className="text-[14px] sm:text-[15px] text-white/35 mb-6 max-w-md leading-relaxed">
            Compare fares and plan your route with leading flight search tools.
          </p>
          <div className="flex flex-wrap gap-3">
            <EditorialLink label="Google Flights" href="https://www.google.com/travel/flights" />
            <EditorialLink label="Skyscanner" href="https://www.skyscanner.com" />
            <EditorialLink label="Kayak" href="https://www.kayak.com/flights" />
          </div>
        </motion.section>

        {/* ── Prepare Your Trip ── */}
        <motion.section className="mb-10 sm:mb-14" {...fadeIn(1.5)}>
          <p className="text-[11px] text-white/25 uppercase tracking-[0.22em] font-medium mb-3">
            Prepare your trip
          </p>
          <p className="text-[14px] sm:text-[15px] text-white/35 mb-6 max-w-md leading-relaxed">
            Organise your itinerary, stay informed, and get ready to travel.
          </p>
          <div className="flex flex-wrap gap-3">
            <EditorialLink label="TripIt" href="https://www.tripit.com" />
            <EditorialLink label="Rome2Rio" href="https://www.rome2rio.com" />
            <EditorialLink label="Travel Off Path" href="https://www.traveloffpath.com" />
          </div>
        </motion.section>

        {/* Bottom whisper */}
        <motion.div
          className="flex justify-center pt-6 pb-4"
          {...fadeIn(1.65)}
        >
          <p className="text-[11px] text-white/15 tracking-[0.14em]">
            Your private guest experience
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Shared Sub-components ─── */

/** Concierge action pill — glass/translucent, not a card. */
function ConciergeActionPill({
  label,
  icon,
  href,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="text-white/40 group-hover:text-white/70 transition-colors duration-300">
        {icon}
      </span>
      <span className="text-[13px] text-white/50 group-hover:text-white/80 transition-colors duration-300">
        {label}
      </span>
    </>
  );

  const className =
    'group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.12] hover:border-white/15 transition-all duration-300 cursor-pointer';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href!} className={className} style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  );
}

/** Editorial external link — minimal pill, not a card. */
function EditorialLink({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[13px] text-white/35 hover:bg-white/[0.08] hover:text-white/55 hover:border-white/10 transition-all duration-300"
      style={{ textDecoration: 'none' }}
    >
      {label}
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40 group-hover:opacity-70 transition-opacity duration-300"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

/* ─── Icons ─── */

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ─── Main Export ─── */

interface CurrentBookingViewProps {
  stay: CustomerStay | null;
  onAddStay: () => void;
}

export default function CurrentBookingView({
  stay,
  onAddStay,
}: CurrentBookingViewProps) {
  if (stay) {
    return <BookedState stay={stay} onAddStay={onAddStay} />;
  }
  return <NoBookingState onAddStay={onAddStay} />;
}
