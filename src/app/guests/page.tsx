'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import { getSupabaseBrowser } from '@/lib/supabase/client'

// ─── Step definitions ────────────────────────────────────────────────────────

type StepId = 'welcome' | 'name' | 'origin' | 'style' | 'city' | 'auth'

interface Step {
  id: StepId
  scene: string          // image shown in the right-hand card
  sceneCaption: string   // small caption overlaid on the image
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    scene: '/onboarding/scenes/intro-portrait.jpg',
    sceneCaption: 'Begin your journey',
  },
  {
    id: 'name',
    scene: '/onboarding/scenes/welcome.jpg',
    sceneCaption: 'Nice to meet you',
  },
  {
    id: 'origin',
    scene: '/onboarding/scenes/home-origin.jpg',
    sceneCaption: 'Where you're from',
  },
  {
    id: 'style',
    scene: '/onboarding/scenes/age-era.jpg',
    sceneCaption: 'How you travel',
  },
  {
    id: 'city',
    scene: '/onboarding/scenes/planning-editorial.jpg',
    sceneCaption: 'Your destination',
  },
  {
    id: 'auth',
    scene: '/onboarding/scenes/closing.jpg',
    sceneCaption: 'Almost there',
  },
]

const TRAVEL_STYLES = [
  { id: 'slow', label: 'Slow traveller', sub: 'Savour every moment' },
  { id: 'explorer', label: 'Explorer', sub: 'Off the beaten path' },
  { id: 'luxe', label: 'Luxury seeker', sub: 'The finer things' },
  { id: 'social', label: 'Social butterfly', sub: 'People & culture' },
]

const CITIES = [
  'Amsterdam', 'Bangkok', 'Barcelona', 'Berlin', 'Bali',
  'Cape Town', 'Dubai', 'Hong Kong', 'Istanbul', 'Kyoto',
  'Lisbon', 'London', 'Maldives', 'Miami', 'New York',
  'Paris', 'Santorini', 'Singapore', 'Sydney', 'Tokyo',
]

const EASE_OUT = 'cubic-bezier(0.16,1,0.3,1)'

// ─── Component ───────────────────────────────────────────────────────────────

