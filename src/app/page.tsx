'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

type Phase = 'intro' | 'dissolving' | 'idle'

const WORDS = [
  'Hello!', 'Welcome', 'to', 'Stayscape.', "I'm", 'Aria', '—',
  'choose', 'the', 'side', 'that', 'fits', 'you,', 'and', "I'll", 'show', 'you', 'around.',
]

export default function SplashPage() {
  const [hovered, setHovered] = useState<'hotels' | 'guests' | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [rm, setRm] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time media query read
  useEffect(() => { setRm(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = []
    if (!rm) {
      t.push(setTimeout(() => setPhase('dissolving'), 4700))
      t.push(setTimeout(() => setPhase('idle'), 5500))
    } else {
      t.push(setTimeout(() => setPhase('dissolving'), 2100))
      t.push(setTimeout(() => setPhase('idle'), 2500))
    }
    return () => t.forEach(clearTimeout)
  }, [rm])

  return (
    <>
      {/* ── Aria entrance overlay ─────────────────────────── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: phase === 'idle' ? 'none' : 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '28px',
          background: 'var(--background)',
          opacity: phase === 'intro' ? 1 : 0,
          transform: phase === 'dissolving' ? 'scale(1.04)' : 'scale(1)',
          transition: 'opacity 800ms ease-in-out, transform 800ms ease-in-out',
          pointerEvents: phase !== 'intro' ? 'none' : 'all',
        }}
      >
        {/* Thin gold divider above Aria */}
        <div aria-hidden="true" style={{ width: '32px', height: '1px', background: 'rgba(201,168,117,0.6)' }} />

        {/* Aria figure — outer wrapper: entrance rise, inner: perpetual bob */}
        <div className={rm ? 'aria-no-enter' : 'aria-enter'}>
          <div className={rm ? '' : 'aria-bob'}>
            <svg
              viewBox="0 0 100 112"
              aria-hidden="true"
              style={{ display: 'block', width: 'clamp(80px, 12vw, 140px)', height: 'auto', overflow: 'visible' }}
            >
              <defs>
                <radialGradient id="aria-halo-g" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(201,168,117,0.22)" />
                  <stop offset="100%" stopColor="rgba(201,168,117,0)" />
                </radialGradient>
              </defs>

              {/* Halo */}
              <circle cx="50" cy="60" r="52" fill="url(#aria-halo-g)" className={rm ? '' : 'aria-halo'} />

              {/* Head */}
              <circle cx="50" cy="26" r="10" stroke="#C9A875" strokeWidth="1.5" fill="none" />

              {/* Eyes open */}
              <g className={rm ? '' : 'aria-blink-open'}>
                <path d="M 44 24.5 Q 46.5 22.5 49 24.5" stroke="#C9A875" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 51 24.5 Q 53.5 22.5 56 24.5" stroke="#C9A875" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>

              {/* Eyes closed — blink state */}
              <g className={rm ? '' : 'aria-blink-closed'}>
                <line x1="44" y1="24.5" x2="49" y2="24.5" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="51" y1="24.5" x2="56" y2="24.5" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Neck + torso */}
              <line x1="50" y1="36" x2="50" y2="63" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />

              {/* Left arm — static */}
              <line x1="50" y1="44" x2="28" y2="55" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />

              {/* Right arm — wave once at 0.9s */}
              <g className={rm ? '' : 'aria-wave'}>
                <line x1="50" y1="44" x2="72" y2="55" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Bell skirt + rim */}
              <g className={rm ? '' : 'aria-bell'}>
                <path
                  d="M 48 63 C 48 71, 22 82, 18 97 L 82 97 C 78 82, 52 71, 52 63 Z"
                  stroke="#C9A875" strokeWidth="1.5" fill="rgba(201,168,117,0.08)" strokeLinejoin="round"
                />
                <line x1="22" y1="94" x2="78" y2="94" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Feet */}
              <circle cx="43" cy="101" r="1.5" fill="#C9A875" />
              <circle cx="57" cy="101" r="1.5" fill="#C9A875" />
            </svg>
          </div>
        </div>

        {/* Aria headline — word by word */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            maxWidth: '22ch',
            textAlign: 'center',
            margin: 0,
          }}
        >
          {WORDS.map((word, i) => (
            <span
              key={i}
              className="aria-word"
              style={{
                animationDelay: rm ? '0.2s' : `${1.0 + i * 0.14}s`,
                animationDuration: rm ? '400ms' : '220ms',
              }}
            >
              {word}{i < WORDS.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>

      {/* ── Two-halves layout ─────────────────────────────── */}
      <div
        className="splash-wrap"
        style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'row' }}
      >
        {/* Wordmark — centered above both halves */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '22px', display: 'flex', justifyContent: 'center',
            zIndex: 20, pointerEvents: 'none',
          }}
        >
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontSize: '18px', fontWeight: 600,
            color: 'rgba(245,230,204,0.9)', letterSpacing: '0.01em',
          }}>
            Stay
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontWeight: 600, color: 'rgba(201,168,117,0.88)' }}>
              scape
            </span>
          </span>
        </div>

        {/* Hotels half */}
        <Link
          href="/hotels"
          className="splash-half"
          style={{ flex: '0 0 50%', height: '100vh', position: 'relative', overflow: 'hidden', display: 'block', textDecoration: 'none', cursor: 'pointer' }}
          onMouseEnter={() => setHovered('hotels')}
          onMouseLeave={() => setHovered(null)}
        >
          {/*
            Video files to upload to /public/videos/ later:
              - splash-hotels.mp4 → cinematic hotel lobby / reception / property exterior, 8–15s loop, ~5MB max
              - splash-guests.mp4 → traveler arriving / opening hotel room curtain / city skyline, 8–15s loop, ~5MB max
          */}
          <video
            autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0,
              filter: hovered === 'guests' ? 'saturate(0.5)' : 'saturate(1)',
              transition: 'filter 280ms ease-out',
            }}
          >
            <source src="/videos/splash-hotels.mp4" type="video/mp4" />
          </video>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: hovered === 'guests'
                ? 'linear-gradient(180deg, rgba(20,16,13,0.40) 0%, rgba(20,16,13,0.55) 50%, rgba(20,16,13,0.92) 100%)'
                : 'linear-gradient(180deg, rgba(20,16,13,0.40) 0%, rgba(20,16,13,0.55) 50%, rgba(20,16,13,0.78) 100%)',
              transition: 'background 280ms ease-out',
            }}
          />
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 2,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: 'clamp(32px, 5vw, 80px)',
            }}
          >
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                For Hotels
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(2.4rem, 4.2vw, 4rem)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.15, margin: 0 }}>
                Run a better property.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', transform: hovered === 'hotels' ? 'translateX(6px)' : 'translateX(0)', transition: 'transform 280ms ease-out' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '32px', color: 'var(--gold)', lineHeight: 1, opacity: 0.85 }}>›</span>
            </div>
          </div>
        </Link>

        {/* Gold seam between halves */}
        <div
          aria-hidden="true"
          className="splash-seam"
          style={{
            position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px',
            transform: 'translateX(-0.5px)',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,117,0.45) 15%, rgba(201,168,117,0.45) 85%, transparent 100%)',
            zIndex: 15, pointerEvents: 'none',
          }}
        />

        {/* Guests half */}
        <Link
          href="/guests"
          className="splash-half"
          style={{ flex: '0 0 50%', height: '100vh', position: 'relative', overflow: 'hidden', display: 'block', textDecoration: 'none', cursor: 'pointer' }}
          onMouseEnter={() => setHovered('guests')}
          onMouseLeave={() => setHovered(null)}
        >
          <video
            autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0,
              filter: hovered === 'hotels' ? 'saturate(0.5)' : 'saturate(1)',
              transition: 'filter 280ms ease-out',
            }}
          >
            <source src="/videos/splash-guests.mp4" type="video/mp4" />
          </video>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: hovered === 'hotels'
                ? 'linear-gradient(180deg, rgba(20,16,13,0.40) 0%, rgba(20,16,13,0.55) 50%, rgba(20,16,13,0.92) 100%)'
                : 'linear-gradient(180deg, rgba(20,16,13,0.40) 0%, rgba(20,16,13,0.55) 50%, rgba(20,16,13,0.78) 100%)',
              transition: 'background 280ms ease-out',
            }}
          />
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 2,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: 'clamp(32px, 5vw, 80px)',
            }}
          >
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                For Guests
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(2.4rem, 4.2vw, 4rem)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.15, margin: 0 }}>
                Step into your stay.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', transform: hovered === 'guests' ? 'translateX(6px)' : 'translateX(0)', transition: 'transform 280ms ease-out' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '32px', color: 'var(--gold)', lineHeight: 1, opacity: 0.85 }}>›</span>
            </div>
          </div>
        </Link>
      </div>

      <style>{`
        /* ── Aria keyframes ──────────────────────────────────── */
        @keyframes ariaRise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ariaBob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-3px); }
        }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes bellSway {
          0%, 100% { transform: rotate(-2deg); }
          50%       { transform: rotate(2deg); }
        }
        @keyframes ariaWave {
          0%   { transform: rotate(0deg); }
          20%  { transform: rotate(-10deg); }
          40%  { transform: rotate(20deg); }
          60%  { transform: rotate(-10deg); }
          80%  { transform: rotate(20deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes ariaBlinkO {
          0%, 87%  { opacity: 1; }
          90%, 95% { opacity: 0; }
          100%     { opacity: 1; }
        }
        @keyframes ariaBlinkC {
          0%, 87%  { opacity: 0; }
          90%, 95% { opacity: 1; }
          100%     { opacity: 0; }
        }
        @keyframes ariaWordReveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Aria animation classes ─────────────────────────── */
        .aria-enter { animation: ariaRise 800ms ease-out both; }
        .aria-no-enter { opacity: 1; }
        .aria-bob  { animation: ariaBob 2.6s 0.8s ease-in-out infinite; }

        .aria-halo {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          animation: haloPulse 2.4s ease-in-out infinite;
        }
        .aria-bell {
          transform-box: fill-box;
          transform-origin: 50% 0%;
          animation: bellSway 3s ease-in-out infinite;
        }
        .aria-wave {
          transform-box: fill-box;
          transform-origin: 0% 0%;
          animation: ariaWave 1.6s 0.9s ease-in-out 1 both;
        }
        .aria-blink-open  { animation: ariaBlinkO 3.5s 1.8s ease-in-out infinite; }
        .aria-blink-closed {
          opacity: 0;
          animation: ariaBlinkC 3.5s 1.8s ease-in-out infinite;
        }

        /* ── Word reveal ─────────────────────────────────────── */
        .aria-word {
          display: inline;
          opacity: 0;
          animation-name: ariaWordReveal;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }

        /* ── Reduced-motion overrides ───────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .aria-halo, .aria-bell, .aria-wave,
          .aria-blink-open, .aria-blink-closed,
          .aria-bob, .aria-enter { animation: none !important; }
          .aria-blink-closed { opacity: 0 !important; }
          .aria-word {
            animation-delay: 0.2s !important;
            animation-duration: 400ms !important;
          }
        }

        /* ── Mobile: stack halves vertically ────────────────── */
        @media (max-width: 767px) {
          .splash-wrap  { flex-direction: column !important; }
          .splash-half  { flex: 0 0 50vh !important; height: 50vh !important; }
          .splash-seam  {
            left: 0 !important; right: 0 !important;
            top: 50vh !important; bottom: auto !important;
            width: 100% !important; height: 1px !important;
            transform: none !important;
            background: linear-gradient(to right,
              transparent 0%, rgba(201,168,117,0.45) 15%,
              rgba(201,168,117,0.45) 85%, transparent 100%) !important;
          }
        }
      `}</style>
    </>
  )
}
