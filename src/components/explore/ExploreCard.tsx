'use client';

import Image from 'next/image';
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
}

const FALLBACK_GRADIENTS: Record<string, string> = {
  made_for_you:   'linear-gradient(145deg, #2C1A08 0%, #4a2e10 50%, #1a1208 100%)',
  in_your_world:  'linear-gradient(145deg, #0e1a2c 0%, #1a3040 50%, #08141a 100%)',
  happening_now:  'linear-gradient(145deg, #1a1408 0%, #3d2c0a 50%, #1a1208 100%)',
  arias_picks:    'linear-gradient(145deg, #1a0e20 0%, #2e1a38 50%, #140a1a 100%)',
};

export default function ExploreCard({ section }: ExploreCardProps) {
  const fallback = FALLBACK_GRADIENTS[section.id] ?? FALLBACK_GRADIENTS.made_for_you;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      {/* Background */}
      {section.image_url ? (
        <Image
          src={section.image_url}
          alt={section.title}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          priority
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: fallback }} />
      )}

      {/* Bottom vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(8,5,2,0.97) 0%, rgba(8,5,2,0.65) 32%, rgba(8,5,2,0.1) 62%, transparent 100%)',
        }}
      />
      {/* Top fade */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(8,5,2,0.5) 0%, transparent 26%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '22px',
        }}
      >
        {/* Eyebrow */}
        <div key={`ey-${section.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', animation: 'ecFadeDown 360ms cubic-bezier(0.16,1,0.3,1) both' }}>
          <div style={{ width: '22px', height: '1px', background: 'rgba(193,127,58,0.8)', flexShrink: 0 }} />
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontSize: '12px',
            color: 'rgba(193,127,58,0.9)',
            letterSpacing: '0.05em',
          }}>{section.label}</span>
        </div>

        {/* Title + subtitle */}
        <div key={`tx-${section.id}`} style={{ animation: 'ecSlideUp 440ms cubic-bezier(0.16,1,0.3,1) both' }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 500,
            color: '#FAF8F5',
            lineHeight: 1.1,
            margin: '0 0 7px',
          }}>{section.title}</h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'rgba(250,248,245,0.62)',
            margin: 0, lineHeight: 1.5,
          }}>{section.subtitle}</p>
        </div>
      </div>

      <style>{`
        @keyframes ecSlideUp {
          from { opacity: 0; transform: translateY(13px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ecFadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
