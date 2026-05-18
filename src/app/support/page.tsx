'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'
import { getSupabaseBrowser } from '@/lib/supabase/client'

const EASE = [0.16, 1, 0.3, 1] as const

interface EarlyProgress {
  total_pledged_sgd: number
  total_backers: number
  goal_sgd: number
}

const PROGRESS_FALLBACK: EarlyProgress = {
  total_pledged_sgd: 0,
  total_backers: 0,
  goal_sgd: 15000,
}

const HERO_STYLES = `
  @keyframes ssFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-hero-item {
    animation: ssFadeUp 700ms cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  .ss-hero-cta-primary {
    background: #C9A875;
    color: #14100D;
    border: none;
    padding: 14px 28px;
    border-radius: 999px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    transition: background 200ms ease, transform 200ms ease;
  }
  .ss-hero-cta-primary:hover {
    background: #D4B58A;
    transform: scale(1.015);
  }
  .ss-hero-cta-ghost {
    background: transparent;
    color: #C9A875;
    border: 1px solid rgba(201, 168, 117, 0.4);
    padding: 14px 28px;
    border-radius: 999px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    transition: border-color 200ms ease;
  }
  .ss-hero-cta-ghost:hover {
    border-color: rgba(201, 168, 117, 0.8);
  }
  .ss-hero-ctas {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
  @media (max-width: 480px) {
    .ss-hero-ctas {
      flex-direction: column;
      width: 100%;
    }
    .ss-hero-cta-primary,
    .ss-hero-cta-ghost {
      width: 100%;
      justify-content: center;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ss-hero-item {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`

const STORY_STYLES = `
  @keyframes ssFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-story-child {
    opacity: 0;
  }
  .ss-story-section.in-view .ss-story-child {
    animation: ssFadeUp 700ms cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  @media (prefers-reduced-motion: reduce) {
    .ss-story-child {
      opacity: 1 !important;
      animation: none !important;
      transform: none !important;
    }
  }
`

interface Tier {
  slug: string
  name: string
  price_sgd: number
  tagline: string
  perks: string[]
  is_limited: boolean
  total_spots: number | null
  stripe_payment_link: string
}

const TIERS_STYLES = `
  @keyframes ssFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-tiers-card {
    opacity: 0;
    transition: border-color 200ms ease, transform 200ms ease;
  }
  .ss-tiers-card:hover {
    border-color: rgba(201, 168, 117, 0.4) !important;
    transform: translateY(-2px);
  }
  .ss-tiers-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    align-items: stretch;
  }
  @media (max-width: 1023px) {
    .ss-tiers-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }
  @media (max-width: 767px) {
    .ss-tiers-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .ss-tiers-card {
      padding: 24px !important;
    }
  }
  .ss-tiers-perks {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }
  .ss-tiers-perks li {
    position: relative;
    padding-left: 22px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: rgba(245, 241, 234, 0.85);
  }
  .ss-tiers-perks li::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #C9A875;
  }
  .ss-tiers-pledge-btn:hover {
    background: #D4B58A !important;
  }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(1) { animation: ssFadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 0ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(2) { animation: ssFadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 80ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(3) { animation: ssFadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 160ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(4) { animation: ssFadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 240ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(5) { animation: ssFadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 320ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(6) { animation: ssFadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1) 400ms both; }
  @media (prefers-reduced-motion: reduce) {
    .ss-tiers-card {
      opacity: 1 !important;
      animation: none !important;
      transform: none !important;
    }
  }
`

