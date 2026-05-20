'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SelectRegionPage() {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const pageExitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (overlay) {
      const t1 = setTimeout(() => {
        overlay.classList.add('hidden')
        const t2 = setTimeout(() => { overlay.style.display = 'none' }, 700)
        return () => clearTimeout(t2)
      }, 1050)
      return () => clearTimeout(t1)
    }
  }, [])

  const handleHover = (role: 'guest' | 'host', entering: boolean) => {
    document.body.classList.toggle(`hovering-${role}`, entering)
  }

  const handlePress = (el: HTMLElement | null, pressed: boolean) => {
    if (!el) return
    el.classList.toggle('pressed', pressed)
  }

  const handleNavigate = (href: string) => {
    const exit = pageExitRef.current
    if (exit) {
      exit.classList.add('active')
      setTimeout(() => { router.push(href) }, 560)
    }
  }

  return (
    <>
      <style>{`
        :root {
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', 'Helvetica Neue', sans-serif;
          --gold: #c9a84c;
          --gold-dim: rgba(201,168,76,0.12);
          --bg: #0e0d0b;
          --surface: #141310;
          --border: rgba(255,255,255,0.07);
          --text: #e8e5df;
          --text-muted: #8a8780;
          --text-faint: #4a4845;
          --spring: cubic-bezier(0.34,1.56,0.64,1);
          --ease-out: cubic-bezier(0.16,1,0.3,1);
        }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── AMBIENT ── */
        .ambient { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .ambient-orb { position:absolute; border-radius:50%; filter:blur(130px); opacity:0; transition:opacity 1.2s ease, transform 1.5s ease; will-change:transform,opacity; }
        .orb-guest { width:650px; height:650px; background:radial-gradient(circle,rgba(201,168,76,0.2) 0%,transparent 70%); top:-160px; left:-180px; }
        .orb-host  { width:650px; height:650px; background:radial-gradient(circle,rgba(100,165,185,0.16) 0%,transparent 70%); bottom:-160px; right:-180px; }
        body.hovering-guest .orb-guest { opacity:1; transform:scale(1.18); }
        body.hovering-host  .orb-host  { opacity:1; transform:scale(1.18); }

        /* ── GRAIN ── */
        .grain { position:fixed; inset:0; z-index:1; pointer-events:none; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); background-size:200px 200px; opacity:0.55; }

        /* ── LOADING OVERLAY ── */
        .enter-overlay { position:fixed; inset:0; z-index:100; background:var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; transition:opacity 0.65s ease; }
        .enter-overlay.hidden { opacity:0; pointer-events:none; }
        .enter-logo { font-family:var(--font-display); font-size:22px; font-weight:400; color:var(--text); letter-spacing:-0.01em; display:flex; align-items:center; gap:12px; opacity:0; animation:fadeIn 0.5s 0.15s ease forwards; }
        .enter-bar-wrap { width:100px; height:1px; background:rgba(255,255,255,0.08); border-radius:1px; overflow:hidden; opacity:0; animation:fadeIn 0.4s 0.3s ease forwards; }
        .enter-bar { height:100%; width:0%; background:linear-gradient(90deg,var(--gold),rgba(201,168,76,0.3)); animation:loadBar 0.75s 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }

        /* ── EXIT CURTAIN ── */
        .page-exit { position:fixed; inset:0; z-index:200; background:var(--bg); transform:scaleY(0); transform-origin:top; pointer-events:none; transition:transform 0.55s cubic-bezier(0.76,0,0.24,1); }
        .page-exit.active { transform:scaleY(1); }

        /* ── NAV ── */
        .sr-nav { position:relative; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:28px 44px; opacity:0; animation:fadeSlideDown 0.7s 0.15s var(--ease-out) forwards; }
        .sr-logo { display:flex; align-items:center; gap:11px; text-decoration:none; color:inherit; }
        .sr-logo-text { font-family:var(--font-display); font-size:18px; font-weight:500; letter-spacing:-0.01em; color:var(--text); }
        .sr-back { display:flex; align-items:center; gap:7px; font-size:13px; color:var(--text-muted); font-weight:400; cursor:pointer; background:none; border:none; font-family:var(--font-body); transition:color 0.25s ease; padding:8px 0; }
        .sr-back:hover { color:var(--text); }

        /* ── STEP DOTS ── */
        .step-dots { display:flex; align-items:center; gap:6px; opacity:0; animation:fadeIn 0.6s 0.6s ease forwards; }
        .sdot { width:6px; height:6px; border-radius:50%; background:var(--border); transition:background 0.3s ease, transform 0.3s var(--spring); }
        .sdot.done   { background:rgba(201,168,76,0.5); }
        .sdot.active { background:var(--gold); transform:scale(1.4); }

        /* ── STAGE ── */
        .sr-stage { position:relative; z-index:5; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 24px 56px; }

        /* ── HEADER ── */
        .sr-header { text-align:center; margin-bottom:52px; opacity:0; animation:fadeSlideUp 0.8s 0.35s var(--ease-out) forwards; }
        .sr-kicker { font-size:10.5px; font-weight:500; letter-spacing:0.15em; text-transform:uppercase; color:var(--gold); margin-bottom:18px; display:flex; align-items:center; justify-content:center; gap:12px; }
        .sr-kicker::before,.sr-kicker::after { content:''; display:block; width:28px; height:1px; background:linear-gradient(90deg,transparent,var(--gold),transparent); opacity:0.5; }
        .sr-h1 { font-family:var(--font-display); font-size:clamp(2rem,3.8vw,3rem); font-weight:400; line-height:1.15; letter-spacing:-0.025em; color:var(--text); margin-bottom:16px; }
        .sr-h1 em { font-style:italic; color:var(--gold); }
        .sr-sub { font-size:15px; color:var(--text-muted); font-weight:300; max-width:34ch; margin:0 auto; line-height:1.65; }

        /* ── CARDS ── */
        .sr-cards { display:grid; grid-template-columns:1fr 1fr; gap:18px; width:100%; max-width:800px; opacity:0; animation:fadeSlideUp 0.9s 0.55s var(--ease-out) forwards; }
        .role-card { position:relative; border:1px solid var(--border); border-radius:22px; padding:40px 36px 34px; cursor:pointer; background:var(--surface); overflow:hidden; transition:border-color 0.35s ease, transform 0.45s var(--spring), box-shadow 0.45s ease; text-decoration:none; display:flex; flex-direction:column; min-height:360px; }
        .role-card::before { content:''; position:absolute; inset:0; border-radius:22px; background:linear-gradient(140deg,rgba(255,255,255,0.035) 0%,transparent 55%); pointer-events:none; }
        .role-card::after { content:''; position:absolute; top:-120%; left:-20%; right:-20%; height:50%; background:linear-gradient(180deg,rgba(255,255,255,0.04) 0%,transparent 100%); transform:skewY(-6deg); transition:top 0.8s var(--ease-out); pointer-events:none; }
        .role-card:hover::after { top:130%; }
        .role-card:hover { transform:translateY(-5px) scale(1.014); box-shadow:0 24px 64px rgba(0,0,0,0.45); }
        .role-card.guest:hover { border-color:rgba(201,168,76,0.4); }
        .role-card.host:hover  { border-color:rgba(100,165,185,0.4); }
        .role-card.pressed { transform:translateY(-2px) scale(1.007) !important; transition-duration:120ms !important; }
        .role-card.guest.pressed { border-color:var(--gold); box-shadow:0 0 0 1px var(--gold-dim),0 16px 40px rgba(0,0,0,0.4); }
        .role-card.host.pressed  { border-color:rgba(100,165,185,0.7); box-shadow:0 0 0 1px rgba(100,165,185,0.1),0 16px 40px rgba(0,0,0,0.4); }

        /* ── ICON ── */
        .card-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:30px; flex-shrink:0; transition:transform 0.45s var(--spring); }
        .guest .card-icon { background:var(--gold-dim); border:1px solid rgba(201,168,76,0.18); }
        .host  .card-icon { background:rgba(100,165,185,0.1); border:1px solid rgba(100,165,185,0.18); }
        .guest .card-icon svg { color:var(--gold); }
        .host  .card-icon svg  { color:#64a5b9; }
        .role-card:hover .card-icon { transform:scale(1.1) rotate(-4deg); }

        /* ── TEXT ── */
        .card-eyebrow { font-size:10px; font-weight:500; letter-spacing:0.13em; text-transform:uppercase; margin-bottom:9px; }
        .guest .card-eyebrow { color:rgba(201,168,76,0.5); }
        .host  .card-eyebrow { color:rgba(100,165,185,0.5); }
        .card-title { font-family:var(--font-display); font-size:clamp(1.35rem,2.4vw,1.7rem); font-weight:400; letter-spacing:-0.022em; line-height:1.12; color:var(--text); margin-bottom:14px; }
        .card-desc { font-size:13.5px; font-weight:300; color:var(--text-muted); line-height:1.7; flex:1; }

        /* ── FEATURES ── */
        .card-features { margin-top:22px; display:flex; flex-direction:column; gap:9px; }
        .card-feature { display:flex; align-items:center; gap:9px; font-size:12px; color:var(--text-muted); font-weight:300; }
        .fdot { width:3px; height:3px; border-radius:50%; flex-shrink:0; opacity:0.7; }
        .guest .fdot { background:var(--gold); }
        .host  .fdot { background:#64a5b9; }

        /* ── FOOTER ── */
        .card-foot { margin-top:30px; display:flex; align-items:center; justify-content:space-between; }
        .card-cta { font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; }
        .guest .card-cta { color:var(--gold); }
        .host  .card-cta { color:#64a5b9; }
        .cta-arrow { display:flex; align-items:center; transition:transform 0.35s var(--spring); }
        .role-card:hover .cta-arrow { transform:translateX(4px); }
        .card-badge { font-size:10px; font-weight:500; letter-spacing:0.05em; padding:3px 9px; border-radius:100px; }
        .guest .card-badge { background:var(--gold-dim); color:rgba(201,168,76,0.75); border:1px solid rgba(201,168,76,0.14); }
        .host  .card-badge { background:rgba(100,165,185,0.09); color:rgba(100,165,185,0.75); border:1px solid rgba(100,165,185,0.14); }

        /* ── FOOTNOTE ── */
        .sr-footnote { margin-top:32px; text-align:center; font-size:12px; color:var(--text-faint); line-height:1.6; opacity:0; animation:fadeIn 0.7s 1s ease forwards; }
        .sr-footnote a { color:var(--text-muted); text-decoration:none; border-bottom:1px solid rgba(255,255,255,0.1); transition:color 0.2s ease, border-color 0.2s ease; }
        .sr-footnote a:hover { color:var(--text); border-color:var(--text-muted); }

        /* ── KEYFRAMES ── */
        @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn        { from{opacity:0} to{opacity:1} }
        @keyframes loadBar       { to{width:100%} }

        /* ── MOBILE ── */
        @media (max-width:640px) {
          .sr-nav { padding:20px 22px; }
          .step-dots { display:none; }
          .sr-cards { grid-template-columns:1fr; max-width:420px; gap:14px; }
          .role-card { min-height:auto; padding:28px 26px; }
          .sr-header { margin-bottom:38px; }
          .sr-stage { padding-bottom:36px; }
        }
        @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
      `}</style>

      {/* Loading overlay */}
      <div className="enter-overlay" ref={overlayRef}>
        <div className="enter-logo">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L3 8.5V19.5L14 26L25 19.5V8.5L14 2Z" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 2V26M3 8.5L25 19.5M25 8.5L3 19.5" stroke="#c9a84c" strokeWidth="0.7" strokeOpacity="0.35"/>
          </svg>
          Stayscape
        </div>
        <div className="enter-bar-wrap"><div className="enter-bar" /></div>
      </div>

      {/* Exit curtain */}
      <div className="page-exit" ref={pageExitRef} />

      <div style={{ minHeight:'100dvh', fontFamily:'var(--font-body)', background:'var(--bg)', color:'var(--text)', overflow:'hidden', display:'flex', flexDirection:'column', WebkitFontSmoothing:'antialiased' }}>
        <div className="ambient">
          <div className="ambient-orb orb-guest" />
          <div className="ambient-orb orb-host" />
        </div>
        <div className="grain" />

        <nav className="sr-nav">
          <Link href="/" className="sr-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L3 8.5V19.5L14 26L25 19.5V8.5L14 2Z" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M14 2V26M3 8.5L25 19.5M25 8.5L3 19.5" stroke="#c9a84c" strokeWidth="0.7" strokeOpacity="0.35"/>
            </svg>
            <span className="sr-logo-text">Stayscape</span>
          </Link>
          <button className="sr-back" onClick={() => router.back()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2L4 7l5 5"/></svg>
          </button>

          <div className="step-dots" aria-label="Step 2 of 3">
            <div className="sdot done" />
            <div className="sdot active" />
            <div className="sdot" />
          </div>

          <button className="sr-back" onClick={() => router.back()} aria-label="Go back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5"/>
            </svg>
            Back
          </button>
        </nav>

        <main className="sr-stage">
          <header className="sr-header">
            <div className="sr-kicker">Step 2 of 3</div>
            <h1 className="sr-h1">You&apos;re in the right place.<br /><em>Tell us how.</em></h1>
            <p className="sr-sub">Your experience is shaped by your role. Choose the one that fits.</p>
          </header>

          <div className="sr-cards">

            {/* GUEST */}
            <div
              className="role-card guest"
              onClick={() => handleNavigate('/app')}
              onMouseEnter={() => handleHover('guest', true)}
              onMouseLeave={(e) => { handleHover('guest', false); handlePress(e.currentTarget, false) }}
              onMouseDown={(e) => handlePress(e.currentTarget, true)}
              onMouseUp={(e) => handlePress(e.currentTarget, false)}
              role="button"
              tabIndex={0}
              aria-label="Continue as a Guest"
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/app')}
            >
              <div className="card-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
                </svg>
              </div>
              <div className="card-eyebrow">For travellers</div>
              <h2 className="card-title">I&apos;m staying<br />somewhere</h2>
              <p className="card-desc">Access your personalised concierge, discover curated local spots, and manage every detail of your stay — all in one place.</p>
              <div className="card-features">
                <div className="card-feature"><span className="fdot" />AI concierge, available 24/7</div>
                <div className="card-feature"><span className="fdot" />Curated local discoveries</div>
                <div className="card-feature"><span className="fdot" />Itinerary &amp; trip planner</div>
              </div>
              <div className="card-foot">
                <span className="card-cta">
                  Continue as guest
                  <span className="cta-arrow">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                  </span>
                </span>
                <span className="card-badge">Most popular</span>
              </div>
            </div>

            {/* HOST */}
            <div
              className="role-card host"
              onClick={() => handleNavigate('/hotel-admin')}
              onMouseEnter={() => handleHover('host', true)}
              onMouseLeave={(e) => { handleHover('host', false); handlePress(e.currentTarget, false) }}
              onMouseDown={(e) => handlePress(e.currentTarget, true)}
              onMouseUp={(e) => handlePress(e.currentTarget, false)}
              role="button"
              tabIndex={0}
              aria-label="Continue as a Hotel or Host"
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/hotel-admin')}
            >
              <div className="card-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/>
                  <path d="M3 21h18"/>
                  <path d="M9 21V13h6v8"/>
                  <rect x="9" y="8" width="2" height="2"/>
                  <rect x="13" y="8" width="2" height="2"/>
                </svg>
              </div>
              <div className="card-eyebrow">For hotels &amp; hosts</div>
              <h2 className="card-title">I manage<br />a property</h2>
              <p className="card-desc">Configure the Stayscape experience for your guests, manage your property content, and track engagement — all from one dashboard.</p>
              <div className="card-features">
                <div className="card-feature"><span className="fdot" />Property dashboard &amp; analytics</div>
                <div className="card-feature"><span className="fdot" />Guest experience configuration</div>
                <div className="card-feature"><span className="fdot" />Content &amp; concierge management</div>
              </div>
              <div className="card-foot">
                <span className="card-cta">
                  Continue as hotel
                  <span className="cta-arrow">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                  </span>
                </span>
                <span className="card-badge">Early access</span>
              </div>
            </div>

          </div>

          <p className="sr-footnote">
            Not sure yet? <Link href="/app">Explore the demo</Link>&nbsp;·&nbsp;
            Already have access? <Link href="/login">Sign in</Link>
          </p>
        </main>
      </div>
    </>
  )
}
