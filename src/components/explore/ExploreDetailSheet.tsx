'use client';

import { useEffect, useRef } from 'react';
import type { ExploreItem } from './ExploreCard';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';
import type { DrillPlaceCard, DrillEventCard } from '@/types/explore';

interface ExploreDetailSheetProps {
  item: ExploreItem | DrillPlaceCard | DrillEventCard | null;
  contentType: 'places' | 'events' | 'properties' | 'regions' | null;
  onClose: () => void;
}

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

/* Reusable inline label + value row — no emojis */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '10px', fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(250,248,245,0.3)',
        flexShrink: 0, minWidth: '52px',
      }}>{label}</span>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        color: 'rgba(250,248,245,0.7)',
        lineHeight: 1.4,
      }}>{value}</span>
    </div>
  );
}

export default function ExploreDetailSheet({ item, contentType, onClose }: ExploreDetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

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

  const isRegion   = contentType === 'regions';
  const isEvent    = contentType === 'events';
  const isProperty = contentType === 'properties';
  const isPlace    = contentType === 'places';

  const place    = isPlace    ? (item as DiscoveryPlaceCard)   : null;
  const event    = isEvent    ? (item as DiscoveryEventCard)   : null;
  const property = isProperty ? (item as ExplorePropertyCard) : null;
  const region   = isRegion   ? (item as RegionOption)        : null;

  const imageUrl     = (isPlace || isEvent || isProperty) && item ? (item as DiscoveryPlaceCard).image_url : null;
  const itemName     = item ? item.name : '';
  const itemCategory = isPlace && item ? (item as DiscoveryPlaceCard).category : null;

  const priceDisplay = event
    ? formatPrice(event.price_min, event.price_max, event.currency)
    : property
    ? (property.price_from != null
        ? `From ${property.currency === 'SGD' ? 'S$' : (property.currency ?? '$')}${property.price_from}`
        : null)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(8,5,2,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: item ? 1 : 0,
          pointerEvents: item ? 'auto' : 'none',
          transition: 'opacity 280ms ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={itemName || 'Detail'}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          background: 'rgba(18,14,10,0.96)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(250,248,245,0.1)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '85dvh',
          overflowY: 'auto',
          transform: item ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
          <div style={{
            width: '36px', height: '3px',
            borderRadius: '2px',
            background: 'rgba(250,248,245,0.15)',
          }} />
        </div>

        {item && (
          <div style={{ padding: '4px 24px 40px' }}>

            {/* Region */}
            {region && (
              <div style={{ paddingTop: '12px', textAlign: 'center' }}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px', fontWeight: 600,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'rgba(250,248,245,0.3)',
                  margin: '0 0 10px',
                }}>Destination</p>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '32px', fontWeight: 500,
                  color: '#FAF8F5',
                  margin: '0 0 4px', lineHeight: 1.1,
                }}>{region.name}</h3>
                {region.country_code && (
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    color: 'rgba(250,248,245,0.4)',
                    margin: 0,
                  }}>{region.country_code}</p>
                )}
                {region.image_url && (
                  <div style={{
                    width: '100%', height: '160px',
                    borderRadius: '16px', overflow: 'hidden',
                    marginTop: '20px',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={region.image_url} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                )}
                <button
                  onClick={onClose}
                  style={{
                    marginTop: '24px',
                    padding: '10px 24px',
                    border: '1px solid rgba(250,248,245,0.15)',
                    borderRadius: '12px',
                    background: 'none',
                    color: 'rgba(250,248,245,0.5)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'border-color 160ms ease, color 160ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(193,127,58,0.5)'; e.currentTarget.style.color = '#FAF8F5'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(250,248,245,0.15)'; e.currentTarget.style.color = 'rgba(250,248,245,0.5)'; }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Place / Event / Property */}
            {!region && (
              <>
                {/* Hero image */}
                {imageUrl && (
                  <div style={{
                    width: '100%', height: '200px',
                    borderRadius: '16px', overflow: 'hidden',
                    marginBottom: '20px',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                )}

                {/* Category eyebrow */}
                {itemCategory && (
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '10px', fontWeight: 600,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: '#C17F3A',
                    margin: '0 0 6px',
                  }}>{itemCategory}</p>
                )}

                {/* Name */}
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '26px', fontWeight: 500,
                  color: '#FAF8F5',
                  margin: '0 0 16px', lineHeight: 1.15,
                }}>{itemName}</h3>

                {/* Detail rows — label/value, no emojis */}
                <div style={{ marginBottom: '16px' }}>
                  {event && (
                    <>
                      {event.start_date && (
                        <DetailRow
                          label="Date"
                          value={`${formatDate(event.start_date)}${event.start_time ? ` · ${event.start_time}` : ''}`}
                        />
                      )}
                      {event.venue_name && <DetailRow label="Venue" value={event.venue_name} />}
                      {priceDisplay && <DetailRow label="Price" value={priceDisplay} />}
                    </>
                  )}
                  {property && (
                    <>
                      {property.star_rating && (
                        <DetailRow label="Rating" value={'★'.repeat(property.star_rating)} />
                      )}
                      {property.city && <DetailRow label="Location" value={property.city} />}
                      {priceDisplay && <DetailRow label="From" value={priceDisplay} />}
                    </>
                  )}
                  {place && (
                    <>
                      {place.rating && <DetailRow label="Rating" value={`${place.rating.toFixed(1)} / 5`} />}
                      {place.price_level && <DetailRow label="Price" value={'$'.repeat(place.price_level)} />}
                    </>
                  )}
                </div>

                {/* Editorial description */}
                {(place?.editorial_summary || place?.description ||
                  event?.editorial_summary || event?.description ||
                  property?.editorial_summary) && (
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px', lineHeight: 1.7,
                    color: 'rgba(250,248,245,0.6)',
                    margin: '0 0 20px',
                  }}>
                    {place?.editorial_summary || place?.description ||
                     event?.editorial_summary || event?.description ||
                     property?.editorial_summary}
                  </p>
                )}

                {/* Vibe tags */}
                {place?.vibes && place.vibes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                    {place.vibes.map((v) => (
                      <span
                        key={v}
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          color: 'rgba(250,248,245,0.5)',
                          border: '1px solid rgba(250,248,245,0.14)',
                          borderRadius: '20px',
                          padding: '3px 12px',
                          letterSpacing: '0.04em',
                        }}
                      >{v}</span>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {event?.ticket_url && (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, minWidth: '140px',
                        background: '#C17F3A',
                        color: '#FAF8F5',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13px', fontWeight: 600,
                        letterSpacing: '0.05em',
                        padding: '13px 20px',
                        borderRadius: '13px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(193,127,58,0.28)',
                        display: 'block',
                      }}
                    >
                      Reserve your place
                    </a>
                  )}
                  {property?.booking_url && (
                    <a
                      href={property.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, minWidth: '140px',
                        background: '#C17F3A',
                        color: '#FAF8F5',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13px', fontWeight: 600,
                        letterSpacing: '0.05em',
                        padding: '13px 20px',
                        borderRadius: '13px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(193,127,58,0.28)',
                        display: 'block',
                      }}
                    >
                      Enquire & book
                    </a>
                  )}
                  {place?.booking_url && (
                    <a
                      href={place.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, minWidth: '140px',
                        background: '#C17F3A',
                        color: '#FAF8F5',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13px', fontWeight: 600,
                        letterSpacing: '0.05em',
                        padding: '13px 20px',
                        borderRadius: '13px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(193,127,58,0.28)',
                        display: 'block',
                      }}
                    >
                      Reserve
                    </a>
                  )}
                  <button
                    onClick={onClose}
                    style={{
                      padding: '13px 20px',
                      border: '1px solid rgba(250,248,245,0.14)',
                      borderRadius: '13px',
                      background: 'none',
                      color: 'rgba(250,248,245,0.45)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'border-color 160ms ease, color 160ms ease',
                      letterSpacing: '0.03em',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(193,127,58,0.4)'; e.currentTarget.style.color = '#FAF8F5'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(250,248,245,0.14)'; e.currentTarget.style.color = 'rgba(250,248,245,0.45)'; }}
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
