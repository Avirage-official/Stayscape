'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CustomerStay } from '@/types/customer';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop';

/* ─── Helpers ─── */

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
  if (s === 'confirmed' || s === 'paid') return 'Confirmed';
  if (s === 'upcoming' || s === 'booked') return 'Upcoming';
  if (s === 'checked_in' || s === 'active') return 'Checked In';
  if (s === 'checked_out' || s === 'completed') return 'Completed';
  if (s === 'cancelled') return 'Cancelled';
  return status;
}

function getTimeOfDay(): 'MORNING' | 'AFTERNOON' | 'EVENING' {
  const hour = new Date().getHours();
  if (hour < 12) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
}

/* ═══════════════════════════════════════════════════════════════════
   BOOKED STATE — Warm Modern stay summary.
   Hotel image card + stay details card + concierge action pills.
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
  const tod = getTimeOfDay();

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.7, ease: REVEAL_EASE, delay },
        };

  const heroSrc = stay.property?.image_url || HERO_FALLBACK;

  return (
    <div className="px-5 sm:px-8 pt-6">
      {/* Greeting */}
      <motion.p
        className="text-[10px] uppercase font-medium mb-3"
        style={{ color: 'var(--gold)', letterSpacing: '0.2em' }}
        {...fadeIn(0.05)}
      >
        GOOD {tod}
      </motion.p>
      <motion.h1
        className="font-serif text-[28px] leading-tight"
        style={{ color: 'var(--text-primary)' }}
        {...fadeIn(0.12)}
      >
        Welcome to {stay.property?.name ?? 'your stay'}.
      </motion.h1>

      {/* Hotel image card */}
      <motion.div
        className="mt-6 relative w-full h-[200px] sm:h-[240px] rounded-2xl overflow-hidden"
        {...fadeIn(0.2)}
      >
        <Image
          src={heroSrc}
          alt={stay.property?.name ?? 'Hotel'}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 720px"
          priority
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 45%, rgba(28,26,23,0.55) 100%)',
          }}
        />

        {/* Status pill */}
        <div className="absolute top-3 right-3">
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] font-medium uppercase"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: 'var(--gold)',
              letterSpacing: '0.12em',
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Hotel name + city overlay */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="font-serif text-[20px] leading-tight">
            {stay.property?.name ?? 'Your Stay'}
          </p>
          {stay.property?.address && (
            <p className="text-[12px] opacity-90 mt-0.5 truncate">
              {stay.property.address}
            </p>
          )}
        </div>
      </motion.div>

      {/* Stay details card */}
      <motion.div
        className="mt-3 rounded-2xl px-5 py-4"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
        {...fadeIn(0.28)}
      >
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <DetailItem label="Check-in" value={formatShortDate(stay.check_in)} />
          <DetailItem label="Check-out" value={formatShortDate(stay.check_out)} />
          <DetailItem
            label="Nights"
            value={nights > 0 ? `${nights}` : '—'}
            divider
          />
          {stay.room_type && (
            <DetailItem label="Room" value={stay.room_type} divider />
          )}
          {stay.guests != null && (
            <DetailItem
              label="Guests"
              value={`${stay.guests}`}
              divider={!stay.room_type}
            />
          )}
        </div>
      </motion.div>

      {/* Action pills row */}
      <motion.div
        className="mt-5 flex flex-wrap gap-3 pb-2"
        {...fadeIn(0.36)}
      >
        <ConciergeActionPill label="Open Map" href="/app?tab=map" icon={<MapIcon />} />
        <ConciergeActionPill label="Explore Nearby" href="/app" icon={<CompassIcon />} />
        <ConciergeActionPill label="Itinerary" href="/app" icon={<CalendarIcon />} />
        <ConciergeActionPill label="Add Stay" onClick={onAddStay} icon={<PlusIcon />} />
      </motion.div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      className={divider ? 'pt-3' : ''}
      style={
        divider
          ? { borderTop: '1px solid var(--border)', gridColumn: 'span 1' }
          : undefined
      }
    >
      <p
        className="text-[10px] uppercase font-medium mb-1"
        style={{ color: 'var(--text-muted)', letterSpacing: '0.16em' }}
      >
        {label}
      </p>
      <p
        className="text-[14px] font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NO-BOOKING STATE — Warm discovery experience.
   ═══════════════════════════════════════════════════════════════════ */

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

