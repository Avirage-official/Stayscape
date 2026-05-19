'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function GuestsPage() {
  const router = useRouter()
  const [ref, setRef] = useState('')

  function handleFind() {
    // TODO: wire to /api/stays/find when endpoint is ready
    router.push('/login')
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
        overflow: 'hidden',
      }}
    >
      {/* ── Hero band (top half) ─────────────────────────── */}
      <div
        style={{
          position: 'relative',
          flex: '0 0 55%',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/videos/postlogin.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(20,16,13,0.78)',
            zIndex: 1,
          }}
        />

        {/* Vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(20,16,13,0.6) 100%)',
            zIndex: 2,
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
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
            onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'var(--text-muted)')}
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

          {/* Spacer to balance layout */}
          <span style={{ width: '60px' }} aria-hidden="true" />
        </div>

        {/* Headline */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              margin: '0 0 16px',
            }}
          >
            Welcome back.
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              color: 'var(--foreground)',
              opacity: 0.8,
              margin: 0,
              letterSpacing: '0.01em',
            }}
          >
            Find your stay or sign in to continue.
          </p>
        </div>
      </div>

      {/* ── Action band (bottom half) ────────────────────── */}
      <div
        style={{
          flex: '1 1 auto',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px 32px',
          gap: '40px',
        }}
      >
        <div
          className="action-cards"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '24px',
            width: '100%',
            maxWidth: '680px',
            alignItems: 'stretch',
          }}
        >
          {/* Card A — booking reference */}
          <div
            style={{
              flex: 1,
              background: 'var(--surface-raised)',
              border: '1px solid rgba(201,168,117,0.18)',
              borderRadius: '4px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--gold)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              I have a booking reference
            </p>

            <input
              type="text"
              value={ref}
              onChange={e => setRef(e.target.value)}
              placeholder="BK-12345"
              className="discovery-ref-input"
              style={{
                width: '100%',
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                padding: '10px 14px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 180ms ease, box-shadow 180ms ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--gold)'
                e.target.style.boxShadow = '0 0 0 2px rgba(201,168,117,0.18)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.boxShadow = 'none'
              }}
            />

            <button
              onClick={handleFind}
              style={{
                background: 'var(--gold)',
                border: 'none',
                borderRadius: '3px',
                padding: '11px 20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: '#14100D',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'opacity 180ms ease',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >
              Find my stay
            </button>
          </div>

          {/* Card B — sign in */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              background: 'var(--surface-raised)',
              border: '1px solid rgba(201,168,117,0.18)',
              borderRadius: '4px',
              padding: '28px 24px',
              gap: '16px',
            }}
          >
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--gold)',
                letterSpacing: '0.16em',
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
                borderRadius: '3px',
                padding: '10px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--gold)',
                letterSpacing: '0.04em',
                textDecoration: 'none',
                transition: 'background 180ms ease, color 180ms ease',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(201,168,117,0.08)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'transparent'
              }}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer strip */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.01em',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Sent fresh by your hotel&nbsp;&nbsp;·&nbsp;&nbsp;No app to download&nbsp;&nbsp;·&nbsp;&nbsp;Your stay, your data
        </p>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .action-cards {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}
