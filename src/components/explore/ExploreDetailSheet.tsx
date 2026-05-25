'use client';

import { useEffect, useRef, useState } from 'react';
import type { ExploreItem } from './ExploreCard';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';
import type { DrillPlaceCard, DrillEventCard } from '@/types/explore';

interface ExploreDetailSheetProps {
  item: ExploreItem | DrillPlaceCard | DrillEventCard | null;
  contentType: 'places' | 'events' | 'properties' | 'regions' | null;
  onClose: () => void;
  onAddToItinerary?: (item: ExploreItem | DrillPlaceCard | DrillEventCard) => void;
}

const CAT_COLOR: Record<string, string> = {
  dining: '#FF6B35', nightlife: '#7B2FFF', shopping: '#FFD600',
  nature: '#00C853', historical: '#FF8F00', wellness: '#00BCD4',
  family: '#FF4081', events: '#E91E8C', local_spots: '#FFAB00',
  fun_places: '#F50057', top_places: '#2979FF',
};
const CAT_GRADIENT: Record<string, string> = {
  dining:     'linear-gradient(145deg, #7A1E00 0%, #1a0700 100%)',
  nightlife:  'linear-gradient(145deg, #1A0040 0%, #07000f 100%)',
  shopping:   'linear-gradient(145deg, #3D2000 0%, #0f0800 100%)',
  nature:     'linear-gradient(145deg, #001A0A 0%, #000802 100%)',
  historical: 'linear-gradient(145deg, #1A0A00 0%, #080400 100%)',
  wellness:   'linear-gradient(145deg, #001A1F 0%, #000608 100%)',
  family:     'linear-gradient(145deg, #200008 0%, #080002 100%)',
  events:     'linear-gradient(145deg, #1A0010 0%, #080006 100%)',
  local_spots:'linear-gradient(145deg, #1A1000 0%, #060400 100%)',
  fun_places: 'linear-gradient(145deg, #1A0008 0%, #060002 100%)',
  top_places: 'linear-gradient(145deg, #000C20 0%, #000308 100%)',
};
const FALLBACK_ACCENT = '#C17F3A';
const FALLBACK_GRADIENT = 'linear-gradient(145deg, #1a1410 0%, #050402 100%)';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-SG', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatPrice(min?: number | null, max?: number | null, currency?: string | null) {
  if (min == null && max == null) return null;
  const sym = currency === 'SGD' ? 'S$' : (currency ?? '$');
  if (min != null && max != null && min !== max) return `${sym}${min} – ${sym}${max}`;
  return `${sym}${min ?? max}`;
}

function priceDots(level: number | null | undefined): string | null {
  if (!level) return null;
  return '$'.repeat(Math.min(level, 4));
}

