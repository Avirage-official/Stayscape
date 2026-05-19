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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect prefers-reduced-motion once on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time media query read
  useEffect(() => { setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  const advance = () => {
    setSlide(s => (s + 1) % SLIDES.length)
    setProgressKey(k => k + 1)
  }

  const retreat = () => {
    setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)
    setProgressKey(k => k + 1)
  }

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft') retreat()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Auto-advance with tab-visibility pause
  useEffect(() => {
    const dwell = prefersReducedMotion ? REDUCED_DWELL_MS : DWELL_MS

    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (document.visibilityState === 'hidden') return
        if (!prefersReducedMotion) {
          setVisible(false)
          setTimeout(() => {
            setSlide(s => (s + 1) % SLIDES.length)
            setProgressKey(k => k + 1)
            setVisible(true)
          }, TRANSITION_MS)
        } else {
          setSlide(s => (s + 1) % SLIDES.length)
          setProgressKey(k => k + 1)
        }
      }, dwell)
    }

    schedule()

    function onVisibility() {
      if (document.visibilityState === 'visible') schedule()
      else if (timerRef.current) clearTimeout(timerRef.current)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [slide, progressKey, prefersReducedMotion])

  function handleFind() {
    setFindError('')
    if (!bookingRef.trim()) {
      setFindError('Please enter a booking reference.')
      return
    }
    // TODO: wire to /api/stays/find when endpoint is ready — POST { booking_reference: bookingRef }
    // On success, router.push to returned stay URL; on failure, setFindError(err.message)
    router.push('/login')
  }

  return (
    <div
      style={{
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
      }}
    >
      {/* ── Top bar ──────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            letterSpacing: '0.01em',
            transition: 'color 180ms ease',
          }}
          onMouseEnter={e => ((e.currentTarget).style.color = 'var(--text-primary)')}
          onMouseLeave={e => ((e.currentTarget).style.color = 'var(--text-muted)')}
        >
          ← Back
        </Link>

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

        <span style={{ width: '48px' }} aria-hidden="true" />
      </div>

      {/* ── Main two-column area ─────────────────────────── */}
      <div
        className="guests-main"
        style={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: '0',
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT: Slide carousel ─────────────────────── */}
        <div
          className="carousel-col"
          style={{
            flex: '0 0 60%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: 'clamp(20px, 3vw, 48px)',
            paddingRight: 'clamp(16px, 2.5vw, 40px)',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              background: 'var(--surface)',
              border: '1px solid rgba(201,168,117,0.15)',
              borderRadius: '20px',
              padding: 'clamp(28px, 4vw, 56px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top-right decorative accent */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 'clamp(20px, 3vw, 32px)',
                right: 'clamp(20px, 3vw, 32px)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '1px',
                  height: '32px',
                  background: 'var(--gold)',
                  opacity: 0.5,
                }}
              />
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '13px',
                  color: 'var(--gold)',
                  opacity: 0.7,
                  minWidth: '24px',
                  transition: 'opacity 300ms ease',
                }}
              >
                {ROMAN[slide]}
              </span>
            </div>

            {/* Slide content */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(20px)',
                transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--gold)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  margin: '0 0 20px',
                }}
              >
                {SLIDES[slide].eyebrow}
              </p>

              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(2rem, 3.6vw, 3.4rem)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.18,
                  letterSpacing: '-0.01em',
                  margin: '0 0 20px',
                }}
              >
                {SLIDES[slide].headline}
              </h2>

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: 'var(--text-secondary)',
                  maxWidth: '46ch',
                  margin: 0,
                }}
              >
                {SLIDES[slide].subline}
              </p>
            </div>

            {/* Progress bars */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                paddingTop: '28px',
                flexShrink: 0,
              }}
            >
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '36px',
                    height: '2px',
                    background: 'var(--gold-muted)',
                    opacity: i < slide ? 0.3 : i > slide ? 1 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {i === slide && (
                    <div
                      key={progressKey}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--gold)',
                        transformOrigin: 'left',
                        animation: `progressFill ${prefersReducedMotion ? 0 : DWELL_MS}ms linear forwards`,
                      }}
                    />
                  )}
                  {i < slide && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--gold)',
                        opacity: 0.3,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Auth block ─────────────────────────── */}
        <div
          className="auth-col"
          style={{
            flex: '0 0 40%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(20px, 3vw, 48px)',
            paddingLeft: 'clamp(16px, 2.5vw, 40px)',
            gap: '28px',
          }}
        >
          {/* Section A — booking reference */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--gold)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              I have a booking reference
            </p>

            <input
              type="text"
              value={bookingRef}
              onChange={e => { setBookingRef(e.target.value); setFindError('') }}
              placeholder="BK-12345"
              className="discovery-ref-input"
              style={{
                width: '100%',
                height: '48px',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                padding: '0 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 180ms ease, box-shadow 180ms ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--gold)'
                e.target.style.boxShadow = '0 0 0 3px var(--input-focus-ring)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--input-border)'
                e.target.style.boxShadow = 'none'
              }}
            />

            <button
              onClick={handleFind}
              style={{
                background: 'var(--gold)',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#14100D',
                letterSpacing: '0.03em',
                cursor: 'pointer',
                transition: 'opacity 180ms ease',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Find my stay
            </button>

            {findError && (
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: 'var(--error)',
                  margin: 0,
                }}
              >
                {findError}
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* Section B — sign in */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--gold)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              I already have an account
            </p>

            <Link
              href="/login"
              style={{
                display: 'inline-block',
                border: '1.5px solid var(--gold)',
                borderRadius: '8px',
                padding: '13px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.03em',
                textDecoration: 'none',
                transition: 'background 180ms ease',
                background: 'transparent',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,117,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        /* Mobile: stack carousel above auth, no scroll */
        @media (max-width: 1023px) {
          .guests-main {
            flex-direction: column !important;
          }
          .carousel-col {
            flex: 0 0 55% !important;
            padding-right: clamp(20px, 3vw, 48px) !important;
          }
          .auth-col {
            flex: 0 0 auto !important;
            justify-content: flex-start !important;
            padding-top: 0 !important;
            padding-left: clamp(20px, 3vw, 48px) !important;
          }
        }

        /* Very small screens: compress paddings */
        @media (max-width: 430px) {
          .carousel-col {
            padding: 12px !important;
          }
          .auth-col {
            padding: 12px !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