export default function GuestsPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [stepIdx, setStepIdx] = useState(0)
  const [prevStepIdx, setPrevStepIdx] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  // form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [origin, setOrigin] = useState('')
  const [travelStyle, setTravelStyle] = useState('')
  const [city, setCity] = useState('')
  const [cityQuery, setCityQuery] = useState('')

  // auth
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const currentStep = STEPS[stepIdx]
  const prevStep = prevStepIdx !== null ? STEPS[prevStepIdx] : null
  const totalOnboarding = STEPS.length - 1 // exclude auth step from dot count

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goTo(idx: number) {
    if (idx === stepIdx || transitioning) return
    setPrevStepIdx(stepIdx)
    setTransitioning(true)
    setTimeout(() => {
      setStepIdx(idx)
      setContentKey(k => k + 1)
      setPrevStepIdx(null)
      setTransitioning(false)
    }, 480)
  }

  function next() { if (stepIdx < STEPS.length - 1) goTo(stepIdx + 1) }
  function back() { if (stepIdx > 0) goTo(stepIdx - 1) }

  // ── Auth handlers ───────────────────────────────────────────────────────────
  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setAuthError(null)
    setIsSubmitting(true)
    const result = await login(email, password)
    if (result.error) { setAuthError(result.error); setIsSubmitting(false); return }
    router.push('/dashboard')
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    setAuthError(null)
    if (password !== confirmPassword) { setAuthError("Passwords don't match"); return }
    setIsSubmitting(true)
    const supabase = getSupabaseBrowser()
    if (!supabase) { setAuthError('Sign-up unavailable in this environment'); setIsSubmitting(false); return }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setAuthError(error.message); setIsSubmitting(false); return }
    if (data.session) { router.push('/dashboard') } else { setSignupDone(true); setIsSubmitting(false) }
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next); setAuthError(null); setSignupDone(false); setPassword(''); setConfirmPassword('')
  }

  // ── Filtered city list ──────────────────────────────────────────────────────
  const filteredCities = cityQuery.length > 0
    ? CITIES.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))
    : CITIES

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes ob-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes ob-slide-up { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ob-slide-down { from { opacity:0; transform:translateY(-14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ob-scale-in { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }

        .ob-content-enter { animation: ob-slide-up 0.55s ${EASE_OUT} both; }
        .ob-content-enter-1 { animation: ob-slide-up 0.55s 0.05s ${EASE_OUT} both; }
        .ob-content-enter-2 { animation: ob-slide-up 0.55s 0.10s ${EASE_OUT} both; }
        .ob-content-enter-3 { animation: ob-slide-up 0.55s 0.16s ${EASE_OUT} both; }
        .ob-content-enter-4 { animation: ob-slide-up 0.55s 0.22s ${EASE_OUT} both; }
        .ob-content-enter-5 { animation: ob-slide-up 0.55s 0.28s ${EASE_OUT} both; }

        .ob-field {
          width:100%; height:48px; padding:0 16px;
          border-radius:10px;
          background:rgba(245,230,204,0.06);
          border:1px solid rgba(245,230,204,0.14);
          color:#F5E6CC; font-size:14px;
          font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;
          outline:none;
          transition:border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
          -webkit-appearance:none;
          box-sizing:border-box;
        }
        .ob-field::placeholder { color:rgba(245,230,204,0.25); }
        .ob-field:focus {
          border-color:rgba(201,168,117,0.6);
          background:rgba(245,230,204,0.09);
          box-shadow:0 0 0 3px rgba(201,168,117,0.14);
        }
        .ob-field:-webkit-autofill,
        .ob-field:-webkit-autofill:hover,
        .ob-field:-webkit-autofill:focus {
          -webkit-text-fill-color:#F5E6CC !important;
          -webkit-box-shadow:0 0 0px 1000px rgba(30,24,20,0.95) inset !important;
          caret-color:#C9A875;
        }

        .style-tile {
          padding:16px 18px;
          border-radius:12px;
          border:1px solid rgba(245,230,204,0.10);
          background:rgba(245,230,204,0.04);
          cursor:pointer;
          transition:border-color 220ms ease, background 220ms ease, transform 220ms ${EASE_OUT};
          text-align:left;
        }
        .style-tile:hover { border-color:rgba(201,168,117,0.35); background:rgba(201,168,117,0.07); transform:translateY(-1px); }
        .style-tile.selected { border-color:rgba(201,168,117,0.6); background:rgba(201,168,117,0.1); }

        .city-chip {
          padding:8px 16px;
          border-radius:999px;
          border:1px solid rgba(245,230,204,0.12);
          background:rgba(245,230,204,0.04);
          font-size:13px;
          color:rgba(245,230,204,0.7);
          font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;
          cursor:pointer;
          transition:border-color 180ms ease, color 180ms ease, background 180ms ease, transform 180ms ${EASE_OUT};
          white-space:nowrap;
        }
        .city-chip:hover { border-color:rgba(201,168,117,0.4); color:#F5E6CC; background:rgba(201,168,117,0.08); transform:translateY(-1px); }
        .city-chip.selected { border-color:#C9A875; color:#C9A875; background:rgba(201,168,117,0.12); }

        .ob-next-btn {
          height:48px; border-radius:10px;
          background:linear-gradient(180deg,#D9BC92 0%,#C9A875 100%);
          color:#14100D;
          font-size:13px; font-weight:600; letter-spacing:0.06em;
          border:none; cursor:pointer;
          font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;
          transition:filter 180ms ease, transform 180ms ${EASE_OUT}, opacity 180ms ease;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 20px rgba(201,168,117,0.28);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .ob-next-btn:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); box-shadow:inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 28px rgba(201,168,117,0.4); }
        .ob-next-btn:active:not(:disabled) { transform:translateY(0) scale(0.97); transition-duration:90ms; }
        .ob-next-btn:disabled { opacity:0.4; cursor:not-allowed; }

        .ob-ghost-btn {
          height:48px; border-radius:10px;
          background:rgba(245,230,204,0.05);
          border:1px solid rgba(245,230,204,0.12);
          color:rgba(245,230,204,0.55);
          font-size:13px; font-weight:500;
          font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;
          cursor:pointer;
          transition:border-color 180ms ease, color 180ms ease, background 180ms ease;
        }
        .ob-ghost-btn:hover { border-color:rgba(245,230,204,0.25); color:#F5E6CC; background:rgba(245,230,204,0.08); }

        .ob-error {
          display:flex; align-items:center; gap:8px;
          padding:10px 12px; border-radius:8px;
          background:rgba(224,123,107,0.08);
          border:1px solid rgba(224,123,107,0.22);
          color:#E07B6B; font-size:12px;
          font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;
          animation:ob-slide-down 0.28s ease both;
        }

        @media (max-width:900px) {
          .ob-layout { flex-direction:column !important; }
          .ob-right  { display:none !important; }
          .ob-left   { width:100% !important; min-height:100dvh; padding:32px 24px !important; }
        }
      `}</style>

      {/* ── Root ── */}
      <div
        className="onboarding-bg-active"
        style={{
          position: 'relative',
          minHeight: '100dvh',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transition: `opacity 500ms ease`,
        }}
      >
        {/* Fixed background image */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 0,
            backgroundImage: `url('/onboarding/scenes/Onboarding-Background.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Dark overlay on background */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 1,
            background: 'rgba(10,7,5,0.72)',
          }}
        />

        {/* ── Layout ── */}
        <div
          className="ob-layout"
          style={{
            position: 'relative', zIndex: 2,
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* ── LEFT PANEL ── */}
          <div
            className="ob-left"
            style={{
              flex: '0 0 48%',
              display: 'flex',
              flexDirection: 'column',
              padding: 'clamp(28px,4vw,56px)',
              paddingTop: 'clamp(28px,4vw,48px)',
              gap: 0,
              overflowY: 'auto',
            }}
          >
            {/* Nav row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(36px,5vh,60px)' }}>
              {/* Logo */}
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: "'Cormorant Garamond',Georgia,serif",
                  fontStyle: 'italic', fontSize: '20px', fontWeight: 600,
                  color: '#F5E6CC', letterSpacing: '0.01em',
                }}>
                  Stay<span style={{ fontFamily: "'DM Sans',sans-serif", fontStyle: 'normal', color: '#C9A875' }}>scape</span>
                </span>
              </Link>

              {/* Step dots — only for onboarding steps (not auth) */}
              {currentStep.id !== 'auth' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {STEPS.slice(0, totalOnboarding).map((s, i) => (
                    <button
                      key={s.id}
                      aria-label={`Step ${i + 1}`}
                      onClick={() => i < stepIdx ? goTo(i) : undefined}
                      style={{
                        width: i === stepIdx ? '22px' : '7px',
                        height: '7px',
                        borderRadius: '999px',
                        background: i === stepIdx
                          ? '#C9A875'
                          : i < stepIdx
                            ? 'rgba(201,168,117,0.45)'
                            : 'rgba(245,230,204,0.15)',
                        border: 'none', padding: 0,
                        cursor: i < stepIdx ? 'pointer' : 'default',
                        transition: `width 350ms ${EASE_OUT}, background 300ms ease`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Step content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div key={contentKey}>
                {currentStep.id === 'welcome' && (
                  <WelcomeStep onNext={next} />
                )}
                {currentStep.id === 'name' && (
                  <NameStep
                    firstName={firstName} setFirstName={setFirstName}
                    lastName={lastName} setLastName={setLastName}
                    onNext={next} onBack={back}
                  />
                )}
                {currentStep.id === 'origin' && (
                  <OriginStep
                    origin={origin} setOrigin={setOrigin}
                    onNext={next} onBack={back}
                  />
                )}
                {currentStep.id === 'style' && (
                  <StyleStep
                    travelStyle={travelStyle} setTravelStyle={setTravelStyle}
                    onNext={next} onBack={back}
                  />
                )}
                {currentStep.id === 'city' && (
                  <CityStep
                    city={city} setCity={setCity}
                    cityQuery={cityQuery} setCityQuery={setCityQuery}
                    filteredCities={filteredCities}
                    onNext={next} onBack={back}
                    firstName={firstName}
                  />
                )}
                {currentStep.id === 'auth' && (
                  <AuthStep
                    mode={mode} switchMode={switchMode}
                    email={email} setEmail={setEmail}
                    password={password} setPassword={setPassword}
                    confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                    authError={authError} setAuthError={setAuthError}
                    isSubmitting={isSubmitting}
                    signupDone={signupDone}
                    handleLogin={handleLogin}
                    handleSignUp={handleSignUp}
                    onBack={back}
                    firstName={firstName}
                    city={city}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL — scene card ── */}
          <div
            className="ob-right"
            style={{
              flex: '0 0 52%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(24px,3vw,48px)',
              paddingLeft: 'clamp(12px,1.5vw,24px)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 'calc(100dvh - clamp(48px,6vw,96px))',
                maxHeight: '900px',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,230,204,0.06)',
              }}
            >
              {/* Scene layers — current + previous crossfade */}
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    position: 'absolute', inset: 0,
                    opacity: i === stepIdx ? 1 : 0,
                    transition: 'opacity 700ms ease',
                    zIndex: i === stepIdx ? 1 : 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.scene}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </div>
              ))}

              {/* Darker overlay on scene image */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  background: 'linear-gradient(to top, rgba(6,4,2,0.85) 0%, rgba(6,4,2,0.35) 45%, rgba(6,4,2,0.12) 75%, transparent 100%)',
                }}
              />
              {/* Edge vignette */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)',
                }}
              />

              {/* Caption */}
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  zIndex: 3,
                  padding: '28px 32px',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                }}
              >
                <div
                  key={`caption-${stepIdx}`}
                  style={{ animation: `ob-slide-up 0.6s 0.2s ${EASE_OUT} both` }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '6px',
                  }}>
                    <div style={{ width: '20px', height: '1px', background: 'rgba(201,168,117,0.7)' }} />
                    <span style={{
                      fontFamily: "'Cormorant Garamond',Georgia,serif",
                      fontStyle: 'italic', fontSize: '12px',
                      color: 'rgba(201,168,117,0.9)', letterSpacing: '0.04em',
                    }}>{currentStep.sceneCaption}</span>
                  </div>
                  <p style={{
                    fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif",
                    fontSize: '11px',
                    color: 'rgba(245,230,204,0.35)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}>
                    {stepIdx + 1} / {STEPS.length}
                  </p>
                </div>

                {/* Step indicator dots on card */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '5px', height: '5px',
                        borderRadius: '50%',
                        background: i === stepIdx ? '#C9A875' : 'rgba(245,230,204,0.2)',
                        transition: 'background 400ms ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Step sub-components ─────────────────────────────────────────────────────

function StepKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="ob-content-enter" style={{
      fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif",
      fontSize: '10.5px', fontWeight: 600,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: '#C9A875', margin: '0 0 14px',
    }}>{children}</p>
  )
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="ob-content-enter-1" style={{
      fontFamily: "'Cormorant Garamond',Georgia,serif",
      fontStyle: 'italic',
      fontSize: 'clamp(2rem,3.8vw,3.2rem)',
      fontWeight: 400, lineHeight: 1.15,
      color: '#F5E6CC', letterSpacing: '-0.02em',
      margin: '0 0 12px',
    }}>{children}</h2>
  )
}

function StepSub({ children }: { children: React.ReactNode }) {
  return (
    <p className="ob-content-enter-2" style={{
      fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif",
      fontSize: '14px', lineHeight: 1.65,
      color: 'rgba(245,230,204,0.5)',
      maxWidth: '42ch', margin: '0 0 36px',
    }}>{children}</p>
  )
}

function NextBtn({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button className="ob-next-btn" onClick={onClick} disabled={disabled} style={{ width: '100%' }}>
      {children}
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="ob-ghost-btn"
      onClick={onClick}
      style={{ width: '100%', marginTop: '10px' }}
    >
      ← Back
    </button>
  )
}

// ── Welcome ──────────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StepKicker>Welcome to Stayscape</StepKicker>
      <StepHeading>Every great stay<br />starts with you.</StepHeading>
      <StepSub>
        A few questions, and we'll have a profile that helps us match you to the right places — and make every stay feel like it was made for you.
      </StepSub>
      <div className="ob-content-enter-3">
        <NextBtn onClick={onNext}>
          Let's begin
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </NextBtn>
      </div>

      <div className="ob-content-enter-4" style={{ marginTop: '16px' }}>
        <a
          href="/dashboard"
          style={{
            display: 'block', textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(245,230,204,0.25)',
            fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif",
            textDecoration: 'none',
            transition: 'color 180ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(245,230,204,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,230,204,0.25)')}
        >
          Skip for now and explore →
        </a>
      </div>
    </div>
  )
}

