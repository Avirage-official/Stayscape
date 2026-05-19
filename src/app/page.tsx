'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

type Beat = 'beat1' | 'beat2' | 'beat3' | 'dissolving' | 'idle'

const BEATS: { id: Beat; words: string[] }[] = [
  { id: 'beat1', words: ['Hi!', 'My', 'name', 'is', 'Aria.'] },
  { id: 'beat2', words: ['Welcome', 'to', 'Stayscape!'] },
  { id: 'beat3', words: ['Pick', 'a', 'side', 'and', 'let', 'me', 'show', 'you', 'around.'] },
]

const POP_CLASSES = ['word-pop-up', 'word-pop-left', 'word-pop-right', 'word-pop-down']
function popClass(i: number) { return POP_CLASSES[i % POP_CLASSES.length] }

export default function SplashPage() {
  const router = useRouter()
  const [hovered, setHovered] = useState<'hotels' | 'guests' | null>(null)
  const [beat, setBeat] = useState<Beat>('beat1')
  const [lineExit, setLineExit] = useState(false)
  const [lineKey, setLineKey] = useState(0)
  const [textVisible, setTextVisible] = useState(true)
  const [showGlow, setShowGlow] = useState(false)
  const [ariaBow, setAriaBow] = useState(false)
  const [rm, setRm] = useState(false)
  const [leaving, setLeaving] = useState<'hotels' | 'guests' | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const t = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }

  useEffect(() => { setRm(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (rm) {
      t(() => { setLineExit(true); setTextVisible(false) }, 1800)
      t(() => { setBeat('beat2'); setLineKey(k => k+1); setLineExit(false); setTextVisible(true) }, 2100)
      t(() => { setLineExit(true); setTextVisible(false) }, 3900)
      t(() => { setBeat('beat3'); setLineKey(k => k+1); setLineExit(false); setTextVisible(true) }, 4200)
      t(() => { setLineExit(true); setTextVisible(false) }, 6500)
      t(() => setBeat('dissolving'), 6700)
      t(() => setBeat('idle'), 7200)
      return () => timers.current.forEach(clearTimeout)
    }

    t(() => { setLineExit(true); setTextVisible(false) }, 1900)
    t(() => {
      setBeat('beat2'); setLineKey(k => k+1)
      setLineExit(false); setTextVisible(true); setShowGlow(true)
    }, 2200)
    t(() => setShowGlow(false), 3400)
    t(() => { setLineExit(true); setTextVisible(false) }, 3900)
    t(() => {
      setBeat('beat3'); setLineKey(k => k+1)
      setLineExit(false); setTextVisible(true)
    }, 4200)
    t(() => setAriaBow(true), 4400)
    t(() => setAriaBow(false), 5400)
    // hold beat3 a bit longer so the longer phrase lands
    t(() => { setLineExit(true); setTextVisible(false) }, 6600)
    t(() => setBeat('dissolving'), 6850)
    t(() => setBeat('idle'), 7500)

    return () => timers.current.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rm])

  const currentBeat = BEATS.find(b => b.id === beat)

  const wordDelay = (beatId: Beat, i: number) => {
    if (beatId === 'beat1') return 0.55 + i * 0.07
    if (beatId === 'beat2') return 0.18 + i * 0.07
    // beat3 has 9 words — keep tight
    return 0.20 + i * 0.055
  }

  // Smooth navigate with full-screen cream wipe
  function navigate(dest: 'hotels' | 'guests') {
    if (leaving) return
    setLeaving(dest)
    // Brief pause then push — the cream overlay covers the transition
    setTimeout(() => router.push(`/${dest}`), 420)
  }

  return (
    <>
      {/* Aria overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: beat === 'idle' ? 'none' : 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 'clamp(16px, 2.5vh, 28px)',
          background: '#FAF8F5',
          opacity: beat === 'dissolving' ? 0 : 1,
          transform: beat === 'dissolving' ? 'scale(1.04)' : 'scale(1)',
          transition: 'opacity 500ms ease-in, transform 500ms ease-in',
          pointerEvents: beat === 'dissolving' ? 'none' : 'all',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(201,168,117,0.13) 0%, transparent 70%)',
        }} />

        <div
          key={lineKey} aria-hidden="true"
          className={lineExit ? 'aria-gold-line aria-gold-line-exit' : 'aria-gold-line aria-gold-line-enter'}
          style={{ height: '1.5px', background: 'rgba(193,127,58,0.6)', position: 'relative', zIndex: 1 }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          {showGlow && !rm && (
            <div aria-hidden="true" className="aria-glow" style={{
              position: 'absolute',
              width: 'clamp(100px, 16vw, 180px)', height: 'clamp(100px, 16vw, 180px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,168,117,0.5) 0%, rgba(201,168,117,0) 70%)',
              pointerEvents: 'none',
            }} />
          )}
          <div className={rm ? 'aria-no-enter' : 'aria-enter'}>
            <div className={(!rm && ariaBow) ? 'aria-bow-active' : 'aria-bow-rest'} style={{ transformOrigin: 'bottom center' }}>
              <svg viewBox="0 0 100 112" aria-hidden="true" style={{ display: 'block', width: 'clamp(76px, 11vw, 130px)', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <radialGradient id="aria-halo-g" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(201,168,117,0.28)" />
                    <stop offset="100%" stopColor="rgba(201,168,117,0)" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="60" r="52" fill="url(#aria-halo-g)" className={rm ? '' : 'aria-halo'} />
                <circle cx="50" cy="26" r="10" stroke="#C17F3A" strokeWidth="1.6" fill="none" />
                <g className={rm ? '' : 'aria-blink-open'}>
                  <path d="M 44 24.5 Q 46.5 22.5 49 24.5" stroke="#C17F3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M 51 24.5 Q 53.5 22.5 56 24.5" stroke="#C17F3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </g>
                <g className={rm ? '' : 'aria-blink-closed'}>
                  <line x1="44" y1="24.5" x2="49" y2="24.5" stroke="#C17F3A" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="51" y1="24.5" x2="56" y2="24.5" stroke="#C17F3A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <line x1="50" y1="36" x2="50" y2="63" stroke="#C17F3A" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="50" y1="44" x2="28" y2="55" stroke="#C17F3A" strokeWidth="1.5" strokeLinecap="round" />
                <g className={(!rm && beat === 'beat1') ? 'aria-wave' : ''} style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }}>
                  <line x1="50" y1="44" x2="72" y2="55" stroke="#C17F3A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <g className={rm ? '' : 'aria-bell'}>
                  <path d="M 48 63 C 48 71, 22 82, 18 97 L 82 97 C 78 82, 52 71, 52 63 Z" stroke="#C17F3A" strokeWidth="1.5" fill="rgba(193,127,58,0.07)" strokeLinejoin="round" />
                  <line x1="22" y1="94" x2="78" y2="94" stroke="#C17F3A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <circle cx="43" cy="101" r="1.5" fill="#C17F3A" />
                <circle cx="57" cy="101" r="1.5" fill="#C17F3A" />
              </svg>
            </div>
          </div>
        </div>

        {currentBeat && (
          <p
            key={currentBeat.id}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(1.35rem, 3vw, 2.6rem)',
              color: '#2C1A08',
              lineHeight: 1.35,
              maxWidth: 'clamp(260px, 70vw, 780px)',
              textAlign: 'center',
              margin: 0,
              opacity: textVisible ? 1 : 0,
              transition: 'opacity 250ms ease-in',
              position: 'relative', zIndex: 1,
            }}
          >
            {currentBeat.words.map((word, i) => (
              <span
                key={`${currentBeat.id}-${i}`}
                className={`aria-word ${popClass(i)}`}
                style={{
                  animationDelay: rm ? '0.05s' : `${wordDelay(currentBeat.id, i)}s`,
                  animationDuration: rm ? '250ms' : '420ms',
                }}
              >
                {word}{i < currentBeat.words.length - 1 ? '\u00a0' : ''}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Full-screen cream wipe on click */}
      {leaving && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: leaving === 'guests' ? '#FAF8F5' : '#0A0908',
            animation: 'wipeIn 400ms cubic-bezier(0.4,0,0.2,1) forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Two-halves layout */}
      <div
        className="splash-wrap"
        style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden', height: '100dvh' }}
      >
        {/* Wordmark */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '20px', display: 'flex', justifyContent: 'center',
          zIndex: 20, pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(13px, 1.2vw, 18px)',
            fontWeight: 600,
            color: 'rgba(245,230,204,0.95)',
            letterSpacing: '0.01em',
          }}>
            Stay<span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontWeight: 600, color: 'rgba(201,168,117,0.9)' }}>scape</span>
          </span>
        </div>

        {/* Hotels half */}
        <button
          className="splash-half"
          onClick={() => navigate('hotels')}
          onMouseEnter={() => setHovered('hotels')}
          onMouseLeave={() => setHovered(null)}
          style={{
            flex: '0 0 50%', height: '100dvh', position: 'relative', overflow: 'hidden',
            display: 'block', border: 'none', padding: 0, cursor: 'pointer', background: 'none',
          }}
        >
          <video
            autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0,
              filter: hovered === 'guests' ? 'saturate(0.45) brightness(0.8)' : 'saturate(1.05)',
              transition: 'filter 300ms ease-out',
            }}
          >
            <source src="/videos/splash-hotels.mp4" type="video/mp4" />
          </video>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: hovered === 'hotels'
              ? 'linear-gradient(180deg, rgba(14,10,6,0.25) 0%, rgba(14,10,6,0.38) 50%, rgba(14,10,6,0.72) 100%)'
              : 'linear-gradient(180deg, rgba(14,10,6,0.35) 0%, rgba(14,10,6,0.48) 50%, rgba(14,10,6,0.80) 100%)',
            transition: 'background 300ms ease-out',
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            padding: 'clamp(40px, 8vh, 96px) clamp(24px, 4vw, 56px)',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(10px, 1.4vw, 12px)',
              fontWeight: 700, color: 'rgba(201,168,117,0.95)',
              letterSpacing: '0.24em', textTransform: 'uppercase',
              margin: '0 0 clamp(12px, 2vh, 20px)',
            }}>For Hotels</p>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 4vw, 4rem)',
              fontWeight: 500, color: '#FAF8F5',
              lineHeight: 1.12, margin: 0,
              maxWidth: 'clamp(240px, 26vw, 440px)',
            }}>Run a better property.</p>
          </div>
          <div style={{
            position: 'absolute', bottom: 'clamp(18px, 3vh, 32px)', right: 'clamp(18px, 3vw, 32px)',
            zIndex: 3,
            transform: hovered === 'hotels' ? 'translateX(8px)' : 'translateX(0)',
            transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(26px, 3vw, 34px)', color: 'rgba(201,168,117,0.9)', lineHeight: 1 }}>›</span>
          </div>
        </button>

        {/* Gold seam */}
        <div aria-hidden="true" className="splash-seam" style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px',
          transform: 'translateX(-0.5px)',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,117,0.5) 15%, rgba(201,168,117,0.5) 85%, transparent 100%)',
          zIndex: 15, pointerEvents: 'none',
        }} />

        {/* Guests half */}
        <button
          className="splash-half"
          onClick={() => navigate('guests')}
          onMouseEnter={() => setHovered('guests')}
          onMouseLeave={() => setHovered(null)}
          style={{
            flex: '0 0 50%', height: '100dvh', position: 'relative', overflow: 'hidden',
            display: 'block', border: 'none', padding: 0, cursor: 'pointer', background: 'none',
          }}
        >
          {/* Guests video */}
          <video
            autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0,
              filter: hovered === 'hotels' ? 'saturate(0.45) brightness(0.8)' : 'saturate(1.05)',
              transition: 'filter 300ms ease-out',
            }}
          >
            <source src="/videos/splash-guests.mp4" type="video/mp4" />
          </video>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: hovered === 'guests'
              ? 'linear-gradient(180deg, rgba(14,10,6,0.25) 0%, rgba(14,10,6,0.38) 50%, rgba(14,10,6,0.72) 100%)'
              : 'linear-gradient(180deg, rgba(14,10,6,0.35) 0%, rgba(14,10,6,0.48) 50%, rgba(14,10,6,0.80) 100%)',
            transition: 'background 300ms ease-out',
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            padding: 'clamp(40px, 8vh, 96px) clamp(24px, 4vw, 56px)',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(10px, 1.4vw, 12px)',
              fontWeight: 700, color: 'rgba(201,168,117,0.95)',
              letterSpacing: '0.24em', textTransform: 'uppercase',
              margin: '0 0 clamp(12px, 2vh, 20px)',
            }}>For Guests</p>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 4vw, 4rem)',
              fontWeight: 500, color: '#FAF8F5',
              lineHeight: 1.12, margin: 0,
              maxWidth: 'clamp(240px, 26vw, 440px)',
            }}>Step into your stay.</p>
          </div>
          <div style={{
            position: 'absolute', bottom: 'clamp(18px, 3vh, 32px)', right: 'clamp(18px, 3vw, 32px)',
            zIndex: 3,
            transform: hovered === 'guests' ? 'translateX(8px)' : 'translateX(0)',
            transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(26px, 3vw, 34px)', color: 'rgba(201,168,117,0.9)', lineHeight: 1 }}>›</span>
          </div>
        </button>
      </div>

      <style>{`
        @keyframes wipeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes goldLineDraw {
          from { width: 0; }
          to   { width: clamp(200px, 36vw, 500px); }
        }
        @keyframes goldLineShrink {
          from { width: clamp(200px, 36vw, 500px); }
          to   { width: 0; }
        }
        .aria-gold-line-enter { animation: goldLineDraw 700ms cubic-bezier(0.22,1,0.36,1) forwards; }
        .aria-gold-line-exit  { animation: goldLineShrink 380ms ease-in forwards; }

        @keyframes ariaGlowExpand {
          0%   { transform: scale(0); opacity: 0.7; }
          100% { transform: scale(4); opacity: 0; }
        }
        .aria-glow { animation: ariaGlowExpand 900ms ease-out forwards; }

        @keyframes ariaRise {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .aria-enter    { animation: ariaRise 600ms cubic-bezier(0.34,1.56,0.64,1) both; }
        .aria-no-enter { opacity: 1; }

        @keyframes ariaBowAnim {
          0%   { transform: rotate(0deg); }
          45%  { transform: rotate(14deg); }
          62%  { transform: rotate(14deg); }
          100% { transform: rotate(0deg); }
        }
        .aria-bow-active { animation: ariaBowAnim 900ms ease-in-out forwards; transform-origin: bottom center; }
        .aria-bow-rest   { transform: rotate(0deg); }

        @keyframes haloPulse {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.07); }
        }
        .aria-halo { transform-box: fill-box; transform-origin: 50% 50%; animation: haloPulse 2.2s ease-in-out infinite; }

        @keyframes bellSway {
          0%, 100% { transform: rotate(-2deg); }
          50%       { transform: rotate(2deg); }
        }
        .aria-bell { transform-box: fill-box; transform-origin: 50% 0%; animation: bellSway 2.8s ease-in-out infinite; }

        @keyframes ariaWave {
          0%   { transform: rotate(0deg); }
          18%  { transform: rotate(-14deg); }
          42%  { transform: rotate(22deg); }
          66%  { transform: rotate(-10deg); }
          84%  { transform: rotate(18deg); }
          100% { transform: rotate(0deg); }
        }
        .aria-wave { transform-box: fill-box; transform-origin: 0% 0%; animation: ariaWave 1.6s 0.6s ease-in-out 1 both; }

        @keyframes ariaBlinkO {
          0%, 85%  { opacity: 1; }
          88%, 94% { opacity: 0; }
          100%     { opacity: 1; }
        }
        @keyframes ariaBlinkC {
          0%, 85%  { opacity: 0; }
          88%, 94% { opacity: 1; }
          100%     { opacity: 0; }
        }
        .aria-blink-open   { animation: ariaBlinkO 3.2s 1.2s ease-in-out infinite; }
        .aria-blink-closed { opacity: 0; animation: ariaBlinkC 3.2s 1.2s ease-in-out infinite; }

        @keyframes wordPopUp {
          0%   { opacity: 0; transform: translateY(18px) scale(0.82); }
          65%  { opacity: 1; transform: translateY(-4px) scale(1.06); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wordPopLeft {
          0%   { opacity: 0; transform: translateX(-16px) scale(0.85) rotate(-3deg); }
          65%  { opacity: 1; transform: translateX(3px) scale(1.04) rotate(0.5deg); }
          100% { opacity: 1; transform: translateX(0) scale(1) rotate(0); }
        }
        @keyframes wordPopRight {
          0%   { opacity: 0; transform: translateX(16px) scale(0.85) rotate(3deg); }
          65%  { opacity: 1; transform: translateX(-3px) scale(1.04) rotate(-0.5deg); }
          100% { opacity: 1; transform: translateX(0) scale(1) rotate(0); }
        }
        @keyframes wordPopDown {
          0%   { opacity: 0; transform: translateY(-16px) scale(0.85); }
          65%  { opacity: 1; transform: translateY(3px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .aria-word {
          display: inline-block;
          opacity: 0;
          animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
          animation-fill-mode: forwards;
        }
        .word-pop-up    { animation-name: wordPopUp; }
        .word-pop-left  { animation-name: wordPopLeft; }
        .word-pop-right { animation-name: wordPopRight; }
        .word-pop-down  { animation-name: wordPopDown; }

        @media (prefers-reduced-motion: reduce) {
          .aria-halo, .aria-bell, .aria-wave,
          .aria-blink-open, .aria-blink-closed,
          .aria-bow-active, .aria-glow, .aria-enter { animation: none !important; }
          .aria-blink-closed { opacity: 0 !important; }
          .aria-gold-line-enter { animation: goldLineDraw 1400ms ease-out forwards !important; }
          .aria-gold-line-exit  { animation: goldLineShrink 700ms ease-in forwards !important; }
          .word-pop-up, .word-pop-left, .word-pop-right, .word-pop-down {
            animation-name: wordPopUp !important;
            animation-timing-function: ease-out !important;
            animation-duration: 250ms !important;
          }
        }

        @media (max-width: 767px) {
          .splash-wrap { flex-direction: column !important; overflow: hidden !important; }
          .splash-half { flex: 0 0 50dvh !important; height: 50dvh !important; width: 100vw !important; }
          .splash-seam {
            left: 0 !important; right: 0 !important;
            top: 50dvh !important; bottom: auto !important;
            width: 100vw !important; height: 1px !important;
            transform: none !important;
            background: linear-gradient(to right, transparent 0%, rgba(201,168,117,0.5) 20%, rgba(201,168,117,0.5) 80%, transparent 100%) !important;
          }
        }
      `}</style>
    </>
  )
}
