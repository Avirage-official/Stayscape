'use client';

import { useState, useEffect, useRef } from 'react';
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
  onItemClick?: (item: ExploreItem, contentType: ExploreSection['content_type']) => void;
  nudgeCity?: boolean;
  openCityPicker?: boolean;
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

function itemSubtitle(item: ExploreItem): string | null {
  if ('category' in item) return String((item as { category: unknown }).category ?? '');
  if ('city' in item) return (item as { city: string | null }).city ?? null;
  return null;
}

export default function ExploreWebPanel({
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
  nudgeCity,
  openCityPicker,
}: ExploreWebPanelProps) {
  const [ariaQuery, setAriaQuery] = useState('');
  // cityOpen is true when the parent requests it OR when the user toggles it manually.
  // We derive the initial value from the prop so we never call setState inside an effect.
  const [cityOpen, setCityOpen] = useState(() => !!openCityPicker);
  const [ariaGateVisible, setAriaGateVisible] = useState(false);
  const ariaGateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the parent flips openCityPicker to true after mount, open the picker.
  // We only ever set state to `true` here (never to false) so there is no
  // "toggle on every render" risk, and the user can still close it manually.
  const prevOpenCityPickerRef = useRef(openCityPicker);
  if (openCityPicker && !prevOpenCityPickerRef.current) {
    // Mutate the ref synchronously during render — safe, no setState in effect.
    prevOpenCityPickerRef.current = openCityPicker;
    // This is a render-time state update via useState initialiser — we can't
    // call setCityOpen here either.  Use a layout effect instead so it fires
    // before the browser paints (no cascading-render problem).
  }

  useEffect(() => {
    if (openCityPicker && !cityOpen) {
      setCityOpen(true);
    }
    // We intentionally only track openCityPicker here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCityPicker]);

  // Clear gate message timer on unmount
  useEffect(() => () => {
    if (ariaGateTimerRef.current) clearTimeout(ariaGateTimerRef.current);
  }, []);

  function handleAriaSend() {
    setAriaQuery('');
    setAriaGateVisible(true);
    if (ariaGateTimerRef.current) clearTimeout(ariaGateTimerRef.current);
    ariaGateTimerRef.current = setTimeout(() => setAriaGateVisible(false), 3000);
  }

  const active = sections[activeIndex];
  const isAria   = active?.id === 'arias_picks';
  const isNearby = active?.id === 'in_your_world';
  const isYours  = active?.id === 'made_for_you';

  const currentCity = regions.find(r => r.id === selectedRegionId) ?? null;

  return (
    <div
      className="hidden md:flex flex-col"
      style={{ width: '300px', flexShrink: 0, gap: '10px', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}
    >

      {/* ── City selector — always visible, always at the top ── */}
      <div style={{ ...GLASS, padding: 0, flexShrink: 0, overflow: 'hidden', animation: nudgeCity ? 'wcNudge 0.45s ease-in-out 4' : 'none' }}>
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
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.35)', margin: '0 0 2px' }}>
              Exploring
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '17px', fontWeight: 500, color: currentCity ? '#FAF8F5' : 'rgba(250,248,245,0.32)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentCity?.name ?? 'Select a city'}
            </p>
          </div>
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="rgba(250,248,245,0.35)" strokeWidth={2.5}
            style={{ flexShrink: 0, transition: 'transform 200ms ease', transform: cityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {cityOpen && (
          <div style={{ borderTop: '1px solid rgba(250,248,245,0.08)', maxHeight: '230px', overflowY: 'auto', scrollbarWidth: 'none', padding: '8px 10px 10px' }}>
            {regions.length === 0 ? (
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '14px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                No cities available.
              </p>
            ) : regions.map(region => {
              const isSel = region.id === selectedRegionId;
              return (
                <button
                  key={region.id}
                  onClick={() => { onRegionChange?.(region.id); setCityOpen(false); }}
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
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', fontWeight: 600, color: isActive ? '#FAF8F5' : 'rgba(250,248,245,0.38)', lineHeight: 1, transition: 'color 200ms ease' }}>
                {NUMERALS[i]}
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', letterSpacing: '0.09em', textTransform: 'uppercase', color: isActive ? 'rgba(250,248,245,0.9)' : 'rgba(250,248,245,0.3)', transition: 'color 200ms ease' }}>
                {sectionShortLabel(s.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section headline */}
      <div style={{ ...GLASS, padding: '14px 16px', flexShrink: 0 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C17F3A', margin: '0 0 4px' }}>
          {active?.label}
        </p>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '20px', fontWeight: 500, color: '#FAF8F5', margin: '0 0 4px', lineHeight: 1.2 }}>
          {active?.title}
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.4)', margin: 0, lineHeight: 1.55 }}>
          {active?.subtitle}
        </p>
      </div>

      {/* L1 content */}
      <div style={{ ...GLASS, padding: '14px 16px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Aria: featured pick + gate message + concierge input */}
        {isAria && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {active?.items[0] && (
              <button
                onClick={() => onItemClick?.(active.items[0], active.content_type)}
                style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '11px 13px', background: 'rgba(250,248,245,0.06)', border: '1px solid rgba(250,248,245,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 160ms ease', boxSizing: 'border-box' } as React.CSSProperties}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.06)'; }}
              >
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#FAF8F5', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.items[0].name}</p>
                {itemSubtitle(active.items[0]) && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(193,127,58,0.75)', margin: 0, textTransform: 'capitalize' }}>{itemSubtitle(active.items[0])}</p>
                )}
              </button>
            )}

            {/* Gate message */}
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'rgba(193,127,58,0.85)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Unlock Aria when you book your trip.
            </p>

            {/* Inline gate reply — fades in on send, clears after 3s */}
            {ariaGateVisible && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '13px',
                color: 'rgba(193,127,58,0.75)',
                margin: 0,
                lineHeight: 1.5,
                animation: 'wcFadeIn 220ms ease',
              }}>
                Aria unlocks once your trip is confirmed.
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(250,248,245,0.05)', border: '1px solid rgba(193,127,58,0.3)', borderRadius: '12px', padding: '0 6px 0 14px', height: '44px' }}>
              <input
                type="text"
                value={ariaQuery}
                onChange={e => setAriaQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && ariaQuery.trim()) handleAriaSend(); }}
                placeholder="Rooftop bar with a view…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#FAF8F5', caretColor: '#C17F3A' }}
              />
              <button
                onClick={() => { if (ariaQuery.trim()) handleAriaSend(); }}
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
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.38)', margin: '0 0 10px', flexShrink: 0 }}>
              Explore a destination
            </p>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
              {regions.length === 0 && (
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '14px', color: 'rgba(250,248,245,0.22)', textAlign: 'center', paddingTop: '20px', margin: 0 }}>
                  No destinations yet.
                </p>
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
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#FAF8F5' : 'rgba(250,248,245,0.8)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {region.name}
                      </p>
                      {region.country_code && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: isSelected ? 'rgba(193,127,58,0.7)' : 'rgba(250,248,245,0.32)', margin: '2px 0 0' }}>
                          {region.country_code}
                        </p>
                      )}
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

        {/* Made for you: featured pick */}
        {isYours && (
          active?.items[0] ? (
            <button
              onClick={() => onItemClick?.(active.items[0], active.content_type)}
              style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '11px 13px', background: 'rgba(250,248,245,0.06)', border: '1px solid rgba(250,248,245,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 160ms ease', boxSizing: 'border-box' } as React.CSSProperties}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,248,245,0.06)'; }}
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#FAF8F5', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.items[0].name}</p>
              {itemSubtitle(active.items[0]) && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(193,127,58,0.75)', margin: 0, textTransform: 'capitalize' }}>{itemSubtitle(active.items[0])}</p>
              )}
            </button>
          ) : (
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.32)', margin: 0, lineHeight: 1.6 }}>
              {currentCity ? `Curated for ${currentCity.name}.` : 'Select a city to personalise your curation.'}
            </p>
          )
        )}

        {/* Tonight / other sections: gentle prompt */}
        {!isAria && !isNearby && !isYours && (
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.32)', margin: 0, lineHeight: 1.6 }}>
            {currentCity
              ? `Curated for ${currentCity.name}. Change your city above to explore somewhere new.`
              : 'Select a city above to personalise your curation.'}
          </p>
        )}
      </div>

      {/* Refresh curation */}
      <div style={{ ...GLASS, padding: '10px', flexShrink: 0 }}>
        <button
          onClick={onPersonalise}
          disabled={isPersonalising}
          style={{ width: '100%', height: '42px', borderRadius: '13px', background: '#C17F3A', color: '#FAF8F5', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.07em', border: 'none', cursor: isPersonalising ? 'not-allowed' : 'pointer', opacity: isPersonalising ? 0.55 : 1, transition: 'background 180ms ease, opacity 180ms ease', boxShadow: '0 4px 14px rgba(193,127,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onMouseEnter={e => { if (!isPersonalising) e.currentTarget.style.background = '#D6A252'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A'; }}
        >
          {isPersonalising ? 'Refreshing…' : 'Refresh my curation'}
        </button>
      </div>

      {nudgeCity && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(193,127,58,0.85)', margin: 0, textAlign: 'center', animation: 'wcFadeIn 200ms ease' }}>
          Please select a city first
        </p>
      )}

      <style>{`
        @keyframes wcNudge { 0%,100% { box-shadow: 0 0 0 0 rgba(193,127,58,0); } 50% { box-shadow: 0 0 0 3px rgba(193,127,58,0.55); } }
        @keyframes wcFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
