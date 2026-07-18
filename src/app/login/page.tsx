'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useAuth } from '@/lib/context/auth-context'

/* ── Slide data ───────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 'discover',
    tag: 'Discover',
    headline: 'Find places worth\nremembering.',
    sub: 'Hidden restaurants, secret viewpoints, local markets — curated by people who actually live there.',
    accent: '#FF6B9D',
    accentB: '#FF9A6C',
    stat: { icon: '🗺️', val: '2,400+', label: 'curated places' },
  },
  {
    id: 'ai',
    tag: 'AI Concierge',
    headline: 'Your AI travel\ncompanion.',
    sub: 'Aria learns what you love and builds a living itinerary that evolves as your trip does.',
    accent: '#9B7CF8',
    accentB: '#5B9CF6',
    stat: { icon: '✨', val: 'Personalised', label: 'just for you' },
  },
  {
    id: 'map',
    tag: 'Explore',
    headline: 'Every city,\nunlocked.',
    sub: 'Interactive maps, walking times, opening hours — everything you need, right when you need it.',
    accent: '#0BC4A0',
    accentB: '#5BC8E8',
    stat: { icon: '🌏', val: '40 cities', label: 'and growing' },
  },
  {
    id: 'vibe',
    tag: 'Vibe Match',
    headline: 'Travel that fits\nhow you feel.',
    sub: 'Filter by mood — romantic, adventurous, laid-back — and let Stayscape handle the rest.',
    accent: '#F5A623',
    accentB: '#F5654B',
    stat: { icon: '❤️', val: '98%', label: 'traveller satisfaction' },
  },
]

const INTERVAL = 4400

export default function HomePage() {
  const router = useRouter()
  const { login } = useAuth()

  /* — Slideshow state — */
  const [slide, setSlide] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* — Login state — */
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function goTo(idx: number) {
    if (idx === slide || transitioning) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setTransitioning(true)
    setSlide(idx)
    setAnimKey(k => k + 1)
    setTimeout(() => setTransitioning(false), 480)
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => goTo((slide + 1) % SLIDES.length), INTERVAL)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, transitioning])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await login(email, password)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    router.push('/dashboard')
  }

  const s = SLIDES[slide]

  return (
    <>
      <div className="hp-root">

        {/* ════════════════════════════════ LEFT — showcase */}
        <div className="hp-left">

          {/* Background gradient — transitions with slide */}
          <div
            key={`bg-${slide}`}
            className="hp-left-bg"
            style={{ background: `linear-gradient(145deg, ${s.accent}18 0%, ${s.accentB}0C 100%)` }}
          />

          {/* Dot grid */}
          <div
            className="hp-dot-grid"
            style={{ backgroundImage: `radial-gradient(circle, ${s.accent}22 1px, transparent 1px)` }}
          />

          {/* Blob */}
          <div
            key={`blob-${slide}`}
            className="hp-blob"
            style={{ background: `radial-gradient(circle, ${s.accent}28 0%, transparent 65%)` }}
          />

          <div className="hp-left-inner">

            {/* Logo */}
            <div className="hp-logo">
              <svg viewBox="0 0 36 36" width="32" height="32" aria-hidden="true">
                <rect width="36" height="36" rx="9"
                  fill={`url(#logo-grad-${slide})`} />
                <defs>
                  <linearGradient id={`logo-grad-${slide}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={s.accent} />
                    <stop offset="100%" stopColor={s.accentB} />
                  </linearGradient>
                </defs>
                <path d="M24,12 C21,7 14,5.5 10,9 C6,12.5 7,19 12,22 C15,23.5 19,23 22,25 C25,27 25,32 22,34"
                  fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
                <path d="M15,9 C15,5.5 19,4.5 22,6.5 C25,8.5 25,13 22,16 C19,19 15,19 13,22.5 C11,26 12,30 15,32 C18,34 22,34 25,32"
                  fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <span className="hp-logo-name">Stayscape</span>
            </div>

            {/* Slide content */}
            <div className="hp-slide-content">

              {/* Tag pill */}
              <div key={`tag-${animKey}`} className="hp-tag" style={{
                background: `${s.accent}18`,
                border: `1.5px solid ${s.accent}30`,
                color: s.accent,
              }}>
                <span className="hp-tag-dot" style={{ background: s.accent }} />
                {s.tag}
              </div>

              {/* Headline */}
              <h1 key={`h-${animKey}`} className="hp-headline">
                {s.headline}
              </h1>

              {/* Sub */}
              <p key={`sub-${animKey}`} className="hp-sub">
                {s.sub}
              </p>

              {/* Stat chip */}
              <div key={`stat-${animKey}`} className="hp-stat">
                <span>{s.stat.icon}</span>
                <span className="hp-stat-val">{s.stat.val}</span>
                <span className="hp-stat-label">{s.stat.label}</span>
              </div>
            </div>

            {/* Dot nav */}
            <div className="hp-dots">
              {SLIDES.map((sl, i) => (
                <button
                  key={sl.id}
                  onClick={() => goTo(i)}
                  aria-label={sl.tag}
                  className="hp-dot"
                  style={{
                    width: i === slide ? 22 : 6,
                    background: i === slide ? s.accent : `${s.accent}35`,
                  }}
                />
              ))}
            </div>

          </div>
        </div>

        {/* ════════════════════════════════ RIGHT — login panel */}
        <div className="hp-right">

          {/* Video background */}
          <video
            autoPlay muted loop playsInline preload="auto"
            className="hp-video"
            aria-hidden="true"
          >
            <source src="/videos/splash-guests.mp4" type="video/mp4" />
          </video>

          {/* Overlays */}
          <div className="hp-video-scrim" />
          <div className="hp-video-grad" style={{
            background: `linear-gradient(to bottom, transparent 30%, ${s.accent}30 100%)`,
            transition: 'background 600ms ease',
          }} />

          {/* Login card */}
          <div className="hp-card">

            <p className="hp-card-eyebrow">Sign in to continue</p>
            <h2 className="hp-card-title">Welcome back</h2>

            <form onSubmit={handleLogin} className="hp-form">
              <div className="hp-field">
                <label className="hp-label">Email</label>
                <input
                  type="email" required autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  placeholder="you@email.com"
                  className="hp-input"
                />
              </div>

              <div className="hp-field">
                <label className="hp-label">Password</label>
                <input
                  type="password" required autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  className="hp-input"
                />
              </div>

              {error && (
                <div className="hp-error">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="hp-submit"
                style={{ background: `linear-gradient(135deg, ${s.accent} 0%, ${s.accentB} 100%)`,
                         boxShadow: `0 8px 24px ${s.accent}40`,
                         transition: 'background 500ms ease, box-shadow 500ms ease, opacity 180ms ease' }}
              >
                {submitting ? (
                  <span className="hp-submit-inner">
                    <svg className="hp-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" opacity="0.25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.8"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="hp-card-footer">
              New to Stayscape? <button className="hp-link" onClick={() => router.push('/dashboard')}>Explore as guest</button>
            </p>
          </div>

          {/* Bottom location tag */}
          <div className="hp-location" style={{ borderColor: `${s.accent}40` }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Discover the world with Stayscape</span>
          </div>

        </div>
      </div>

      <style>{`
        /* ── Root ───────────────────────────────────────────────── */
        .hp-root {
          position: fixed; inset: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
        }

        /* ── Left ───────────────────────────────────────────────── */
        .hp-left {
          position: relative;
          background: #fafafa;
          overflow: hidden;
        }
        .hp-left-bg {
          position: absolute; inset: 0;
          animation: hp-bg-in 600ms ease forwards;
        }
        .hp-dot-grid {
          position: absolute; inset: 0;
          background-size: 26px 26px;
          mask-image: radial-gradient(ellipse 80% 80% at 80% 80%, black 0%, transparent 100%);
          opacity: 0.8;
        }
        .hp-blob {
          position: absolute;
          top: -10%; right: -15%;
          width: 60%; padding-bottom: 60%;
          border-radius: 50%;
          filter: blur(80px);
          animation: hp-blob-in 700ms ease both;
        }
        .hp-left-inner {
          position: relative; z-index: 1;
          height: 100%;
          display: flex; flex-direction: column;
          padding: clamp(28px, 5vh, 52px) clamp(28px, 5vw, 60px);
        }

        /* ── Logo ───────────────────────────────────────────────── */
        .hp-logo {
          display: flex; align-items: center; gap: 9px;
          margin-bottom: auto;
        }
        .hp-logo-name {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 16px; font-weight: 700; letter-spacing: -0.01em;
          color: #0f0f1a;
        }

        /* ── Slide content ──────────────────────────────────────── */
        .hp-slide-content {
          flex: 1;
          display: flex; flex-direction: column; justify-content: center;
          padding: clamp(16px, 3vh, 32px) 0;
        }
        .hp-tag {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px 5px 8px;
          border-radius: 999px;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 18px;
          animation: hp-slide-in 420ms cubic-bezier(0.22,1,0.36,1) both;
        }
        .hp-tag-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: hp-dot-pulse 2s ease-in-out infinite;
        }
        .hp-headline {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(26px, 3.8vw, 50px);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.02em;
          color: #0f0f1a;
          margin: 0 0 clamp(12px, 2vh, 20px);
          white-space: pre-line;
          animation: hp-slide-in 420ms cubic-bezier(0.22,1,0.36,1) 50ms both;
        }
        .hp-sub {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(13px, 1.2vw, 15px);
          font-weight: 400;
          line-height: 1.65;
          color: #4a4a6a;
          margin: 0 0 clamp(20px, 3.5vh, 32px);
          max-width: 380px;
          animation: hp-slide-in 420ms cubic-bezier(0.22,1,0.36,1) 90ms both;
        }
        .hp-stat {
          display: inline-flex; align-items: center; gap: 8px;
          background: white;
          border-radius: 12px;
          padding: 10px 16px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          width: fit-content;
          animation: hp-slide-in 420ms cubic-bezier(0.22,1,0.36,1) 130ms both;
        }
        .hp-stat-val {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 14px; font-weight: 700; color: #0f0f1a;
        }
        .hp-stat-label {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 12px; color: #8080a0;
        }

        /* ── Dot nav ────────────────────────────────────────────── */
        .hp-dots {
          display: flex; gap: 7px; align-items: center;
          padding-top: clamp(20px, 3.5vh, 36px);
        }
        .hp-dot {
          border: none; padding: 0; cursor: pointer;
          height: 6px; border-radius: 999px;
          transition: width 280ms ease, background 280ms ease;
        }

        /* ── Right ───────────────────────────────────────────────── */
        .hp-right {
          position: relative;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .hp-video {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .hp-video-scrim {
          position: absolute; inset: 0;
          background: rgba(4,2,2,0.52);
        }
        .hp-video-grad {
          position: absolute; inset: 0;
        }

        /* ── Login card ─────────────────────────────────────────── */
        .hp-card {
          position: relative; z-index: 2;
          width: clamp(280px, 84%, 380px);
          background: rgba(8,6,5,0.72);
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 20px;
          padding: clamp(24px, 4vh, 36px) clamp(22px, 3.5vw, 32px);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          box-shadow: 0 32px 72px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset;
        }
        .hp-card-eyebrow {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 10px; font-weight: 600; letter-spacing: 0.13em;
          text-transform: uppercase; color: rgba(250,248,245,0.35);
          margin: 0 0 6px;
        }
        .hp-card-title {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(20px, 2.2vw, 26px);
          font-weight: 600; color: #faf8f5;
          margin: 0 0 clamp(18px, 3vh, 26px);
          letter-spacing: -0.01em;
        }

        /* ── Form ───────────────────────────────────────────────── */
        .hp-form { display: flex; flex-direction: column; gap: 14px; }
        .hp-field { display: flex; flex-direction: column; gap: 7px; }
        .hp-label {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(250,248,245,0.35);
        }
        .hp-input {
          width: 100%; height: 42px; padding: 0 14px;
          border-radius: 9px;
          background: rgba(250,248,245,0.06);
          border: 1px solid rgba(250,248,245,0.11);
          color: #faf8f5; font-size: 13px;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          outline: none;
          transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
          box-sizing: border-box;
          -webkit-appearance: none;
        }
        .hp-input::placeholder { color: rgba(250,248,245,0.22); }
        .hp-input:focus {
          border-color: rgba(255,255,255,0.28);
          background: rgba(250,248,245,0.09);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.06);
        }
        .hp-error {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 11px; border-radius: 8px;
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.22);
          color: #f87171;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 12px;
          animation: hp-slide-in 260ms ease both;
        }
        .hp-submit {
          width: 100%; height: 42px; border-radius: 9px;
          color: #fff; border: none; cursor: pointer;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
          margin-top: 4px;
        }
        .hp-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        .hp-submit-inner { display: inline-flex; align-items: center; gap: 8px; }
        .hp-card-footer {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 12px; color: rgba(250,248,245,0.35);
          text-align: center; margin: clamp(14px, 2.5vh, 20px) 0 0;
        }
        .hp-link {
          background: none; border: none; cursor: pointer; padding: 0;
          font-size: 12px; color: rgba(250,248,245,0.65);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          text-decoration: underline; text-underline-offset: 2px;
        }
        .hp-link:hover { color: #faf8f5; }

        /* ── Bottom location tag ────────────────────────────────── */
        .hp-location {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          z-index: 2;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(0,0,0,0.4);
          border: 1px solid;
          backdrop-filter: blur(8px);
          white-space: nowrap;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 11px; color: rgba(250,248,245,0.6);
          transition: border-color 500ms ease;
        }

        /* ── Keyframes ──────────────────────────────────────────── */
        @keyframes hp-bg-in {
          from { opacity: 0 } to { opacity: 1 }
        }
        @keyframes hp-blob-in {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes hp-slide-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hp-dot-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.45; transform: scale(0.75); }
        }
        @keyframes hp-spin {
          to { transform: rotate(360deg); }
        }
        .hp-spin { animation: hp-spin 0.8s linear infinite; }

        /* ── Mobile ─────────────────────────────────────────────── */
        @media (max-width: 767px) {
          .hp-root { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
          .hp-left { min-height: 42vh; }
          .hp-left-inner { padding: 24px 22px 20px; }
          .hp-headline { font-size: clamp(22px, 5.5vw, 32px); }
          .hp-stat { display: none; }
          .hp-right { min-height: 58vh; align-items: flex-end; padding-bottom: 32px; }
          .hp-location { display: none; }
          .hp-card { width: calc(100% - 40px); }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </>
  )
}