// ── Name ─────────────────────────────────────────────────────────────────────

function NameStep({
  firstName, setFirstName, lastName, setLastName, onNext, onBack,
}: {
  firstName: string; setFirstName: (v: string) => void
  lastName: string; setLastName: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StepKicker>Step 1 of 4</StepKicker>
      <StepHeading>What should<br />we call you?</StepHeading>
      <StepSub>Your name helps us personalise every interaction across your stays.</StepSub>

      <div className="ob-content-enter-3" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,204,0.35)', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif" }}>
            First name
          </label>
          <input
            className="ob-field"
            type="text"
            autoComplete="given-name"
            placeholder="e.g. James"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,204,0.35)', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif" }}>
            Last name
          </label>
          <input
            className="ob-field"
            type="text"
            autoComplete="family-name"
            placeholder="e.g. Chen"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div className="ob-content-enter-4">
        <NextBtn onClick={onNext} disabled={!firstName.trim()}>
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </NextBtn>
        <BackBtn onClick={onBack} />
      </div>
    </div>
  )
}

// ── Origin ───────────────────────────────────────────────────────────────────

function OriginStep({
  origin, setOrigin, onNext, onBack,
}: {
  origin: string; setOrigin: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StepKicker>Step 2 of 4</StepKicker>
      <StepHeading>Where do you<br />call home?</StepHeading>
      <StepSub>
        We use this to understand your travel context — not to limit where you can go.
      </StepSub>

      <div className="ob-content-enter-3" style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,204,0.35)', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif" }}>
          Your home city or country
        </label>
        <input
          className="ob-field"
          type="text"
          placeholder="e.g. Singapore, London, New York…"
          value={origin}
          onChange={e => setOrigin(e.target.value)}
          autoFocus
        />
      </div>

      <div className="ob-content-enter-4">
        <NextBtn onClick={onNext} disabled={!origin.trim()}>
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </NextBtn>
        <BackBtn onClick={onBack} />
      </div>
    </div>
  )
}

