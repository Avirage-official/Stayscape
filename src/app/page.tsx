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
        background: 'var(--background)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
      }}
    >
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

      {/* Editorial headline */}
      <p
        style={{
          position: 'relative',
          zIndex: 10,
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

      {/*
        Video files to upload to /public/videos/ later:
          - splash-hotels.mp4  → suggested content: cinematic hotel lobby / reception / property exterior, 8–15s loop, ~5MB max
          - splash-guests.mp4  → suggested content: traveler arriving / opening hotel room curtain / city skyline / pool aerial, 8–15s loop, ~5MB max
        Both should be muted-friendly (no critical audio) and visually warm to match the espresso palette.
      */}

      {/* The two decks */}
      <div
        className="deck-row"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'row',
          gap: '40px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          width: '100%',
        }}
      >
        {/* Hotels deck */}
        <Link
          href="/hotels"
          style={{ textDecoration: 'none', display: 'block' }}
          onMouseEnter={() => setHovered('hotels')}
          onMouseLeave={() => setHovered(null)}
        >
          <div
            style={{
              position: 'relative',
              width: 'clamp(280px, 42vw, 620px)',
              height: 'clamp(340px, 72vh, 780px)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(201,168,117,0.25)',
              cursor: 'pointer',
              transform: hovered === 'hotels'
                ? 'rotate(0deg) translateY(-8px)'
                : 'rotate(-3deg)',
              opacity: hovered === 'guests' ? 0.4 : 1,
              transition: 'transform 280ms ease-out, opacity 280ms ease-out',
            }}
          >
            {/* Deck video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
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
              <source src="/videos/splash-hotels.mp4" type="video/mp4" />
            </video>

            {/* Gradient overlay */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: hovered === 'hotels'
                  ? 'linear-gradient(180deg, rgba(20,16,13,0.45) 0%, rgba(20,16,13,0.62) 100%)'
                  : 'linear-gradient(180deg, rgba(20,16,13,0.45) 0%, rgba(20,16,13,0.78) 100%)',
                transition: 'background 280ms ease-out',
                zIndex: 1,
              }}
            />

            {/* Deck text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'clamp(24px, 3.5vw, 44px)',
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
                    fontSize: 'clamp(1.3rem, 2.4vw, 2rem)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  Run a better property.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  style={{ color: 'var(--gold)', opacity: 0.75 }}
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
          </div>
        </Link>

        {/* Guests deck */}
        <Link
          href="/guests"
          style={{ textDecoration: 'none', display: 'block' }}
          onMouseEnter={() => setHovered('guests')}
          onMouseLeave={() => setHovered(null)}
        >
          <div
            style={{
              position: 'relative',
              width: 'clamp(280px, 42vw, 620px)',
              height: 'clamp(340px, 72vh, 780px)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(201,168,117,0.25)',
              cursor: 'pointer',
              transform: hovered === 'guests'
                ? 'rotate(0deg) translateY(-8px)'
                : 'rotate(3deg)',
              opacity: hovered === 'hotels' ? 0.4 : 1,
              transition: 'transform 280ms ease-out, opacity 280ms ease-out',
            }}
          >
            {/* Deck video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
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
              <source src="/videos/splash-guests.mp4" type="video/mp4" />
            </video>

            {/* Gradient overlay */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: hovered === 'guests'
                  ? 'linear-gradient(180deg, rgba(20,16,13,0.45) 0%, rgba(20,16,13,0.62) 100%)'
                  : 'linear-gradient(180deg, rgba(20,16,13,0.45) 0%, rgba(20,16,13,0.78) 100%)',
                transition: 'background 280ms ease-out',
                zIndex: 1,
              }}
            />

            {/* Deck text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'clamp(24px, 3.5vw, 44px)',
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
                    fontSize: 'clamp(1.3rem, 2.4vw, 2rem)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  Step into your stay.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  style={{ color: 'var(--gold)', opacity: 0.75 }}
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
          </div>
        </Link>
      </div>

      {/* Bottom hint */}
      <p
        style={{
          position: 'relative',
          zIndex: 10,
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

      <style>{`
        @media (max-width: 767px) {
          .deck-row {
            flex-direction: column !important;
            gap: 20px !important;
          }
          .deck-row a > div {
            width: 88vw !important;
            height: 44vh !important;
            transform: none !important;
          }
          .deck-row a:first-child > div {
            transform: rotate(-1.5deg) !important;
          }
          .deck-row a:last-child > div {
            transform: rotate(1.5deg) !important;
          }
        }
      `}</style>
    </div>
  )
}
