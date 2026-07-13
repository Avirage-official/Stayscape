'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

/* ── Slide content ────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 'discover',
    label: 'Discover',
    headline: 'Find places\nworth remembering.',
    sub: 'Hidden restaurants, local markets, secret viewpoints — curated by people who actually live there.',
    accent: '#FF6B9D',
    accentB: '#FF9A6C',
    bg: 'linear-gradient(135deg, #fff5f7 0%, #fff0e8 100%)',
    dot: '#FF6B9D',
    shapes: [
      { top: '8%', right: '12%', size: 220, blur: 80, color: 'rgba(255,107,157,0.18)' },
      { top: '60%', right: '5%', size: 120, blur: 50, color: 'rgba(255,154,108,0.14)' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Curated',
    headline: 'Your AI travel\ncompanion.',
    sub: 'Aria learns what you love and builds a living itinerary that updates as your trip evolves.',
    accent: '#9B7CF8',
    accentB: '#5B9CF6',
    bg: 'linear-gradient(135deg, #f8f5ff 0%, #f0f5ff 100%)',
    dot: '#9B7CF8',
    shapes: [
      { top: '10%', right: '8%', size: 200, blur: 80, color: 'rgba(155,124,248,0.18)' },
      { top: '65%', right: '15%', size: 100, blur: 45, color: 'rgba(91,156,246,0.14)' },
    ],
  },
  {
    id: 'map',
    label: 'Explore',
    headline: 'Every city\nunlocked.',
    sub: 'Interactive maps, walking distances, opening hours — everything you need, right when you need it.',
    accent: '#0BC4A0',
    accentB: '#5BC8E8',
    bg: 'linear-gradient(135deg, #f0fff9 0%, #f0fbff 100%)',
    dot: '#0BC4A0',
    shapes: [
      { top: '6%', right: '10%', size: 180, blur: 75, color: 'rgba(11,196,160,0.16)' },
      { top: '70%', right: '8%', size: 130, blur: 55, color: 'rgba(91,200,232,0.14)' },
    ],
  },
  {
    id: 'vibe',
    label: 'Vibe Match',
    headline: 'Travel that fits\nhow you feel.',
    sub: 'Filter by vibe — romantic, adventurous, laid-back — and let Stayscape handle the rest.',
    accent: '#F5A623',
    accentB: '#F5654B',
    bg: 'linear-gradient(135deg, #fffbf0 0%, #fff5f0 100%)',
    dot: '#F5A623',
    shapes: [
      { top: '5%', right: '14%', size: 210, blur: 85, color: 'rgba(245,166,35,0.16)' },
      { top: '62%', right: '6%', size: 115, blur: 50, color: 'rgba(245,101,75,0.13)' },
    ],
  },
]

const INTERVAL = 4200

export default function SplashPage() {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function goTo(idx: number) {
    if (idx === slide || transitioning) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setTransitioning(true)
    setPrev(slide)
    setSlide(idx)
    setTimeout(() => {
      setPrev(null)
      setTransitioning(false)
    }, 500)
  }

  function advance() {
    const next = (slide + 1) % SLIDES.length
    goTo(next)
  }

  useEffect(() => {
    timerRef.current = setTimeout(advance, INTERVAL)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, transitioning])

  function navigate() {
    if (leaving) return
    setLeaving(true)
    setTimeout(() => router.push('/login'), 360)
  }

  const current = SLIDES[slide]
  const prevSlide = prev !== null ? SLIDES[prev] : null

  return (
    <>
      {leaving && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: '#fff',
          animation: 'ss-wipe 360ms cubic-bezier(0.4,0,0.2,1) forwards',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

        {/* ── Slide backgrounds ───────────────────────────────── */}
        {prevSlide && (
          <div
            key={`bg-prev-${prev}`}
            style={{
              position: 'absolute', inset: 0,
              background: prevSlide.bg,
              opacity: 0,
              animation: 'ss-bg-out 500ms ease forwards',
            }}
          />
        )}
        <div
          key={`bg-${slide}`}
          style={{
            position: 'absolute', inset: 0,
            background: current.bg,
            animation: prev !== null ? 'ss-bg-in 500ms ease forwards' : 'none',
          }}
        />

        {/* ── Decorative blobs ────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {current.shapes.map((s, i) => (
            <div
              key={`${slide}-${i}`}
              style={{
                position: 'absolute',
                top: s.top, right: s.right,
                width: s.size, height: s.size,
                borderRadius: '50%',
                background: s.color,
                filter: `blur(${s.blur}px)`,
                animation: 'ss-blob-in 600ms ease both',
              }}
            />
          ))}
          {/* Subtle dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle, ${current.accent}18 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 80% 50%, black 0%, transparent 100%)',
            transition: 'background-image 500ms ease',
          }} />
        </div>

        {/* ── Main layout ─────────────────────────────────────── */}
        <div className="ss-layout">

          {/* Left: branding + content */}
          <div className="ss-left">

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'clamp(40px,7vh,72px)' }}>
              <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">
                <rect width="40" height="40" rx="10" fill={`url(#lg-${slide})`} />
                <defs>
                  <linearGradient id={`lg-${slide}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={current.accent} />
                    <stop offset="100%" stopColor={current.accentB} />
                  </linearGradient>
                </defs>
                <path
                  d="M 27,13 C 23,7 16,5 11,9 C 6,13 7,21 13,24 C 17,26 21,25 24,27 C 27,29 27,34 24,36"
                  fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                />
                <path
                  d="M 16,9 C 16,5 20,4 23,6 C 26,8 26,13 23,16 C 20,19 16,19 14,23 C 12,27 13,31 16,33 C 19,35 23,35 26,33"
                  fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="2.2" strokeLinecap="round"
                />
              </svg>
              <span style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em',
                color: '#1a1a2e',
              }}>Stayscape</span>
            </div>

            {/* Slide label pill */}
            <div
              key={`label-${slide}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px 5px 8px',
                borderRadius: 999,
                background: `${current.accent}16`,
                border: `1.5px solid ${current.accent}30`,
                marginBottom: 20,
                animation: 'ss-pill-in 400ms cubic-bezier(0.22,1,0.36,1) both',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: current.accent, display: 'inline-block',
                animation: 'ss-dot-pulse 2s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: current.accent,
              }}>{current.label}</span>
            </div>

            {/* Headline */}
            <h1
              key={`h-${slide}`}
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 'clamp(30px, 4.5vw, 58px)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#0f0f1a',
                margin: '0 0 clamp(14px,2.5vh,22px)',
                whiteSpace: 'pre-line',
                animation: 'ss-text-in 450ms cubic-bezier(0.22,1,0.36,1) 60ms both',
              }}
            >
              {current.headline}
            </h1>

            {/* Sub */}
            <p
              key={`s-${slide}`}
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 'clamp(14px,1.4vw,17px)',
                fontWeight: 400,
                lineHeight: 1.65,
                color: '#4a4a6a',
                margin: '0 0 clamp(28px,5vh,48px)',
                maxWidth: 400,
                animation: 'ss-text-in 450ms cubic-bezier(0.22,1,0.36,1) 120ms both',
              }}
            >
              {current.sub}
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button
                onClick={navigate}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 14, fontWeight: 700,
                  color: '#fff',
                  background: `linear-gradient(135deg, ${current.accent} 0%, ${current.accentB} 100%)`,
                  border: 'none', borderRadius: 999,
                  padding: '14px 28px',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${current.accent}40`,
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 14px 32px ${current.accent}55`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = `0 8px 24px ${current.accent}40`
                }}
              >
                Start exploring
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <span style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 12, color: '#9090b0',
              }}>Free · No account needed to browse</span>
            </div>

            {/* Progress dots */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              marginTop: 'clamp(32px,5vh,52px)',
            }}>
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide: ${s.label}`}
                  style={{
                    border: 'none', padding: 0, cursor: 'pointer',
                    background: i === slide ? current.accent : `${current.accent}30`,
                    borderRadius: 999,
                    width: i === slide ? 24 : 6,
                    height: 6,
                    transition: 'width 300ms ease, background 300ms ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right: visual card stack */}
          <div className="ss-right" aria-hidden="true">
            <div className="ss-card-stack">

              {/* Background card (static) */}
              <div
                style={{
                  position: 'absolute',
                  top: '5%', right: '-6%',
                  width: '86%', height: '88%',
                  borderRadius: 28,
                  background: `linear-gradient(145deg, ${current.accent}20, ${current.accentB}10)`,
                  border: `1.5px solid ${current.accent}20`,
                  transition: 'background 500ms ease, border-color 500ms ease',
                }}
              />

              {/* Main video card */}
              <div style={{
                position: 'relative',
                width: '90%',
                height: '90%',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: `0 40px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.8)`,
                zIndex: 2,
              }}>
                <video
                  autoPlay muted loop playsInline preload="auto"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                >
                  <source src="/videos/splash-guests.mp4" type="video/mp4" />
                </video>

                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(to top, ${current.accent}60 0%, transparent 50%)`,
                  transition: 'background 500ms ease',
                }} />

                {/* Floating info card */}
                <div
                  key={`info-${slide}`}
                  style={{
                    position: 'absolute', bottom: 20, left: 16, right: 16,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                    animation: 'ss-card-in 500ms cubic-bezier(0.22,1,0.36,1) 150ms both',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${current.accent}, ${current.accentB})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <SlideIcon id={current.id} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0f1a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      {INFO_CARDS[current.id].title}
                    </div>
                    <div style={{ fontSize: 11, color: '#7070a0', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 2 }}>
                      {INFO_CARDS[current.id].detail}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                    {[0,1,2,3,4].map(i => (
                      <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill={i < INFO_CARDS[current.id].stars ? current.accent : '#e0e0e8'}>
                        <polygon points="5,0 6.5,3.5 10,3.8 7.5,6.2 8.2,10 5,8 1.8,10 2.5,6.2 0,3.8 3.5,3.5" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating stat pill */}
              <div
                key={`stat-${slide}`}
                style={{
                  position: 'absolute',
                  top: '12%', right: '-8%',
                  background: 'white',
                  borderRadius: 999,
                  padding: '8px 14px',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  zIndex: 3,
                  animation: 'ss-pill-float 500ms cubic-bezier(0.22,1,0.36,1) 300ms both',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 18 }}>{STATS[current.id].emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0f1a', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.2 }}>{STATS[current.id].value}</div>
                  <div style={{ fontSize: 10, color: '#9090b0', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{STATS[current.id].label}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ss-bg-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ss-bg-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes ss-text-in  {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ss-pill-in {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ss-card-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ss-pill-float {
          from { opacity: 0; transform: translateX(16px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes ss-blob-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ss-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes ss-wipe {
          from { opacity: 0 }
          to   { opacity: 1 }
        }

        .ss-layout {
          position: absolute; inset: 0;
          display: flex; align-items: center;
          padding: 0 clamp(28px, 7vw, 96px);
          gap: clamp(32px, 5vw, 72px);
        }
        .ss-left {
          flex: 0 0 auto;
          width: clamp(280px, 46%, 520px);
          display: flex; flex-direction: column;
        }
        .ss-right {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
        }
        .ss-card-stack {
          position: relative;
          width: clamp(220px, 35vw, 420px);
          height: clamp(320px, 60vh, 560px);
          display: flex; align-items: center; justify-content: center;
        }

        @media (max-width: 767px) {
          .ss-right { display: none; }
          .ss-layout { padding: 32px 24px 40px; align-items: flex-start; padding-top: 10vh; }
          .ss-left { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </>
  )
}

/* ── Slide-specific icons ─────────────────────────────────────── */
function SlideIcon({ id }: { id: string }) {
  switch (id) {
    case 'discover':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    case 'ai':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18 2v4h4"/></svg>
    case 'map':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
    case 'vibe':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    default: return null
  }
}

const INFO_CARDS: Record<string, { title: string; detail: string; stars: number }> = {
  discover: { title: 'Tanuki Sake Bar, Tokyo', detail: '3 min walk · Opens at 5pm', stars: 5 },
  ai:       { title: 'Aria built your day', detail: '6 places · 4.2 km total', stars: 5 },
  map:      { title: 'Marina Bay, Singapore', detail: '14 spots nearby · Open now', stars: 4 },
  vibe:     { title: 'Romantic evening vibes', detail: '8 matches found for tonight', stars: 5 },
}

const STATS: Record<string, { emoji: string; value: string; label: string }> = {
  discover: { emoji: '🗺️', value: '2,400+',  label: 'curated places' },
  ai:       { emoji: '✨', value: 'AI picks', label: 'personalised for you' },
  map:      { emoji: '🌏', value: '40 cities', label: 'and growing' },
  vibe:     { emoji: '❤️', value: '98%',      label: 'traveller satisfaction' },
}