export default function ExploreDetailSheet({
  item, contentType, onClose, onAddToItinerary,
}: ExploreDetailSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setSaved(false); setAdded(false);
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [item]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = item ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  if (!mounted || !item) return null;

  const isEvent    = contentType === 'events';
  const isProperty = contentType === 'properties';
  const isPlace    = contentType === 'places';
  const isRegion   = contentType === 'regions';

  const place    = isPlace    ? (item as DrillPlaceCard & DiscoveryPlaceCard)  : null;
  const event    = isEvent    ? (item as DrillEventCard & DiscoveryEventCard)  : null;
  const property = isProperty ? (item as ExplorePropertyCard)                 : null;
  const region   = isRegion   ? (item as RegionOption)                        : null;

  const imageUrl     = (item as DrillPlaceCard).image_url ?? null;
  const itemName     = item.name ?? '';
  const rawCat       = (item as DrillPlaceCard).category ?? '';
  const accentFg     = CAT_COLOR[rawCat.toLowerCase()] ?? FALLBACK_ACCENT;
  const bgGradient   = CAT_GRADIENT[rawCat.toLowerCase()] ?? FALLBACK_GRADIENT;

  const priceDisplay = event
    ? formatPrice(event.price_min, event.price_max, event.currency)
    : property
    ? (property.price_from != null ? `From ${property.currency === 'SGD' ? 'S$' : (property.currency ?? '$')}${property.price_from}` : null)
    : place
    ? priceDots(place.price_level)
    : null;

  const rating   = place?.rating ?? (property?.star_rating ?? null);
  const summary  = place?.editorial_summary ?? (place as DiscoveryPlaceCard | null)?.description
    ?? event?.editorial_summary ?? (event as DiscoveryEventCard | null)?.description
    ?? property?.editorial_summary ?? null;
  const vibes    = place?.vibes ?? null;
  const bookingUrl = place?.booking_url ?? event?.ticket_url ?? property?.booking_url ?? null;
  const address  = place?.address ?? event?.address ?? null;
  const venueName = event?.venue_name ?? null;

  function handleSave() { setSaved(s => !s); }

  function handleItinerary() {
    if (!item || added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    onAddToItinerary?.(item);
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  // ── outer overlay ──
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    opacity: visible ? 1 : 0,
    transition: visible
      ? 'opacity 320ms cubic-bezier(0.16,1,0.3,1)'
      : 'opacity 260ms ease-in',
    pointerEvents: visible ? 'auto' : 'none',
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={itemName}>

      {/* ─────────────────────────────────────────────────────
           FULL-SCREEN IMAGE BACKGROUND — the world
      ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: bgGradient,
          transform: visible ? 'scale(1)' : 'scale(1.04)',
          transition: 'transform 500ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 25%',
            }}
            loading="eager"
          />
        )}

        {/* left veil — keeps left-side text readable */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(4,3,2,0.82) 0%, rgba(4,3,2,0.40) 55%, transparent 100%)',
        }} />
        {/* bottom veil */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(4,3,2,0.95) 0%, rgba(4,3,2,0.4) 40%, transparent 70%)',
        }} />
        {/* top veil */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(4,3,2,0.55) 0%, transparent 18%)',
        }} />
      </div>

      {/* ─────────────────────────────────────────────────────
           FROSTED CLOSE × — top right
      ───────────────────────────────────────────────────── */}
      <button
        onClick={handleClose}
        aria-label="Close"
        style={{
          position: 'absolute', top: '20px', right: '20px', zIndex: 70,
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(8,6,4,0.55)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(250,248,245,0.18)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 160ms ease, transform 160ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.18)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,6,4,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.8)" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* ─────────────────────────────────────────────────────
           FROSTED BOOKMARK — top right (below close)
      ───────────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        aria-label={saved ? 'Unsave' : 'Save'}
        style={{
          position: 'absolute', top: '68px', right: '20px', zIndex: 70,
          width: '38px', height: '38px', borderRadius: '50%',
          background: saved ? `${accentFg}30` : 'rgba(8,6,4,0.55)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${saved ? accentFg + '70' : 'rgba(250,248,245,0.18)'}`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 200ms ease, border-color 200ms ease, transform 160ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24"
          fill={saved ? accentFg : 'none'}
          stroke={saved ? accentFg : 'rgba(250,248,245,0.75)'}
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      </button>

      {/* ─────────────────────────────────────────────────────
           LEFT CONTENT — name massive, floats on image
      ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          // on mobile: bottom half. on desktop: left 55%, vertically centred
          bottom: '120px', left: 0, right: 0,
          zIndex: 65,
          padding: '0 28px',
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: visible
            ? 'transform 500ms 80ms cubic-bezier(0.16,1,0.3,1), opacity 400ms 80ms ease'
            : 'transform 220ms ease-in, opacity 180ms ease-in',
          opacity: visible ? 1 : 0,
          maxWidth: '600px',
        }}
      >
        {/* eyebrow: accent dot + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: accentFg,
            boxShadow: `0 0 10px ${accentFg}, 0 0 20px ${accentFg}55`,
            flexShrink: 0,
          }} />
          {rawCat && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: accentFg,
            }}>{rawCat.replace(/_/g, ' ')}</span>
          )}
          {event?.is_featured && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#FAF8F5',
              background: `${accentFg}28`,
              border: `1px solid ${accentFg}55`,
              borderRadius: '20px',
              padding: '2px 8px',
            }}>Featured</span>
          )}
        </div>

        {/* —— MASSIVE NAME — directly on the image, like BALI/THAILAND —— */}
        <h1 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 'clamp(2.2rem, 7vw, 5rem)',
          fontWeight: 800,
          color: '#FAF8F5',
          margin: '0 0 16px',
          lineHeight: 0.92,
          letterSpacing: '-0.04em',
          textTransform: 'uppercase',
        }}>{itemName}</h1>

        {/* rating chip + price — inline, understated */}
        {(rating != null || priceDisplay) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {rating != null && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px', fontWeight: 700,
                color: '#0A0806',
                background: accentFg,
                borderRadius: '6px',
                padding: '3px 8px',
                lineHeight: 1.5,
              }}>★ {typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            )}
            {priceDisplay && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', fontWeight: 600,
                color: 'rgba(250,248,245,0.55)',
              }}>{priceDisplay}</span>
            )}
          </div>
        )}

        {/* description — floats below, no box, small body text */}
        {summary && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', lineHeight: 1.7,
            color: 'rgba(250,248,245,0.58)',
            margin: '0 0 18px',
            maxWidth: '420px',
          }}>{summary}</p>
        )}

        {/* vibes row */}
        {vibes && vibes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
            {vibes.map((v, i) => (
              <span key={v} style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '10px',
                color: i === 0 ? accentFg : 'rgba(250,248,245,0.38)',
                border: `1px solid ${i === 0 ? accentFg + '50' : 'rgba(250,248,245,0.1)'}`,
                borderRadius: '20px',
                padding: '3px 10px',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>{v}</span>
            ))}
          </div>
        )}

        {/* meta row — address / date+venue with accent icons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
          {address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.5)', lineHeight: 1.4 }}>{address}</span>
            </div>
          )}
          {event?.start_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={2} style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.5)' }}>
                {formatDate(event.start_date)}{event.start_time ? ` · ${event.start_time}` : ''}
              </span>
            </div>
          )}
          {venueName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={2} style={{ flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.5)' }}>{venueName}</span>
            </div>
          )}
          {region && (
            <>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: 800, color: '#FAF8F5', margin: '8px 0 4px', lineHeight: 0.95, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>{region.name}</h3>
              {region.country_code && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.4)', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{region.country_code}</p>}
            </>
          )}
        </div>

        {/* ── CTAs — bottom left, minimal + intentional ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Primary — Add to Itinerary OR Get Tickets */}
          {event?.ticket_url ? (
            <a
              href={event.ticket_url}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: accentFg,
                borderRadius: '40px',
                padding: '12px 24px',
                textDecoration: 'none',
                boxShadow: `0 6px 24px ${accentFg}44`,
                transition: 'opacity 160ms ease, transform 140ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#0A0806', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Get Tickets</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0806" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          ) : (
            <button
              onClick={handleItinerary}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: added ? 'rgba(250,248,245,0.12)' : accentFg,
                border: added ? `1px solid ${accentFg}60` : 'none',
                borderRadius: '40px',
                padding: '12px 24px',
                cursor: 'pointer',
                boxShadow: added ? 'none' : `0 6px 24px ${accentFg}44`,
                transition: 'background 200ms ease, box-shadow 200ms ease, transform 140ms ease',
                transform: 'translateX(0)',
              }}
              onMouseEnter={e => { if (!added) e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              {added
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0806" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
              }
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', fontWeight: 700,
                color: added ? accentFg : '#0A0806',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>{added ? 'Added' : 'Add to Itinerary'}</span>
            </button>
          )}

          {/* Booking link — secondary ghost pill */}
          {!event && bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: 'rgba(250,248,245,0.08)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(250,248,245,0.16)',
                borderRadius: '40px',
                padding: '12px 20px',
                textDecoration: 'none',
                transition: 'background 160ms ease, transform 140ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.15)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.08)'; e.currentTarget.style.transform = 'translateX(0)'; }}
              aria-label="Open booking"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.65)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: 'rgba(250,248,245,0.65)', letterSpacing: '0.04em' }}>Book</span>
            </a>
          )}
        </div>
      </div>

      <style>{`div::-webkit-scrollbar{display:none;}`}</style>
    </div>
  );
}
