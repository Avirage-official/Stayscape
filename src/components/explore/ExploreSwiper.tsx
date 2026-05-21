'use client';

import { useRef, useState, useCallback } from 'react';
import ExploreCard, { type ExploreSection, type ExploreItem } from './ExploreCard';
import ExploreDetailSheet from './ExploreDetailSheet';
import ExploreWebPanel from './ExploreWebPanel';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';

interface ExploreSwiperProps {
  sections: ExploreSection[];
  regions: RegionOption[];
  selectedRegionId: string | null;
  firstName: string | null;
  onRegionChange: (regionId: string) => void;
  onPersonalise: () => void;
  isPersonalising: boolean;
  isRefreshing?: boolean;
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

function mobileItemMeta(item: ExploreItem, ct: ExploreSection['content_type']): string {
  if (ct === 'events') {
    const e = item as DiscoveryEventCard;
    const date = e.start_date
      ? new Date(e.start_date).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })
      : null;
    return [date, e.venue_name].filter(Boolean).join(' · ');
  }
  if (ct === 'regions') return (item as RegionOption).country_code ?? '';
  if (ct === 'properties') {
    const p = item as ExplorePropertyCard;
    const stars = p.star_rating ? '★'.repeat(p.star_rating) : null;
    const price = p.price_from != null ? `S$${p.price_from}` : null;
    return [stars, price].filter(Boolean).join(' · ');
  }
  const p = item as DiscoveryPlaceCard;
  const rating = p.rating ? `★ ${p.rating.toFixed(1)}` : null;
  const vibe = p.vibes?.[0] ?? null;
  return [rating, vibe].filter(Boolean).join(' · ');
}

export default function ExploreSwiper({
  sections,
  regions,
  selectedRegionId,
  firstName,
  onRegionChange,
  onPersonalise,
  isPersonalising,
  isRefreshing,
}: ExploreSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(sections.length - 1, index)));
    },
    [sections.length],
  );

  function handlePointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX;
    isDragging.current = false;
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (pointerStartX.current !== null && Math.abs(e.clientX - pointerStartX.current) > 6) {
      isDragging.current = true;
    }
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (pointerStartX.current === null) return;
    const delta = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (!isDragging.current) return;
    if (delta < -50) goTo(activeIndex + 1);
    else if (delta > 50) goTo(activeIndex - 1);
  }

  const active = sections[activeIndex];
  const greeting = firstName ? `for ${firstName}` : 'for you';

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{
        height: 'calc(100dvh - 68px)',
        background: '#EDE8E1',
        padding: '12px',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Hero card — full height on desktop, fixed height on mobile ── */}
      <div
        className="flex-shrink-0 md:flex-1 h-[44dvh] md:h-full"
        style={{
          position: 'relative',
          userSelect: 'none',
          borderRadius: '20px',
          overflow: 'hidden',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* key forces a full remount → triggers ExploreCard's fade-in animation */}
        <ExploreCard
          key={active.id}
          section={active}
          sections={sections}
          activeIndex={activeIndex}
          onSectionChange={goTo}
        />

        {/* Region-change overlay — keeps current content visible while fetching */}
        {isRefreshing && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 25,
              background: 'rgba(8,5,2,0.38)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              animation: 'ecFadeIn 200ms ease both',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#C17F3A',
              boxShadow: '0 0 16px rgba(193,127,58,0.7)',
              animation: 'ecPulse 1.1s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* Greeting — top-left */}
        <p style={{
          position: 'absolute', top: '16px', left: '20px',
          zIndex: 20,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(250,248,245,0.45)',
          margin: 0,
          pointerEvents: 'none',
        }}>
          Explore {greeting}
        </p>
      </div>

      {/* ── Mobile-only: section switcher + items ── */}
      <div
        className="flex flex-col md:hidden"
        style={{ flex: 1, minHeight: 0, gap: '10px', overflow: 'hidden' }}
      >
        {/* Section pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {sections.map((s, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                style={{
                  flex: 1,
                  background: isActive ? '#C17F3A' : '#FAF8F5',
                  border: `1px solid ${isActive ? '#C17F3A' : 'rgba(193,127,58,0.18)'}`,
                  borderRadius: '12px',
                  padding: '9px 4px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '15px', fontWeight: 600,
                  color: isActive ? '#FAF8F5' : 'rgba(44,26,8,0.4)',
                  lineHeight: 1,
                }}>{NUMERALS[i]}</span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '9px',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: isActive ? 'rgba(250,248,245,0.85)' : 'rgba(44,26,8,0.35)',
                }}>{sectionShortLabel(s.id)}</span>
              </button>
            );
          })}
        </div>

        {/* Items container */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: '#FAF8F5',
            border: '1px solid rgba(193,127,58,0.14)',
            borderRadius: '18px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(44,26,8,0.3)',
            margin: '0 0 8px',
            flexShrink: 0,
          }}>{active ? listLabel(active.content_type) : ''}</p>

          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {active?.items.length === 0 && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: 'rgba(44,26,8,0.25)',
                textAlign: 'center',
                padding: '20px 0',
                margin: 0,
              }}>
                {active.content_type === 'events' ? 'No upcoming events yet.' : 'More coming soon.'}
              </p>
            )}
            {active?.items.map((item) => {
              const name = 'name' in item ? item.name : '';
              const imageUrl = 'image_url' in item ? (item as { image_url: string | null }).image_url : null;
              const meta = mobileItemMeta(item, active.content_type);
              const isRegion = active.content_type === 'regions';

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(193,127,58,0.1)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'rgba(44,26,8,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <span style={{ color: 'rgba(44,26,8,0.3)', fontSize: '11px' }}>
                        {isRegion ? ((item as RegionOption).country_code ?? '—') : '·'}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px', fontWeight: 500,
                      color: '#2C1A08',
                      margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{name}</p>
                    {meta && (
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '11px',
                        color: 'rgba(44,26,8,0.45)',
                        margin: '2px 0 0',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{meta}</p>
                    )}
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(44,26,8,0.2)" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Personalise — mobile */}
          <button
            onClick={onPersonalise}
            disabled={isPersonalising}
            style={{
              flexShrink: 0,
              marginTop: '10px',
              width: '100%',
              height: '40px',
              borderRadius: '11px',
              background: '#C17F3A',
              color: '#FAF8F5',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.06em',
              border: 'none',
              cursor: isPersonalising ? 'not-allowed' : 'pointer',
              opacity: isPersonalising ? 0.55 : 1,
              transition: 'opacity 180ms ease',
              boxShadow: '0 4px 12px rgba(193,127,58,0.22)',
            }}
          >
            {isPersonalising ? 'Personalising…' : 'Personalise for me'}
          </button>
        </div>
      </div>

      {/* ── Desktop web panel ── */}
      <ExploreWebPanel
        sections={sections}
        regions={regions}
        selectedRegionId={selectedRegionId}
        activeIndex={activeIndex}
        onSectionChange={goTo}
        onItemClick={(item) => setSelectedItem(item)}
        onRegionChange={onRegionChange}
        onPersonalise={onPersonalise}
        isPersonalising={isPersonalising}
      />

      {/* ── Detail sheet (unchanged) ── */}
      <ExploreDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <style>{`
        @keyframes ecFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ecPulse  { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.5; } }
      `}</style>
    </div>
  );
}
