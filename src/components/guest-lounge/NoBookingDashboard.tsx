'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cormorant_Garamond } from 'next/font/google';
import type { HotelData, RegionData, PlaceChip } from './CurrentBookingView';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '600'],
  display: 'swap',
});

/* ─── Types ─── */

type FeaturedPlace = {
  id: string;
  name: string;
  category: string | null;
  image_url?: string | null;
  rating?: number | null;
};

export interface NoBookingDashboardProps {
  onAddStay: () => void;
  hotels: HotelData[];
  hotelsLoading: boolean;
  regions: RegionData[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedRegion: string | null;
  setSelectedRegion: (id: string | null) => void;
  regionPlaces: PlaceChip[];
  bookingRef: string;
  setBookingRef: (ref: string) => void;
  filteredHotels: HotelData[];
  countryFlag: (code: string) => string;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const UNSPLASH_FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop';

const HERO_IMAGES = [
  '/images/brand/hero-01.jpg',
  '/images/brand/hero-02.jpg',
  '/images/brand/hero-03.jpg',
] as const;

/* ─── Nav items config ─── */

const NAV_ITEMS = [
  { label: 'Home',    href: '/dashboard',         icon: 'home',  active: true  },
  { label: 'Profile', href: '/dashboard/profile', icon: 'user',  active: false },
] as const;

/* ─── Inline SVG icons ─── */

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function NavCompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function NavMapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function NavCalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function NavUserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusSidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MapWidgetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function getNavIcon(icon: string) {
  switch (icon) {
    case 'home': return <HomeIcon />;
    case 'compass': return <NavCompassIcon />;
    case 'map': return <NavMapIcon />;
    case 'calendar': return <NavCalendarIcon />;
    case 'user': return <NavUserIcon />;
    default: return null;
  }
}

/* ─── Main Component ─── */

export default function NoBookingDashboard({
  onAddStay,
  hotels: _hotels,
  hotelsLoading,
  regions,
  searchQuery,
  setSearchQuery,
  selectedRegion,
  setSelectedRegion,
  regionPlaces,
  bookingRef,
  setBookingRef,
  filteredHotels,
  countryFlag,
}: NoBookingDashboardProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [searchFocused, setSearchFocused] = useState(false);
  const [featuredPlaces, setFeaturedPlaces] = useState<FeaturedPlace[]>([]);
  const [mapHovered, setMapHovered] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  /* Fetch featured places from first region */
  useEffect(() => {
    if (regions.length === 0) return;
    fetch(
      `/api/discovery/places?featured_only=true&limit=6&region_id=${encodeURIComponent(regions[0].id)}`,
    )
      .then((res) => res.json())
      .then((json: { data?: FeaturedPlace[] }) => {
        setFeaturedPlaces(json.data ?? []);
      })
      .catch((err: unknown) => {
        console.error(
          `[NoBookingDashboard] Failed to fetch featured places for region ${regions[0].id}:`,
          err,
        );
        setFeaturedPlaces([]);
      });
  }, [regions]);

  /* Hero slideshow */
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  const anim = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.4, ease: EASE, delay },
        };

