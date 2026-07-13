'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SplashPage() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  function navigate() {
    if (leaving) return
    setLeaving(true)
    setTimeout(() => router.push('/login'), 360)
  }

  return (
    <>
      {leaving && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: '#fff',
            animation: 'wipeIn 360ms cubic-bezier(0.4,0,0.2,1) forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#fff' }}>

        {/* ── Background gradient mesh ───────────────────────────── */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Top-left blush */}
          <div className="sc-blob sc-blob-a" />
          {/* Bottom-right sky */}
          <div className="sc-blob sc-blob-b" />
          {/* Centre warmth */}
          <div className="sc-blob sc-blob-c" />
          {/* Subtle grid overlay */}
          <div className="sc-grid" />
        </div>

        {/* ── Video card ────────────────────────────────────────── */}
        <div className="sc-vid-card" aria-hidden="true">
          <video
            autoPlay muted loop playsInline preload="auto"
            className="sc-vid"
          >
            <source src="/videos/splash-guests.mp4" type="video/mp4" />
          </video>
          <div className="sc-vid-scrim" />
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        <div className="sc-layout">
          <div className="sc-panel">

            {/* Logo mark */}
            <div className="sc-logo-wrap sc-logo-enter">
              <svg viewBox="0 0 40 40" aria-hidden="true" style={{ width: 40, height: 40 }}>
                <circle cx="20" cy="20" r="20" fill="url(#logo-bg)" />
                <path
                  d="M 28,14 C 24,9 16,8 12,13 C 8,18 10,25 16,27 C 20,28 24,26 27,28 C 30,30 30,35 26,37"
                  fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF8FAB" />
                    <stop offset="100%" stopColor="#7B9CF4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Brand name */}
            <p className="sc-brand sc-brand-enter" aria-label="Stayscape">
              {'Stayscape'.split('').map((char, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{ animationDelay: `${320 + i * 40}ms` }}
                  className="sc-letter"
                >
                  {char}
                </span>
              ))}
            </p>

            {/* Tagline */}
            <p className="sc-tagline sc-fade-up" style={{ animationDelay: '680ms' }}>
              Discover places worth remembering.
            </p>

            {/* Pill tags */}
            <div className="sc-pills sc-fade-up" style={{ animationDelay: '800ms' }} aria-hidden="true">
              <span className="sc-pill sc-pill-pink">✦ Hidden gems</span>
              <span className="sc-pill sc-pill-blue">✦ Local favourites</span>
              <span className="sc-pill sc-pill-lavender">✦ AI curated</span>
            </div>

            {/* CTA */}
            <div className="sc-cta sc-fade-up" style={{ animationDelay: '940ms' }}>
              <button
                onClick={navigate}
                className="sc-btn-primary"
                aria-label="Get started with Stayscape"
              >
                Start exploring
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <p className="sc-cta-sub">Free to use · No sign-up required to browse</p>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        /* ── Background blobs ───────────────────────────────────── */
        .sc-blob { position: absolute; border-radius: 50%; will-change: transform; }
        .sc-blob-a {
          top: -20%; left: -10%;
          width: clamp(300px, 55vw, 800px); height: clamp(300px, 55vw, 800px);
          background: radial-gradient(circle, rgba(255,181,213,0.45) 0%, transparent 70%);
          filter: blur(60px);
          animation: sc-drift-a 12s ease-in-out infinite;
        }
        .sc-blob-b {
          bottom: -20%; right: -10%;
          width: clamp(280px, 50vw, 700px); height: clamp(280px, 50vw, 700px);
          background: radial-gradient(circle, rgba(123,156,244,0.40) 0%, transparent 70%);
          filter: blur(60px);
          animation: sc-drift-b 14s ease-in-out infinite;
        }
        .sc-blob-c {
          top: 30%; left: 35%;
          width: clamp(200px, 35vw, 500px); height: clamp(200px, 35vw, 500px);
          background: radial-gradient(circle, rgba(255,230,200,0.30) 0%, transparent 70%);
          filter: blur(50px);
          animation: sc-drift-a 18s 2s ease-in-out infinite reverse;
        }

        /* ── Subtle grid ─────────────────────────────────────────── */
        .sc-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(100,120,200,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,120,200,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        /* ── Video card ──────────────────────────────────────────── */
        .sc-vid-card {
          position: absolute;
          top: 50%; right: clamp(24px, 6vw, 80px);
          transform: translateY(-50%);
          width: clamp(220px, 28vw, 420px);
          height: clamp(340px, 52vh, 580px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 32px 80px rgba(80,100,200,0.18),
            0 8px 24px rgba(255,140,180,0.15),
            0 0 0 1px rgba(255,255,255,0.8);
          animation: sc-card-enter 900ms cubic-bezier(0.22,1,0.36,1) 100ms both;
        }
        .sc-vid {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .sc-vid-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(
            160deg,
            rgba(255,181,213,0.15) 0%,
            transparent 40%,
            rgba(123,156,244,0.10) 100%
          );
        }

        /* ── Layout ──────────────────────────────────────────────── */
        .sc-layout {
          position: absolute; inset: 0;
          display: flex; align-items: center;
          padding: 0 clamp(24px, 8vw, 100px);
        }
        .sc-panel {
          max-width: 480px;
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 0;
        }

        /* ── Logo ─────────────────────────────────────────────────── */
        .sc-logo-wrap {
          margin-bottom: 20px;
          filter: drop-shadow(0 4px 16px rgba(255,100,160,0.25));
        }

        /* ── Brand name ───────────────────────────────────────────── */
        .sc-brand {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: clamp(36px, 5.5vw, 64px);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
          margin: 0 0 clamp(12px, 2vh, 18px);
          background: linear-gradient(135deg, #FF6B9D 0%, #9B7CF8 55%, #5B9CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sc-letter {
          display: inline-block;
          animation: sc-letter-appear 560ms cubic-bezier(0.22,1,0.36,1) both;
        }

        /* ── Tagline ──────────────────────────────────────────────── */
        .sc-tagline {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: clamp(16px, 1.8vw, 22px);
          font-weight: 400;
          color: #3D3D5C;
          line-height: 1.5;
          margin: 0 0 clamp(20px, 3vh, 28px);
          opacity: 0;
        }

        /* ── Pill tags ────────────────────────────────────────────── */
        .sc-pills {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-bottom: clamp(28px, 4vh, 40px);
          opacity: 0;
        }
        .sc-pill {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.02em;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1.5px solid transparent;
        }
        .sc-pill-pink {
          background: rgba(255,143,171,0.12);
          border-color: rgba(255,143,171,0.35);
          color: #D6417A;
        }
        .sc-pill-blue {
          background: rgba(91,156,246,0.12);
          border-color: rgba(91,156,246,0.35);
          color: #3A72D4;
        }
        .sc-pill-lavender {
          background: rgba(155,124,248,0.12);
          border-color: rgba(155,124,248,0.35);
          color: #7145D6;
        }

        /* ── CTA ──────────────────────────────────────────────────── */
        .sc-cta { display: flex; flex-direction: column; gap: 12px; opacity: 0; }
        .sc-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: clamp(14px, 1.1vw, 15px);
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #FF6B9D 0%, #9B7CF8 100%);
          border: none;
          border-radius: 999px;
          padding: clamp(14px, 1.8vh, 17px) clamp(24px, 2.5vw, 32px);
          cursor: pointer;
          transition: transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease;
          box-shadow: 0 8px 28px rgba(155,124,248,0.35), 0 2px 8px rgba(255,107,157,0.25);
        }
        .sc-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(155,124,248,0.45), 0 4px 12px rgba(255,107,157,0.30);
        }
        .sc-btn-primary:active { transform: translateY(0); opacity: 0.92; }
        .sc-cta-sub {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12px; color: rgba(80,80,120,0.55);
          margin: 0; letter-spacing: 0.01em;
        }

        /* ── Animations ───────────────────────────────────────────── */
        @keyframes sc-logo-enter-anim {
          from { opacity: 0; transform: scale(0.8) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sc-letter-appear {
          from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes sc-fade-up-anim {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sc-card-enter {
          from { opacity: 0; transform: translateY(-50%) translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
        }
        @keyframes sc-drift-a {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(4%, 5%); }
        }
        @keyframes sc-drift-b {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-5%, -4%); }
        }
        @keyframes wipeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .sc-logo-enter { animation: sc-logo-enter-anim 700ms cubic-bezier(0.22,1,0.36,1) 60ms both; }
        .sc-brand-enter .sc-letter { animation: sc-letter-appear 560ms cubic-bezier(0.22,1,0.36,1) both; }
        .sc-fade-up { animation: sc-fade-up-anim 600ms cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Mobile ───────────────────────────────────────────────── */
        @media (max-width: 767px) {
          .sc-vid-card {
            position: absolute;
            top: 0; right: 0; left: 0;
            width: 100%; height: 42dvh;
            border-radius: 0 0 28px 28px;
            transform: none;
            animation: sc-card-enter-mobile 900ms cubic-bezier(0.22,1,0.36,1) 100ms both;
          }
          .sc-layout {
            align-items: flex-end;
            padding: 0;
          }
          .sc-panel {
            max-width: 100%;
            padding: 28px 24px 40px;
          }
          .sc-btn-primary { width: 100%; justify-content: center; }
        }
        @keyframes sc-card-enter-mobile {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sc-logo-enter, .sc-brand-enter .sc-letter, .sc-fade-up, .sc-vid-card,
          .sc-blob-a, .sc-blob-b, .sc-blob-c {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </>
  )
}