// ── Travel Style ─────────────────────────────────────────────────────────────

function StyleStep({
  travelStyle, setTravelStyle, onNext, onBack,
}: {
  travelStyle: string; setTravelStyle: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StepKicker>Step 3 of 4</StepKicker>
      <StepHeading>How do you<br />like to travel?</StepHeading>
      <StepSub>Pick the style that feels most like you.</StepSub>

      <div className="ob-content-enter-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        {TRAVEL_STYLES.map(s => (
          <button
            key={s.id}
            className={`style-tile${travelStyle === s.id ? ' selected' : ''}`}
            onClick={() => setTravelStyle(s.id)}
          >
            <p style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontStyle: 'italic', fontSize: '16px',
              color: travelStyle === s.id ? '#C9A875' : '#F5E6CC',
              margin: '0 0 3px',
              transition: 'color 180ms ease',
            }}>{s.label}</p>
            <p style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '11.5px', color: 'rgba(245,230,204,0.4)',
              margin: 0, lineHeight: 1.4,
              transition: 'color 180ms ease',
            }}>{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="ob-content-enter-4">
        <NextBtn onClick={onNext} disabled={!travelStyle}>
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </NextBtn>
        <BackBtn onClick={onBack} />
      </div>
    </div>
  )
}

// ── City ─────────────────────────────────────────────────────────────────────

