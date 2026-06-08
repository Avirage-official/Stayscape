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

        {/* ── Background layers ──────────────────────────────── */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

          {/*
           * Aurora blobs: solid colour + filter:blur() creates an organic Gaussian
           * spread (how Stripe/Vercel/Linear do it) vs. mathematical gradient falloff.
           * will-change:transform promotes each blob to its own GPU compositing layer.
           */}
          <div className="sc-blob sc-blob-top" />
          <div className="sc-blob sc-blob-bl" />
          <div className="sc-blob sc-blob-tr" />

          {/* Edge vignette — frames content, draws eye inward */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 96% 92% at 50% 48%, transparent 36%, rgba(30,16,4,0.07) 100%)',
          }} />

          {/*
           * Film grain: tiled SVG feTurbulence as CSS background-image (300×300,
           * seamless via stitchTiles="stitch"). mix-blend-mode:soft-light merges
           * the grayscale noise into the cream surface — looks like paper/linen
           * rather than a static overlay. This is the CSS-Tricks canonical technique.
           */}
          <div className="sc-grain" />
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}>

          {/* Outer: opacity + scale appear once */}
          <div className="sc-appear">
            {/* Inner: infinite float — separate div keeps translateY off the appear's scale */}
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

          {/*
           * Activity-based labels (NN/G research: identity labels — "I'm a Guest" —
           * cause friction; task labels — "Find a Stay" — resolve intent immediately).
           * Primary filled button = guest (majority user type, guest-first per Airbnb model).
           * Ghost outline = hotel managers (secondary path, subordinate visual weight).
           */}
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
              Find a Stay
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
              Manage a Property
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Aurora blobs ─────────────────────────────────────────
         * Solid colour + filter:blur() = organic Gaussian spread.
         * Pure radial-gradient has a mathematical falloff that looks
         * synthetic by comparison.
         * ──────────────────────────────────────────────────────── */
        .sc-blob {
          position: absolute;
          border-radius: 50%;
          will-change: transform;
        }
        .sc-blob-top {
          top: -15%; left: 50%; transform: translateX(-50%);
          width: clamp(280px, 68vmax, 860px);
          height: clamp(240px, 58vmax, 720px);
          background: rgba(200,168,90,0.52);
          filter: blur(100px);
        }
        .sc-blob-bl {
          bottom: -20%; left: -10%;
          width: clamp(180px, 48vmax, 580px);
          height: clamp(180px, 48vmax, 580px);
          background: rgba(180,110,42,0.38);
          filter: blur(90px);
        }
        .sc-blob-tr {
          top: -8%; right: -8%;
          width: clamp(140px, 36vmax, 460px);
          height: clamp(140px, 36vmax, 460px);
          background: rgba(200,168,90,0.28);
          filter: blur(85px);
        }

        /* ── Film grain ───────────────────────────────────────────
         * Tiled SVG feTurbulence (300×300, seamless via stitchTiles).
         * mix-blend-mode:soft-light merges grain into the cream
         * surface optically — unlike plain opacity which just layers
         * transparent static on top. (CSS-Tricks canonical technique.)
         * ──────────────────────────────────────────────────────── */
        .sc-grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E");
          background-size: 300px 300px;
          background-repeat: repeat;
          mix-blend-mode: soft-light;
          opacity: 0.72;
          pointer-events: none;
        }

        /* ── Monogram animations ──────────────────────────────── */
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
