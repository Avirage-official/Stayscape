'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CustomerStay } from '@/types/customer';
import { getSupabaseBrowser } from '@/lib/supabase/client';

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

  const sectionAnim = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const,
            delay,
          },
        };

  const newCardStripVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };

  const newCardItemVariants = {
    hidden: { opacity: 0, x: 24 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        overflowX: 'hidden',
      }}
    >
      {/* ═══ BLOCK 1 — IMMERSIVE HERO ═══ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(420px, 60vh, 620px)',
          overflow: 'hidden',
        }}
      >
        {/* Aurora animated gradient background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, #C17F3A 0%, #E8C9A8 20%, #FAF8F5 40%, #D4956A 60%, #C17F3A 80%, #F5EBD8 100%)',
            backgroundSize: '400% 400%',
            animation: 'auroraShift 12s ease infinite',
          }}
        />

        {/* Frosted bottom panel */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '32px 32px 40px',
            background:
              'linear-gradient(to top, rgba(250,248,245,1) 0%, rgba(250,248,245,0.95) 40%, rgba(250,248,245,0) 100%)',
          }}
          className="sm:!p-[48px_48px_56px]"
        >
          <motion.p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.28em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 8 } as const,
                  animate: { opacity: 1, y: 0 } as const,
                  transition: {
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1] as const,
                    delay: 0.1,
                  },
                })}
          >
            YOUR NEXT STAY AWAITS
          </motion.p>
          <motion.h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 'clamp(44px, 7vw, 72px)',
              lineHeight: 0.98,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: 0,
            }}
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 12 } as const,
                  animate: { opacity: 1, y: 0 } as const,
                  transition: {
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1] as const,
                    delay: 0.18,
                  },
                })}
          >
            Where to next?
          </motion.h1>
        </div>
      </div>

      {/* ═══ BLOCK 2 — FLOATING SEARCH BAR ═══ */}
      <motion.div
        className="px-6 sm:px-10"
        style={{
          marginTop: '-28px',
          position: 'relative',
          zIndex: 20,
        }}
        {...(prefersReducedMotion
          ? {}
          : {
              initial: { opacity: 0, y: 16, scale: 0.97 } as const,
              animate: { opacity: 1, y: 0, scale: 1 } as const,
              transition: {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1] as const,
                delay: 0.28,
              },
            })}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '600px',
            height: '60px',
            borderRadius: '30px',
            background: 'white',
            boxShadow: searchFocused
              ? '0 8px 40px rgba(193,127,58,0.28), 0 2px 8px rgba(28,26,23,0.10)'
              : '0 4px 24px rgba(193,127,58,0.18), 0 1px 4px rgba(28,26,23,0.08)',
            border: `1.5px solid ${searchFocused ? 'var(--gold)' : 'rgba(193,127,58,0.2)'}`,
            padding: '0 24px',
            gap: '14px',
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search a destination…"
            value={searchQuery}
            onChange={(e: { target: { value: string } }) =>
              setSearchQuery(e.target.value)
            }
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search hotel destinations"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              color: 'var(--text-primary)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '999px',
                background: 'var(--surface-raised)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: 0,
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ BLOCK 3 — PARTNER HOTELS GRID ═══ */}
      <motion.div
        className="px-6 sm:px-10"
        style={{ marginTop: '40px' }}
        {...sectionAnim(0.14)}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '16px',
          }}
        >
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
            }}
          >
            PARTNER HOTELS
          </p>
          {!hotelsLoading && filteredHotels.length > 0 && (
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {filteredHotels.length} properties
            </p>
          )}
        </div>

        {/* Hotel grid */}
        {hotelsLoading ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            style={{ gap: '12px' }}
            role="status"
            aria-label="Loading hotels"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`skeleton-warm${i === 0 ? ' col-span-2' : ''}`}
                style={{
                  borderRadius: '16px',
                  paddingTop: i === 0 ? '65%' : '120%',
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <div
            style={{
              gridColumn: 'span 2',
              padding: '48px 0',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Not there yet
            </p>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginTop: '6px',
              }}
            >
              We&apos;re growing our hotel network fast.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            style={{ gap: '12px' }}
          >
            {filteredHotels.map((hotel: HotelData, index: number) => {
              const isFeatured = index === 0;
              return (
                <motion.div
                  key={hotel.id}
                  className={isFeatured ? 'col-span-2' : ''}
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'var(--surface)',
                    paddingTop: isFeatured ? '65%' : '120%',
                    transition:
                      'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  initial={
                    prefersReducedMotion
                      ? {}
                      : { opacity: 0, y: 20, scale: 0.97 }
                  }
                  animate={
                    prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }
                  }
                  transition={
                    prefersReducedMotion
                      ? {}
                      : {
                          duration: 0.45,
                          ease: [0.22, 1, 0.36, 1] as const,
                          delay: index * 0.06,
                        }
                  }
                  whileHover={{
                    boxShadow: '0 12px 40px rgba(28,26,23,0.22)',
                  }}
                >
                  {/* Inner absolute container */}
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {hotel.image_url ? (
                      <motion.div
                        style={{ position: 'absolute', inset: 0 }}
                        whileHover={{ scale: 1.04 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      >
                        <Image
                          src={hotel.image_url}
                          alt={hotel.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              UNSPLASH_FALLBACK;
                          }}
                        />
                      </motion.div>
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'linear-gradient(145deg, #EDE8E1, #D8CFC4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Playfair Display, serif',
                            fontSize: '28px',
                            color: 'var(--gold)',
                            opacity: 0.4,
                          }}
                        >
                          {hotel.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to top, rgba(10,8,6,0.90) 0%, rgba(10,8,6,0.4) 45%, transparent 100%)',
                      }}
                    />
                    {/* Card content */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '14px',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '15px',
                          fontWeight: 500,
                          lineHeight: 1.25,
                          color: 'white',
                        }}
                      >
                        {hotel.name}
                      </p>
                      <p
                        style={{
                          fontSize: '10px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: 'rgba(255,255,255,0.55)',
                          marginTop: '3px',
                        }}
                      >
                        {hotel.city}
                      </p>
                      {hotel.booking_url && (
                        <a
                          href={hotel.booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            color: '#D4956A',
                            marginTop: '6px',
                          }}
                          onClick={(e: { stopPropagation(): void }) =>
                            e.stopPropagation()
                          }
                        >
                          Book →
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ═══ BLOCK 4 — BOOKING REFERENCE ═══ */}
      <motion.div
        className="px-6 sm:px-10"
        style={{ marginTop: '48px' }}
        {...sectionAnim(0.2)}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(193,127,58,0.15)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 4px 24px rgba(193,127,58,0.08)',
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: 'var(--gold)',
                textTransform: 'uppercase',
              }}
            >
              HAVE A BOOKING?
            </p>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(193,127,58,0.6)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '10px 0 20px',
            }}
          >
            Enter your hotel booking reference to unlock your personal AI
            concierge experience.
          </p>

          {/* Reference input */}
          <input
            type="text"
            placeholder="e.g. MBS-A1B2C3D4"
            value={bookingRef}
            onChange={(e: { target: { value: string } }) =>
              setBookingRef(e.target.value)
            }
            aria-label="Enter booking reference number"
            className="reference-glow discovery-ref-input"
            style={{
              display: 'block',
              width: '100%',
              height: '52px',
              borderRadius: '14px',
              background: 'white',
              border: '1.5px solid var(--border)',
              padding: '0 18px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none',
              marginBottom: '12px',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />

          {/* CTA button */}
          <motion.button
            type="button"
            onClick={bookingRef.trim() ? onAddStay : undefined}
            disabled={!bookingRef.trim()}
            aria-label={
              bookingRef.trim()
                ? 'Unlock My Stay'
                : 'Enter a reference to continue'
            }
            style={{
              display: 'block',
              width: '100%',
              height: '52px',
              borderRadius: '14px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: bookingRef.trim() ? 'pointer' : 'default',
              pointerEvents: bookingRef.trim() ? 'auto' : 'none',
              ...(bookingRef.trim()
                ? {
                    background:
                      'linear-gradient(135deg, #C17F3A 0%, #D4956A 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(193,127,58,0.35)',
                  }
                : {
                    background: 'var(--surface-raised)',
                    color: 'var(--text-faint)',
                    border: '1.5px solid var(--border)',
                    boxShadow: 'none',
                  }),
            }}
            whileHover={
              bookingRef.trim()
                ? {
                    y: -1,
                    boxShadow: '0 8px 28px rgba(193,127,58,0.45)',
                  }
                : {}
            }
          >
            {bookingRef.trim() ? 'Unlock My Stay →' : 'Enter a reference to continue'}
          </motion.button>
        </div>
      </motion.div>

      {/* ═══ BLOCK 5 — EXPLORE DESTINATIONS ═══ */}
      <motion.div
        className="px-6 sm:px-10"
        style={{ marginTop: '40px', paddingBottom: '120px' }}
        {...sectionAnim(0.26)}
      >
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
          }}
        >
          EXPLORE DESTINATIONS
        </p>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: '8px 0 16px',
          }}
        >
          Discover places across our partner cities.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {regions.map((region: RegionData) => {
            const isSelected = selectedRegion === region.id;
            return (
              <button
                key={region.id}
                type="button"
                data-selected={String(isSelected)}
                className="region-pill-btn"
                onClick={() =>
                  setSelectedRegion(isSelected ? null : region.id)
                }
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  outline: 'none',
                  background: isSelected
                    ? 'rgba(193,127,58,0.10)'
                    : 'white',
                  border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                  color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                  boxShadow: isSelected
                    ? '0 2px 12px rgba(193,127,58,0.18)'
                    : '0 1px 4px rgba(28,26,23,0.06)',
                }}
              >
                {region.country_code ? (
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>
                    {countryFlag(region.country_code)}
                  </span>
                ) : null}
                {region.name}
              </button>
            );
          })}
        </div>

        {selectedRegion && regionPlaces.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '10px',
              }}
            >
              {regions.find((r: RegionData) => r.id === selectedRegion)
                ?.name ?? ''}{' '}
              highlights
            </p>
            <div
              className="scrollbar-hide"
              style={{ overflowX: 'auto', display: 'flex', gap: '8px' }}
            >
              {regionPlaces.map((place: PlaceChip) => (
                <div
                  key={place.id}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    background: 'white',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 4px rgba(28,26,23,0.06)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                  }}
                >
                  {place.name}
                  {place.category && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {place.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
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
