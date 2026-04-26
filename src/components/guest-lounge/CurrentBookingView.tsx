'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CustomerStay } from '@/types/customer';
import { getSupabaseBrowser } from '@/lib/supabase/client';

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

function getStatusConfig(status: string): { label: string; dotColor: string } {
  const s = status.toLowerCase();
  // staystatus enum values: upcoming, active, completed, cancelled, confirmed, checked_in, checked_out
  if (s === 'confirmed' || s === 'paid')
    return { label: status, dotColor: 'bg-emerald-400/80' };
  if (s === 'upcoming' || s === 'booked')
    return { label: 'Upcoming', dotColor: 'bg-[var(--gold)]/80' };
  if (s === 'checked_in' || s === 'active')
    return { label: 'Checked In', dotColor: 'bg-emerald-400/80' };
  if (s === 'checked_out' || s === 'completed')
    return { label: 'Completed', dotColor: 'bg-white/60' };
  if (s === 'cancelled')
    return { label: 'Cancelled', dotColor: 'bg-red-400/60' };
  return { label: status, dotColor: 'bg-white/40' };
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
  const { label: statusLabel, dotColor: statusDotColor } = getStatusConfig(stay.status);

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
          <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
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
   NO-BOOKING STATE — rich discovery experience.
   Hotel partners, destination search, booking reference, region pills.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Types ── */
type HotelData = {
  id: string;
  name: string;
  city: string;
  country: string;
  image_url: string | null;
  booking_url: string | null;
};

type RegionData = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
};

type PlaceChip = {
  id: string;
  name: string;
  category: string | null;
};

/* ── Animation constants ── */
const CARD_EASE = [0.25, 0.46, 0.45, 0.94] as const;

/* ── Card strip variants (entrance stagger) ── */
const cardStripVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardItemVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: CARD_EASE },
  },
};

