'use client';

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { ExploreSection, ExploreItem } from './ExploreCard';
import type { RegionOption } from '@/app/dashboard/explore/page';

export interface ExploreWebPanelProps {
  sections: ExploreSection[];
  regions: RegionOption[];
  activeIndex: number;
  activeRegion: RegionOption | null;
  selectedRegionId: string | null;
  onSectionChange: (index: number) => void;
  onDrillRegion: (region: RegionOption) => void;
  onRegionChange?: (regionId: string) => void;
  onPersonalise: () => void;
  isPersonalising: boolean;
  /** Called when an item card is clicked so the parent can open ExploreDetailSheet */
  onItemClick?: (item: ExploreItem, contentType: ExploreSection['content_type']) => void;
}

export interface ExploreWebPanelHandle {
  triggerCityNudge: () => void;
}

const NUMERALS = ['I', 'II', 'III', 'IV'] as const;

function sectionShortLabel(id: string) {
  if (id === 'made_for_you') return 'Yours';
  if (id === 'in_your_world') return 'Nearby';
  if (id === 'happening_now') return 'Tonight';
  if (id === 'arias_picks') return 'Aria';
  return id;
}

const GLASS: React.CSSProperties = {
  background: 'rgba(250,248,245,0.07)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(250,248,245,0.12)',
  borderRadius: '18px',
};

