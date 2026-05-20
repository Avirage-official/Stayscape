'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useAuth } from '@/lib/context/auth-context'

const ROMAN = ['I', 'II', 'III', 'IV'] as const

const SLIDE_TINTS = [
  'rgba(201,168,117,0.07)',
  'rgba(117,155,201,0.06)',
  'rgba(117,201,155,0.06)',
  'rgba(168,117,201,0.06)',
] as const

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
  const { login } = useAuth()

  // carousel
  const [slide, setSlide] = useState(0)
  const [visible, setVisible] = useState(true)
  const [progressKey, setProgressKey] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setAuthError(null)
    setIsSubmitting(true)
    const result = await login(email, password)
    if (result.error) {
      setAuthError(result.error)
      setIsSubmitting(false)
      return
    }
    router.push('/dashboard')
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

      {/* Nav */}
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

      {/* Main two-col layout */}
      <div
        className="guests-main"
        style={{
          flex: '1 1 0', minHeight: 0, position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'row', overflow: 'hidden',
        }}
      >
        {/* ── LEFT: carousel ── */}
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
              background: `linear-gradient(135deg, rgba(245,240,232,0.88) 0%, rgba(235,228,216,0.92) 100%)`,
              boxShadow: `0 4px 32px rgba(193,127,58,0.12), 0 1px 0 rgba(255,255,255,0.9) inset, inset 0 0 0 2000px ${SLIDE_TINTS[slide]}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(193,127,58,0.22)',
              borderRadius: '20px',
              padding: 'clamp(28px, 4vw, 56px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
              transition: 'box-shadow 600ms ease',
            }}
          >
            <div aria-hidden="true" style={{
              position: 'absolute',
              top: 'clamp(20px, 3vw, 32px)', right: 'clamp(20px, 3vw, 32px)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{ width: '1px', height: '32px', background: '#C17F3A', opacity: 0.5 }} />
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontSize: '13px',
                color: '#C17F3A', opacity: 0.7,
                minWidth: '24px', transition: 'opacity 300ms ease',
              }}>{ROMAN[slide]}</span>
            </div>

            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(20px)',
              transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px', fontWeight: 600,
                color: '#C17F3A', letterSpacing: '0.18em',
                textTransform: 'uppercase', margin: '0 0 20px',
              }}>{SLIDES[slide].eyebrow}</p>

              <h2 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 'clamp(2rem, 3.6vw, 3.4rem)',
                fontWeight: 500, color: '#2C1A08',
                lineHeight: 1.18, letterSpacing: '-0.01em',
                margin: '0 0 20px',
              }}>{SLIDES[slide].headline}</h2>

              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px', lineHeight: 1.65,
                color: '#5C4A35', maxWidth: '46ch', margin: 0,
              }}>{SLIDES[slide].subline}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingTop: '28px', flexShrink: 0 }}>
              {SLIDES.map((_, i) => (
                <div key={i} style={{
                  width: '36px', height: '2px',
                  background: 'rgba(193,127,58,0.25)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {i === slide && (
                    <div key={progressKey} style={{
                      position: 'absolute', inset: 0,
                      background: '#C17F3A',
                      transformOrigin: 'left',
                      animation: `progressFill ${prefersReducedMotion ? 0 : DWELL_MS}ms linear forwards`,
                    }} />
                  )}
                  {i < slide && (
                    <div style={{ position: 'absolute', inset: 0, background: '#C17F3A', opacity: 0.35 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: guest login form ── */}
        <div
          className="auth-col"
          style={{
            flex: '0 0 40%', minWidth: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: 'clamp(20px, 3vw, 48px)',
            paddingLeft: 'clamp(16px, 2.5vw, 40px)',
            gap: '8px',
          }}
        >
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', fontWeight: 600,
            color: '#C17F3A', letterSpacing: '0.18em',
            textTransform: 'uppercase', margin: '0 0 4px',
          }}>Guest Sign In</p>

          <h3 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
            fontWeight: 500, color: '#2C1A08',
            lineHeight: 1.2, margin: '0 0 24px',
          }}>Welcome back.</h3>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(44,26,8,0.45)', marginBottom: '8px',
              }}>Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setAuthError(null) }}
                placeholder="your@email.com"
                className="guest-input"
                style={{
                  width: '100%', height: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(193,127,58,0.28)',
                  color: '#2C1A08',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  transition: 'border-color 180ms ease, box-shadow 180ms ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#C17F3A'; e.target.style.boxShadow = '0 0 0 3px rgba(193,127,58,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(193,127,58,0.28)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(44,26,8,0.45)', marginBottom: '8px',
              }}>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => { setPassword(e.target.value); setAuthError(null) }}
                placeholder="••••••••"
                className="guest-input"
                style={{
                  width: '100%', height: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(193,127,58,0.28)',
                  color: '#2C1A08',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  transition: 'border-color 180ms ease, box-shadow 180ms ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#C17F3A'; e.target.style.boxShadow = '0 0 0 3px rgba(193,127,58,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(193,127,58,0.28)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {authError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(193,58,58,0.06)',
                border: '1px solid rgba(193,58,58,0.2)',
                color: '#C13A3A', fontSize: '12px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', height: '46px',
                borderRadius: '8px',
                background: '#C17F3A',
                color: '#FAF8F5',
                fontSize: '13px', fontWeight: 600,
                letterSpacing: '0.07em',
                border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: isSubmitting ? 0.55 : 1,
                transition: 'background 180ms ease, opacity 180ms ease',
                boxShadow: '0 4px 14px rgba(193,127,58,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#D6A252' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A' }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(44,26,8,0.35)', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
              Demo: <code style={{ color: 'rgba(44,26,8,0.55)' }}>ben.test@stayscape-demo.com</code> / <code style={{ color: 'rgba(44,26,8,0.55)' }}>Demo1234!</code>
            </p>
            <a
              href="/dashboard"
              style={{ fontSize: '12px', color: 'rgba(44,26,8,0.3)', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none', transition: 'color 180ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(44,26,8,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(44,26,8,0.3)')}
            >
              Explore without signing in →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .guest-input, .guest-input:focus, .guest-input:hover, .guest-input:active {
          background-color: #FFFFFF !important;
          color: #2C1A08 !important;
          -webkit-text-fill-color: #2C1A08 !important;
        }
        .guest-input:-webkit-autofill,
        .guest-input:-webkit-autofill:hover,
        .guest-input:-webkit-autofill:focus,
        .guest-input:-webkit-autofill:active {
          -webkit-text-fill-color: #2C1A08 !important;
          -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
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