/* ── Hotel card sub-component ── */
function HotelCard({ hotel }: { hotel: HotelData }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={cardItemVariants}
      className="w-[220px] sm:w-[240px] flex-shrink-0 h-[300px] sm:h-[320px] rounded-2xl overflow-hidden relative cursor-pointer"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Full-bleed image with parallax */}
      <motion.div
        className="absolute inset-0"
        animate={{ y: hovered ? -4 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {hotel.image_url ? (
          <Image
            src={hotel.image_url}
            alt={hotel.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 640px) 220px, 240px"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)' }}
          />
        )}
      </motion.div>

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        }}
      />

      {/* Content pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <p className="font-serif text-[18px] text-white leading-snug">{hotel.name}</p>
        <p className="text-[11px] text-white/50 uppercase tracking-[0.12em] mt-1">
          {hotel.city}
          {hotel.country ? `, ${hotel.country}` : ''}
        </p>
        {hotel.booking_url && (
          <a
            href={hotel.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[11px] text-[#C9A84C]/70 mt-2 hover:text-[#C9A84C] transition-colors"
            onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}
          >
            Book now →
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main NoBookingState ── */
function NoBookingState({ onAddStay }: { onAddStay: () => void }) {
  const prefersReducedMotion = useReducedMotion();

  /* ── State ── */
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionPlaces, setRegionPlaces] = useState<PlaceChip[]>([]);
  const [bookingRef, setBookingRef] = useState('');

  /* ── Fetch hotels on mount ── */
  useEffect(() => {
    fetch('/api/customer/properties')
      .then((res) => res.json())
      .then((json: { properties?: HotelData[] }) => {
        setHotels(json.properties ?? []);
        setHotelsLoading(false);
      })
      .catch((err: unknown) => {
        console.error('[NoBookingState] Failed to fetch hotels:', err);
        setHotelsLoading(false);
      });
  }, []);

  /* ── Fetch regions on mount (Supabase browser client) ── */
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase
      .from('regions')
      .select('id, name, slug, country_code')
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }: { data: RegionData[] | null; error: unknown }) => {
        if (error) {
          console.error('[NoBookingState] Failed to fetch regions:', error);
          return;
        }
        if (data) setRegions(data as RegionData[]);
      });
  }, []);

  /* ── Fetch region places when selection changes ── */
  useEffect(() => {
    if (!selectedRegion) {
      setRegionPlaces([]);
      return;
    }
    fetch(`/api/places?region_id=${encodeURIComponent(selectedRegion)}&limit=8`)
      .then((res) => res.json())
      .then((json: { data?: PlaceChip[] }) => {
        setRegionPlaces(json.data ?? []);
      })
      .catch((err: unknown) => {
        console.error('[NoBookingState] Failed to fetch region places:', err);
        setRegionPlaces([]);
      });
  }, [selectedRegion]);

  /* ── Filtered hotels ── */
  const filteredHotels = searchQuery
    ? hotels.filter(
        (h: HotelData) =>
          h.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.country?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : hotels;

  /* ── Country flag helper ── */
  const countryFlag = (code: string): string => {
    const letters = code
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 2);
    if (letters.length !== 2) return '';
    return letters
      .split('')
      .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
      .join('');
  };

  /* ── Animation helpers ── */
  const sectionReveal = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: {
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1] as const,
            delay,
          },
        };

  const scrollRevealProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.6 },
      };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">

      {/* ═══ A) TOP SECTION — greeting + destination search ═══ */}
      <div className="pt-24 sm:pt-28 pb-10 px-6 sm:px-10">
        <motion.p
          className="text-[10px] text-[#C9A84C] uppercase tracking-[0.25em] mb-4"
          {...sectionReveal(0)}
        >
          YOUR NEXT JOURNEY
        </motion.p>

        <motion.h1
          className="font-serif text-[38px] sm:text-[46px] text-white leading-tight mb-8"
          {...sectionReveal(0.1)}
        >
          Where to next?
        </motion.h1>

        {/* Search input */}
        <motion.div
          layoutId="search-container"
          layout
          className="mx-auto transition-[max-width] duration-300 ease-out"
          style={{ maxWidth: searchFocused ? 480 : 380 }}
          {...sectionReveal(0.22)}
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5 border transition-all duration-300"
            style={{
              background: searchFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.07)',
              borderColor: searchFocused ? 'rgba(201,168,76,0.40)' : 'rgba(255,255,255,0.10)',
            }}
          >
            {/* Search icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/35 flex-shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search a destination…"
              value={searchQuery}
              onChange={(e: { target: { value: string } }) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search hotel destinations"
              className="flex-1 bg-transparent text-[15px] text-white/80 placeholder:text-white/30 outline-none"
            />
          </div>
        </motion.div>
      </div>

      {/* ═══ B) HOTEL CARDS SECTION ═══ */}
      <motion.div {...scrollRevealProps}>
        <p className="text-[10px] text-[#C9A84C] uppercase tracking-[0.25em] px-6 sm:px-10 mb-5">
          PARTNER HOTELS
        </p>

        {hotelsLoading ? (
          /* Skeleton cards */
          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-6 sm:px-10 pb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[220px] sm:w-[240px] flex-shrink-0 h-[300px] rounded-2xl bg-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <p className="text-[13px] text-white/35 text-center py-8 px-6">
            No partner hotels found in that destination yet.
            <br />
            We&apos;re expanding — check back soon.
          </p>
        ) : (
          <motion.div
            className="flex gap-4 overflow-x-auto scrollbar-hide px-6 sm:px-10 pb-4"
            variants={cardStripVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {filteredHotels.map((hotel: HotelData) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ═══ C) BOOKING REFERENCE SECTION ═══ */}
      <motion.div
        className="px-6 sm:px-10 py-10"
        {...scrollRevealProps}
      >
        <p className="text-[10px] text-[#C9A84C] uppercase tracking-[0.25em] mb-2">
          HAVE A BOOKING?
        </p>
        <p className="text-[14px] text-white/45 max-w-sm leading-relaxed mt-2 mb-6">
          Enter your hotel booking reference to unlock
          your personal concierge experience.
        </p>

        <div className="flex gap-3 max-w-lg">
          {/* Input with glow */}
          <div className="reference-glow flex-1 rounded-xl">
            <input
              type="text"
              placeholder="e.g. MBS-A1B2C3D4"
              value={bookingRef}
              onChange={(e: { target: { value: string } }) => setBookingRef(e.target.value)}
              aria-label="Enter booking reference number"
              className="w-full rounded-xl bg-white/[0.07] border border-white/10 px-5 py-3.5 text-[14px] text-white/80 placeholder:text-white/25 outline-none focus:border-[#C9A84C]/40 transition-colors duration-300"
            />
          </div>

          {/* Activate button */}
          <button
            type="button"
            onClick={onAddStay}
            disabled={!bookingRef.trim()}
            className="px-6 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-[250ms] ease-out cursor-pointer disabled:cursor-not-allowed"
            style={
              bookingRef.trim()
                ? { background: '#C9A84C', color: '#000' }
                : { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.25)' }
            }
          >
            Activate Stay
          </button>
        </div>
      </motion.div>

      {/* ═══ D) REGION EXPLORE SECTION ═══ */}
      <motion.div
        className="px-6 sm:px-10 pb-16"
        {...scrollRevealProps}
      >
        <p className="text-[10px] text-[#C9A84C] uppercase tracking-[0.25em] mb-2">
          EXPLORE BY DESTINATION
        </p>
        <p className="text-[13px] text-white/40 mb-5">
          Browse places, restaurants, and experiences
          across our partner destinations.
        </p>

        {/* Region pills */}
        <div className="flex flex-wrap gap-2">
          {regions.map((region: RegionData) => {
            const isSelected = selectedRegion === region.id;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() =>
                  setSelectedRegion(isSelected ? null : region.id)
                }
                className="px-4 py-2 rounded-full text-[12px] border outline-none cursor-pointer"
                style={{
                  background: isSelected
                    ? 'rgba(201,168,76,0.10)'
                    : 'rgba(255,255,255,0.05)',
                  borderColor: isSelected
                    ? 'rgba(201,168,76,0.30)'
                    : 'rgba(255,255,255,0.08)',
                  color: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.50)',
                  transition: 'background 250ms ease, border-color 250ms ease, color 250ms ease',
                }}
              >
                {region.country_code ? `${countryFlag(region.country_code)} ` : ''}
                {region.name}
              </button>
            );
          })}
        </div>

        {/* Region places strip */}
        {selectedRegion && regionPlaces.length > 0 && (
          <motion.div
            className="mt-5 flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            {regionPlaces.map((place: PlaceChip) => (
              <div
                key={place.id}
                className="flex-shrink-0 rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3"
              >
                <p className="text-[13px] text-white/65 whitespace-nowrap">{place.name}</p>
                {place.category && (
                  <p className="text-[11px] text-white/30 mt-0.5 uppercase tracking-[0.1em]">
                    {place.category}
                  </p>
                )}
              </div>
            ))}

            {/* Explore all link */}
            <div className="flex-shrink-0 flex items-center px-2">
              <Link
                href="/select-region"
                className="text-[12px] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors whitespace-nowrap"
              >
                Explore all →
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
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

