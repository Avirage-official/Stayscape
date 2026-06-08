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

      {/* Root */}
      <div style={{ position: 'fixed', inset: 0, background: '#FAF8F5', overflow: 'hidden' }}>

        {/* ── Background layers ──────────────────────────── */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

          {/* Primary gold orb — large warm glow above logo */}
          <div style={{
            position: 'absolute',
            top: '-28%', left: '50%', transform: 'translateX(-50%)',
            width: '88vmax', height: '78vmax',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 40%, rgba(200,168,90,0.24) 0%, rgba(200,168,90,0.10) 38%, transparent 68%)',
          }} />

          {/* Secondary amber orb — bottom-left, asymmetric depth */}
          <div style={{
            position: 'absolute',
            bottom: '-22%', left: '-12%',
            width: '58vmax', height: '58vmax',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(180,110,42,0.14) 0%, transparent 62%)',
          }} />

          {/* Tertiary accent — top-right whisper */}
          <div style={{
            position: 'absolute',
            top: '-8%', right: '-8%',
            width: '42vmax', height: '42vmax',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(200,168,90,0.10) 0%, transparent 60%)',
          }} />

          {/* Edge vignette — frames content, adds luxury depth */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 96% 92% at 50% 48%, transparent 36%, rgba(30,16,4,0.07) 100%)',
          }} />

          {/* Film grain — SVG feTurbulence; tactile premium texture */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <filter id="sc-grain" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.72"
                  numOctaves="4"
                  stitchTiles="stitch"
                />
                <feColorMatrix type="saturate" values="0" />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter="url(#sc-grain)" opacity="0.048" />
          </svg>
        </div>

        {/* ── Content ────────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}>

          {/* Outer: opacity + scale appear once */}
          <div className="sc-appear">
            {/* Inner: infinite float (translateY — separate property, no conflict) */}
            <div className="sc-float">

              {/* SC monogram */}
              <svg
                viewBox="0 0 160 140"
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: 'clamp(108px, 16vw, 152px)',
                  height: 'auto',
                  margin: '0 auto',
                }}
              >
                {/* C (gold) — rendered first so S sits on top */}
                <path
                  d="M 130,44 C 118,22 96,13 70,13 C 40,13 20,36 20,68 C 20,100 40,123 70,123 C 96,123 118,114 130,92"
                  fill="none"
                  stroke="#C8A85A"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* S (dark brown) — on top */}
                <path
                  d="M 100,34 C 100,24 87,16 73,16 C 59,16 49,26 49,39 C 49,54 76,59 86,66 C 96,73 108,83 108,97 C 108,112 93,122 77,122 C 61,122 50,112 46,102"
                  fill="none"
                  stroke="#2C1A08"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Wordmark */}
              <p
                className="sc-wordmark"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 'clamp(10px, 1.2vw, 13px)',
                  fontWeight: 700,
                  letterSpacing: '0.30em',
                  paddingLeft: '0.30em',
                  textTransform: 'uppercase',
                  color: '#2C1A08',
                  textAlign: 'center',
                  margin: 'clamp(14px, 2.4vh, 22px) 0 0',
                }}
              >
                Stayscape
              </p>
            </div>
          </div>

          {/* Choice buttons */}
          <div
            className="sc-buttons"
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 'clamp(10px, 1.4vw, 14px)',
              marginTop: 'clamp(36px, 5.5vh, 54px)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => navigate('guests')}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 'clamp(12px, 1.1vw, 14px)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#FAF8F5',
                background: '#2C1A08',
                border: '1.5px solid transparent',
                borderRadius: '999px',
                padding: 'clamp(13px, 1.8vh, 17px) clamp(28px, 3.8vw, 44px)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'opacity 180ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.80')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              I'm a Guest
            </button>
            <button
              onClick={() => navigate('hotels')}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 'clamp(12px, 1.1vw, 14px)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#2C1A08',
                background: 'transparent',
                border: '1.5px solid rgba(44,26,8,0.28)',
                borderRadius: '999px',
                padding: 'clamp(13px, 1.8vh, 17px) clamp(28px, 3.8vw, 44px)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
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
              For Hotels
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sc-appear-anim {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes sc-float-anim {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes sc-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wipeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .sc-appear   { animation: sc-appear-anim 900ms cubic-bezier(0.34,1.12,0.64,1) both; }
        .sc-float    { animation: sc-float-anim 4.5s 900ms ease-in-out infinite; }
        .sc-wordmark { animation: sc-fade-up 600ms 480ms cubic-bezier(0.22,1,0.36,1) both; }
        .sc-buttons  { animation: sc-fade-up 600ms 750ms cubic-bezier(0.22,1,0.36,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .sc-appear, .sc-float, .sc-wordmark, .sc-buttons {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </>
  )
}
