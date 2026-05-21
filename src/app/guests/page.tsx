'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import { getSupabaseBrowser } from '@/lib/supabase/client'

const ROMAN = ['I', 'II', 'III', 'IV'] as const

const SLIDES = [
  {
    eyebrow: '01 · Profile',
    headline: 'We\'re getting to know you.',
    subline: 'Stayscape quietly builds a travel profile from your stays — preferences, pace, the kind of places that move you.',
    image: '/images/onboarding/slide-1.jpg',
  },
  {
    eyebrow: '02 · Connect',
    headline: 'One thread to your hotel.',
    subline: 'From the moment your booking lands, you\'re connected to the property — requests, questions, late check-outs, all in one place.',
    image: '/images/onboarding/slide-2.jpg',
  },
  {
    eyebrow: '03 · During your stay',
    headline: 'Your stay, in your pocket.',
    subline: 'Plan your days, order room service, request what you need, and explore places worth your time — without leaving the experience.',
    image: '/images/onboarding/slide-3.jpg',
  },
  {
    eyebrow: '04 · Aria',
    headline: 'A concierge that knows the city.',
    subline: 'Aria, your AI concierge, is along for the trip — answering questions, suggesting where to go, making your stay easier, 24/7.',
    image: '/images/onboarding/slide-4.jpg',
  },
] as const

const DWELL_MS = 5000
const REDUCED_DWELL_MS = 8000
const TRANSITION_MS = 800

