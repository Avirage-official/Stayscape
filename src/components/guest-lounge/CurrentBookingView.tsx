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

function getStatusConfig(status: string) {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'paid')
    return { label: status, color: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (s === 'booked')
    return { label: 'Booked', color: 'text-[var(--gold)]', dot: 'bg-[var(--gold)]' };
  if (s === 'checked_in' || s === 'active')
    return { label: 'Checked In', color: 'text-emerald-400', dot: 'bg-emerald-400' };
  return { label: status, color: 'text-[var(--dashboard-text-muted)]', dot: 'bg-[var(--dashboard-text-muted)]' };
}

/* ─── Booked State ─── */

function BookedState({
  stay,
  onAddStay,
}: {
  stay: CustomerStay;
  onAddStay: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const statusConfig = getStatusConfig(stay.status);
  const nights = nightsBetween(stay.check_in, stay.check_out);

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.7, ease: REVEAL_EASE, delay },
        };

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* ── Stay Hero ── */}
      <motion.section {...fadeIn(0.1)}>
        <div className="relative overflow-hidden rounded-xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)]">
          {/* Hotel image */}
          {stay.property?.image_url && (
            <div className="relative h-56 sm:h-72 w-full overflow-hidden">
              <Image
                src={stay.property.image_url}
                alt={stay.property.name ?? 'Hotel'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 960px"
                priority
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, var(--dashboard-card-bg) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                }}
              />
            </div>
          )}

          <div className="relative z-10 px-7 sm:px-10 pb-8 sm:pb-10 -mt-6">
            {/* Property name */}
            <h2 className="font-serif text-3xl sm:text-4xl text-[var(--dashboard-text-primary)] leading-tight mb-2">
              {stay.property?.name ?? 'Your Stay'}
            </h2>

            {/* Location */}
            {stay.property?.address && (
              <p className="text-[14px] text-[var(--dashboard-text-muted)] mb-5">
                {stay.property.address}
              </p>
            )}

            {/* Date strip */}
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--dashboard-text-secondary)]">
              <span>{formatShortDate(stay.check_in)}</span>
              <span className="text-[var(--dashboard-text-faint)]">→</span>
              <span>{formatShortDate(stay.check_out)}</span>
              {nights > 0 && (
                <>
                  <span className="w-px h-3.5 bg-[var(--dashboard-border-subtle)]" aria-hidden="true" />
                  <span className="text-[var(--dashboard-text-faint)]">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                </>
              )}
              <span className="w-px h-3.5 bg-[var(--dashboard-border-subtle)]" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                <span className={`${statusConfig.color} font-medium uppercase tracking-wider text-[11px]`}>
                  {statusConfig.label}
                </span>
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Booking Details ── */}
      <motion.section {...fadeIn(0.25)}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Booking Details
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
          <DetailItem label="Check-in" value={formatDate(stay.check_in)} />
          <DetailItem label="Check-out" value={formatDate(stay.check_out)} />
          {stay.guests != null && (
            <DetailItem
              label="Guests"
              value={`${stay.guests} ${stay.guests === 1 ? 'guest' : 'guests'}`}
            />
          )}
          {stay.room_type && <DetailItem label="Room" value={stay.room_type} />}
          <DetailItem label="Status" value={statusConfig.label} />
          {stay.property?.address && (
            <DetailItem label="Location" value={stay.property.address} />
          )}
        </div>
      </motion.section>

      {/* ── Next Actions ── */}
      <motion.section {...fadeIn(0.4)}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Continue your journey
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ConciergeAction
            label="Add Stay"
            icon={<PlusIcon />}
            onClick={onAddStay}
          />
          <ConciergeAction
            label="Open Map"
            icon={<MapIcon />}
            href="/app"
          />
          <ConciergeAction
            label="Explore Nearby"
            icon={<CompassIcon />}
            href="/app"
          />
          <ConciergeAction
            label="Itinerary"
            icon={<CalendarIcon />}
            href="/app"
          />
        </div>
      </motion.section>
    </div>
  );
}

/* ─── No-Booking State ─── */

