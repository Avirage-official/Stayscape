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
const FALLBACK_ACCENT = '#C17F3A';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-SG', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
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
  const [itineraryPulse, setItineraryPulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // two-phase mount: insert into DOM first, then trigger CSS transition
  useEffect(() => {
    if (item) {
      setSaved(false);
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 240);
      return () => clearTimeout(t);
    }
  }, [item]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = item ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  if (!mounted || !item) return null;

  const isEvent    = contentType === 'events';
  const isProperty = contentType === 'properties';
  const isPlace    = contentType === 'places';
  const isRegion   = contentType === 'regions';

  const place    = isPlace    ? (item as DrillPlaceCard & DiscoveryPlaceCard)   : null;
  const event    = isEvent    ? (item as DrillEventCard & DiscoveryEventCard)   : null;
  const property = isProperty ? (item as ExplorePropertyCard)                  : null;
  const region   = isRegion   ? (item as RegionOption)                         : null;

  const imageUrl  = (item as DrillPlaceCard).image_url ?? null;
  const itemName  = item.name ?? '';
  const rawCat    = (item as DrillPlaceCard).category ?? '';
  const accentFg  = CAT_COLOR[rawCat.toLowerCase()] ?? FALLBACK_ACCENT;

  const priceDisplay = event
    ? formatPrice(event.price_min, event.price_max, event.currency)
    : property
    ? (property.price_from != null ? `From ${property.currency === 'SGD' ? 'S$' : (property.currency ?? '$')}${property.price_from}` : null)
    : place
    ? priceDots(place.price_level)
    : null;

  const rating = place?.rating ?? (property?.star_rating ? property.star_rating : null);
  const summary = place?.editorial_summary ?? (place as DiscoveryPlaceCard | null)?.description
    ?? event?.editorial_summary ?? (event as DiscoveryEventCard | null)?.description
    ?? property?.editorial_summary ?? null;
  const vibes = place?.vibes ?? null;
  const bookingUrl = place?.booking_url ?? event?.ticket_url ?? property?.booking_url ?? null;
  const address = place?.address ?? event?.address ?? null;
  const venueName = event?.venue_name ?? null;

  function handleSave() {
    setSaved(s => !s);
  }

  function handleItinerary() {
    if (!item) return;
    setItineraryPulse(true);
    setTimeout(() => setItineraryPulse(false), 600);
    onAddToItinerary?.(item);
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  // Card animation state
  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    pointerEvents: visible ? 'auto' : 'none',
  };

  const innerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '88dvh',
    borderRadius: '24px',
    overflow: 'hidden',
    background: 'rgba(14,11,8,0.97)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    boxShadow: `0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(250,248,245,0.07), 0 0 40px ${accentFg}18`,
    display: 'flex',
    flexDirection: 'column',
    // spring expand animation
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(16px)',
    transition: visible
      ? 'opacity 360ms cubic-bezier(0.16,1,0.3,1), transform 360ms cubic-bezier(0.16,1,0.3,1)'
      : 'opacity 200ms ease-in, transform 200ms ease-in',
    // top accent border
    borderTop: `2px solid ${accentFg}`,
  };

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 49,
    background: 'rgba(6,4,2,0.72)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    opacity: visible ? 1 : 0,
    transition: 'opacity 300ms ease',
    cursor: 'pointer',
  };

  return (
    <>
      {/* Backdrop */}
      <div style={backdropStyle} onClick={handleClose} aria-hidden="true" />

      {/* Card */}
      <div style={cardStyle} role="dialog" aria-modal="true" aria-label={itemName}>
        <div style={innerStyle}>

          {/* Close button — top right, always visible */}
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: '14px', right: '14px', zIndex: 20,
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(10,8,6,0.62)', backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(250,248,245,0.14)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 160ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,8,6,0.62)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.7)" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable content */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>

            {/* ── Hero image ── */}
            {imageUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '240px', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl} alt={itemName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  loading="eager"
                />
                {/* gradient bleed into content */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to top, rgba(14,11,8,0.97) 0%, transparent 100%)', pointerEvents: 'none' }} />
                {/* category pill top-left */}
                <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: accentFg, boxShadow: `0 0 8px ${accentFg}` }} />
                  {rawCat && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FAF8F5', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '20px', padding: '3px 9px' }}>{rawCat.replace(/_/g, ' ')}</span>
                  )}
                </div>
              </div>
            ) : (
              // No image — gradient hero block
              <div style={{ position: 'relative', width: '100%', height: '160px', flexShrink: 0, background: `linear-gradient(135deg, ${accentFg}55 0%, rgba(14,11,8,0.8) 100%)`, display: 'flex', alignItems: 'flex-end', padding: '0 0 0 0' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(14,11,8,0.97) 0%, transparent 100%)' }} />
                <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: accentFg, boxShadow: `0 0 8px ${accentFg}` }} />
                  {rawCat && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FAF8F5', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '20px', padding: '3px 9px' }}>{rawCat.replace(/_/g, ' ')}</span>
                  )}
                </div>
              </div>
            )}

            {/* ── Content well ── */}
            <div style={{ padding: '4px 22px 100px' }}>

              {/* Name */}
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '28px', fontWeight: 500, color: '#FAF8F5', margin: '0 0 10px', lineHeight: 1.1, letterSpacing: '-0.01em' }}>{itemName}</h2>

              {/* Rating + price chips inline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {rating && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, color: '#0A0806', background: accentFg, borderRadius: '6px', padding: '3px 8px', lineHeight: 1.5 }}>★ {typeof rating === 'number' ? rating.toFixed(1) : '★'.repeat(rating as number)}</span>
                )}
                {priceDisplay && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(250,248,245,0.6)', background: 'rgba(250,248,245,0.08)', borderRadius: '6px', padding: '3px 8px', lineHeight: 1.5 }}>{priceDisplay}</span>
                )}
                {event?.is_featured && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentFg, background: `${accentFg}18`, borderRadius: '6px', padding: '3px 8px' }}>Featured</span>
                )}
              </div>

              {/* Vibe tags */}
              {vibes && vibes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                  {vibes.map((v, i) => (
                    <span key={v} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: i === 0 ? accentFg : 'rgba(250,248,245,0.45)', border: `1px solid ${i === 0 ? accentFg + '55' : 'rgba(250,248,245,0.12)'}`, borderRadius: '20px', padding: '3px 11px', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{v}</span>
                  ))}
                </div>
              )}

              {/* Event date + venue */}
              {event && (
                <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {event.start_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" /></svg>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.65)' }}>{formatDate(event.start_date)}{event.start_time ? ` · ${event.start_time}` : ''}</span>
                    </div>
                  )}
                  {venueName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.65)' }}>{venueName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Place address */}
              {!event && address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentFg} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: '2px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.55)', lineHeight: 1.4 }}>{address}</span>
                </div>
              )}

              {/* Divider */}
              {summary && <div style={{ height: '1px', background: 'rgba(250,248,245,0.07)', margin: '2px 0 14px' }} />}

              {/* Editorial summary */}
              {summary && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', lineHeight: 1.75, color: 'rgba(250,248,245,0.58)', margin: '0' }}>{summary}</p>
              )}

              {/* Region fallback */}
              {region && (
                <div style={{ paddingTop: '8px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.3)', margin: '0 0 10px' }}>Destination</p>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '32px', fontWeight: 500, color: '#FAF8F5', margin: '0 0 4px', lineHeight: 1.1 }}>{region.name}</h3>
                  {region.country_code && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(250,248,245,0.4)', margin: 0 }}>{region.country_code}</p>}
                  {region.image_url && (
                    <div style={{ width: '100%', height: '140px', borderRadius: '14px', overflow: 'hidden', marginTop: '18px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={region.image_url} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Sticky CTA strip ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 18px 18px',
            background: 'linear-gradient(to top, rgba(14,11,8,1) 70%, rgba(14,11,8,0) 100%)',
            display: 'flex', gap: '9px',
          }}>
            {/* Save button */}
            <button
              onClick={handleSave}
              aria-label={saved ? 'Unsave' : 'Save'}
              style={{
                width: '46px', height: '46px', flexShrink: 0,
                borderRadius: '13px',
                border: `1px solid ${saved ? accentFg + '80' : 'rgba(250,248,245,0.14)'}`,
                background: saved ? `${accentFg}18` : 'rgba(250,248,245,0.05)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 200ms ease, border-color 200ms ease, transform 120ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? accentFg : 'none'} stroke={saved ? accentFg : 'rgba(250,248,245,0.55)'} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>

            {/* Primary CTA — Add to Itinerary or Get Tickets */}
            {event?.ticket_url ? (
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, height: '46px',
                  background: accentFg,
                  borderRadius: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  textDecoration: 'none',
                  boxShadow: `0 4px 20px ${accentFg}44`,
                  transition: 'opacity 160ms ease, transform 120ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#0A0806', letterSpacing: '0.04em' }}>Get Tickets</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0806" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
              </a>
            ) : (
              <button
                onClick={handleItinerary}
                style={{
                  flex: 1, height: '46px',
                  background: itineraryPulse ? `${accentFg}dd` : accentFg,
                  borderRadius: '13px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  boxShadow: `0 4px 20px ${accentFg}44`,
                  transition: 'background 160ms ease, transform 120ms ease',
                  transform: itineraryPulse ? 'scale(0.97)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (!itineraryPulse) e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A0806" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, color: '#0A0806', letterSpacing: '0.04em' }}>
                  {itineraryPulse ? 'Added ✓' : 'Add to Itinerary'}
                </span>
              </button>
            )}

            {/* Booking link if available (places/properties) */}
            {!event && bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '46px', height: '46px', flexShrink: 0,
                  borderRadius: '13px',
                  border: '1px solid rgba(250,248,245,0.14)',
                  background: 'rgba(250,248,245,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 160ms ease, transform 120ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.12)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                aria-label="Open booking link"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.55)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
              </a>
            )}
          </div>

        </div>
      </div>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
