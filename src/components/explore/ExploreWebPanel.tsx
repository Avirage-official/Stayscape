'use client';

import { useState } from 'react';
import type { ExploreSection, ExploreItem } from './ExploreCard';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';

interface ExploreWebPanelProps {
  sections: ExploreSection[];
  regions: RegionOption[];
  selectedRegionId: string | null;
  activeIndex: number;
  onSectionChange: (index: number) => void;
  onItemClick: (item: ExploreItem) => void;
  onRegionChange: (regionId: string) => void;
  onPersonalise: () => void;
  isPersonalising: boolean;
}

const NUMERALS = ['I', 'II', 'III', 'IV'] as const;

function sectionShortLabel(id: string) {
  if (id === 'made_for_you') return 'Yours';
  if (id === 'in_your_world') return 'Nearby';
  if (id === 'happening_now') return 'Tonight';
  if (id === 'arias_picks') return 'Aria';
  return id;
}

function listLabel(ct: ExploreSection['content_type']) {
  if (ct === 'events') return 'Upcoming experiences';
  if (ct === 'regions') return 'Where to next';
  if (ct === 'properties') return 'Curated properties';
  return 'Worth your time';
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* Glass surface */
const GLASS: React.CSSProperties = {
  background: 'rgba(250,248,245,0.07)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(250,248,245,0.12)',
  borderRadius: '18px',
};

function ItemRow({
  item,
  contentType,
  onClick,
}: {
  item: ExploreItem;
  contentType: ExploreSection['content_type'];
  onClick: () => void;
}) {
  const isEvent    = contentType === 'events';
  const isRegion   = contentType === 'regions';
  const isProperty = contentType === 'properties';

  const name     = 'name' in item ? item.name : '';
  const imageUrl = 'image_url' in item ? (item as { image_url: string | null }).image_url : null;

  let metaChip: string | null = null;
  let metaText = '';

  if (isEvent) {
    const e = item as DiscoveryEventCard;
    metaChip = formatDate(e.start_date);
    metaText = e.venue_name ?? e.category ?? '';
  } else if (isRegion) {
    metaText = (item as RegionOption).country_code ?? '';
  } else if (isProperty) {
    const p = item as ExplorePropertyCard;
    const stars = p.star_rating ? '★'.repeat(p.star_rating) : null;
    const price  = p.price_from != null
      ? `From ${p.currency === 'SGD' ? 'S$' : (p.currency ?? '$')}${p.price_from}`
      : null;
    metaText = [stars, price].filter(Boolean).join(' · ');
  } else {
    const p = item as DiscoveryPlaceCard;
    metaText = [
      p.rating  ? `★ ${p.rating.toFixed(1)}` : null,
      p.vibes?.[0] ?? null,
    ].filter(Boolean).join(' · ');
  }

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        padding: '9px 10px',
        marginBottom: '5px',
        width: '100%',
        background: 'rgba(250,248,245,0.05)',
        border: '1px solid rgba(250,248,245,0.08)',
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 160ms ease',
        boxSizing: 'border-box',
      } as React.CSSProperties}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.05)'; }}
    >
      <div style={{
        width: '38px', height: '38px',
        borderRadius: '10px',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'rgba(250,248,245,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <span style={{ color: 'rgba(250,248,245,0.35)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
            {isRegion ? ((item as RegionOption).country_code ?? '—') : '·'}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', fontWeight: 500,
          color: '#FAF8F5',
          margin: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
          {metaChip && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px', color: '#C17F3A',
              background: 'rgba(193,127,58,0.15)',
              border: '1px solid rgba(193,127,58,0.25)',
              borderRadius: '20px', padding: '1px 8px',
              whiteSpace: 'nowrap',
            }}>{metaChip}</span>
          )}
          {metaText && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              color: 'rgba(250,248,245,0.38)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{metaText}</span>
          )}
        </div>
      </div>

      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.2)" strokeWidth={2} style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export default function ExploreWebPanel({
  sections,
  regions,
  selectedRegionId,
  activeIndex,
  onSectionChange,
  onItemClick,
  onRegionChange,
  onPersonalise,
  isPersonalising,
}: ExploreWebPanelProps) {
  const active = sections[activeIndex];
  const [ariaQuery, setAriaQuery] = useState('');

  return (
    <div
      className="hidden md:flex flex-col"
      style={{
        width: '340px',
        flexShrink: 0,
        gap: '10px',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
      }}
    >

      {/* Section switcher — compact pill row */}
      <div style={{
        ...GLASS,
        padding: '5px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '3px',
        flexShrink: 0,
      }}>
        {sections.map((s, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={s.id}
              onClick={() => onSectionChange(i)}
              style={{
                background: isActive ? '#C17F3A' : 'transparent',
                border: 'none',
                borderRadius: '13px',
                padding: '9px 4px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                boxShadow: isActive ? '0 2px 10px rgba(193,127,58,0.28)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(250,248,245,0.07)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontSize: '15px', fontWeight: 600,
                color: isActive ? '#FAF8F5' : 'rgba(250,248,245,0.38)',
                lineHeight: 1,
                transition: 'color 200ms ease',
              }}>{NUMERALS[i]}</span>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '8px', letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: isActive ? 'rgba(250,248,245,0.9)' : 'rgba(250,248,245,0.3)',
                transition: 'color 200ms ease',
              }}>{sectionShortLabel(s.id)}</span>
            </button>
          );
        })}
      </div>

      {/* Section headline — tighter padding, editorial feel */}
      <div style={{ ...GLASS, padding: '14px 16px', flexShrink: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#C17F3A', margin: '0 0 4px',
        }}>{active?.label}</p>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontSize: '20px', fontWeight: 500,
          color: '#FAF8F5', margin: '0 0 4px', lineHeight: 1.2,
        }}>{active?.title}</h3>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: 'rgba(250,248,245,0.4)',
          margin: 0, lineHeight: 1.55,
        }}>{active?.subtitle}</p>
      </div>

      {/* Items — generous padding, editorial subheader */}
      <div style={{
        ...GLASS,
        padding: '14px 16px',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {/* Editorial subheader — label + subtle count */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexShrink: 0,
          marginBottom: '10px',
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(250,248,245,0.38)', margin: 0,
          }}>{active ? listLabel(active.content_type) : ''}</p>
          {(active?.items.length ?? 0) > 0 && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px',
              color: 'rgba(250,248,245,0.22)',
              letterSpacing: '0.04em',
            }}>{active.items.length} curated</span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {active?.items.length === 0 && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'rgba(250,248,245,0.22)',
              textAlign: 'center',
              padding: '28px 0', margin: 0,
            }}>
              {active.content_type === 'events' ? 'Nothing on just yet.' : 'More coming soon.'}
            </p>
          )}
          {active?.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              contentType={active.content_type}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      </div>

      {/* Region selector */}
      {regions.length > 1 && (
        <div style={{ ...GLASS, padding: '12px 14px', flexShrink: 0 }}>
          <label style={{
            display: 'block',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(250,248,245,0.35)', marginBottom: '7px',
          }}>Destination</label>
          <select
            value={selectedRegionId ?? ''}
            onChange={(e) => onRegionChange(e.target.value)}
            aria-label="Change destination"
            style={{
              width: '100%', height: '38px', padding: '0 12px',
              borderRadius: '10px',
              background: 'rgba(250,248,245,0.07)',
              border: '1px solid rgba(193,127,58,0.28)',
              color: '#FAF8F5',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              outline: 'none', cursor: 'pointer', appearance: 'none',
              boxSizing: 'border-box',
            }}
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id} style={{ background: '#1a1208', color: '#FAF8F5' }}>
                {r.name}{r.country_code ? ` · ${r.country_code}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Your concierge — Aria prompt */}
      <div style={{ ...GLASS, padding: '12px 14px', flexShrink: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(250,248,245,0.35)',
          margin: '0 0 9px',
        }}>Your concierge</p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(250,248,245,0.05)',
          border: '1px solid rgba(193,127,58,0.28)',
          borderRadius: '12px',
          padding: '0 6px 0 14px',
          height: '42px',
        }}>
          <input
            type="text"
            value={ariaQuery}
            onChange={e => setAriaQuery(e.target.value)}
            placeholder="Ask anything about your stay…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#FAF8F5',
              caretColor: '#C17F3A',
            }}
          />
          <button
            style={{
              width: '30px', height: '30px',
              borderRadius: '9px',
              background: '#C17F3A',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 160ms ease',
              boxShadow: '0 2px 8px rgba(193,127,58,0.28)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#D6A252'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Curation refresh */}
      <div style={{ ...GLASS, padding: '10px', flexShrink: 0 }}>
        <button
          onClick={onPersonalise}
          disabled={isPersonalising}
          style={{
            width: '100%', height: '42px',
            borderRadius: '13px',
            background: '#C17F3A',
            color: '#FAF8F5',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', fontWeight: 600, letterSpacing: '0.07em',
            border: 'none',
            cursor: isPersonalising ? 'not-allowed' : 'pointer',
            opacity: isPersonalising ? 0.55 : 1,
            transition: 'background 180ms ease, opacity 180ms ease',
            boxShadow: '0 4px 14px rgba(193,127,58,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
          onMouseEnter={e => { if (!isPersonalising) e.currentTarget.style.background = '#D6A252'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A'; }}
        >
          {isPersonalising ? (
            <>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              </svg>
              Refreshing your curation…
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh my curation
            </>
          )}
        </button>
      </div>

    </div>
  );
}
