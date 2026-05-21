'use client';

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
  if (id === 'made_for_you') return 'For You';
  if (id === 'in_your_world') return 'World';
  if (id === 'happening_now') return 'Now';
  if (id === 'arias_picks') return "Aria's";
  return id;
}

function listLabel(ct: ExploreSection['content_type']) {
  if (ct === 'events') return 'Coming up';
  if (ct === 'regions') return 'Destinations';
  if (ct === 'properties') return 'Stays';
  return 'Top picks';
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* Shared card surface — cream white, warm border */
const CARD: React.CSSProperties = {
  background: '#FAF8F5',
  border: '1px solid rgba(193,127,58,0.14)',
  borderRadius: '16px',
  padding: '16px',
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
  const imageUrl = 'image_url' in item ? (item as DiscoveryPlaceCard).image_url : null;

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
        gap: '12px',
        padding: '10px 8px',
        margin: '0 -8px',
        width: 'calc(100% + 16px)',
        background: 'transparent',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 160ms ease',
        boxSizing: 'border-box',
      } as React.CSSProperties}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,127,58,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '40px', height: '40px',
        borderRadius: '10px',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'rgba(44,26,8,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <span style={{ color: 'rgba(44,26,8,0.3)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
            {isRegion ? ((item as RegionOption).country_code ?? '—') : '·'}
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', fontWeight: 500,
          color: '#2C1A08',
          margin: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
          {metaChip && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px', color: '#C17F3A',
              background: 'rgba(193,127,58,0.1)',
              border: '1px solid rgba(193,127,58,0.22)',
              borderRadius: '20px', padding: '1px 8px',
              whiteSpace: 'nowrap',
            }}>{metaChip}</span>
          )}
          {metaText && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              color: 'rgba(44,26,8,0.45)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{metaText}</span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(44,26,8,0.2)" strokeWidth={2} style={{ flexShrink: 0 }}>
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

      {/* Card 1 — Section switcher */}
      <div style={{ ...CARD, flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {sections.map((s, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={s.id}
                onClick={() => onSectionChange(i)}
                style={{
                  background: isActive ? '#C17F3A' : 'rgba(44,26,8,0.05)',
                  border: `1px solid ${isActive ? '#C17F3A' : 'rgba(193,127,58,0.18)'}`,
                  borderRadius: '10px',
                  padding: '10px 4px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(193,127,58,0.1)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(44,26,8,0.05)';
                }}
              >
                <span style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic', fontSize: '16px', fontWeight: 600,
                  color: isActive ? '#FAF8F5' : 'rgba(44,26,8,0.4)',
                  lineHeight: 1,
                  transition: 'color 200ms ease',
                }}>{NUMERALS[i]}</span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '9px', letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isActive ? 'rgba(250,248,245,0.85)' : 'rgba(44,26,8,0.35)',
                  transition: 'color 200ms ease',
                }}>{sectionShortLabel(s.id)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card 2 — Section headline */}
      <div style={{ ...CARD, flexShrink: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#C17F3A', margin: '0 0 5px',
        }}>{active?.label}</p>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontSize: '21px', fontWeight: 500,
          color: '#2C1A08', margin: '0 0 5px', lineHeight: 1.2,
        }}>{active?.title}</h3>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: 'rgba(44,26,8,0.45)',
          margin: 0, lineHeight: 1.5,
        }}>{active?.subtitle}</p>
      </div>

      {/* Card 3 — Items */}
      <div style={{ ...CARD, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(44,26,8,0.3)', margin: '0 0 4px', flexShrink: 0,
        }}>{active ? listLabel(active.content_type) : ''}</p>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {active?.items.length === 0 && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              color: 'rgba(44,26,8,0.25)', textAlign: 'center',
              padding: '28px 0', margin: 0,
            }}>
              {active.content_type === 'events' ? 'No upcoming events yet.' : 'More coming soon.'}
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

      {/* Card 4 — Actions */}
      <div style={{ ...CARD, flexShrink: 0, marginTop: 'auto' }}>
        {regions.length > 1 && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{
              display: 'block',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(44,26,8,0.35)', marginBottom: '7px',
            }}>Region</label>
            <select
              value={selectedRegionId ?? ''}
              onChange={(e) => onRegionChange(e.target.value)}
              aria-label="Change region"
              style={{
                width: '100%', height: '40px', padding: '0 12px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid rgba(193,127,58,0.28)',
                color: '#2C1A08',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                outline: 'none', cursor: 'pointer', appearance: 'none',
                boxSizing: 'border-box',
              }}
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.country_code ? ` · ${r.country_code}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onPersonalise}
          disabled={isPersonalising}
          style={{
            width: '100%', height: '44px',
            borderRadius: '12px',
            background: '#C17F3A',
            color: '#FAF8F5',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', fontWeight: 600, letterSpacing: '0.07em',
            border: 'none',
            cursor: isPersonalising ? 'not-allowed' : 'pointer',
            opacity: isPersonalising ? 0.55 : 1,
            transition: 'background 180ms ease, opacity 180ms ease',
            boxShadow: '0 4px 14px rgba(193,127,58,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
          onMouseEnter={e => { if (!isPersonalising) e.currentTarget.style.background = '#D6A252'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A'; }}
        >
          {isPersonalising ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              </svg>
              Personalising…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
              Personalise for me
            </>
          )}
        </button>
      </div>
    </div>
  );
}
