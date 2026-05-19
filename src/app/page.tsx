'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function SplashPage() {
  const [hovered, setHovered] = useState<'hotels' | 'guests' | null>(null)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#14100D',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/videos/postlogin.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20,16,13,0.72)',
          zIndex: 1,
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(20,16,13,0.65) 100%)',
          zIndex: 2,
        }}
      />

      {/* Top wordmark */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.01em',
          }}
        >
          Stay
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontStyle: 'normal',
              fontWeight: 600,
              color: 'var(--gold)',
            }}
          >
            scape
          </span>
        </span>
      </div>

      {/* Center column */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '48px',
          padding: '0 20px',
          width: '100%',
          maxWidth: '720px',
        }}
      >
        {/* Editorial headline */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.375rem, 3vw, 2.25rem)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            letterSpacing: '0.01em',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Two ways in.
        </p>

        {/* The two decks */}
        <div
          className="deck-row"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '32px',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Hotels deck */}
          <Link
            href="/hotels"
            style={{ textDecoration: 'none' }}
            onMouseEnter={() => setHovered('hotels')}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              style={{
                width: 'clamp(280px, 38vw, 300px)',
                height: 'clamp(180px, 28vw, 360px)',
                background: 'var(--surface-raised)',
                border: '1px solid rgba(201,168,117,0.25)',
                borderRadius: '4px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transform: hovered === 'hotels'
                  ? 'rotate(0deg) translateY(-6px)'
                  : 'rotate(-3deg)',
                opacity: hovered === 'guests' ? 0.35 : 1,
                transition: 'transform 240ms ease-out, opacity 240ms ease-out',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--gold)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    margin: '0 0 16px',
                  }}
                >
                  For Hotels
                </p>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  Run a better property.
                </p>
              </div>

              {/* Chevron */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  style={{ color: 'var(--gold)', opacity: 0.7 }}
                >
                  <path
                    d="M7.5 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </Link>

          {/* Guests deck */}
          <Link
            href="/guests"
            style={{ textDecoration: 'none' }}
            onMouseEnter={() => setHovered('guests')}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              style={{
                width: 'clamp(280px, 38vw, 300px)',
                height: 'clamp(180px, 28vw, 360px)',
                background: 'var(--surface-raised)',
                border: '1px solid rgba(201,168,117,0.25)',
                borderRadius: '4px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transform: hovered === 'guests'
                  ? 'rotate(0deg) translateY(-6px)'
                  : 'rotate(3deg)',
                opacity: hovered === 'hotels' ? 0.35 : 1,
                transition: 'transform 240ms ease-out, opacity 240ms ease-out',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--gold)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    margin: '0 0 16px',
                  }}
                >
                  For Guests
                </p>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  Step into your stay.
                </p>
              </div>

              {/* Chevron */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  style={{ color: 'var(--gold)', opacity: 0.7 }}
                >
                  <path
                    d="M7.5 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Bottom hint */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
            textAlign: 'center',
            margin: 0,
          }}
        >
          If you have a booking, choose Guest.
        </p>
      </div>

      {/* Mobile responsive overrides */}
      <style>{`
        @media (max-width: 767px) {
          .deck-row {
            flex-direction: column !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}
