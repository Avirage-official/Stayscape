'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

const ROMAN = ['I', 'II', 'III', 'IV'] as const

const SLIDES = [
  {
    eyebrow: '01 · Profile',
    headline: 'We\'re getting to know you.',
    subline:
      'Stayscape is quietly building a travel profile from your stays — preferences, pace, the kind of places that move you — so every trip after this feels less like starting over.',
  },
  {
    eyebrow: '02 · Connect',
    headline: 'One thread to your hotel.',
    subline:
      'From the moment your booking lands, you\'re connected to the property — requests, questions, late check-outs, everything in one place. No phone tag, no front-desk queue.',
  },
  {
    eyebrow: '03 · During your stay',
    headline: 'Your stay, in your pocket.',
    subline:
      'Plan your days, order room service, request the things you need, and explore a map of places worth your time — all without leaving the experience.',
  },
  {
    eyebrow: '04 · Aria',
    headline: 'A concierge that knows the city.',
    subline:
      'Aria, your AI concierge, is along for the trip — answering questions, suggesting where to go, and quietly making your stay easier, 24/7.',
  },
] as const

const DWELL_MS = 4000
const REDUCED_DWELL_MS = 6000
const TRANSITION_MS = 600

export default function GuestsPage() {
  const router = useRouter()
  const [bookingRef, setBookingRef] = useState('')
  const [findError, setFindError] = useState('')
  const [slide, setSlide] = useState(0)
  const [visible, setVisible] = useState(true)
  const [progressKey, setProgressKey] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      setMounted(true)
    }, 60)
    return () => clearTimeout(id)
  }, [])

  const advance = () => { setSlide(s => (s + 1) % SLIDES.length); setProgressKey(k => k + 1) }
  const retreat = () => { setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length); setProgressKey(k => k + 1) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft') retreat()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const dwell = prefersReducedMotion ? REDUCED_DWELL_MS : DWELL_MS
    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (document.visibilityState === 'hidden') return
        if (!prefersReducedMotion) {
          setVisible(false)
          setTimeout(() => { setSlide(s => (s + 1) % SLIDES.length); setProgressKey(k => k + 1); setVisible(true) }, TRANSITION_MS)
        } else {
          setSlide(s => (s + 1) % SLIDES.length); setProgressKey(k => k + 1)
        }
      }, dwell)
    }
    schedule()
    function onVisibility() {
      if (document.visibilityState === 'visible') schedule()
      else if (timerRef.current) clearTimeout(timerRef.current)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { if (timerRef.current) clearTimeout(timerRef.current); document.removeEventListener('visibilitychange', onVisibility) }
  }, [slide, progressKey, prefersReducedMotion])

  function handleFind() {
    setFindError('')
    if (!bookingRef.trim()) { setFindError('Please enter a booking reference.'); return }
    router.push('/login')
  }

  return (
    <div
      style={{
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#FAF8F5',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'scale(1)' : 'scale(0.98)',
        transition: 'opacity 420ms ease-out, transform 420ms cubic-bezier(0.34,1,0.64,1)',
      }}
    >
      <video
        autoPlay muted loop playsInline preload="metadata"
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.18,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      >
        <source src="/videos/guests-bg.mp4" type="video/mp4" />
      </video>

      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 65% at 30% 50%, rgba(201,168,117,0.10) 0%, transparent 70%)',
      }} />

      <div
        style={{
          flexShrink: 0, position: 'relative', zIndex: 10,
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(193,127,58,0.18)',
          background: 'rgba(250,248,245,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#7A6B57',
            textDecoration: 'none',
            letterSpacing: '0.01em',
            transition: 'color 180ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2C1A08')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7A6B57')}
        >
          ← Back
        </Link>

        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontSize: '18px', fontWeight: 600,
          color: '#2C1A08', letterSpacing: '0.01em',
        }}>
          Stay<span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontWeight: 600, color: '#C17F3A' }}>scape</span>
        </span>

        <span style={{ width: '48px' }} aria-hidden="true" />
      </div>

      <div
        className="guests-main"
        style={{
          flex: '1 1 0', minHeight: 0, position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'row', overflow: 'hidden',
        }}
      >
        <div
          className="carousel-col"
          style={{
            flex: '0 0 60%', minWidth: 0,
            display: 'flex', flexDirection: 'column',
            padding: 'clamp(20px, 3vw, 48px)',
            paddingRight: 'clamp(16px, 2.5vw, 40px)',
          }}
        >
          <div
            style={{
              flex: 1, minHeight: 0,
              background: '#1A120A',
              boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: 'clamp(28px, 4vw, 56px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Background image — fades with slide */}
            <img
              src={`/images/onboarding/slide-${slide + 1}.jpg`}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: visible ? 1 : 0,
                transition: `opacity ${TRANSITION_MS}ms ease`,
                zIndex: 0,
              }}
            />

            {/* Dark overlay — heavier at bottom so text stays readable */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(to bottom, rgba(10,8,6,0.42) 0%, rgba(10,8,6,0.68) 55%, rgba(10,8,6,0.88) 100%)',
            }} />

            {/* Roman numeral corner tag */}
            <div aria-hidden="true" style={{
              position: 'absolute',
              top: 'clamp(20px, 3vw, 32px)', right: 'clamp(20px, 3vw, 32px)',
              display: 'flex', alignItems: 'center', gap: '10px',
              zIndex: 2,
            }}>
              <div style={{ width: '1px', height: '32px', background: '#C9A875', opacity: 0.7 }} />
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontSize: '13px',
                color: '#C9A875',
                minWidth: '24px', transition: 'opacity 300ms ease',
              }}>{ROMAN[slide]}</span>
            </div>

            {/* Slide text */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(20px)',
              transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
              position: 'relative', zIndex: 2,
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px', fontWeight: 600,
                color: '#C9A875', letterSpacing: '0.18em',
                textTransform: 'uppercase', margin: '0 0 20px',
              }}>{SLIDES[slide].eyebrow}</p>

              <h2 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 'clamp(2rem, 3.6vw, 3.4rem)',
                fontWeight: 500, color: '#F5E6CC',
                lineHeight: 1.18, letterSpacing: '-0.01em',
                margin: '0 0 20px',
              }}>{SLIDES[slide].headline}</h2>

              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px', lineHeight: 1.65,
                color: 'rgba(245,230,204,0.78)', maxWidth: '46ch', margin: 0,
              }}>{SLIDES[slide].subline}</p>
            </div>

            {/* Progress bars */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '28px', flexShrink: 0, position: 'relative', zIndex: 2 }}>
              {SLIDES.map((_, i) => (
                <div key={i} style={{
                  width: '36px', height: '2px',
                  background: 'rgba(255,255,255,0.22)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {i === slide && (
                    <div key={progressKey} style={{
                      position: 'absolute', inset: 0,
                      background: '#C9A875',
                      transformOrigin: 'left',
                      animation: `progressFill ${prefersReducedMotion ? 0 : DWELL_MS}ms linear forwards`,
                    }} />
                  )}
                  {i < slide && (
                    <div style={{ position: 'absolute', inset: 0, background: '#C9A875', opacity: 0.45 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="auth-col"
          style={{
            flex: '0 0 40%', minWidth: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: 'clamp(20px, 3vw, 48px)',
            paddingLeft: 'clamp(16px, 2.5vw, 40px)',
            gap: '28px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px', fontWeight: 600,
              color: '#C17F3A', letterSpacing: '0.18em',
              textTransform: 'uppercase', margin: 0,
            }}>I have a booking reference</p>

            <input
              type="text"
              value={bookingRef}
              onChange={e => { setBookingRef(e.target.value); setFindError('') }}
              placeholder="BK-12345"
              className="discovery-ref-input"
              style={{
                width: '100%', height: '48px',
                colorScheme: 'light',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(193,127,58,0.28)',
                borderRadius: '8px', padding: '0 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#2C1A08',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 180ms ease, box-shadow 180ms ease',
              }}
              onFocus={e => { e.target.style.borderColor = '#C17F3A'; e.target.style.boxShadow = '0 0 0 3px rgba(193,127,58,0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(193,127,58,0.28)'; e.target.style.boxShadow = 'none' }}
            />

            <button
              onClick={handleFind}
              style={{
                background: '#C17F3A',
                border: 'none', borderRadius: '8px',
                padding: '14px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: 600,
                color: '#FAF8F5', letterSpacing: '0.03em',
                cursor: 'pointer',
                transition: 'opacity 180ms ease, transform 180ms ease',
                alignSelf: 'flex-start',
                boxShadow: '0 4px 14px rgba(193,127,58,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Find my stay
            </button>

            {findError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#C14A3A', margin: 0 }}>{findError}</p>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(193,127,58,0.2)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px', fontWeight: 600,
              color: '#C17F3A', letterSpacing: '0.18em',
              textTransform: 'uppercase', margin: 0,
            }}>I already have an account</p>

            <Link
              href="/login"
              style={{
                display: 'inline-block',
                border: '1.5px solid rgba(193,127,58,0.5)',
                borderRadius: '8px', padding: '13px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: 600,
                color: '#2C1A08', letterSpacing: '0.03em',
                textDecoration: 'none',
                transition: 'background 180ms ease, border-color 180ms ease',
                background: 'transparent', alignSelf: 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,127,58,0.08)'; e.currentTarget.style.borderColor = '#C17F3A' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(193,127,58,0.5)' }}
            >Sign in</Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        /* Scoped autofill override — keeps this light input white.
           globals.css sets dark autofill bg for all inputs (dark dashboard);
           this !important block wins for .discovery-ref-input only. */
        .discovery-ref-input,
        .discovery-ref-input:focus,
        .discovery-ref-input:hover,
        .discovery-ref-input:active {
          background-color: #FFFFFF !important;
          color: #2C1A08 !important;
          -webkit-text-fill-color: #2C1A08 !important;
        }

        .discovery-ref-input:-webkit-autofill,
        .discovery-ref-input:-webkit-autofill:hover,
        .discovery-ref-input:-webkit-autofill:focus,
        .discovery-ref-input:-webkit-autofill:active {
          -webkit-text-fill-color: #2C1A08 !important;
          -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
          box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
          caret-color: #C17F3A !important;
        }

        @media (max-width: 1023px) {
          .guests-main { flex-direction: column !important; }
          .carousel-col { flex: 0 0 55% !important; padding-right: clamp(20px, 3vw, 48px) !important; }
          .auth-col { flex: 0 0 auto !important; justify-content: flex-start !important; padding-top: 0 !important; padding-left: clamp(20px, 3vw, 48px) !important; }
        }
        @media (max-width: 430px) {
          .carousel-col { padding: 12px !important; }
          .auth-col { padding: 12px !important; gap: 16px !important; }
        }
      `}</style>
    </div>
  )
}
