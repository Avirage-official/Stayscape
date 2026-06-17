'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SplashPage() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  function navigate(dest: 'hotels' | 'guests') {
    if (leaving) return
    setLeaving(true)
    setTimeout(() => router.push(`/${dest}`), 380)
  }

  return (
    <>
      {leaving && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: '#FAF8F5',
            animation: 'wipeIn 380ms cubic-bezier(0.4,0,0.2,1) forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ position: 'fixed', inset: 0, background: '#FAF8F5', overflow: 'hidden' }}>

        {/* ── Video (left, diagonal clip) ───────────────────────── */}
        <div className="sc-vid-wrap">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            autoPlay muted loop playsInline preload="auto"
            aria-hidden="true"
            className="sc-vid"
          >
            <source src="/videos/splash-guests.mp4" type="video/mp4" />
          </video>
          {/* Scrim: darker on left, fades to nothing at diagonal edge */}
          <div className="sc-vid-scrim" />
        </div>

        {/* ── Diagonal gold seam ────────────────────────────────── */}
        <svg
          aria-hidden="true"
          className="sc-seam"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {/* Line coordinates match the video clip-path edge exactly */}
          <line x1="58%" y1="0%" x2="66%" y2="100%"
            stroke="rgba(200,168,90,0.5)" strokeWidth="1" />
        </svg>

        {/* ── Background decoration (cream area) ───────────────── */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Warm gold orb — top-right of cream section */}
          <div className="sc-blob sc-blob-a" />
          {/* Amber accent — bottom-right of cream section */}
          <div className="sc-blob sc-blob-b" />
          {/* Edge vignette centred on cream area */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 90% at 82% 50%, transparent 38%, rgba(30,16,4,0.06) 100%)',
          }} />
          {/* Film grain: mix-blend-mode:soft-light merges grain into surface */}
          <div className="sc-grain" />
        </div>

        {/* ── Content (right section) ───────────────────────────── */}
        <div className="sc-layout" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          {/* Spacer matching the video area — keeps content in cream zone */}
          <div className="sc-layout-gap" />

          <div className="sc-layout-content">
            {/* Float wrapper — begins after entrance animations settle */}
            <div className="sc-float">
                <svg
                  viewBox="0 0 160 140"
                  aria-hidden="true"
                  className="sc-logo-enter"
                  style={{
                    display: 'block',
                    width: 'clamp(96px, 12vw, 136px)',
                    height: 'auto',
                    margin: '0 auto',
                  }}
                >
                  <path
                    d="M 130,44 C 118,22 96,13 70,13 C 40,13 20,36 20,68 C 20,100 40,123 70,123 C 96,123 118,114 130,92"
                    fill="none" stroke="#C8A85A" strokeWidth="14"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <path
                    d="M 100,34 C 100,24 87,16 73,16 C 59,16 49,26 49,39 C 49,54 76,59 86,66 C 96,73 108,83 108,97 C 108,112 93,122 77,122 C 61,122 50,112 46,102"
                    fill="none" stroke="#2C1A08" strokeWidth="14"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>

                <p
                  aria-label="Stayscape"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 'clamp(9px, 0.9vw, 12px)',
                    fontWeight: 700,
                    letterSpacing: '0.30em',
                    paddingLeft: '0.30em',
                    textTransform: 'uppercase',
                    color: '#2C1A08',
                    textAlign: 'center',
                    margin: 'clamp(12px, 2vh, 18px) 0 0',
                  }}
                >
                  {'Stayscape'.split('').map((char, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        animation: `sc-letter-appear 560ms cubic-bezier(0.22,1,0.36,1) ${360 + i * 48}ms both`,
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </p>
            </div>

            <div
              className="sc-buttons"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(8px, 1.2vh, 12px)',
                marginTop: 'clamp(28px, 4.5vh, 44px)',
                width: '100%',
                maxWidth: '220px',
              }}
            >
              <button
                onClick={() => navigate('guests')}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 'clamp(12px, 1vw, 13px)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#FAF8F5',
                  background: '#2C1A08',
                  border: '1.5px solid transparent',
                  borderRadius: '999px',
                  padding: 'clamp(12px, 1.6vh, 15px) 0',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'opacity 180ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.80')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Find a Stay
              </button>
              <button
                onClick={() => navigate('hotels')}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 'clamp(12px, 1vw, 13px)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#2C1A08',
                  background: 'transparent',
                  border: '1.5px solid rgba(44,26,8,0.28)',
                  borderRadius: '999px',
                  padding: 'clamp(12px, 1.6vh, 15px) 0',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'border-color 180ms ease, background 180ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(44,26,8,0.55)'
                  e.currentTarget.style.background = 'rgba(44,26,8,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(44,26,8,0.28)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                For Hotel Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Video ──────────────────────────────────────────────── */
        .sc-vid-wrap {
          position: absolute; inset: 0;
          clip-path: polygon(0 0, 58% 0, 66% 100%, 0 100%);
        }
        .sc-vid {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .sc-vid-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(
            to right,
            rgba(14,10,6,0.30) 0%,
            rgba(14,10,6,0.14) 55%,
            transparent 85%
          );
        }

        /* ── Diagonal seam ──────────────────────────────────────── */
        .sc-seam { z-index: 2; }

        /* ── Background blobs (cream section only) ──────────────── */
        .sc-blob { position: absolute; border-radius: 50%; will-change: transform; }
        .sc-blob-a {
          top: -18%; right: -4%;
          width: clamp(180px, 44vmax, 520px); height: clamp(150px, 36vmax, 430px);
          background: rgba(200,168,90,0.46); filter: blur(90px);
        }
        .sc-blob-b {
          bottom: -16%; right: 2%;
          width: clamp(120px, 28vmax, 340px); height: clamp(120px, 28vmax, 340px);
          background: rgba(180,110,42,0.30); filter: blur(80px);
        }

        /* ── Film grain ─────────────────────────────────────────── */
        .sc-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E");
          background-size: 300px 300px;
          background-repeat: repeat;
          mix-blend-mode: soft-light;
          opacity: 0.50;
          pointer-events: none;
        }

        /* ── Content layout ─────────────────────────────────────── */
        .sc-layout {
          display: flex; flex-direction: row; align-items: stretch;
        }
        .sc-layout-gap {
          /* Flex spacer: matches the average video width (58–66% = ~62%) */
          flex: 0 0 62%;
        }
        .sc-layout-content {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 0 clamp(20px, 3vw, 48px);
        }

        /* ── Animations ─────────────────────────────────────────── */
        @keyframes sc-logo-enter-anim {
          from { opacity: 0; transform: translateY(-22px); filter: blur(3px); }
          to   { opacity: 1; transform: translateY(0);     filter: blur(0px); }
        }
        @keyframes sc-letter-appear {
          from { opacity: 0; transform: translateY(6px); filter: blur(5px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0px); }
        }
        @keyframes sc-float-anim {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes sc-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wipeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .sc-logo-enter { animation: sc-logo-enter-anim 700ms cubic-bezier(0.22,1,0.36,1) 80ms both; }
        .sc-float      { animation: sc-float-anim 4.5s 1400ms ease-in-out infinite; }
        .sc-buttons    { animation: sc-fade-up 600ms 780ms cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Mobile: stack vertically ───────────────────────────── */
        @media (max-width: 767px) {
          .sc-vid-wrap {
            /* Horizontal diagonal: full-width video, angled bottom edge */
            bottom: auto;
            height: 50vh; /* vh fallback for older iOS */
            height: 50dvh;
            width: 100%;
            clip-path: polygon(0 0, 100% 0, 100% 88%, 0 100%);
          }
          .sc-vid {
            /* Force visible on mobile — some browsers need explicit dims */
            width: 100% !important;
            height: 100% !important;
            min-height: 50vh;
          }
          .sc-seam { display: none; }
          .sc-layout { flex-direction: column; }
          .sc-layout-gap {
            flex: 0 0 50vh; /* vh fallback */
            flex: 0 0 50dvh;
          }
          .sc-layout-content {
            flex: 1;
            padding: 28px 32px 32px;
          }
          .sc-buttons { width: 100%; max-width: 260px !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sc-logo-enter, .sc-float, .sc-buttons {
            animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important;
          }
          .sc-logo-enter span {
            animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important;
          }
        }
      `}</style>
    </>
  )
}
