'use client';

import { useState } from 'react';
import type { ExploreSection } from './ExploreCard';
import type { RegionOption } from '@/app/dashboard/explore/page';

export interface ExploreWebPanelProps {
  sections: ExploreSection[];
  regions: RegionOption[];
  activeIndex: number;
  activeRegion: RegionOption | null;
  onSectionChange: (index: number) => void;
  onDrillRegion: (region: RegionOption) => void;
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

const GLASS: React.CSSProperties = {
  background: 'rgba(250,248,245,0.07)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(250,248,245,0.12)',
  borderRadius: '18px',
};

export default function ExploreWebPanel({
  sections,
  regions,
  activeIndex,
  activeRegion,
  onSectionChange,
  onDrillRegion,
  onPersonalise,
  isPersonalising,
}: ExploreWebPanelProps) {
  const [ariaQuery, setAriaQuery] = useState('');
  const active = sections[activeIndex];
  const isYours = active?.id === 'made_for_you';
  const isAria  = active?.id === 'arias_picks';
  const showRegions = !isYours && !isAria;

  return (
    <div
      className="hidden md:flex flex-col"
      style={{ width: '300px', flexShrink: 0, gap: '10px', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}
    >

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

        {/* Yours: coming soon */}
        {isYours && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '20px 8px', textAlign: 'center', flex: 1 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '18px', color: 'rgba(250,248,245,0.7)', lineHeight: 1.4 }}>
              Your personal curation is on its way.
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(250,248,245,0.35)', lineHeight: 1.65 }}>
              Aria will start tailoring places once your profile and stays are in.
            </span>
            <button
              style={{ marginTop: '4px', background: 'none', border: '1px solid rgba(193,127,58,0.45)', borderRadius: '10px', padding: '9px 20px', color: '#C17F3A', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', cursor: 'pointer', letterSpacing: '0.06em', transition: 'border-color 160ms ease, color 160ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C17F3A'; e.currentTarget.style.color = '#FAF8F5'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(193,127,58,0.45)'; e.currentTarget.style.color = '#C17F3A'; }}
            >
              Complete your profile →
            </button>
          </div>
        )}

        {/* Aria: concierge input */}
        {isAria && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(250,248,245,0.55)', margin: 0, lineHeight: 1.5 }}>
              Tell Aria what you're looking for and she'll find it.
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

        {/* Nearby / Tonight: region list */}
        {showRegions && (
          <>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.38)', margin: '0 0 10px', flexShrink: 0 }}>
              Where to next
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

    </div>
  );
}
