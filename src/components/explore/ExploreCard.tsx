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

export default function ExploreCard({ section }: ExploreCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#1a1208',
      }}
    >
      {/* Background image — no key so it crossfades in place */}
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
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #1a1208 0%, #2c1f0c 100%)',
          }}
        />
      )}

      {/* Bottom vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(14,11,8,0.97) 0%, rgba(14,11,8,0.62) 36%, rgba(14,11,8,0.08) 64%, transparent 100%)',
        }}
      />
      {/* Top fade */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(14,11,8,0.52) 0%, transparent 28%)',
        }}
      />

      {/* Text overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '20px',
        }}
      >
        {/* Eyebrow — re-animates on section change via key */}
        <div key={`ey-${section.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', animation: 'ecFadeDown 380ms cubic-bezier(0.16,1,0.3,1) both' }}>
          <div style={{ width: '24px', height: '1px', background: 'rgba(193,127,58,0.7)', flexShrink: 0 }} />
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '12px',
            color: 'rgba(193,127,58,0.85)',
            letterSpacing: '0.04em',
          }}>
            {section.label}
          </span>
        </div>

        {/* Title + subtitle */}
        <div key={`tx-${section.id}`} style={{ animation: 'ecSlideUp 460ms cubic-bezier(0.16,1,0.3,1) both' }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.9rem, 5vw, 3rem)',
            fontWeight: 500,
            color: '#FAF8F5',
            lineHeight: 1.1,
            margin: '0 0 7px',
          }}>
            {section.title}
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'rgba(250,248,245,0.58)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {section.subtitle}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ecSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ecFadeDown {
          from { opacity: 0; transform: translateY(-7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