const ExploreWebPanel = forwardRef<ExploreWebPanelHandle, ExploreWebPanelProps>(function ExploreWebPanel(
  {
    sections,
    regions,
    activeIndex,
    activeRegion,
    selectedRegionId,
    onSectionChange,
    onDrillRegion,
    onRegionChange,
    onPersonalise,
    isPersonalising,
    onItemClick,
  },
  ref,
) {
  const [ariaQuery, setAriaQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState(false);

  const active = sections[activeIndex];
  const isAria   = active?.id === 'arias_picks';
  const isNearby = active?.id === 'in_your_world';
  const showItems = !isAria && !isNearby;

  const currentCity = regions.find(r => r.id === selectedRegionId) ?? null;

  const previewItems: ExploreItem[] = (active?.items ?? []).slice(0, 4);

  const triggerNudge = useCallback(() => {
    setNudge(true);
    setNudgeMsg(true);
    setCityOpen(true);
    setTimeout(() => setNudge(false), 1200);
    setTimeout(() => setNudgeMsg(false), 4000);
  }, []);

  useImperativeHandle(ref, () => ({
    triggerCityNudge: triggerNudge,
  }), [triggerNudge]);

  return (
    <div
      className="hidden md:flex flex-col"
      style={{ width: '300px', flexShrink: 0, gap: '10px', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}
    >

      {/* ── City selector ── */}
      <div
        style={{
          ...GLASS,
          padding: 0,
          flexShrink: 0,
          overflow: 'hidden',
          outline: nudge ? '2px solid rgba(193,127,58,0.85)' : '2px solid transparent',
          transition: 'outline 180ms ease, box-shadow 180ms ease',
          boxShadow: nudge ? '0 0 0 4px rgba(193,127,58,0.18)' : 'none',
          animation: nudge ? 'cityNudge 0.6s ease-in-out 2' : 'none',
        } as React.CSSProperties}
      >
        <button
          onClick={() => setCityOpen(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(193,127,58,0.85)" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.35)', margin: '0 0 2px' }}>Exploring</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '17px', fontWeight: 500, color: currentCity ? '#FAF8F5' : 'rgba(250,248,245,0.32)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentCity?.name ?? 'Select a city'}
            </p>
          </div>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.35)" strokeWidth={2.5} style={{ flexShrink: 0, transition: 'transform 200ms ease', transform: cityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {nudgeMsg && (
          <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C17F3A" strokeWidth={2} style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(193,127,58,0.9)', lineHeight: 1.4 }}>
              Pick a city first — we&apos;ll show you around.
            </span>
          </div>
        )}

        {cityOpen && (
          <div style={{ borderTop: '1px solid rgba(250,248,245,0.08)', maxHeight: '230px', overflowY: 'auto', scrollbarWidth: 'none', padding: '8px 10px 10px' }}>
            {regions.length === 0 ? (
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '14px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', padding: '12px 0', margin: 0 }}>No cities available.</p>
            ) : regions.map(region => {
              const isSel = region.id === selectedRegionId;
              return (
                <button
                  key={region.id}
                  onClick={() => { onRegionChange?.(region.id); setCityOpen(false); setNudgeMsg(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '7px 8px', marginBottom: '3px', width: '100%',
                    background: isSel ? 'rgba(193,127,58,0.14)' : 'transparent',
                    border: `1px solid ${isSel ? 'rgba(193,127,58,0.5)' : 'transparent'}`,
                    borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                    transition: 'background 140ms ease',
                    boxSizing: 'border-box',
                  } as React.CSSProperties}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(250,248,245,0.07)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', overflow: 'hidden', flexShrink: 0, background: 'rgba(250,248,245,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {region.image_url
                      ? <img src={region.image_url} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      : <span style={{ color: 'rgba(250,248,245,0.35)', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}>{region.country_code ?? '—'}</span>}
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: isSel ? 600 : 400, color: isSel ? '#FAF8F5' : 'rgba(250,248,245,0.78)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                    {region.name}
                  </p>
                  {isSel && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(193,127,58,0.9)" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ ...GLASS, padding: '5px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px', flexShrink: 0 }}>
        {sections.map((s, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={s.id}
              onClick={() => onSectionChange(i)}
              style={{
                background: isActive ? '#C17F3A' : 'transparent',
                border: 'none', borderRadius: '13px', padding: '9px 4px',
                cursor: 'pointer', transition: 'all 200ms ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                boxShadow: isActive ? '0 2px 10px rgba(193,127,58,0.28)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(250,248,245,0.07)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', fontWeight: 600, color: isActive ? '#FAF8F5' : 'rgba(250,248,245,0.38)', lineHeight: 1, transition: 'color 200ms ease' }}>{NUMERALS[i]}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', letterSpacing: '0.09em', textTransform: 'uppercase', color: isActive ? 'rgba(250,248,245,0.9)' : 'rgba(250,248,245,0.3)', transition: 'color 200ms ease' }}>{sectionShortLabel(s.id)}</span>
            </button>
          );
        })}
      </div>

      {/* Section headline */}
      <div style={{ ...GLASS, padding: '14px 16px', flexShrink: 0 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C17F3A', margin: '0 0 4px' }}>{active?.label}</p>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '20px', fontWeight: 500, color: '#FAF8F5', margin: '0 0 4px', lineHeight: 1.2 }}>{active?.title}</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.4)', margin: 0, lineHeight: 1.55 }}>{active?.subtitle}</p>
      </div>

      {/* L1 content */}
      <div style={{ ...GLASS, padding: '14px 16px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Aria: concierge input */}
        {isAria && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.55)', margin: 0, lineHeight: 1.5 }}>
              Tell Aria what you&apos;re looking for and she&apos;ll find it.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(250,248,245,0.05)', border: '1px solid rgba(193,127,58,0.3)', borderRadius: '12px', padding: '0 6px 0 14px', height: '44px' }}>
              <input
                type="text"
                value={ariaQuery}
                onChange={e => setAriaQuery(e.target.value)}
                placeholder="Rooftop bar with a view…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#FAF8F5', caretColor: '#C17F3A' }}
              />
              <button
                style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#C17F3A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 160ms ease', boxShadow: '0 2px 8px rgba(193,127,58,0.28)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#D6A252'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* In your world: region drill list */}
        {isNearby && (
          <>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.38)', margin: '0 0 10px', flexShrink: 0 }}>Explore a destination</p>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
              {regions.length === 0 && (
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '14px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', paddingTop: '20px', margin: 0 }}>No destinations yet.</p>
              )}
              {regions.map(region => {
                const isSelected = activeRegion?.id === region.id;
                return (
                  <button
                    key={region.id}
                    onClick={() => onDrillRegion(region)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '11px',
                      padding: '9px 10px', marginBottom: '5px', width: '100%',
                      background: isSelected ? 'rgba(193,127,58,0.14)' : 'rgba(250,248,245,0.05)',
                      border: `1px solid ${isSelected ? 'rgba(193,127,58,0.5)' : 'rgba(250,248,245,0.08)'}`,
                      borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 160ms ease, border-color 160ms ease',
                      boxSizing: 'border-box',
                    } as React.CSSProperties}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(250,248,245,0.11)'; } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(250,248,245,0.05)'; } }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(250,248,245,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {region.image_url
                        ? <img src={region.image_url} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        : <span style={{ color: 'rgba(250,248,245,0.35)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>{region.country_code ?? '—'}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#FAF8F5' : 'rgba(250,248,245,0.8)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region.name}</p>
                      {region.country_code && (<p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: isSelected ? 'rgba(193,127,58,0.7)' : 'rgba(250,248,245,0.32)', margin: '2px 0 0' }}>{region.country_code}</p>)}
                    </div>
                    {isSelected
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(193,127,58,0.9)" strokeWidth={2.5} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.2)" strokeWidth={2} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Made for you / Tonight: item cards + city nudge if no region */}
        {showItems && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {!currentCity ? (
              <button
                onClick={triggerNudge}
                style={{
                  background: 'rgba(193,127,58,0.08)',
                  border: '1px dashed rgba(193,127,58,0.35)',
                  borderRadius: '14px',
                  padding: '18px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C17F3A', margin: 0 }}>No city selected</p>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.55)', margin: 0, lineHeight: 1.5 }}>
                  Pick a city above and we&apos;ll curate this section for you.
                </p>
              </button>
            ) : previewItems.length === 0 ? (
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '14px', color: 'rgba(250,248,245,0.28)', margin: 0, lineHeight: 1.6 }}>
                Curated for {currentCity.name}. Change your city above to explore somewhere new.
              </p>
            ) : (
              previewItems.map((item) => {
                const subtitle = 'venue_name' in item ? (item as { venue_name: string | null }).venue_name
                  : 'city' in item ? (item as { city: string | null }).city
                  : null;
                return (
                <button
                  key={item.id}
                  onClick={() => onItemClick?.(item, active.content_type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '9px 10px',
                    width: '100%',
                    background: 'rgba(250,248,245,0.05)',
                    border: '1px solid rgba(250,248,245,0.08)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 150ms ease, border-color 150ms ease',
                    boxSizing: 'border-box',
                  } as React.CSSProperties}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(250,248,245,0.10)';
                    e.currentTarget.style.borderColor = 'rgba(193,127,58,0.28)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(250,248,245,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(250,248,245,0.08)';
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'rgba(250,248,245,0.08)' }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> // eslint-disable-line @next/next/no-img-element
                      : <div style={{ width: '100%', height: '100%', background: 'rgba(193,127,58,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(193,127,58,0.6)" strokeWidth={1.5}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          </svg>
                        </div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#FAF8F5', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </p>
                    {subtitle && (
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(250,248,245,0.38)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.25)" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Refresh curation */}
      <div style={{ ...GLASS, padding: '10px', flexShrink: 0 }}>
        <button
          onClick={!currentCity ? triggerNudge : onPersonalise}
          disabled={isPersonalising}
          style={{ width: '100%', height: '42px', borderRadius: '13px', background: '#C17F3A', color: '#FAF8F5', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.07em', border: 'none', cursor: isPersonalising ? 'not-allowed' : 'pointer', opacity: isPersonalising ? 0.55 : 1, transition: 'background 180ms ease, opacity 180ms ease', boxShadow: '0 4px 14px rgba(193,127,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onMouseEnter={e => { if (!isPersonalising) e.currentTarget.style.background = '#D6A252'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A'; }}
        >
          {isPersonalising ? 'Refreshing…' : 'Refresh my curation'}
        </button>
      </div>

      <style>{`
        @keyframes cityNudge {
          0%   { box-shadow: 0 0 0 0 rgba(193,127,58,0.55); }
          50%  { box-shadow: 0 0 0 8px rgba(193,127,58,0); }
          100% { box-shadow: 0 0 0 0 rgba(193,127,58,0); }
        }
      `}</style>
    </div>
  );
});

export default ExploreWebPanel;
