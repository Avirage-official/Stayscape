'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CustomerStay } from '@/types/customer';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import NoBookingDashboard from './NoBookingDashboard';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

const IMG = {
  hero01: '/images/brand/hero-01.jpg',
  hero02: '/images/brand/hero-02.jpg',
  hero03: '/images/brand/hero-03.jpg',
  moodPool: '/images/brand/mood-pool.jpg',
  moodRooftop: '/images/brand/mood-rooftop.jpg',
  moodFriends: '/images/brand/mood-friends.jpg',
  moodGolden: '/images/brand/mood-golden.jpg',
  moodMorning: '/images/brand/mood-morning.jpg',
  moodMarket: '/images/brand/mood-market.jpg',
  emptyStays: '/images/ui/empty-stays.jpg',
  emptyDiscover: '/images/ui/empty-discover.jpg',
} as const;

const UNSPLASH_FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop';

const MOOD_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1520250497591-112753be183e?w=400&q=80';

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

  const heroSrc = stay.property?.image_url || IMG.hero01;

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
          onError={(e) => { (e.target as HTMLImageElement).src = UNSPLASH_FALLBACK; }}
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

export type HotelData = {
  id: string;
  name: string;
  city: string;
  country: string;
  image_url: string | null;
  booking_url: string | null;
};

export type RegionData = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
};

export type PlaceChip = {
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
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  return (
    <NoBookingDashboard
      onAddStay={onAddStay}
      hotels={hotels}
      hotelsLoading={hotelsLoading}
      regions={regions}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedRegion={selectedRegion}
      setSelectedRegion={setSelectedRegion}
      regionPlaces={regionPlaces}
      bookingRef={bookingRef}
      setBookingRef={setBookingRef}
      filteredHotels={filteredHotels}
      countryFlag={countryFlag}
    />
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