function NoBookingState({ onAddStay }: { onAddStay: () => void }) {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.7, ease: REVEAL_EASE, delay },
        };

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ── 1. Start Your Stay ── */}
      <motion.section {...fadeIn(0.1)}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--dashboard-card-bg)] via-[var(--dashboard-bg)] to-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)]">
          {/* Decorative gold glow */}
          <div
            className="absolute top-0 right-0 w-80 h-80 opacity-[0.04]"
            style={{
              background: 'radial-gradient(circle at top right, var(--gold) 0%, transparent 60%)',
            }}
          />

          <div className="relative z-10 px-8 sm:px-12 py-14 sm:py-18">
            <div className="max-w-lg">
              <p className="text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.22em] mb-4">
                Start your stay
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[var(--dashboard-text-primary)] leading-tight mb-4">
                Your next journey awaits
              </h2>
              <p className="text-[15px] text-[var(--dashboard-text-muted)] leading-relaxed mb-8 max-w-md">
                Add your upcoming hotel stay to unlock your personal concierge,
                local recommendations, and a tailored guest experience.
              </p>

              <button
                type="button"
                onClick={onAddStay}
                className="inline-flex items-center gap-2.5 h-[3.25rem] px-10 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[14px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] transition-all duration-300 cursor-pointer shadow-gold-glow"
              >
                <PlusIcon />
                Add Your Stay
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 2. Book a Hotel ── */}
      <motion.section {...fadeIn(0.25)}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Book a hotel
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>
        <p className="text-[14px] text-[var(--dashboard-text-muted)] mb-5 max-w-lg">
          Browse trusted platforms to find and reserve your perfect stay.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExternalLink
            label="Booking.com"
            description="Wide selection worldwide"
            href="https://www.booking.com"
          />
          <ExternalLink
            label="Hotels.com"
            description="Earn rewards on every stay"
            href="https://www.hotels.com"
          />
          <ExternalLink
            label="Agoda"
            description="Great rates across Asia & beyond"
            href="https://www.agoda.com"
          />
        </div>
      </motion.section>

      {/* ── 3. Check Flights ── */}
      <motion.section {...fadeIn(0.4)}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Check flights
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>
        <p className="text-[14px] text-[var(--dashboard-text-muted)] mb-5 max-w-lg">
          Compare fares and plan your route with leading flight search tools.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExternalLink
            label="Google Flights"
            description="Compare routes & prices"
            href="https://www.google.com/travel/flights"
          />
          <ExternalLink
            label="Skyscanner"
            description="Flexible date search"
            href="https://www.skyscanner.com"
          />
          <ExternalLink
            label="Kayak"
            description="Aggregated airline fares"
            href="https://www.kayak.com/flights"
          />
        </div>
      </motion.section>

      {/* ── 4. Prepare Your Trip ── */}
      <motion.section {...fadeIn(0.55)}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Prepare your trip
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>
        <p className="text-[14px] text-[var(--dashboard-text-muted)] mb-5 max-w-lg">
          Organise your itinerary, stay informed, and get ready to travel.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExternalLink
            label="TripIt"
            description="Itinerary & travel management"
            href="https://www.tripit.com"
          />
          <ExternalLink
            label="Rome2Rio"
            description="Multi-modal route planning"
            href="https://www.rome2rio.com"
          />
          <ExternalLink
            label="Travel Off Path"
            description="Destination news & updates"
            href="https://www.traveloffpath.com"
          />
        </div>
      </motion.section>
    </div>
  );
}

/* ─── Shared Sub-components ─── */

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--dashboard-text-faint)] uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-[14px] text-[var(--dashboard-text-secondary)] font-medium">
        {value}
      </p>
    </div>
  );
}

function ConciergeAction({
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
      <div className="w-10 h-10 rounded-lg bg-[var(--dashboard-surface-raised)] border border-[var(--dashboard-border-subtle)] flex items-center justify-center text-[var(--dashboard-text-muted)] group-hover:text-[var(--gold)] transition-colors duration-300">
        {icon}
      </div>
      <span className="text-[13px] text-[var(--dashboard-text-secondary)] group-hover:text-[var(--dashboard-text-primary)] transition-colors duration-300">
        {label}
      </span>
    </>
  );

  const className =
    'group flex flex-col items-center gap-3 py-5 rounded-xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] hover:border-[var(--gold)]/20 hover:bg-[var(--dashboard-surface-raised)] transition-all duration-300 cursor-pointer';

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

function ExternalLink({
  label,
  description,
  href,
}: {
  label: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 p-5 rounded-xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] hover:border-[var(--gold)]/20 hover:bg-[var(--dashboard-surface-raised)] transition-all duration-300"
      style={{ textDecoration: 'none' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--dashboard-text-primary)] group-hover:text-[var(--gold)] transition-colors duration-300">
          {label}
        </p>
        <p className="text-[12px] text-[var(--dashboard-text-faint)] mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 mt-1 text-[var(--dashboard-text-dim)] group-hover:text-[var(--dashboard-text-faint)] transition-colors duration-300"
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
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
