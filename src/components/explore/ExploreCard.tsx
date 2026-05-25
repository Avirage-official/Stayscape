'use client';

import { useState } from 'react';
import type { DiscoveryPlaceCard, DiscoveryEventCard } from '@/types/database';
import type { ExplorePropertyCard } from '@/lib/supabase/explore-properties-repository';
import type { RegionOption } from '@/app/dashboard/explore/page';

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
  onExplore?: () => void;
}

const SECTION_LOCAL_IMAGE: Record<string, string> = {
  made_for_you:  '/explore/sections/made_for_you.jpg',
  in_your_world: '/explore/sections/in_your_world.jpg',
  happening_now: '/explore/sections/happening_now.jpg',
  arias_picks:   '/explore/sections/arias_picks.jpg',
};

const FALLBACK_GRADIENT: Record<string, string> = {
  made_for_you:  'linear-gradient(145deg, #2C1A08 0%, #4a2e10 60%, #0e0a06 100%)',
  in_your_world: 'linear-gradient(145deg, #071420 0%, #0e2233 60%, #050e17 100%)',
  happening_now: 'linear-gradient(145deg, #130d00 0%, #2a1f00 60%, #0d0a00 100%)',
  arias_picks:   'linear-gradient(145deg, #130820 0%, #221038 60%, #0a0512 100%)',
};

const SECTION_EYEBROW: Record<string, string> = {
  made_for_you:  'Curated for you',
  in_your_world: 'Around you',
  happening_now: 'Tonight',
  arias_picks:   "Aria's edit",
};

function pad(n: number) {
  return String(n + 1).padStart(2, '0');
}

export default function ExploreCard({ section, sections, activeIndex = 0, onSectionChange, onExplore }: ExploreCardProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [prevIndex, setPrevIndex] = useState(activeIndex);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const total = sections?.length ?? 1;
  const heroSrc = section.image_url ?? SECTION_LOCAL_IMAGE[section.id] ?? null;
  const imgLoaded = loadedSrc === heroSrc;

  function goNext() {
    if (!sections || activeIndex >= sections.length - 1) return;
    setDirection('next');
    setPrevIndex(activeIndex);
    onSectionChange?.(activeIndex + 1);
  }

  function goPrev() {
    if (!sections || activeIndex <= 0) return;
    setDirection('prev');
    setPrevIndex(activeIndex);
    onSectionChange?.(activeIndex - 1);
  }

  const eyebrow = SECTION_EYEBROW[section.id] ?? section.label;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: FALLBACK_GRADIENT[section.id] ?? FALLBACK_GRADIENT.made_for_you,
      }}
    >
      {/* ── Hero image ── */}
      {heroSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={heroSrc}
          src={heroSrc}
          alt=""
          aria-hidden="true"
          onLoad={() => setLoadedSrc(heroSrc)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 600ms ease',
            animation: `ecZoom 8s ease-out both`,
          }}
        />
      )}

      {/* ── Cinematic gradients ── */}
      {/* left dark veil so text is always readable */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(6,4,2,0.78) 0%, rgba(6,4,2,0.38) 55%, transparent 100%)',
      }} />
      {/* bottom veil */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(6,4,2,0.72) 0%, transparent 45%)',
      }} />
      {/* top veil for counter readability */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(6,4,2,0.52) 0%, transparent 22%)',
      }} />

      {/* ── Counter + arrows — top right ── */}
      {sections && sections.length > 1 && (
        <div style={{
          position: 'absolute', top: '22px', right: '20px', zIndex: 20,
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {/* counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', fontWeight: 700,
              color: '#FAF8F5',
              letterSpacing: '0.04em',
            }}>{pad(activeIndex)}</span>
            {/* line */}
            <div style={{ position: 'relative', width: '40px', height: '1px', background: 'rgba(250,248,245,0.22)' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '1px',
                background: '#C17F3A',
                width: `${((activeIndex + 1) / total) * 100}%`,
                transition: 'width 380ms cubic-bezier(0.25,0,0,1)',
              }} />
            </div>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', fontWeight: 400,
              color: 'rgba(250,248,245,0.38)',
              letterSpacing: '0.04em',
            }}>{pad(total - 1)}</span>
          </div>

          {/* prev arrow */}
          <button
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label="Previous section"
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(14,11,8,0.52)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(250,248,245,0.18)',
              cursor: activeIndex === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: activeIndex === 0 ? 0.32 : 1,
              transition: 'opacity 200ms ease, background 200ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (activeIndex > 0) e.currentTarget.style.background = 'rgba(193,127,58,0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,11,8,0.52)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* next arrow */}
          <button
            onClick={goNext}
            disabled={activeIndex === total - 1}
            aria-label="Next section"
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(14,11,8,0.52)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(250,248,245,0.18)',
              cursor: activeIndex === total - 1 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: activeIndex === total - 1 ? 0.32 : 1,
              transition: 'opacity 200ms ease, background 200ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (activeIndex < total - 1) e.currentTarget.style.background = 'rgba(193,127,58,0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,11,8,0.52)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Main text — bottom left, directly on image ── */}
      <div
        key={section.id}
        style={{
          position: 'absolute',
          bottom: '32px', left: '28px',
          zIndex: 10,
          maxWidth: '72%',
          animation: 'ecTextIn 520ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* eyebrow — thin line + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '28px', height: '1px', background: '#C17F3A', flexShrink: 0 }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C17F3A',
          }}>{eyebrow}</span>
        </div>

        {/* Big title — like BALI / THAILAND in reference */}
        <h2
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
            fontWeight: 800,
            color: '#FAF8F5',
            lineHeight: 0.95,
            margin: '0 0 14px',
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
          }}
        >
          {section.title}
        </h2>

        {/* Subtitle — floats below, small, no container */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', lineHeight: 1.6,
          color: 'rgba(250,248,245,0.62)',
          margin: '0 0 22px',
          maxWidth: '340px',
        }}>{section.subtitle}</p>

        {/* Explore CTA — like the Foxico "Explore →" pill */}
        <button
          onClick={onExplore}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(193,127,58,0.18)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(193,127,58,0.45)',
            borderRadius: '40px',
            padding: '11px 22px',
            cursor: 'pointer',
            transition: 'background 200ms ease, border-color 200ms ease, transform 160ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(193,127,58,0.32)';
            e.currentTarget.style.borderColor = 'rgba(193,127,58,0.8)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(193,127,58,0.18)';
            e.currentTarget.style.borderColor = 'rgba(193,127,58,0.45)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#FAF8F5',
          }}>Explore</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C17F3A" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Section dots — bottom right ── */}
      {sections && sections.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '38px', right: '24px',
          zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: '6px',
          alignItems: 'center',
        }}>
          {sections.map((s, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={s.id}
                onClick={() => onSectionChange?.(i)}
                aria-label={s.label}
                style={{
                  width: isActive ? '3px' : '3px',
                  height: isActive ? '20px' : '6px',
                  borderRadius: '2px',
                  background: isActive ? '#C17F3A' : 'rgba(250,248,245,0.28)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'height 280ms cubic-bezier(0.25,0,0,1), background 280ms ease',
                }}
              />
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes ecTextIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ecZoom {
          from { transform: scale(1.06); }
          to   { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
