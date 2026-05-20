'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SelectRegionPage() {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const pageExitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dismiss loading overlay
    const overlay = overlayRef.current
    if (overlay) {
      setTimeout(() => {
        overlay.style.opacity = '0'
        setTimeout(() => { overlay.style.display = 'none' }, 700)
      }, 950)
    }
  }, [])

  const handleHover = (role: 'guest' | 'host', entering: boolean) => {
    if (entering) {
      document.body.classList.add(`hovering-${role}`)
    } else {
      document.body.classList.remove(`hovering-${role}`)
    }
  }

  const handlePress = (el: HTMLElement | null, pressed: boolean) => {
    if (!el) return
    if (pressed) el.classList.add('active')
    else el.classList.remove('active')
  }

  const handleNavigate = (href: string) => {
    const exit = pageExitRef.current
    if (exit) {
      exit.style.transform = 'scaleY(1)'
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
          --gold-dim: rgba(201, 168, 76, 0.12);
          --bg: #0e0d0b;
          --surface: #141310;
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(201,168,76,0.35);
          --text: #e8e5df;
          --text-muted: #8a8780;
          --text-faint: #4a4845;
          --transition: 400ms cubic-bezier(0.16, 1, 0.3, 1);
          --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        .sr-body { min-height:100dvh; font-family:var(--font-body); background:var(--bg); color:var(--text); overflow:hidden; display:flex; flex-direction:column; -webkit-font-smoothing:antialiased; }
        .ambient { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .ambient-orb { position:absolute; border-radius:50%; filter:blur(120px); opacity:0; transition:opacity 1.2s ease, transform 1.4s var(--transition); will-change:transform,opacity; }
        .orb-guest { width:600px; height:600px; background:radial-gradient(circle,rgba(201,168,76,0.18) 0%,transparent 70%); top:-100px; left:-150px; }
        .orb-host  { width:600px; height:600px; background:radial-gradient(circle,rgba(100,160,180,0.14) 0%,transparent 70%); bottom:-100px; right:-150px; }
        body.hovering-guest .orb-guest { opacity:1; transform:scale(1.15); }
        body.hovering-host  .orb-host  { opacity:1; transform:scale(1.15); }
        .grain { position:fixed; inset:0; z-index:0; pointer-events:none; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); background-size:200px 200px; opacity:0.6; }
        .sr-nav { position:relative; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:24px 40px; opacity:0; animation:fadeSlideDown 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) forwards; }
        .sr-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .sr-logo-text { font-family:var(--font-display); font-size:18px; font-weight:500; color:var(--text); letter-spacing:-0.01em; }
        .sr-back { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text-muted); cursor:pointer; background:none; border:none; font-family:var(--font-body); transition:color var(--transition); }
        .sr-back:hover { color:var(--text); }
        .sr-stage { position:relative; z-index:5; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 24px 48px; }
        .sr-header { text-align:center; margin-bottom:56px; opacity:0; animation:fadeSlideUp 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
        .sr-kicker { font-size:11px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:var(--gold); margin-bottom:16px; display:flex; align-items:center; justify-content:center; gap:10px; }
        .sr-kicker::before,.sr-kicker::after { content:''; display:block; width:24px; height:1px; background:linear-gradient(90deg,transparent,var(--gold),transparent); opacity:0.6; }
        .sr-h1 { font-family:var(--font-display); font-size:clamp(2rem,4vw,3.2rem); font-weight:400; line-height:1.15; letter-spacing:-0.02em; color:var(--text); margin-bottom:14px; }
        .sr-h1 em { font-style:italic; color:var(--gold); }
        .sr-sub { font-size:15px; color:var(--text-muted); font-weight:300; max-width:36ch; margin:0 auto; line-height:1.6; }
        .sr-cards { display:grid; grid-template-columns:1fr 1fr; gap:20px; width:100%; max-width:780px; opacity:0; animation:fadeSlideUp 0.9s 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .role-card { position:relative; border:1px solid var(--border); border-radius:20px; padding:40px 36px 36px; cursor:pointer; background:var(--surface); overflow:hidden; transition:border-color 0.35s ease,transform 0.4s var(--spring),box-shadow 0.4s ease; text-decoration:none; display:flex; flex-direction:column; min-height:340px; }
        .role-card::before { content:''; position:absolute; inset:0; border-radius:20px; background:linear-gradient(145deg,rgba(255,255,255,0.03) 0%,transparent 50%); pointer-events:none; }
        .role-card::after { content:''; position:absolute; top:-100%; left:0; right:0; height:40%; background:linear-gradient(180deg,rgba(255,255,255,0.03) 0%,transparent 100%); transform:skewY(-8deg); transition:top 0.7s ease; pointer-events:none; }
        .role-card:hover::after { top:110%; }
        .role-card:hover { transform:translateY(-4px) scale(1.012); box-shadow:0 20px 60px rgba(0,0,0,0.4); }
        .role-card.guest:hover { border-color:var(--border-hover); }
        .role-card.host:hover  { border-color:rgba(100,160,180,0.35); }
        .role-card.guest.active { border-color:var(--gold); box-shadow:0 0 0 1px var(--gold-dim),0 20px 60px rgba(0,0,0,0.4); }
        .role-card.host.active  { border-color:rgba(100,160,180,0.7); box-shadow:0 0 0 1px rgba(100,160,180,0.1),0 20px 60px rgba(0,0,0,0.4); }
        .card-illus { width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:28px; transition:transform 0.4s var(--spring); }
        .guest .card-illus { background:var(--gold-dim); border:1px solid rgba(201,168,76,0.2); }
        .host  .card-illus { background:rgba(100,160,180,0.1); border:1px solid rgba(100,160,180,0.2); }
        .role-card:hover .card-illus { transform:scale(1.1) rotate(-3deg); }
        .guest .card-illus svg { color:var(--gold); }
        .host  .card-illus svg { color:#64a0b4; }
        .card-label { font-size:10px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
        .guest .card-label { color:rgba(201,168,76,0.5); }
        .host  .card-label { color:rgba(100,160,180,0.5); }
        .card-title { font-family:var(--font-display); font-size:clamp(1.4rem,2.5vw,1.75rem); font-weight:400; letter-spacing:-0.02em; line-height:1.1; color:var(--text); margin-bottom:14px; }
        .card-desc { font-size:14px; font-weight:300; color:var(--text-muted); line-height:1.65; flex:1; }
        .card-features { margin-top:20px; display:flex; flex-direction:column; gap:8px; }
        .card-feature { display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--text-muted); font-weight:300; }
        .fdot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }
        .guest .fdot { background:var(--gold); opacity:0.6; }
        .host  .fdot { background:#64a0b4; opacity:0.6; }
        .card-footer { margin-top:28px; display:flex; align-items:center; justify-content:space-between; }
        .card-cta { font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; transition:gap 0.3s var(--spring),color 0.3s ease; }
        .guest .card-cta { color:var(--gold); }
        .host  .card-cta { color:#64a0b4; }
        .role-card:hover .card-cta { gap:10px; }
        .card-cta svg { width:14px; height:14px; transition:transform 0.3s var(--spring); }
        .role-card:hover .card-cta svg { transform:translateX(3px); }
        .card-badge { font-size:10px; font-weight:500; letter-spacing:0.06em; padding:3px 8px; border-radius:100px; }
        .guest .card-badge { background:var(--gold-dim); color:rgba(201,168,76,0.8); border:1px solid rgba(201,168,76,0.15); }
        .host  .card-badge { background:rgba(100,160,180,0.1); color:rgba(100,160,180,0.8); border:1px solid rgba(100,160,180,0.15); }
        .sr-footnote { margin-top:36px; text-align:center; font-size:12px; color:var(--text-faint); opacity:0; animation:fadeIn 0.8s 0.9s ease forwards; line-height:1.6; }
        .sr-footnote a { color:var(--text-muted); text-decoration:none; border-bottom:1px solid var(--border); transition:color 0.2s,border-color 0.2s; }
        .sr-footnote a:hover { color:var(--text); border-color:var(--text-muted); }
        .enter-overlay { position:fixed; inset:0; z-index:100; background:var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; pointer-events:none; transition:opacity 0.6s ease; }
        .enter-logo { font-family:var(--font-display); font-size:24px; font-weight:400; color:var(--text); letter-spacing:-0.02em; display:flex; align-items:center; gap:10px; }
        .enter-bar-wrap { width:120px; height:1px; background:var(--border); border-radius:1px; overflow:hidden; }
        .enter-bar { height:100%; width:0%; background:linear-gradient(90deg,var(--gold),rgba(201,168,76,0.4)); animation:loadProgress 0.8s 0.1s cubic-bezier(0.4,0,0.2,1) forwards; }
        .page-exit { position:fixed; inset:0; z-index:200; background:var(--bg); transform:scaleY(0); transform-origin:top; pointer-events:none; transition:transform 0.55s cubic-bezier(0.76,0,0.24,1); }
        @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(18px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn        { from{opacity:0} to{opacity:1} }
        @keyframes loadProgress  { to{width:100%} }
        @media (max-width:640px) {
          .sr-nav { padding:20px; }
          .sr-cards { grid-template-columns:1fr; max-width:400px; gap:14px; }
          .role-card { min-height:auto; padding:28px 24px; }
          .sr-header { margin-bottom:40px; }
          .sr-body { overflow:auto; }
        }
        @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
      `}</style>

      {/* Loading overlay */}
      <div className="enter-overlay" ref={overlayRef}>
        <div className="enter-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L3 8.5V19.5L14 26L25 19.5V8.5L14 2Z" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 2V26M3 8.5L25 19.5M25 8.5L3 19.5" stroke="#c9a84c" strokeWidth="0.75" strokeOpacity="0.4"/>
          </svg>
          Stayscape
        </div>
        <div className="enter-bar-wrap"><div className="enter-bar" /></div>
      </div>

      {/* Exit curtain */}
      <div className="page-exit" ref={pageExitRef} />

      <div className="sr-body">
        <div className="ambient">
          <div className="ambient-orb orb-guest" />
          <div className="ambient-orb orb-host" />
        </div>
        <div className="grain" />

        <nav className="sr-nav">
          <Link href="/" className="sr-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L3 8.5V19.5L14 26L25 19.5V8.5L14 2Z" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M14 2V26M3 8.5L25 19.5M25 8.5L3 19.5" stroke="#c9a84c" strokeWidth="0.75" strokeOpacity="0.4"/>
            </svg>
            <span className="sr-logo-text">Stayscape</span>
          </Link>
          <button className="sr-back" onClick={() => router.back()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2L4 7l5 5"/></svg>
            Back
          </button>
        </nav>

        <main className="sr-stage">
          <header className="sr-header">
            <div className="sr-kicker">Welcome to Stayscape</div>
            <h1 className="sr-h1">You&apos;re in the right place.<br /><em>Tell us how.</em></h1>
            <p className="sr-sub">Your experience is shaped by who you are. Choose your role to get started.</p>
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
            >
              <div className="card-illus">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="8" width="20" height="13" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
              </div>
              <div className="card-label">For guests</div>
              <h2 className="card-title">I&apos;m staying<br />at a hotel</h2>
              <p className="card-desc">Access your personalised concierge, discover curated places around your hotel, and manage your stay — all in one place.</p>
              <div className="card-features">
                <div className="card-feature"><span className="fdot" />AI concierge, available 24/7</div>
                <div className="card-feature"><span className="fdot" />Curated local discoveries</div>
                <div className="card-feature"><span className="fdot" />Trip planner &amp; itinerary</div>
              </div>
              <div className="card-footer">
                <span className="card-cta">
                  Continue as guest
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
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
            >
              <div className="card-illus">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/><path d="M3 21h18"/>
                  <path d="M9 21V13h6v8"/><rect x="9" y="8" width="2" height="2"/><rect x="13" y="8" width="2" height="2"/>
                </svg>
              </div>
              <div className="card-label">For hotels &amp; hosts</div>
              <h2 className="card-title">I manage<br />a property</h2>
              <p className="card-desc">Set up Stayscape for your property, configure your guest experience, manage content, and track guest engagement.</p>
              <div className="card-features">
                <div className="card-feature"><span className="fdot" />Property dashboard &amp; analytics</div>
                <div className="card-feature"><span className="fdot" />Guest experience configuration</div>
                <div className="card-feature"><span className="fdot" />Content &amp; concierge management</div>
              </div>
              <div className="card-footer">
                <span className="card-cta">
                  Continue as hotel
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
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
