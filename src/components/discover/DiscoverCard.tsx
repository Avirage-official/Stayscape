'use client';

/**
 * DiscoverCard — rich place card for the Discover sidebar.
 *
 * Matches the reference design:
 *  - Hero image (16:10) with heart button overlay
 *  - Title (Cormorant)
 *  - 2-line description
 *  - Meta badges row: distance · likes · rating
 *
 * Heart icon is decorative for now (no `is_favorite` column).
 */

import React, { useState } from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import type { PlaceCard } from '@/lib/data/discover-fallback';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

interface DiscoverCardProps {
  place: PlaceCard;
  onClick: () => void;
}

/* ─── Sub-components ─── */

function MetaBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className={dmSans.className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', color: 'var(--gold)' }}>{icon}</span>
      {label}
    </span>
  );
}

function IconCompass() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconThumbsUp() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" fill="currentColor" stroke="none" />
      <path d="M7 22V11" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* ─── Main component ─── */

export default function DiscoverCard({ place, onClick }: DiscoverCardProps) {
  const [hearted, setHearted] = useState(false);
  const placeholder =
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop';

  const ratingValue =
    typeof place.rating === 'number' && isFinite(place.rating)
      ? place.rating.toFixed(1)
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="ss-card-raised"
      style={{
        padding: 12,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Hero image with heart overlay */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 10',
          borderRadius: 14,
          overflow: 'hidden',
          backgroundImage: `url(${place.image || placeholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          aria-label={hearted ? 'Remove from favourites' : 'Save to favourites'}
          onClick={(e) => {
            e.stopPropagation();
            setHearted((v) => !v);
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: hearted
              ? 'rgba(201, 168, 117, 0.95)'
              : 'rgba(20, 16, 13, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: hearted ? 'var(--background)' : '#F5E6CC',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.18s ease, background 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <IconHeart filled={hearted} />
        </button>
      </div>

      {/* Title */}
      <h3
        className={cormorant.className}
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 500,
          lineHeight: 1.2,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {place.name}
      </h3>

      {/* Description */}
      {place.description && (
        <p
          className={dmSans.className}
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            fontWeight: 300,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {place.description}
        </p>
      )}

      {/* Meta badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {place.distance && (
          <MetaBadge icon={<IconCompass />} label={place.distance} />
        )}
        {ratingValue && (
          <MetaBadge icon={<IconStar />} label={ratingValue} />
        )}
        <MetaBadge icon={<IconThumbsUp />} label={place.category} />
      </div>
    </div>
  );
}