const CARD_EASE = [0.25, 0.46, 0.45, 0.94] as const;

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

function HotelCard({ hotel }: { hotel: HotelData }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={cardItemVariants}
      className="w-[220px] sm:w-[240px] flex-shrink-0 h-[300px] sm:h-[320px] rounded-2xl overflow-hidden relative cursor-pointer"
      style={{
        background: 'var(--card-bg)',
        boxShadow: 'var(--card-shadow)',
      }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
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
            style={{
              background:
                'linear-gradient(135deg, var(--surface-raised) 0%, var(--charcoal) 100%)',
            }}
          />
        )}
      </motion.div>

      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to top, rgba(28,26,23,0.85) 0%, rgba(28,26,23,0.30) 50%, transparent 100%)',
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 text-white">
        <p className="font-serif text-[18px] leading-snug">{hotel.name}</p>
        <p className="text-[11px] uppercase tracking-[0.12em] mt-1 opacity-80">
          {hotel.city}
          {hotel.country ? `, ${hotel.country}` : ''}
        </p>
        {hotel.booking_url && (
          <a
            href={hotel.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[11px] mt-2 transition-colors"
            style={{ color: 'var(--gold-muted)' }}
            onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}
          >
            Book now →
          </a>
        )}
      </div>
    </motion.div>
  );
}