  const animX = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, x: 16 } as const,
          animate: { opacity: 1, x: 0 } as const,
          transition: { duration: 0.4, ease: EASE, delay },
        };

  /* ═══ Shared Panel Widgets ═══ */

  const BookingRefWidget = (
    <motion.div
      style={{
        borderRadius: '16px',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        padding: '20px',
        overflow: 'hidden',
        position: 'relative',
      }}
      {...animX(0.1)}
    >
      {/* Decorative top accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--gold) 0%, #D4956A 100%)',
        }}
      />

      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--gold)',
          marginBottom: '8px',
          marginTop: '4px',
        }}
      >
        HAVE A BOOKING?
      </p>
      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          marginBottom: '16px',
        }}
      >
        Enter your booking reference to unlock your personal concierge experience.
      </p>

      <input
        type="text"
        placeholder="e.g. MBS-A1B2C3D4"
        value={bookingRef}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setBookingRef(e.target.value)
        }
        aria-label="Enter booking reference number"
        className="reference-glow"
        style={{
          width: '100%',
          height: '44px',
          borderRadius: '10px',
          background: 'white',
          border: '1.5px solid var(--border)',
          padding: '0 14px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: 'var(--text-primary)',
          outline: 'none',
          marginBottom: '10px',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />

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
          height: '44px',
          borderRadius: '10px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          cursor: bookingRef.trim() ? 'pointer' : 'default',
          border: 'none',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          ...(bookingRef.trim()
            ? {
                background:
                  'linear-gradient(135deg,#C17F3A,#D4956A)',
                color: 'white',
                boxShadow: '0 4px 14px rgba(193,127,58,0.30)',
                pointerEvents: 'auto' as const,
              }
            : {
                background: 'var(--charcoal)',
                color: 'var(--text-faint)',
                pointerEvents: 'none' as const,
              }),
        }}
        whileHover={
          bookingRef.trim()
            ? { y: -1, boxShadow: '0 6px 20px rgba(193,127,58,0.40)' }
            : {}
        }
      >
        {bookingRef.trim()
          ? 'Unlock My Stay →'
          : 'Enter reference to continue'}
      </motion.button>
    </motion.div>
  );

  const ExploreWidget = (
    <motion.div
      style={{
        borderRadius: '16px',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        padding: '20px',
      }}
      {...anim(0.18)}
    >
      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--gold)',
          marginBottom: '14px',
        }}
      >
        EXPLORE DESTINATIONS
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {regions.map((region: RegionData) => {
          const isSelected = selectedRegion === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() =>
                setSelectedRegion(isSelected ? null : region.id)
              }
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                outline: 'none',
                background: isSelected ? 'rgba(193,127,58,0.09)' : 'white',
                border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
              }}
            >
              {region.country_code ? (
                <span style={{ fontSize: '13px' }}>
                  {countryFlag(region.country_code)}
                </span>
              ) : null}
              {region.name}
            </button>
          );
        })}
      </div>

      {selectedRegion && regionPlaces.length > 0 && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}
          >
            {regions.find((r: RegionData) => r.id === selectedRegion)?.name ?? ''}
          </p>
          <div
            className="scrollbar-hide"
            style={{ overflowX: 'auto', display: 'flex', gap: '6px' }}
          >
            {regionPlaces.map((place: PlaceChip) => (
              <div
                key={place.id}
                style={{
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {place.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const MiniMapWidget = (
    <motion.div
      onClick={() => router.push('/dashboard')}
      onMouseEnter={() => setMapHovered(true)}
      onMouseLeave={() => setMapHovered(false)}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        height: '180px',
        position: 'relative',
        cursor: 'pointer',
        background:
          'linear-gradient(145deg, #E8F4E8 0%, #D4E8D4 30%, #B8D4B8 60%, #E8E4D4 100%)',
        boxShadow: mapHovered
          ? '0 8px 24px rgba(28,26,23,0.14)'
          : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
      {...anim(0.26)}
    >
      {/* SVG grid overlay */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.3,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#5A7A5A" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
      </svg>

      {/* Content overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <MapWidgetIcon />
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Explore the map
        </p>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          See places near our hotels
        </p>
      </div>

      {/* Arrow pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'white',
          borderRadius: '999px',
          padding: '6px 12px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--gold)',
          boxShadow: '0 2px 8px rgba(28,26,23,0.12)',
        }}
      >
        View Map →
      </div>
    </motion.div>
  );

  /* ═══ RENDER ═══ */

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══ TOP BAR ═══ */}
      <motion.div
        style={{
          height: '64px',
          background: 'white',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
        {...anim(0)}
      >
        {/* Search pill — centred */}
        <div
          style={{
            flex: 1,
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              height: '40px',
              borderRadius: '20px',
              background: searchFocused ? 'white' : 'var(--surface-raised)',
              border: `1px solid ${searchFocused ? 'var(--gold)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: searchFocused
                ? '0 0 0 3px rgba(193,127,58,0.10)'
                : 'none',
            }}
          >
            <SearchIcon />
            <input
              type="text"
              placeholder="Search destinations…"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search destinations"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Date — hidden on mobile */}
        <span
          className="hidden lg:block"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          {todayLabel}
        </span>
      </motion.div>

      {/* ═══ HERO SECTION ═══ */}
      <section
        className="h-[55vh] lg:h-[65vh]"
        style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}
        aria-label="Featured destination slideshow"
      >
        {/* Crossfade background images */}
        {HERO_IMAGES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`Destination hero image ${i + 1}`}
            fill
            priority={i === 0}
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: i === heroIndex ? 1 : 0,
              transition: prefersReducedMotion ? 'none' : 'opacity 1.2s ease',
            }}
          />
        ))}

        {/* Dark gradient overlay for text legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(10,8,6,0.70) 0%, rgba(10,8,6,0.25) 55%, rgba(10,8,6,0.10) 100%)',
          }}
        />

        {/* Headline */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            padding: 'clamp(24px, 5vw, 56px)',
          }}
        >
          <h1
            className={cormorant.className}
            style={{
              fontSize: 'clamp(2.8rem, 5vw, 5rem)',
              fontWeight: 300,
              fontStyle: 'normal',
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              color: 'white',
              maxWidth: '680px',
            }}
          >
            Your city. Yours to explore.
          </h1>
        </div>
      </section>

      {/* ═══ CONTENT AREA ═══ */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[200px_1fr_320px]"
        style={{ flex: 1, minHeight: 0 }}
      >
        {/* ─── LEFT SIDEBAR (desktop only) ─── */}
        <aside
          className="hidden lg:flex"
          style={{
            flexDirection: 'column',
            padding: '32px 16px',
            borderRight: '1px solid var(--border)',
            background: 'white',
            gap: '4px',
            position: 'sticky',
            top: '64px',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          {/* Greeting */}
          <div style={{ padding: '0 12px', marginBottom: '24px' }}>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {greeting}
            </p>
            <p
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '18px',
                fontStyle: 'italic',
                color: 'var(--text-primary)',
                marginTop: '2px',
              }}
            >
              Traveller
            </p>
          </div>

          {/* Nav items */}
          {NAV_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, x: -8 } as const,
                    animate: { opacity: 1, x: 0 } as const,
                    transition: {
                      duration: 0.3,
                      ease: EASE,
                      delay: i * 0.04,
                    },
                  })}
            >
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: item.active ? 600 : 500,
                  color: item.active ? 'var(--gold)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  background: item.active
                    ? 'rgba(193,127,58,0.08)'
                    : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {getNavIcon(item.icon)}
                {item.label}
              </Link>
            </motion.div>
          ))}

          {/* Add a stay button */}
          <div
            style={{
              marginTop: 'auto',
              padding: '12px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={onAddStay}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--gold)',
                color: 'white',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#A86D2E';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)';
              }}
            >
              <PlusSidebarIcon />
              Add a stay
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main
          style={{
            padding: '28px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
          className="lg:!p-[32px]"
        >
          {/* SECTION B — Partner Hotels */}
          <motion.div {...anim(0.12)}>
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'var(--gold)',
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
                className="grid grid-cols-2 xl:grid-cols-3"
                style={{ gap: '14px' }}
                role="status"
                aria-label="Loading hotels"
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`skeleton-warm${i === 0 ? ' col-span-2' : ''}`}
                    style={{
                      borderRadius: '14px',
                      paddingTop: i === 0 ? '55%' : '100%',
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : filteredHotels.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '48px 24px',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    color: 'var(--text-muted)',
                    margin: '0 auto 12px',
                    display: 'block',
                  }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
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
                  We&apos;re growing our hotel network.
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 xl:grid-cols-3"
                style={{ gap: '14px' }}
              >
                {filteredHotels.map((hotel: HotelData, index: number) => {
                  const isFeatured = index === 0;
                  return (
                    <motion.div
                      key={hotel.id}
                      className={isFeatured ? 'col-span-2' : ''}
                      style={{
                        position: 'relative',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'var(--surface-raised)',
                        paddingTop: isFeatured ? '55%' : '100%',
                        transition:
                          'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      initial={
                        prefersReducedMotion
                          ? {}
                          : { opacity: 0, y: 16, scale: 0.98 }
                      }
                      animate={
                        prefersReducedMotion
                          ? {}
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      transition={
                        prefersReducedMotion
                          ? {}
                          : {
                              duration: 0.35,
                              ease: EASE,
                              delay: index * 0.06,
                            }
                      }
                      whileHover={{
                        boxShadow:
                          '0 12px 40px rgba(28,26,23,0.20)',
                      }}
                    >
                      <div style={{ position: 'absolute', inset: 0 }}>
                        {hotel.image_url ? (
                          <motion.div
                            style={{ position: 'absolute', inset: 0 }}
                            whileHover={{ scale: 1.04 }}
                            transition={{
                              duration: 0.4,
                              ease: [0.4, 0, 0.2, 1] as const,
                            }}
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
                                fontSize: '32px',
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
                              'linear-gradient(to top, rgba(10,8,6,0.88) 0%, rgba(10,8,6,0.35) 50%, transparent 100%)',
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
                              fontSize: '16px',
                              fontWeight: 500,
                              lineHeight: 1.2,
                              color: 'white',
                            }}
                          >
                            {hotel.name}
                          </p>
                          <p
                            style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '10px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              color: 'rgba(255,255,255,0.55)',
                              marginTop: '3px',
                            }}
                          >
                            {hotel.city}
                            {hotel.country ? `, ${hotel.country}` : ''}
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
                              onClick={(
                                e: React.MouseEvent<HTMLAnchorElement>,
                              ) => e.stopPropagation()}
                            >
                              Book now →
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

          {/* SECTION C — Featured Places */}
          {regions.length > 0 && featuredPlaces.length > 0 && (
            <motion.div {...anim(0.18)}>
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'var(--gold)',
                  marginBottom: '14px',
                }}
              >
                FEATURED PLACES
              </p>

              <div
                className="grid grid-cols-3"
                style={{ gap: '10px' }}
              >
                {featuredPlaces.map((place: FeaturedPlace) => (
                  <div
                    key={place.id}
                    style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      aspectRatio: '4/3',
                      background: 'var(--surface-raised)',
                      cursor: 'pointer',
                    }}
                  >
                    {place.image_url ? (
                      <Image
                        src={place.image_url}
                        alt={place.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 20vw"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            UNSPLASH_FALLBACK;
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'linear-gradient(145deg, #EDE8E1, #D8CFC4)',
                        }}
                      />
                    )}

                    {/* Gradient */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to top, rgba(10,8,6,0.75) 0%, transparent 60%)',
                      }}
                    />

                    {/* Rating badge */}
                    {place.rating != null && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(255,255,255,0.15)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          borderRadius: '999px',
                          padding: '3px 8px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'white',
                        }}
                      >
                        ★ {place.rating}
                      </div>
                    )}

                    {/* Content */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '10px',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'white',
                        }}
                      >
                        {place.name}
                      </p>
                      {place.category && (
                        <p
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.6)',
                            textTransform: 'capitalize',
                            marginTop: '2px',
                          }}
                        >
                          {place.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MOBILE — right panel widgets (shown only on mobile) */}
          <div
            className="flex flex-col gap-4 lg:hidden"
            style={{ paddingBottom: '120px' }}
          >
            {BookingRefWidget}
            {ExploreWidget}
            {MiniMapWidget}
          </div>
        </main>

        {/* ─── RIGHT PANEL (desktop only) ─── */}
        <aside
          className="hidden lg:flex"
          style={{
            flexDirection: 'column',
            gap: '20px',
            padding: '28px 20px',
            borderLeft: '1px solid var(--border)',
            background: 'white',
            position: 'sticky',
            top: '64px',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          {BookingRefWidget}
          {ExploreWidget}
          {MiniMapWidget}
        </aside>
      </div>
    </div>
  );
}
