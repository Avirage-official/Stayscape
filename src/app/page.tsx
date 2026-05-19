'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

type Beat = 'beat1' | 'beat2' | 'beat3' | 'dissolving' | 'idle'

// Gold line draw/shrink controlled via CSS class
// lineExit: true = shrink back to 0
const BEATS: { id: Beat; words: string[] }[] = [
  { id: 'beat1', words: ['Hi!', 'My', 'name', 'is', 'Aria.'] },
  { id: 'beat2', words: ['Welcome', 'to', 'Stayscape.'] },
  { id: 'beat3', words: ['Choose', 'your', 'side', '—', "I'll", 'show', 'you', 'around.'] },
]

export default function SplashPage() {
  const [hovered, setHovered] = useState<'hotels' | 'guests' | null>(null)
  const [beat, setBeat] = useState<Beat>('beat1')
  const [lineExit, setLineExit] = useState(false)
  const [lineKey, setLineKey] = useState(0)
  const [textVisible, setTextVisible] = useState(true)
  const [showGlow, setShowGlow] = useState(false)
  const [ariaBow, setAriaBow] = useState(false)
  const [rm, setRm] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const addTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setRm(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (rm) {
      // Reduced motion: each beat 1.5s hold, words all at once, no wave/bow/glow
      // beat1: 0–3s, beat2: 3–6s, beat3: 6–9s, dissolve 9–9.7s, idle 9.7s
      addTimer(() => { setLineExit(true); setTextVisible(false) }, 2600)
      addTimer(() => { setBeat('beat2'); setLineKey(k => k + 1); setLineExit(false); setTextVisible(true) }, 3000)
      addTimer(() => { setLineExit(true); setTextVisible(false) }, 5600)
      addTimer(() => { setBeat('beat3'); setLineKey(k => k + 1); setLineExit(false); setTextVisible(true) }, 6000)
      addTimer(() => { setLineExit(true); setTextVisible(false) }, 8600)
      addTimer(() => setBeat('dissolving'), 9000)
      addTimer(() => setBeat('idle'), 9700)
      return () => timers.current.forEach(clearTimeout)
    }

    // Full cinematic sequence
    // beat1: 0–2.6s
    addTimer(() => { setLineExit(true); setTextVisible(false) }, 2300)
    // transition to beat2 at 2.6s
    addTimer(() => {
      setBeat('beat2')
      setLineKey(k => k + 1)
      setLineExit(false)
      setTextVisible(true)
      setShowGlow(true)
    }, 2600)
    // glow fades itself (handled by CSS animation), just clean up state
    addTimer(() => setShowGlow(false), 4000)
    // beat2 exit at 4.9s
    addTimer(() => { setLineExit(true); setTextVisible(false) }, 4900)
    // transition to beat3 at 5.2s
    addTimer(() => {
      setBeat('beat3')
      setLineKey(k => k + 1)
      setLineExit(false)
      setTextVisible(true)
    }, 5200)
    // Aria bow starts at 5.5s
    addTimer(() => setAriaBow(true), 5500)
    addTimer(() => setAriaBow(false), 6550)
    // beat3 exit at 7.6s
    addTimer(() => { setLineExit(true); setTextVisible(false) }, 7600)
    // dissolve at 7.8s
    addTimer(() => setBeat('dissolving'), 7800)
    // idle at 8.5s
    addTimer(() => setBeat('idle'), 8500)

    return () => timers.current.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rm])

  const currentBeat = BEATS.find(b => b.id === beat)

  return (
    <>
      {/* ── Aria 3-beat cinematic overlay ────────────────────── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: beat === 'idle' ? 'none' : 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 'clamp(20px, 3vh, 36px)',
          background: 'var(--background)',
          opacity: beat === 'dissolving' ? 0 : 1,
          transform: beat === 'dissolving' ? 'scale(1.05)' : 'scale(1)',
          transition: 'opacity 700ms ease-in-out, transform 700ms ease-in-out',
          pointerEvents: beat !== 'beat1' && beat !== 'beat2' && beat !== 'beat3' ? 'none' : 'all',
        }}
      >
        {/* Gold horizontal line — re-keyed per beat so animation re-triggers */}
        <div
          key={lineKey}
          aria-hidden="true"
          className={lineExit ? 'aria-gold-line aria-gold-line-exit' : 'aria-gold-line aria-gold-line-enter'}
          style={{ height: '1px', background: 'rgba(201,168,117,0.55)' }}
        />

        {/* Aria figure */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Beat 2 radial glow — expands and fades */}
          {showGlow && !rm && (
            <div
              aria-hidden="true"
              className="aria-glow"
              style={{
                position: 'absolute',
                width: 'clamp(120px, 18vw, 200px)',
                height: 'clamp(120px, 18vw, 200px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(201,168,117,0.45) 0%, rgba(201,168,117,0) 70%)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Outer wrapper: entrance rise */}
          <div className={rm ? 'aria-no-enter' : 'aria-enter'}>
            {/* Bow wrapper: transform-origin bottom center */}
            <div
              className={(!rm && ariaBow) ? 'aria-bow-active' : 'aria-bow-rest'}
              style={{ transformOrigin: 'bottom center' }}
            >
              <svg
                viewBox="0 0 100 112"
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: 'clamp(80px, 12vw, 140px)',
                  height: 'auto',
                  overflow: 'visible',
                }}
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

                {/* Eyes closed */}
                <g className={rm ? '' : 'aria-blink-closed'}>
                  <line x1="44" y1="24.5" x2="49" y2="24.5" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="51" y1="24.5" x2="56" y2="24.5" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Neck + torso */}
                <line x1="50" y1="36" x2="50" y2="63" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />

                {/* Left arm — static */}
                <line x1="50" y1="44" x2="28" y2="55" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />

                {/* Right arm — wave once on beat 1 only */}
                <g
                  className={(!rm && beat === 'beat1') ? 'aria-wave' : ''}
                  style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }}
                >
                  <line x1="50" y1="44" x2="72" y2="55" stroke="#C9A875" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Bell skirt */}
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
        </div>

        {/* Beat text — word-by-word stagger, collective fade-out */}
        {currentBeat && (
          <p
            key={currentBeat.id}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(1.3rem, 2.8vw, 2.4rem)',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              maxWidth: 'clamp(260px, 60vw, 720px)',
              textAlign: 'center',
              margin: 0,
              opacity: textVisible ? 1 : 0,
              transition: 'opacity 300ms ease-in-out',
            }}
          >
            {currentBeat.words.map((word, i) => (
              <span
                key={`${currentBeat.id}-${i}`}
                className="aria-word"
                style={{
                  animationDelay: rm ? '0.1s' : `${(beat === 'beat1' ? 0.8 : beat === 'beat2' ? 0.4 : 0.6) + i * 0.26}s`,
                  animationDuration: rm ? '300ms' : '500ms',
                }}
              >
                {word}{i < currentBeat.words.length - 1 ? '\u00a0' : ''}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* ── Two-halves layout ────────────────────────────────── */}
      <div
        className="splash-wrap"
        style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden', height: '100dvh' }}
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
            fontStyle: 'italic',
            fontSize: 'clamp(13px, 1.2vw, 18px)',
            fontWeight: 600,
            color: 'rgba(245,230,204,0.9)',
            letterSpacing: '0.01em',
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
          style={{
            flex: '0 0 50%', height: '100dvh', position: 'relative',
            overflow: 'hidden', display: 'block', textDecoration: 'none', cursor: 'pointer',
          }}
          onMouseEnter={() => setHovered('hotels')}
          onMouseLeave={() => setHovered(null)}
        >
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
          {/* Centered text block */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 2,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center',
              padding: 'clamp(40px, 8vh, 96px) clamp(24px, 4vw, 56px)',
            }}
          >
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(10px, 1.4vw, 12px)',
              fontWeight: 600, color: 'var(--gold)',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              margin: '0 0 clamp(14px, 2vh, 22px)',
            }}>
              For Hotels
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 4vw, 4rem)',
              fontWeight: 500, color: 'var(--text-primary)',
              lineHeight: 1.15, margin: 0,
              maxWidth: 'clamp(260px, 28vw, 460px)',
            }}>
              Run a better property.
            </p>
          </div>
          {/* Chevron — bottom right */}
          <div style={{
            position: 'absolute', bottom: 'clamp(20px, 3vh, 36px)', right: 'clamp(20px, 3vw, 36px)',
            zIndex: 3,
            transform: hovered === 'hotels' ? 'translateX(6px)' : 'translateX(0)',
            transition: 'transform 280ms ease-out',
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(28px, 3vw, 36px)',
              color: 'var(--gold)', lineHeight: 1, opacity: 0.85,
            }}>›</span>
          </div>
        </Link>

        {/* Gold seam */}
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
          style={{
            flex: '0 0 50%', height: '100dvh', position: 'relative',
            overflow: 'hidden', display: 'block', textDecoration: 'none', cursor: 'pointer',
          }}
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
          {/* Centered text block */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 2,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center',
              padding: 'clamp(40px, 8vh, 96px) clamp(24px, 4vw, 56px)',
            }}
          >
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(10px, 1.4vw, 12px)',
              fontWeight: 600, color: 'var(--gold)',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              margin: '0 0 clamp(14px, 2vh, 22px)',
            }}>
              For Guests
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 4vw, 4rem)',
              fontWeight: 500, color: 'var(--text-primary)',
              lineHeight: 1.15, margin: 0,
              maxWidth: 'clamp(260px, 28vw, 460px)',
            }}>
              Step into your stay.
            </p>
          </div>
          {/* Chevron — bottom right */}
          <div style={{
            position: 'absolute', bottom: 'clamp(20px, 3vh, 36px)', right: 'clamp(20px, 3vw, 36px)',
            zIndex: 3,
            transform: hovered === 'guests' ? 'translateX(6px)' : 'translateX(0)',
            transition: 'transform 280ms ease-out',
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(28px, 3vw, 36px)',
              color: 'var(--gold)', lineHeight: 1, opacity: 0.85,
            }}>›</span>
          </div>
        </Link>
      </div>

      <style>{`
        /* ── Gold line: draw in and shrink out ─────────────── */
        @keyframes goldLineDraw {
          from { width: 0; }
          to   { width: clamp(220px, 38vw, 520px); }
        }
        @keyframes goldLineShrink {
          from { width: clamp(220px, 38vw, 520px); }
          to   { width: 0; }
        }
        .aria-gold-line {
          position: relative;
          /* vertically centered in the flex column via gap */
        }
        .aria-gold-line-enter {
          animation: goldLineDraw 900ms ease-out forwards;
        }
        .aria-gold-line-exit {
          animation: goldLineShrink 500ms ease-in forwards;
        }

        /* ── Aria glow: expand and fade ─────────────────────── */
        @keyframes ariaGlowExpand {
          0%   { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        .aria-glow {
          animation: ariaGlowExpand 1100ms ease-out forwards;
        }

        /* ── Aria entrance rise ──────────────────────────────── */
        @keyframes ariaRise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .aria-enter { animation: ariaRise 700ms ease-out both; }
        .aria-no-enter { opacity: 1; }

        /* ── Aria bow ────────────────────────────────────────── */
        @keyframes ariaBowAnim {
          0%   { transform: rotate(0deg); }
          46%  { transform: rotate(14deg); }
          60%  { transform: rotate(14deg); }
          100% { transform: rotate(0deg); }
        }
        .aria-bow-active {
          animation: ariaBowAnim 1250ms ease-in-out forwards;
          transform-origin: bottom center;
        }
        .aria-bow-rest { transform: rotate(0deg); }

        /* ── Aria halo pulse ─────────────────────────────────── */
        @keyframes haloPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        .aria-halo {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          animation: haloPulse 2.4s ease-in-out infinite;
        }

        /* ── Bell sway ───────────────────────────────────────── */
        @keyframes bellSway {
          0%, 100% { transform: rotate(-2deg); }
          50%       { transform: rotate(2deg); }
        }
        .aria-bell {
          transform-box: fill-box;
          transform-origin: 50% 0%;
          animation: bellSway 3s ease-in-out infinite;
        }

        /* ── Arm wave — beat 1 only, 2 slow swings ───────────── */
        @keyframes ariaWave {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(-12deg); }
          40%  { transform: rotate(18deg); }
          65%  { transform: rotate(-10deg); }
          85%  { transform: rotate(14deg); }
          100% { transform: rotate(0deg); }
        }
        .aria-wave {
          transform-box: fill-box;
          transform-origin: 0% 0%;
          animation: ariaWave 2s 0.9s ease-in-out 1 both;
        }

        /* ── Blink ────────────────────────────────────────────── */
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
        .aria-blink-open  { animation: ariaBlinkO 3.5s 1.6s ease-in-out infinite; }
        .aria-blink-closed {
          opacity: 0;
          animation: ariaBlinkC 3.5s 1.6s ease-in-out infinite;
        }

        /* ── Word reveal ─────────────────────────────────────── */
        @keyframes ariaWordReveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .aria-word {
          display: inline-block;
          opacity: 0;
          animation-name: ariaWordReveal;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }

        /* ── Reduced-motion overrides ────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .aria-halo, .aria-bell, .aria-wave,
          .aria-blink-open, .aria-blink-closed,
          .aria-bow-active, .aria-glow,
          .aria-enter { animation: none !important; }
          .aria-blink-closed { opacity: 0 !important; }
          .aria-gold-line-enter {
            animation: goldLineDraw 1800ms ease-out forwards !important;
          }
          .aria-gold-line-exit {
            animation: goldLineShrink 1000ms ease-in forwards !important;
          }
          .aria-word {
            animation-delay: 0.1s !important;
            animation-duration: 300ms !important;
          }
        }

        /* ── Mobile: stack halves vertically (<768px) ─────────── */
        @media (max-width: 767px) {
          .splash-wrap  { flex-direction: column !important; overflow: hidden !important; }
          .splash-half  {
            flex: 0 0 50dvh !important;
            height: 50dvh !important;
            width: 100vw !important;
          }
          .splash-seam {
            left: 0 !important; right: 0 !important;
            top: 50dvh !important; bottom: auto !important;
            width: 100vw !important; height: 1px !important;
            transform: none !important;
            background: linear-gradient(to right,
              transparent 0%, rgba(201,168,117,0.45) 20%,
              rgba(201,168,117,0.45) 80%, transparent 100%) !important;
          }
        }
      `}</style>
    </>
  )
}