function CityStep({
  city, setCity, cityQuery, setCityQuery,
  filteredCities, onNext, onBack, firstName,
}: {
  city: string; setCity: (v: string) => void
  cityQuery: string; setCityQuery: (v: string) => void
  filteredCities: string[]
  onNext: () => void; onBack: () => void
  firstName: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StepKicker>Step 4 of 4</StepKicker>
      <StepHeading>
        {firstName ? `${firstName}, where` : 'Where'}<br />are you headed?
      </StepHeading>
      <StepSub>
        Tell us the city for your next trip — we'll build your stay around it.
      </StepSub>

      <div className="ob-content-enter-3" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,204,0.35)', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif" }}>
          Search or choose a city
        </label>
        <input
          className="ob-field"
          type="text"
          placeholder="Type a city name…"
          value={cityQuery}
          onChange={e => { setCityQuery(e.target.value); if (!e.target.value) setCity('') }}
          autoFocus
        />
      </div>

      <div
        className="ob-content-enter-4"
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          maxHeight: '140px', overflowY: 'auto',
          marginBottom: '24px',
        }}
      >
        {filteredCities.map(c => (
          <button
            key={c}
            className={`city-chip${city === c ? ' selected' : ''}`}
            onClick={() => { setCity(c); setCityQuery(c) }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="ob-content-enter-5">
        <NextBtn onClick={onNext} disabled={!city.trim() && !cityQuery.trim()}>
          Continue to sign up
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </NextBtn>
        <BackBtn onClick={onBack} />
      </div>
    </div>
  )
}

// ── Auth ─────────────────────────────────────────────────────────────────────

function AuthStep({
  mode, switchMode,
  email, setEmail,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  authError, setAuthError,
  isSubmitting, signupDone,
  handleLogin, handleSignUp,
  onBack, firstName, city,
}: {
  mode: 'signin' | 'signup'; switchMode: (m: 'signin' | 'signup') => void
  email: string; setEmail: (v: string) => void
  password: string; setPassword: (v: string) => void
  confirmPassword: string; setConfirmPassword: (v: string) => void
  authError: string | null; setAuthError: (v: string | null) => void
  isSubmitting: boolean; signupDone: boolean
  handleLogin: (e: FormEvent) => void; handleSignUp: (e: FormEvent) => void
  onBack: () => void; firstName: string; city: string
}) {
  const greeting = firstName
    ? `Almost there, ${firstName}.`
    : mode === 'signup'
      ? 'Create your account.'
      : 'Welcome back.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StepKicker>{mode === 'signup' ? 'Create Account' : 'Sign In'}</StepKicker>
      <StepHeading>{greeting}</StepHeading>

      {city && mode === 'signup' && (
        <p className="ob-content-enter-2" style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: '13px', lineHeight: 1.6,
          color: 'rgba(245,230,204,0.45)',
          margin: '0 0 28px',
        }}>
          Your {city} profile is ready — just set up your account to save it.
        </p>
      )}

      {!city && (
        <StepSub>
          {mode === 'signup'
            ? 'Create an account to save your travel profile and unlock your personal concierge.'
            : 'Sign in to access your travel profile and saved stays.'}
        </StepSub>
      )}

      {signupDone ? (
        <div className="ob-content-enter-3" style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'rgba(201,168,117,0.08)',
          border: '1px solid rgba(201,168,117,0.22)',
          marginBottom: '20px',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            fontStyle: 'italic', fontSize: '18px',
            color: '#F5E6CC', margin: '0 0 8px', fontWeight: 400,
          }}>Check your email.</p>
          <p style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '13px', lineHeight: 1.65,
            color: 'rgba(245,230,204,0.5)', margin: '0 0 14px',
          }}>
            We&apos;ve sent a confirmation link to <strong style={{ color: '#C9A875' }}>{email}</strong>.
            Click it to activate your account, then come back to sign in.
          </p>
          <button
            type="button"
            onClick={() => switchMode('signin')}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: '12px', color: '#C9A875', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
              transition: 'opacity 180ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Back to sign in →
          </button>
        </div>
      ) : (
        <form
          onSubmit={mode === 'signin' ? handleLogin : handleSignUp}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}
        >
          <div className="ob-content-enter-3">
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,204,0.35)', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif" }}>
              Email
            </label>
            <input
              className="ob-field"
              type="email"
              autoComplete="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setAuthError(null) }}
            />
          </div>

          <div className="ob-content-enter-4">
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,204,0.35)', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif" }}>
              Password
            </label>
            <input
              className="ob-field"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError(null) }}
            />
          </div>

          {mode === 'signup' && (
            <div className="ob-content-enter-5">
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,204,0.35)', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif" }}>
                Confirm password
              </label>
              <input
                className="ob-field"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setAuthError(null) }}
              />
            </div>
          )}

          {authError && (
            <div className="ob-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {authError}
            </div>
          )}

          <button
            type="submit"
            className="ob-next-btn"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '4px' }}
          >
            {isSubmitting ? (
              <>
                <svg className="app-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/>
                </svg>
                {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {mode === 'signin' && (
          <p style={{ fontSize: '11px', color: 'rgba(245,230,204,0.25)', fontFamily: "'DM Sans',sans-serif", margin: 0 }}>
            Demo: <code style={{ color: 'rgba(245,230,204,0.4)' }}>ben.test@stayscape-demo.com</code> / <code style={{ color: 'rgba(245,230,204,0.4)' }}>Demo1234!</code>
          </p>
        )}
        <a
          href="/dashboard"
          style={{ fontSize: '12px', color: 'rgba(245,230,204,0.25)', fontFamily: "'DM Sans',sans-serif", textDecoration: 'none', transition: 'color 180ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(245,230,204,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,230,204,0.25)')}
        >
          Explore without signing in →
        </a>
        {!signupDone && (
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{
              background: 'none', border: 'none', padding: 0, textAlign: 'left',
              fontSize: '12px', color: 'rgba(245,230,204,0.25)',
              fontFamily: "'DM Sans',sans-serif",
              cursor: 'pointer', transition: 'color 180ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(245,230,204,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,230,204,0.25)')}
          >
            {mode === 'signin' ? 'New here? Create an account →' : 'Already have an account? Sign in →'}
          </button>
        )}
        <BackBtn onClick={onBack} />
      </div>
    </div>
  )
}