export default function GuestsPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [slide, setSlide] = useState(0)
  const [nextSlide, setNextSlide] = useState<number | null>(null)
  const [progressKey, setProgressKey] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      setMounted(true)
    }, 60)
    return () => clearTimeout(id)
  }, [])

  function goTo(idx: number) {
    if (idx === slide) return
    setNextSlide(idx)
    setProgressKey(k => k + 1)
    setTimeout(() => {
      setSlide(idx)
      setNextSlide(null)
    }, TRANSITION_MS)
  }

  const advance = () => goTo((slide + 1) % SLIDES.length)
  const retreat = () => goTo((slide - 1 + SLIDES.length) % SLIDES.length)

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
        advance()
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

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    setAuthError(null)
    if (!consentChecked) {
      setAuthError('Please agree to the Privacy Policy and Terms to continue')
      return
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords don't match")
      return
    }
    setIsSubmitting(true)
    const supabase = getSupabaseBrowser()
    if (!supabase) {
      setAuthError('Sign-up is not available in this environment')
      setIsSubmitting(false)
      return
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setAuthError(error.message)
      setIsSubmitting(false)
      return
    }
    if (data.session) {
      router.push('/dashboard')
    } else {
      setSignupDone(true)
      setIsSubmitting(false)
    }
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setAuthError(null)
    setSignupDone(false)
    setPassword('')
    setConfirmPassword('')
    setConsentChecked(false)
  }

  return (
    <div
      style={{
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#0E0B08',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'scale(1)' : 'scale(0.98)',
        transition: 'opacity 420ms ease-out, transform 420ms cubic-bezier(0.34,1,0.64,1)',
      }}
    >
      {/* Nav */}
      <div
        style={{
          flexShrink: 0, position: 'relative', zIndex: 20,
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(14,11,8,0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'rgba(250,248,245,0.5)',
            textDecoration: 'none',
            letterSpacing: '0.01em',
            transition: 'color 180ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FAF8F5')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,248,245,0.5)')}
        >
          ← Back
        </Link>

        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontSize: '18px', fontWeight: 600,
          color: '#FAF8F5', letterSpacing: '0.01em',
        }}>
          Stay<span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: 'normal', fontWeight: 600, color: '#C17F3A' }}>scape</span>
        </span>

        <span style={{ width: '48px' }} aria-hidden="true" />
      </div>

      {/* Main layout */}
      <div
        className="guests-main"
        style={{
          flex: '1 1 0', minHeight: 0, position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'row', overflow: 'hidden',
        }}
      >
        {/* LEFT: full-bleed image carousel */}
        <div
          className="carousel-col"
          style={{
            flex: '0 0 60%', minWidth: 0,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', inset: 0,
                opacity: i === slide ? 1 : i === nextSlide ? 0 : 0,
                transition: `opacity ${TRANSITION_MS}ms ease`,
                zIndex: i === nextSlide ? 2 : i === slide ? 1 : 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt=""
                aria-hidden="true"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  animation: i === slide && !prefersReducedMotion
                    ? 'kenBurns 12s ease-out forwards'
                    : 'none',
                }}
              />
            </div>
          ))}

          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
              background: 'linear-gradient(to top, rgba(8,5,2,0.88) 0%, rgba(8,5,2,0.45) 40%, rgba(8,5,2,0.1) 70%, transparent 100%)',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(8,5,2,0.35) 0%, transparent 25%)',
            }}
          />

          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              zIndex: 4,
              padding: 'clamp(28px, 4vw, 52px)',
              paddingBottom: 'clamp(32px, 4.5vw, 56px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '28px', height: '1px', background: 'rgba(193,127,58,0.7)' }} />
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontSize: '13px',
                color: 'rgba(193,127,58,0.85)',
                letterSpacing: '0.04em',
                transition: 'opacity 300ms ease',
              }}>{SLIDES[slide].eyebrow}</span>
            </div>

            <h2
              key={slide}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 'clamp(2rem, 3.8vw, 3.6rem)',
                fontWeight: 500,
                color: '#FAF8F5',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                margin: '0 0 14px',
                animation: 'slideUp 600ms cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              {SLIDES[slide].headline}
            </h2>

            <p
              key={`sub-${slide}`}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                lineHeight: 1.65,
                color: 'rgba(250,248,245,0.7)',
                maxWidth: '44ch',
                margin: '0 0 28px',
                animation: 'slideUp 600ms 80ms cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              {SLIDES[slide].subline}
            </p>

            <div style={{ display: 'flex', gap: '6px' }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  style={{
                    width: '36px', height: '2px',
                    background: 'rgba(255,255,255,0.2)',
                    position: 'relative', overflow: 'hidden',
                    border: 'none', padding: 0, cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  {i === slide && (
                    <div
                      key={progressKey}
                      style={{
                        position: 'absolute', inset: 0,
                        background: '#C17F3A',
                        transformOrigin: 'left',
                        animation: `progressFill ${prefersReducedMotion ? 0 : DWELL_MS}ms linear forwards`,
                      }}
                    />
                  )}
                  {i < slide && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(193,127,58,0.6)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            aria-label="Previous slide"
            onClick={retreat}
            style={{
              position: 'absolute', left: 0, top: '10%', bottom: '20%',
              width: '30%', zIndex: 5,
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          />
          <button
            aria-label="Next slide"
            onClick={advance}
            style={{
              position: 'absolute', right: 0, top: '10%', bottom: '20%',
              width: '30%', zIndex: 5,
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          />
        </div>

        {/* RIGHT: auth form */}
        <div
          className="auth-col"
          style={{
            flex: '0 0 40%', minWidth: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: 'clamp(20px, 3vw, 48px)',
            paddingLeft: 'clamp(24px, 3vw, 52px)',
            gap: '8px',
            background: '#FAF8F5',
          }}
        >
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', fontWeight: 600,
            color: '#C17F3A', letterSpacing: '0.18em',
            textTransform: 'uppercase', margin: '0 0 4px',
          }}>{mode === 'signin' ? 'Guest Sign In' : 'Create Account'}</p>

          <h3 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
            fontWeight: 500, color: '#2C1A08',
            lineHeight: 1.2, margin: '0 0 24px',
          }}>{mode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h3>

          {signupDone ? (
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(193,127,58,0.07)',
              border: '1px solid rgba(193,127,58,0.22)',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontSize: '17px',
                color: '#2C1A08', margin: 0, fontWeight: 500,
              }}>Check your email.</p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px', lineHeight: 1.6,
                color: 'rgba(44,26,8,0.6)', margin: 0,
              }}>
                We&apos;ve sent a confirmation link to <strong style={{ color: '#2C1A08' }}>{email}</strong>.
                Click it to activate your account, then come back and sign in.
              </p>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={{
                  marginTop: '4px', background: 'none', border: 'none', padding: 0,
                  fontSize: '12px', color: '#C17F3A', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
                  transition: 'color 180ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#D6A252')}
                onMouseLeave={e => (e.currentTarget.style.color = '#C17F3A')}
              >
                Back to sign in →
              </button>
            </div>
          ) : (
            <form
              onSubmit={mode === 'signin' ? handleLogin : handleSignUp}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
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
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

              {mode === 'signup' && (
                <div>
                  <label style={{
                    display: 'block', fontSize: '10px', fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'rgba(44,26,8,0.45)', marginBottom: '8px',
                  }}>Confirm Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setAuthError(null) }}
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
              )}

              {mode === 'signup' && (
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  cursor: 'pointer', userSelect: 'none',
                }}>
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={e => { setConsentChecked(e.target.checked); setAuthError(null) }}
                    style={{
                      width: '16px', height: '16px', marginTop: '2px',
                      accentColor: '#C17F3A', cursor: 'pointer', flexShrink: 0,
                    }}
                  />
                  <span style={{
                    fontSize: '12px', lineHeight: 1.5,
                    color: 'rgba(44,26,8,0.6)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    I agree to the{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer"
                       style={{ color: '#C17F3A', textDecoration: 'underline' }}>
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer"
                       style={{ color: '#C17F3A', textDecoration: 'underline' }}>
                      Terms of Service
                    </a>.
                  </span>
                </label>
              )}

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
                disabled={isSubmitting || (mode === 'signup' && !consentChecked)}
                style={{
                  width: '100%', height: '46px',
                  borderRadius: '8px',
                  background: '#C17F3A',
                  color: '#FAF8F5',
                  fontSize: '13px', fontWeight: 600,
                  letterSpacing: '0.07em',
                  border: 'none', cursor: (isSubmitting || (mode === 'signup' && !consentChecked)) ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: (isSubmitting || (mode === 'signup' && !consentChecked)) ? 0.55 : 1,
                  transition: 'background 180ms ease, opacity 180ms ease',
                  boxShadow: '0 4px 14px rgba(193,127,58,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseEnter={e => { if (!isSubmitting && !(mode === 'signup' && !consentChecked)) e.currentTarget.style.background = '#D6A252' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C17F3A' }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                    </svg>
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          )}

          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mode === 'signin' && (
              <p style={{ fontSize: '11px', color: 'rgba(44,26,8,0.35)', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                Demo: <code style={{ color: 'rgba(44,26,8,0.55)' }}>ben.test@stayscape-demo.com</code> / <code style={{ color: 'rgba(44,26,8,0.55)' }}>Demo1234!</code>
              </p>
            )}
            <a
              href="/dashboard"
              style={{ fontSize: '12px', color: 'rgba(44,26,8,0.3)', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none', transition: 'color 180ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(44,26,8,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(44,26,8,0.3)')}
            >
              Explore without signing in →
            </a>
            {!signupDone && (
              <button
                type="button"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                style={{
                  background: 'none', border: 'none', padding: 0, textAlign: 'left',
                  fontSize: '12px', color: 'rgba(44,26,8,0.3)',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer', transition: 'color 180ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(44,26,8,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(44,26,8,0.3)')}
              >
                {mode === 'signin' ? 'New here? Create an account →' : 'Already have an account? Sign in →'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes kenBurns {
          from { transform: scale(1.0) translate(0px, 0px); }
          to   { transform: scale(1.07) translate(-10px, -6px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
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
          .carousel-col { flex: 0 0 52% !important; }
          .auth-col { flex: 0 0 auto !important; justify-content: flex-start !important; overflow-y: auto; padding-top: 24px !important; }
        }
        @media (max-width: 430px) {
          .carousel-col { flex: 0 0 45% !important; }
          .auth-col { padding: 16px !important; gap: 16px !important; }
        }
      `}</style>
    </div>
  )
}