/** Grounded section — translucent panel for lower content areas. */
function GroundedSection({
  label,
  description,
  children,
  fadeIn,
  delay,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  fadeIn: (d: number) => Record<string, unknown>;
  delay: number;
}) {
  return (
    <motion.section
      className="mb-12 sm:mb-16 rounded-2xl px-6 sm:px-8 py-7 sm:py-9"
      style={{
        background: 'rgba(0,0,0,0.30)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      {...fadeIn(delay)}
    >
      <p className="text-[11px] text-white/50 uppercase tracking-[0.22em] font-semibold mb-3">
        {label}
      </p>
      <p className="text-[14px] sm:text-[15px] text-white/55 mb-6 max-w-lg leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap gap-3">
        {children}
      </div>
    </motion.section>
  );
}

/** Editorial external link — refined translucent pill with premium feel. */
function EditorialLink({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const isExternal = href.startsWith('http');
  const Tag = isExternal ? 'a' : Link;
  const externalProps = isExternal
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  return (
    <Tag
      href={href}
      {...externalProps}
      className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-[13px] text-white/60 font-medium backdrop-blur-sm hover:bg-white/[0.14] hover:text-white/85 hover:border-white/20 focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:outline-none transition-all duration-300"
      style={{ textDecoration: 'none' }}
    >
      {label}
      {isExternal && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50 group-hover:opacity-80 transition-opacity duration-300"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      )}
    </Tag>
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

function VisaIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function WeatherIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="M3 17h18" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <path d="M9 10c0-1.1.9-2 2-2h2a2 2 0 010 4h-2a2 2 0 000 4h2a2 2 0 002-2" />
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