export default function SupportPage() {
  const reduced = useReducedMotion()
  const [progress, setProgress] = useState<EarlyProgress>(PROGRESS_FALLBACK)
  const [tiers, setTiers] = useState<Tier[]>([])

  useEffect(() => {
    const sb = getSupabaseBrowser()
    if (!sb) return
    void (async () => {
      try {
        const { data } = await sb
          .from('early_progress')
          .select('total_pledged_sgd,total_backers,goal_sgd')
          .single()
        if (data) setProgress(data as EarlyProgress)
      } catch {
        // fallback state already set
      }
    })()
  }, [])

  useEffect(() => {
    const sb = getSupabaseBrowser()
    if (!sb) return
    void (async () => {
      try {
        const { data } = await sb
          .from('early_tiers')
          .select('slug,name,price_sgd,tagline,perks,is_limited,total_spots,stripe_payment_link')
          .order('display_order', { ascending: true })
        if (data) setTiers(data as Tier[])
      } catch {
        // fallback: empty grid renders cleanly
      }
    })()
  }, [])

  const storyRef = useRef<HTMLElement>(null)
  const tiersRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = storyRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view')
          obs.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const el = tiersRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view')
          obs.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, ease: EASE, delay },
        }

  const pledgedPct = Math.min(
    Math.round((progress.total_pledged_sgd / progress.goal_sgd) * 100),
    100,
  )

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <LandingNav />

      <main>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            minHeight: '100vh',
            background: '#0A0908',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(80px, 10vh, 120px) clamp(24px, 5vw, 48px)',
          }}
        >
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />

          {/* Background media — bottom fades into #0A0908 via mask */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              WebkitMaskImage: 'linear-gradient(to bottom, black 52%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 52%, transparent 100%)',
            }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            >
              <source src="/videos/support-hero.mp4" type="video/mp4" />
            </video>
            {/* Cinematic still — swap for your own asset */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1800&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
              }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,6,4,0.54)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(4,3,2,0.62) 100%)' }} />
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(32px, 4vw, 48px)',
              width: '100%',
              maxWidth: 680,
              textAlign: 'center',
            }}
          >
            {/* Eyebrow */}
            <p
              className="ss-hero-item"
              style={{
                animationDelay: '0ms',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#C9A875',
                margin: 0,
              }}
            >
              Stayscape Early Support · Limited Release
            </p>

            {/* Headline */}
            <h1
              className="ss-hero-item"
              style={{
                animationDelay: '100ms',
                fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                fontSize: 'clamp(2rem, 5.5vw, 4rem)',
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              <span style={{ color: '#F5F1EA', display: 'block' }}>
                Travel was supposed to feel like discovery.
              </span>
              <span style={{ color: '#A89B8C', display: 'block', fontStyle: 'italic' }}>
                Somewhere along the way, it became logistics.
              </span>
            </h1>

            {/* Subhead */}
            <p
              className="ss-hero-item"
              style={{
                animationDelay: '250ms',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 'clamp(15px, 2vw, 19px)',
                fontWeight: 400,
                lineHeight: 1.65,
                color: 'rgba(245,241,234,0.82)',
                maxWidth: 580,
                margin: 0,
              }}
            >
              We&apos;re inviting a small group of early travellers to support Stayscape Personal — the AI travel companion built for people who want their next trip to feel human again.
            </p>

            {/* CTAs */}
            <div
              className="ss-hero-item ss-hero-ctas"
              style={{ animationDelay: '400ms' }}
            >
              <a href="#tiers" className="ss-hero-cta-primary">
                Support Stayscape
              </a>
              <a href="#story" className="ss-hero-cta-ghost">
                Read the Story
              </a>
            </div>

            {/* Progress block — live from Supabase */}
            <div
              className="ss-hero-item"
              style={{
                animationDelay: '550ms',
                width: 'min(680px, 92vw)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 13,
                  color: '#A89B8C',
                  textAlign: 'center',
                  margin: '0 0 10px',
                  lineHeight: 1.4,
                }}
              >
                S$&nbsp;{progress.total_pledged_sgd.toLocaleString('en-SG')} raised of
                S$&nbsp;{progress.goal_sgd.toLocaleString('en-SG')} goal
                &nbsp;·&nbsp;{progress.total_backers} supporters so far
              </p>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  background: 'rgba(201, 168, 117, 0.12)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pledgedPct}%`,
                    background: 'linear-gradient(90deg, #C9A875, #E0C088)',
                    borderRadius: 999,
                    transition: 'width 600ms ease',
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#C9A875',
                  textAlign: 'center',
                  margin: '12px 0 0',
                }}
              >
                {pledgedPct}% funded
              </p>
            </div>
          </div>
        </section>

        {/* ── STORY ────────────────────────────────────────────────── */}
        <section
          id="story"
          ref={storyRef}
          className="ss-story-section"
          style={{
            background: '#0A0908',
            padding: 'clamp(80px, 12vw, 160px) 24px',
          }}
        >
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: STORY_STYLES }} />

          <div style={{ maxWidth: 'min(680px, 92vw)', margin: '0 auto' }}>

            {/* Eyebrow */}
            <p
              className="ss-story-child"
              style={{
                animationDelay: '0ms',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#C9A875',
                margin: 0,
              }}
            >
              The Story
            </p>

            {/* Heading */}
            <h2
              className="ss-story-child"
              style={{
                animationDelay: '100ms',
                fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: '#F5F1EA',
                margin: '16px 0 0',
              }}
            >
              Travel deserves a companion that actually knows you.
            </h2>

            {/* Paragraph 1 block */}
            <div
              className="ss-story-child"
              style={{ animationDelay: '250ms', marginTop: 'clamp(32px, 4vw, 56px)' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 'clamp(16px, 1.8vw, 18px)',
                  fontWeight: 400,
                  lineHeight: 1.75,
                  color: 'rgba(245,241,234,0.82)',
                  margin: 0,
                }}
              >
                We understand that loving travel and actually traveling are two very different things. One requires excitement — the other requires planning.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 'clamp(16px, 1.8vw, 18px)',
                  fontWeight: 400,
                  lineHeight: 1.75,
                  color: 'rgba(245,241,234,0.82)',
                  margin: '28px 0 0',
                }}
              >
                And for hotels, no matter how advanced operational technology becomes, hospitality has always been about enhancing the guest experience. But do you see the gap? Hotels are meant to be the gateway to a destination — a bridge between guests and the local ecosystem, culture, and experiences waiting to be discovered.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 'clamp(16px, 1.8vw, 18px)',
                  fontWeight: 400,
                  lineHeight: 1.75,
                  color: 'rgba(245,241,234,0.82)',
                  margin: '28px 0 0',
                }}
              >
                As technology evolves, so does the opportunity to digitalize services in ways that improve hotel operations while creating greater convenience and comfort for travelers.
              </p>
            </div>

            {/* Divider */}
            <hr
              style={{
                width: 64,
                height: 1,
                border: 'none',
                background: 'rgba(201, 168, 117, 0.3)',
                margin: '40px 0',
                marginLeft: 0,
              }}
            />

            {/* Paragraph 2 block */}
            <div
              className="ss-story-child"
              style={{ animationDelay: '400ms' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 'clamp(16px, 1.8vw, 18px)',
                  fontWeight: 400,
                  lineHeight: 1.75,
                  color: 'rgba(245,241,234,0.82)',
                  margin: 0,
                }}
              >
                That is where StayScape comes in.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 'clamp(16px, 1.8vw, 18px)',
                  fontWeight: 400,
                  lineHeight: 1.75,
                  color: 'rgba(245,241,234,0.82)',
                  margin: '28px 0 0',
                }}
              >
                StayScape is designed to be an extra source of comfort throughout your journey — helping you get things done effortlessly, discover places with ease, and feel supported whenever uncertainty arises. It is an extension of the hotel experience, and when needed, a trusted guide during your travels.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 'clamp(16px, 1.8vw, 18px)',
                  fontWeight: 400,
                  lineHeight: 1.75,
                  color: 'rgba(245,241,234,0.82)',
                  margin: '28px 0 0',
                }}
              >
                Aria is more than just an AI concierge. She is a planner, a local guide, and most importantly, a companion — there to support{' '}
                <em
                  style={{
                    fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 400,
                  }}
                >
                  you
                </em>
                {' '}every step of your trip.
              </p>

              <figure
                style={{
                  margin: 'clamp(32px, 4vw, 48px) 0 0',
                  width: '100%',
                  borderRadius: 6,
                  overflow: 'hidden',
                  lineHeight: 0,
                }}
              >
                <img
                  src="/images/story-aria-companion.jpg"
                  alt="Aria — your personal travel companion"
                  style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: 6 }}
                />
              </figure>
            </div>

            {/* Divider */}
            <hr
              style={{
                width: 64,
                height: 1,
                border: 'none',
                background: 'rgba(201, 168, 117, 0.3)',
                margin: '40px 0',
                marginLeft: 0,
              }}
            />

            {/* Pull quote — Meet Aria */}
            <div
              className="ss-story-child"
              style={{ animationDelay: '550ms', marginTop: 24 }}
            >
              <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 3,
                    flexShrink: 0,
                    background: '#C9A875',
                    borderRadius: 2,
                  }}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                    fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: 1.3,
                    color: '#C9A875',
                    margin: 0,
                  }}
                >
                  Meet Aria — your personal travel concierge.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── TIERS ────────────────────────────────────────────────── */}
        <section
          id="tiers"
          ref={tiersRef}
          className="ss-tiers-section"
          style={{
            background: '#0A0908',
            padding: 'clamp(80px, 10vw, 140px) 24px',
          }}
        >
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: TIERS_STYLES }} />

          <div style={{ maxWidth: 'min(1200px, 92vw)', margin: '0 auto' }}>

            {/* Section header */}
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: '#C9A875',
                  margin: 0,
                }}
              >
                CHOOSE YOUR TIER
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: '#F5F1EA',
                  margin: '16px 0 0',
                }}
              >
                Six ways to support.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 'clamp(15px, 1.7vw, 17px)',
                  color: '#A89B8C',
                  lineHeight: 1.6,
                  maxWidth: 520,
                  margin: '24px auto 0',
                }}
              >
                Every tier includes lifetime access. Limited tiers are gone when they&apos;re gone.
              </p>
            </div>

            {/* Tier cards */}
            <div className="ss-tiers-grid">
              {tiers.map((tier) => (
                <div
                  key={tier.slug}
                  className="ss-tiers-card"
                  style={{
                    position: 'relative',
                    background: '#14100D',
                    border: '1px solid rgba(201, 168, 117, 0.18)',
                    borderRadius: 12,
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  {/* Most Popular pill (wanderer only) */}
                  {tier.slug === 'wanderer' && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '4px 14px',
                        background: '#C9A875',
                        color: '#14100D',
                        borderRadius: 999,
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      MOST POPULAR
                    </span>
                  )}

                  {/* Limited badge */}
                  {tier.is_limited && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(201, 168, 117, 0.15)',
                        border: '1px solid rgba(201, 168, 117, 0.3)',
                        color: '#C9A875',
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        fontSize: 10,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tier.total_spots ? `LIMITED · ${tier.total_spots} SPOTS` : 'LIMITED'}
                    </span>
                  )}

                  {/* Tier name */}
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 12,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                      color: '#C9A875',
                      margin: 0,
                    }}
                  >
                    {tier.name}
                  </p>

                  {/* Price */}
                  <p
                    style={{
                      fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                      fontSize: 'clamp(2.5rem, 3.5vw, 3.25rem)',
                      fontWeight: 400,
                      lineHeight: 1,
                      color: '#F5F1EA',
                      margin: 0,
                    }}
                  >
                    S$&nbsp;{tier.price_sgd.toLocaleString('en-SG')}
                  </p>

                  {/* Tagline */}
                  <p
                    style={{
                      fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                      fontSize: 16,
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                      color: 'rgba(245, 241, 234, 0.7)',
                      margin: 0,
                    }}
                  >
                    {tier.tagline}
                  </p>

                  {/* Divider */}
                  <hr style={{ height: 1, background: 'rgba(201, 168, 117, 0.2)', border: 'none', margin: 0 }} />

                  {/* Perks */}
                  <ul className="ss-tiers-perks">
                    {(tier.perks as string[]).map((perk, pi) => (
                      <li key={pi}>{perk}</li>
                    ))}
                  </ul>

                  {/* Pledge button */}
                  <a
                    href={tier.stripe_payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ss-tiers-pledge-btn"
                    aria-label={
                      tier.slug === 'hotel-insider'
                        ? `Reserve your spot — ${tier.name} tier`
                        : `Pledge S$ ${tier.price_sgd.toLocaleString('en-SG')} — ${tier.name} tier`
                    }
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '14px 24px',
                      background: '#C9A875',
                      color: '#14100D',
                      borderRadius: 999,
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 15,
                      fontWeight: 500,
                      textAlign: 'center',
                      textDecoration: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {tier.slug === 'hotel-insider'
                      ? 'Reserve Your Spot'
                      : `Pledge S$ ${tier.price_sgd.toLocaleString('en-SG')}`}
                  </a>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 13,
                color: '#A89B8C',
                textAlign: 'center',
                marginTop: 56,
              }}
            >
              Secure checkout powered by Stripe · Cards accepted globally
            </p>
          </div>
        </section>

        {/* ── STORY ────────────────────────────────────────────────── */}
        <section
          id="story"
          style={{
            background: 'var(--background)',
            borderTop: '1px solid var(--border)',
            padding: 'clamp(80px, 10vw, 120px) clamp(24px, 5vw, 80px)',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                gap: 'clamp(48px, 6vw, 96px)',
                alignItems: 'start',
              }}
            >
              {/* Left: heading block */}
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: 'var(--gold)',
                    marginBottom: 20,
                  }}
                >
                  Our Story
                </p>
                <motion.h2
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={reduced ? undefined : { duration: 0.8, ease: EASE }}
                  style={{
                    fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                    fontWeight: 600,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    maxWidth: '18ch',
                  }}
                >
                  Built by travellers who got tired of losing the magic.
                </motion.h2>

                {/* Thin rule */}
                <motion.div
                  initial={reduced ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={reduced ? undefined : { duration: 0.7, ease: EASE, delay: 0.2 }}
                  style={{
                    width: 48,
                    height: 1,
                    background: 'var(--gold)',
                    marginTop: 32,
                    transformOrigin: 'left center',
                    opacity: 0.6,
                  }}
                />
              </div>

              {/* Right: editorial copy */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={reduced ? undefined : { duration: 0.8, ease: EASE, delay: 0.15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                {[
                  `We built Stayscape because we kept losing something when we travelled. That feeling — arriving somewhere new, not knowing what was around the corner, being surprised. It gets engineered out by apps that optimise for efficiency over experience.`,
                  `Stayscape Personal is our answer to that. An AI that knows you, knows the city, and helps you move through it the way a well-travelled friend would. Not a search engine. Not a booking tool. A companion.`,
                  `We're a small team building carefully. We're not raising from institutions right now — we're raising from the people who will actually use this. If you've ever felt that travel should feel like more, this is for you.`,
                ].map((text, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 17,
                      color: i === 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                      lineHeight: 1.75,
                    }}
                  >
                    {text}
                  </p>
                ))}

                {/* Story CTA */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <a
                    href="#tiers"
                    className="ss-gold-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 48,
                      padding: '0 32px',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      letterSpacing: '0.03em',
                      textDecoration: 'none',
                      color: 'var(--background)',
                    }}
                  >
                    See the Tiers
                  </a>
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                    }}
                  >
                    Reward-based · No equity
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  )
}