function NoBookingState({ onAddStay }: { onAddStay: () => void }) {
  const prefersReducedMotion = useReducedMotion();

  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionPlaces, setRegionPlaces] = useState<PlaceChip[]>([]);
  const [bookingRef, setBookingRef] = useState('');

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

  useEffect(() => {
    if (!selectedRegion) return;
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

  const filteredHotels = searchQuery
    ? hotels.filter(
        (h: HotelData) =>
          h.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.country?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : hotels;

  const countryFlag = (code: string): string => {
    const letters = code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    if (letters.length !== 2) return '';
    return letters
      .split('')
      .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
      .join('');
  };

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
    <div style={{ background: 'var(--background)' }}>
      {/* ═══ A) TOP SECTION — greeting + destination search ═══ */}
      <div className="pt-6 pb-8 px-5 sm:px-8">
        <motion.p
          className="text-[10px] uppercase mb-3 font-medium"
          style={{ color: 'var(--gold)', letterSpacing: '0.25em' }}
          {...sectionReveal(0)}
        >
          YOUR NEXT JOURNEY
        </motion.p>

        <motion.h1
          className="font-serif text-[32px] sm:text-[38px] leading-tight mb-6"
          style={{ color: 'var(--text-primary)' }}
          {...sectionReveal(0.1)}
        >
          Where to next?
        </motion.h1>

        <motion.div
          layoutId="search-container"
          layout
          className="transition-[max-width] duration-300 ease-out"
          style={{ maxWidth: searchFocused ? 480 : 380 }}
          {...sectionReveal(0.22)}
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all duration-300"
            style={{
              background: 'var(--input-bg)',
              border: `1px solid ${searchFocused ? 'var(--gold)' : 'var(--input-border)'}`,
              boxShadow: searchFocused
                ? 'var(--input-focus, 0 0 0 3px rgba(193,127,58,0.15))'
                : 'var(--card-shadow)',
            }}
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
              style={{ color: 'var(--text-muted)' }}
              className="flex-shrink-0"
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
              className="flex-1 bg-transparent text-[15px] outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </motion.div>
      </div>

      {/* ═══ B) HOTEL CARDS SECTION ═══ */}
      <motion.div {...scrollRevealProps}>
        <p
          className="text-[10px] uppercase px-5 sm:px-8 mb-4 font-medium"
          style={{ color: 'var(--gold)', letterSpacing: '0.25em' }}
        >
          PARTNER HOTELS
        </p>

        {hotelsLoading ? (
          <div
            className="flex gap-4 overflow-x-auto scrollbar-hide px-5 sm:px-8 pb-4"
            role="status"
            aria-label="Loading hotels"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[220px] sm:w-[240px] flex-shrink-0 h-[300px] rounded-2xl skeleton-warm"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <p
            className="text-[13px] text-center py-8 px-6"
            style={{ color: 'var(--text-muted)' }}
          >
            No partner hotels found in that destination yet.
            <br />
            We&apos;re expanding — check back soon.
          </p>
        ) : (
          <motion.div
            className="flex gap-4 overflow-x-auto scrollbar-hide px-5 sm:px-8 pb-4"
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
      <motion.div className="px-5 sm:px-8 py-10" {...scrollRevealProps}>
        <p
          className="text-[10px] uppercase mb-2 font-medium"
          style={{ color: 'var(--gold)', letterSpacing: '0.25em' }}
        >
          HAVE A BOOKING?
        </p>
        <p
          className="text-[14px] max-w-sm leading-relaxed mt-2 mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Enter your hotel booking reference to unlock your personal concierge
          experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <div className="reference-glow flex-1 rounded-xl">
            <input
              type="text"
              placeholder="e.g. MBS-A1B2C3D4"
              value={bookingRef}
              onChange={(e: { target: { value: string } }) => setBookingRef(e.target.value)}
              aria-label="Enter booking reference number"
              className="w-full rounded-xl px-5 py-3.5 text-[14px] outline-none transition-colors duration-300"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={onAddStay}
            disabled={!bookingRef.trim()}
            className="px-6 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-[250ms] ease-out cursor-pointer disabled:cursor-not-allowed"
            style={
              bookingRef.trim()
                ? { background: 'var(--gold)', color: '#FFFFFF' }
                : {
                    background: 'var(--surface-raised)',
                    color: 'var(--text-faint)',
                  }
            }
          >
            Activate Stay
          </button>
        </div>
      </motion.div>

      {/* ═══ D) REGION EXPLORE SECTION ═══ */}
      <motion.div className="px-5 sm:px-8 pb-12" {...scrollRevealProps}>
        <p
          className="text-[10px] uppercase mb-2 font-medium"
          style={{ color: 'var(--gold)', letterSpacing: '0.25em' }}
        >
          EXPLORE BY DESTINATION
        </p>
        <p
          className="text-[13px] mb-5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Browse places, restaurants, and experiences across our partner
          destinations.
        </p>

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
                className="px-4 py-2 rounded-full text-[12px] outline-none cursor-pointer"
                style={{
                  background: isSelected
                    ? 'var(--gold-subtle)'
                    : 'var(--surface-raised)',
                  border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                  color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                  transition:
                    'background 250ms ease, border-color 250ms ease, color 250ms ease',
                }}
              >
                {region.country_code ? `${countryFlag(region.country_code)} ` : ''}
                {region.name}
              </button>
            );
          })}
        </div>

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
                className="flex-shrink-0 rounded-xl px-4 py-3"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <p
                  className="text-[13px] whitespace-nowrap"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {place.name}
                </p>
                {place.category && (
                  <p
                    className="text-[11px] mt-0.5 uppercase tracking-[0.1em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {place.category}
                  </p>
                )}
              </div>
            ))}

            <div className="flex-shrink-0 flex items-center px-2">
              <Link
                href="/select-region"
                className="text-[12px] transition-colors whitespace-nowrap"
                style={{ color: 'var(--gold)' }}
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
      <span style={{ color: 'currentColor' }}>{icon}</span>
      <span className="text-[13px] font-medium">{label}</span>
    </>
  );

  const className =
    'group inline-flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer';
  const style: React.CSSProperties = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    boxShadow: 'var(--card-shadow)',
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href!} className={className} style={{ ...style, textDecoration: 'none' }}>
      {inner}
    </Link>
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
