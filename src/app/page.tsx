'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/* ── Feature sections ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Curated by locals',
    body: 'Every place is hand-picked and AI-verified — no tourist traps, no sponsored results. Just places worth your time.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18 2v4h4"/>
      </svg>
    ),
    title: 'AI that plans for you',
    body: 'Tell Aria what you\'re in the mood for. It builds your day, adjusts on the fly, and remembers what you loved.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
    title: 'Every city, unlocked',
    body: 'From Tokyo backstreets to Lisbon hilltops — live maps, walking times, and opening hours all in one place.',
  },
]

const STATS = [
  { val: '2,400+', label: 'Curated places' },
  { val: '40',     label: 'Cities' },
  { val: 'AI',     label: 'Powered itineraries' },
  { val: '98%',    label: 'Traveller satisfaction' },
]

/* ── Words that cycle in the hero headline ────────────────────── */
const CYCLING_WORDS = ['hidden gems', 'local secrets', 'places to love', 'the good stuff']

export default function WelcomePage() {
  const router = useRouter()
  const [wordIdx, setWordIdx] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  /* Word cycling */
  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIdx(i => (i + 1) % CYCLING_WORDS.length)
        setWordVisible(true)
      }, 300)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  /* Navbar background on scroll */
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className={`wl-nav ${scrolled ? 'wl-nav--solid' : ''}`}>
        <div className="wl-nav-inner">
          {/* Logo */}
          <button className="wl-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <svg viewBox="0 0 36 36" width="28" height="28" aria-hidden="true">
              <rect width="36" height="36" rx="9" fill="url(#nav-logo-grad)"/>
              <defs>
                <linearGradient id="nav-logo-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF6B9D"/>
                  <stop offset="100%" stopColor="#7B9CF4"/>
                </linearGradient>
              </defs>
              <path d="M24,12 C21,7 14,5.5 10,9 C6,12.5 7,19 12,22 C15,23.5 19,23 22,25 C25,27 25,32 22,34"
                fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
              <path d="M15,9 C15,5.5 19,4.5 22,6.5 C25,8.5 25,13 22,16 C19,19 15,19 13,22.5 C11,26 12,30 15,32 C18,34 22,34 25,32"
                fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            <span className="wl-nav-brand">Stayscape</span>
          </button>

          {/* Actions */}
          <div className="wl-nav-actions">
            <button className="wl-btn-ghost" onClick={() => router.push('/login')}>Log in</button>
            <button className="wl-btn-primary" onClick={() => router.push('/login')}>Sign up free</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="wl-hero">
        {/* Video bg */}
        <video
          ref={videoRef}
          autoPlay muted loop playsInline preload="auto"
          className="wl-hero-video"
          aria-hidden="true"
        >
          <source src="/videos/splash-guests.mp4" type="video/mp4" />
        </video>
        <div className="wl-hero-scrim" />

        {/* Hero content */}
        <div className="wl-hero-content">
          <div className="wl-hero-tag wl-anim" style={{ animationDelay: '0ms' }}>
            <span className="wl-hero-tag-dot" />
            Your AI travel companion
          </div>

          <h1 className="wl-hero-h1 wl-anim" style={{ animationDelay: '80ms' }}>
            Discover{' '}
            <span
              className="wl-word"
              style={{ opacity: wordVisible ? 1 : 0 }}
            >
              {CYCLING_WORDS[wordIdx]}
            </span>
            <br />in every city.
          </h1>

          <p className="wl-hero-sub wl-anim" style={{ animationDelay: '160ms' }}>
            Stayscape curates the places locals love — hidden restaurants,
            rooftop bars, secret viewpoints — then lets AI build your perfect day.
          </p>

          <div className="wl-hero-cta wl-anim" style={{ animationDelay: '240ms' }}>
            <button className="wl-cta-main" onClick={() => router.push('/login')}>
              Get started free
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
            <button className="wl-cta-ghost" onClick={() => router.push('/login')}>
              Log in
            </button>
          </div>

          {/* Stats row */}
          <div className="wl-stats wl-anim" style={{ animationDelay: '340ms' }}>
            {STATS.map((s, i) => (
              <div key={i} className="wl-stat">
                <span className="wl-stat-val">{s.val}</span>
                <span className="wl-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="wl-scroll-hint" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M6 13l6 6 6-6"/>
          </svg>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="wl-features">
        <div className="wl-section-inner">
          <p className="wl-section-eyebrow">Why Stayscape</p>
          <h2 className="wl-section-h2">Travel the way you actually want to.</h2>
          <p className="wl-section-sub">
            Not another list of tourist attractions. Stayscape is built for
            travellers who want the real thing.
          </p>

          <div className="wl-feature-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="wl-feature-card">
                <div className="wl-feature-icon">{f.icon}</div>
                <h3 className="wl-feature-title">{f.title}</h3>
                <p className="wl-feature-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="wl-how">
        <div className="wl-section-inner">
          <p className="wl-section-eyebrow">How it works</p>
          <h2 className="wl-section-h2">Three steps to a better trip.</h2>

          <div className="wl-steps">
            {[
              { n: '01', title: 'Tell us where you\'re going', body: 'Pick a city and set your travel dates. Stayscape loads up everything worth knowing.' },
              { n: '02', title: 'Browse or ask Aria', body: 'Explore curated places on the map, or chat with Aria to get a personalised itinerary in seconds.' },
              { n: '03', title: 'Go live your trip', body: 'Save places, follow your itinerary, discover more as you walk — Stayscape travels with you.' },
            ].map((step, i) => (
              <div key={i} className="wl-step">
                <span className="wl-step-num">{step.n}</span>
                <h3 className="wl-step-title">{step.title}</h3>
                <p className="wl-step-body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="wl-bottom-cta">
        <div className="wl-bottom-blob wl-bottom-blob-a" />
        <div className="wl-bottom-blob wl-bottom-blob-b" />
        <div className="wl-section-inner wl-bottom-inner">
          <h2 className="wl-bottom-h2">Ready to travel differently?</h2>
          <p className="wl-bottom-sub">Join travellers discovering the world with Stayscape.</p>
          <button className="wl-cta-main wl-cta-large" onClick={() => router.push('/login')}>
            Start for free
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="wl-footer">
        <div className="wl-nav-inner">
          <span className="wl-footer-brand">© 2026 Stayscape</span>
          <div className="wl-footer-links">
            <button className="wl-footer-link" onClick={() => router.push('/privacy')}>Privacy</button>
            <button className="wl-footer-link" onClick={() => router.push('/terms')}>Terms</button>
          </div>
        </div>
      </footer>

      <style>{`
        /* ── Reset / base ──────────────────────────────────────── */
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Navbar ────────────────────────────────────────────── */
        .wl-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 clamp(20px, 5vw, 72px);
          transition: background 300ms ease, box-shadow 300ms ease, backdrop-filter 300ms ease;
        }
        .wl-nav--solid {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 1px 0 rgba(0,0,0,0.07);
        }
        .wl-nav-inner {
          max-width: 1120px; margin: 0 auto;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .wl-nav-logo {
          display: flex; align-items: center; gap: 9px;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .wl-nav-brand {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 16px; font-weight: 700; letter-spacing: -0.01em;
          color: #fff;
          transition: color 300ms ease;
        }
        .wl-nav--solid .wl-nav-brand { color: #0f0f1a; }
        .wl-nav-actions { display: flex; align-items: center; gap: 10px; }

        .wl-btn-ghost {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.85);
          background: none; border: none; cursor: pointer;
          padding: 8px 14px; border-radius: 8px;
          transition: color 300ms ease, background 180ms ease;
        }
        .wl-btn-ghost:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .wl-nav--solid .wl-btn-ghost { color: #3d3d5c; }
        .wl-nav--solid .wl-btn-ghost:hover { background: rgba(0,0,0,0.05); color: #0f0f1a; }

        .wl-btn-primary {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 13px; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, #FF6B9D 0%, #9B7CF8 100%);
          border: none; cursor: pointer;
          padding: 8px 18px; border-radius: 8px;
          box-shadow: 0 4px 14px rgba(155,124,248,0.30);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .wl-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(155,124,248,0.40);
        }

        /* ── Hero ──────────────────────────────────────────────── */
        .wl-hero {
          position: relative;
          min-height: 100svh;
          display: flex; align-items: center;
          overflow: hidden;
        }
        .wl-hero-video {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
        }
        .wl-hero-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(4,2,8,0.55) 0%,
            rgba(4,2,8,0.42) 50%,
            rgba(4,2,8,0.72) 100%
          );
        }
        .wl-hero-content {
          position: relative; z-index: 1;
          max-width: 1120px; margin: 0 auto; width: 100%;
          padding: clamp(100px,16vh,160px) clamp(20px,5vw,72px) clamp(80px,12vh,120px);
        }

        /* Tag pill */
        .wl-hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.20);
          backdrop-filter: blur(8px);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: rgba(255,255,255,0.85);
          margin-bottom: clamp(20px,3.5vh,32px);
        }
        .wl-hero-tag-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #FF6B9D;
          animation: wl-pulse 2s ease-in-out infinite;
        }

        /* Headline */
        .wl-hero-h1 {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(38px, 6.5vw, 88px);
          font-weight: 800; line-height: 1.06;
          letter-spacing: -0.03em; color: #fff;
          margin-bottom: clamp(18px,3vh,28px);
          max-width: 820px;
        }
        .wl-word {
          background: linear-gradient(135deg, #FF6B9D 0%, #9B7CF8 55%, #5B9CF6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: opacity 280ms ease;
          display: inline-block;
        }

        /* Sub */
        .wl-hero-sub {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(15px, 1.6vw, 19px); font-weight: 400;
          line-height: 1.65; color: rgba(255,255,255,0.72);
          max-width: 520px;
          margin-bottom: clamp(28px,5vh,44px);
        }

        /* CTA row */
        .wl-hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: clamp(36px,6vh,56px); }
        .wl-cta-main {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 14px; font-weight: 700; color: #fff;
          background: linear-gradient(135deg, #FF6B9D 0%, #9B7CF8 100%);
          border: none; cursor: pointer; border-radius: 999px;
          padding: 14px 28px;
          box-shadow: 0 8px 28px rgba(155,124,248,0.40);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .wl-cta-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(155,124,248,0.50);
        }
        .wl-cta-large { padding: 16px 36px; font-size: 15px; }
        .wl-cta-ghost {
          display: inline-flex; align-items: center;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 14px; font-weight: 600;
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.20);
          cursor: pointer; border-radius: 999px;
          padding: 14px 24px;
          backdrop-filter: blur(8px);
          transition: background 180ms ease, color 180ms ease;
        }
        .wl-cta-ghost:hover { background: rgba(255,255,255,0.18); color: #fff; }

        /* Stats */
        .wl-stats {
          display: flex; gap: clamp(24px,4vw,56px);
          flex-wrap: wrap;
        }
        .wl-stat { display: flex; flex-direction: column; gap: 2px; }
        .wl-stat-val {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(22px,3vw,32px); font-weight: 700;
          color: #fff; line-height: 1;
        }
        .wl-stat-label {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.45); letter-spacing: 0.02em;
        }

        /* Scroll hint */
        .wl-scroll-hint {
          position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
          animation: wl-bounce 2s ease-in-out infinite;
        }

        /* ── Shared section styles ─────────────────────────────── */
        .wl-section-inner {
          max-width: 1120px; margin: 0 auto;
          padding: 0 clamp(20px,5vw,72px);
        }
        .wl-section-eyebrow {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #FF6B9D;
          margin-bottom: 14px;
        }
        .wl-section-h2 {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(26px,3.8vw,48px); font-weight: 700;
          line-height: 1.12; letter-spacing: -0.02em;
          color: #0f0f1a;
          margin-bottom: 16px; max-width: 600px;
        }
        .wl-section-sub {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(14px,1.3vw,16px); color: #6060a0; line-height: 1.65;
          max-width: 500px;
        }

        /* ── Features ──────────────────────────────────────────── */
        .wl-features {
          background: #fff;
          padding: clamp(64px,10vh,96px) 0;
        }
        .wl-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          margin-top: clamp(36px,6vh,56px);
        }
        .wl-feature-card {
          background: #fafafa;
          border: 1px solid #f0f0f8;
          border-radius: 20px;
          padding: clamp(24px,3vw,36px);
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .wl-feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(100,80,200,0.10);
        }
        .wl-feature-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, #FF6B9D18, #9B7CF818);
          border: 1px solid #f0e8ff;
          display: flex; align-items: center; justify-content: center;
          color: #9B7CF8;
          margin-bottom: 20px;
        }
        .wl-feature-title {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 16px; font-weight: 700; color: #0f0f1a;
          margin-bottom: 10px; letter-spacing: -0.01em;
        }
        .wl-feature-body {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 14px; line-height: 1.65; color: #6060a0;
        }

        /* ── How it works ──────────────────────────────────────── */
        .wl-how {
          background: #f8f7ff;
          padding: clamp(64px,10vh,96px) 0;
        }
        .wl-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          margin-top: clamp(36px,6vh,56px);
          position: relative;
        }
        .wl-steps::before {
          content: '';
          position: absolute;
          top: 22px; left: calc(16.67% + 14px); right: calc(16.67% + 14px);
          height: 1px;
          background: linear-gradient(90deg, #FF6B9D40, #9B7CF840, #5B9CF640);
        }
        .wl-step { padding: clamp(20px,2.5vw,32px) 0; }
        .wl-step-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 999px;
          background: linear-gradient(135deg, #FF6B9D, #9B7CF8);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 13px; font-weight: 700; color: #fff;
          margin-bottom: 20px;
        }
        .wl-step-title {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 16px; font-weight: 700; color: #0f0f1a;
          margin-bottom: 10px; letter-spacing: -0.01em;
        }
        .wl-step-body {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 14px; line-height: 1.65; color: #6060a0;
        }

        /* ── Bottom CTA ────────────────────────────────────────── */
        .wl-bottom-cta {
          position: relative; overflow: hidden;
          background: #fff;
          padding: clamp(64px,10vh,96px) 0;
          text-align: center;
        }
        .wl-bottom-blob {
          position: absolute; border-radius: 50%; pointer-events: none;
        }
        .wl-bottom-blob-a {
          top: -30%; left: -10%;
          width: 60vw; height: 60vw; max-width: 700px; max-height: 700px;
          background: radial-gradient(circle, rgba(255,107,157,0.12) 0%, transparent 70%);
          filter: blur(60px);
        }
        .wl-bottom-blob-b {
          bottom: -30%; right: -10%;
          width: 55vw; height: 55vw; max-width: 640px; max-height: 640px;
          background: radial-gradient(circle, rgba(91,156,246,0.12) 0%, transparent 70%);
          filter: blur(60px);
        }
        .wl-bottom-inner {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .wl-bottom-h2 {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(28px,4.5vw,56px); font-weight: 700;
          letter-spacing: -0.02em; color: #0f0f1a; line-height: 1.1;
        }
        .wl-bottom-sub {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(14px,1.3vw,17px); color: #6060a0;
          margin-bottom: 8px;
        }

        /* ── Footer ────────────────────────────────────────────── */
        .wl-footer {
          background: #fff;
          border-top: 1px solid #f0f0f8;
          padding: 0;
        }
        .wl-footer .wl-nav-inner { height: 56px; }
        .wl-footer-brand {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 13px; color: #9090b0;
        }
        .wl-footer-links { display: flex; gap: 20px; }
        .wl-footer-link {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 13px; color: #9090b0;
          background: none; border: none; cursor: pointer; padding: 0;
          transition: color 150ms ease;
        }
        .wl-footer-link:hover { color: #0f0f1a; }

        /* ── Animations ────────────────────────────────────────── */
        .wl-anim {
          animation: wl-fade-up 600ms cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes wl-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wl-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes wl-bounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(6px); }
        }

        /* ── Mobile ────────────────────────────────────────────── */
        @media (max-width: 767px) {
          .wl-feature-grid, .wl-steps { grid-template-columns: 1fr; gap: 16px; }
          .wl-steps::before { display: none; }
          .wl-stats { gap: 20px; }
          .wl-hero-cta { flex-direction: column; align-items: flex-start; }
          .wl-cta-main, .wl-cta-ghost { width: 100%; justify-content: center; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
          .wl-word { transition: none !important; }
        }
      `}</style>
    </>
  )
}
