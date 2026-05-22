'use client';

import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';
import type { ExploreView } from '@/types/explore';

export type ExploreItem =
  | DiscoveryPlaceCard
  | DiscoveryEventCard
  | ExplorePropertyCard
  | RegionOption;

export interface ExploreSection {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  gradient: string;
  content_type: 'places' | 'events' | 'properties' | 'regions';
  items: ExploreItem[];
}

interface ExploreCardProps {
  section: ExploreSection;
  sections?: ExploreSection[];
  activeIndex?: number;
  onSectionChange?: (i: number) => void;
  drillView?: ExploreView;
  onBack?: () => void;
}

const NUMERALS = ['I', 'II', 'III', 'IV'] as const;

function sectionShortLabel(id: string) {
  if (id === 'made_for_you') return 'Yours';
  if (id === 'in_your_world') return 'Nearby';
  if (id === 'happening_now') return 'Tonight';
  if (id === 'arias_picks') return 'Aria';
  return id;
}

const FALLBACK: Record<string, string> = {
  made_for_you:  'linear-gradient(145deg, #2C1A08 0%, #4a2e10 45%, #1a1208 100%)',
  in_your_world: 'linear-gradient(145deg, #0e1a2c 0%, #1a3040 45%, #08141a 100%)',
  happening_now: 'linear-gradient(145deg, #1a1408 0%, #3d2c0a 45%, #1a1208 100%)',
  arias_picks:   'linear-gradient(145deg, #1a0e20 0%, #2e1a38 45%, #140a1a 100%)',
};

export default function ExploreCard({ section, sections, activeIndex, onSectionChange }: ExploreCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: FALLBACK[section.id] ?? FALLBACK.made_for_you,
        animation: 'ecFadeIn 350ms ease both',
      }}
    >
      {section.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={section.image_url}
          src={section.image_url}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            animation: 'ecFadeIn 500ms ease both',
          }}
        />
      )}

      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(8,5,2,0.45) 0%, transparent 28%)',
      }} />

      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(8,5,2,0.65) 0%, transparent 48%)',
      }} />

      {/* Glass card */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px', left: '20px', right: '20px',
          zIndex: 10,
          animation: 'ecSlideUp 420ms cubic-bezier(0.16,1,0.3,1) both',
        }}
        key={section.id}
      >
        <div style={{
          background: 'rgba(14,11,8,0.52)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(250,248,245,0.14)',
          borderRadius: '16px',
          padding: '18px 20px',
        }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '20px', height: '1px', background: 'rgba(193,127,58,0.8)', flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontSize: '12px',
              color: 'rgba(193,127,58,0.9)',
              letterSpacing: '0.05em',
            }}>{section.label}</span>
          </div>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
            fontWeight: 500,
            color: '#FAF8F5',
            lineHeight: 1.1,
            margin: '0 0 6px',
          }}>{section.title}</h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'rgba(250,248,245,0.6)',
            margin: 0, lineHeight: 1.5,
          }}>{section.subtitle}</p>

          {/* Labeled section tabs — replaces anonymous expanding dot pips */}
          {sections && sections.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '4px',
              marginTop: '16px',
            }}>
              {sections.map((s, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    key={s.id}
                    aria-label={`Switch to ${sectionShortLabel(s.id)}`}
                    onClick={() => onSectionChange?.(i)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '6px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 220ms ease',
                      background: isActive
                        ? 'rgba(193,127,58,0.22)'
                        : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(250,248,245,0.07)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isActive ? '#C17F3A' : 'rgba(250,248,245,0.35)',
                      lineHeight: 1,
                      transition: 'color 220ms ease',
                    }}>{NUMERALS[i]}</span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '8px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: isActive ? 'rgba(193,127,58,0.85)' : 'rgba(250,248,245,0.25)',
                      transition: 'color 220ms ease',
                    }}>{sectionShortLabel(s.id)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ecSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ecFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
