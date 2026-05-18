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

const TIERS = [
  {
    id: 'traveller',
    name: 'Traveller',
    price: 'S$ 99',
    period: 'one-time',
    tagline: 'Your first step in.',
    description: 'Early access to Stayscape Personal and a permanent seat at the founding table.',
    perks: [
      '12 months of Stayscape Personal',
      'Founding member status',
      'Early access before public launch',
      'Community access',
    ],
    highlight: false,
    badge: null,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    price: 'S$ 299',
    period: 'one-time',
    tagline: 'For those who want more.',
    description: 'Extended access and a voice in how we build. This is the tier most early supporters choose.',
    perks: [
      '24 months of Stayscape Personal',
      'Private product update calls (quarterly)',
      'Founding member status',
      'Name in app credits',
      'All Traveller perks',
    ],
    highlight: true,
    badge: 'Most popular',
  },
  {
    id: 'founding',
    name: 'Founding Member',
    price: 'S$ 999',
    period: 'one-time',
    tagline: 'Shape what we become.',
    description: 'For the rare few who want to be genuinely close to how Stayscape is built.',
    perks: [
      'Lifetime access to Stayscape Personal',
      'Direct founder access (bi-annual call)',
      'Input on roadmap priorities',
      'Name in app credits (prominent)',
      'All Explorer perks',
    ],
    highlight: false,
    badge: 'Limited — 10 spots',
  },
]

export default function SupportPage() {
  const reduced = useReducedMotion()
  const [progress, setProgress] = useState<EarlyProgress>(PROGRESS_FALLBACK)

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

  const storyRef = useRef<HTMLElement>(null)

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

              {/*
                IMAGE PLACEHOLDER — recommended: a phone screen showing Aria's interface,
                warm ambient hotel lighting, soft focus background.
                Upload to: /public/images/story-aria-companion.jpg
                Ideal dimensions: 680 × 420px (aspect ratio 16:10)
              */}
              <figure
                aria-hidden="true"
                style={{
                  margin: 'clamp(32px, 4vw, 48px) 0 0',
                  width: '100%',
                  aspectRatio: '16/10',
                  background: 'rgba(201, 168, 117, 0.03)',
                  border: '1px dashed rgba(201, 168, 117, 0.15)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  overflow: 'hidden',
                }}
              >
                {/* Replace this entire <figure> with: */}
                {/* <img src="/images/story-aria-companion.jpg" alt="Aria — your personal travel companion" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} /> */}
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'rgba(201, 168, 117, 0.25)',
                  }}
                >
                  Image placeholder
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 11,
                    color: 'rgba(201, 168, 117, 0.15)',
                    textAlign: 'center',
                    maxWidth: 260,
                    lineHeight: 1.5,
                  }}
                >
                  Upload to /public/images/story-aria-companion.jpg · 680 × 420px
                </span>
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
          style={{
            background: 'var(--background)',
            padding: 'clamp(80px, 10vw, 120px) clamp(24px, 5vw, 80px)',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>

            {/* Section header */}
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--gold)',
                marginBottom: 16,
              }}
            >
              Support Tiers
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: 16,
                maxWidth: '22ch',
              }}
            >
              Back Stayscape Personal.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 17,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '52ch',
                marginBottom: 64,
              }}
            >
              Choose a tier that works for you. Every pledge goes directly into building.
              Payment links coming soon — reserve your spot below.
            </p>

            {/* Tier cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: 20,
                alignItems: 'start',
              }}
            >
              {TIERS.map((tier, i) => (
                <motion.div
                  key={tier.id}
                  initial={reduced ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={reduced ? undefined : { duration: 0.7, ease: EASE, delay: i * 0.12 }}
                  style={{
                    position: 'relative',
                    background: tier.highlight
                      ? 'linear-gradient(160deg, rgba(201,168,117,0.08) 0%, rgba(201,168,117,0.02) 60%), var(--surface)'
                      : 'var(--surface)',
                    border: tier.highlight
                      ? '1px solid rgba(201,168,117,0.35)'
                      : '1px solid var(--border)',
                    borderRadius: 20,
                    padding: 'clamp(28px, 4vw, 40px)',
                    boxShadow: tier.highlight
                      ? 'inset 0 1px 0 rgba(201,168,117,0.12), 0 8px 32px rgba(0,0,0,0.3)'
                      : 'inset 0 1px 0 rgba(245,230,204,0.04), 0 4px 16px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: 28,
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: tier.highlight ? 'var(--background)' : 'var(--gold)',
                        background: tier.highlight ? 'var(--gold)' : 'var(--surface)',
                        border: '1px solid var(--gold)',
                        borderRadius: 999,
                        padding: '4px 12px',
                      }}
                    >
                      {tier.badge}
                    </span>
                  )}

                  {/* Tier name */}
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      color: 'var(--gold)',
                      marginBottom: 12,
                    }}
                  >
                    {tier.name}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                        fontSize: 'clamp(2.4rem, 4vw, 3.2rem)',
                        fontWeight: 600,
                        lineHeight: 1,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {tier.price}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        marginLeft: 8,
                      }}
                    >
                      {tier.period}
                    </span>
                  </div>

                  {/* Tagline */}
                  <p
                    style={{
                      fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                      fontSize: 18,
                      fontStyle: 'italic',
                      fontWeight: 400,
                      color: 'var(--text-secondary)',
                      marginBottom: 16,
                    }}
                  >
                    {tier.tagline}
                  </p>

                  {/* Divider */}
                  <div
                    style={{
                      height: 1,
                      background: tier.highlight
                        ? 'rgba(201,168,117,0.2)'
                        : 'var(--border)',
                      marginBottom: 20,
                    }}
                  />

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      marginBottom: 24,
                    }}
                  >
                    {tier.description}
                  </p>

                  {/* Perks */}
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {tier.perks.map((perk) => (
                      <li
                        key={perk}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          fontFamily: 'var(--font-dm-sans), sans-serif',
                          fontSize: 14,
                          color: 'var(--text-primary)',
                          lineHeight: 1.45,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            display: 'inline-block',
                            width: 14,
                            height: 14,
                            marginTop: 2,
                            flexShrink: 0,
                            color: 'var(--gold)',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          –
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {/* Placeholder CTA */}
                  <button
                    disabled
                    aria-label={`Pledge ${tier.price} — ${tier.name} tier (coming soon)`}
                    className={tier.highlight ? 'ss-gold-btn' : undefined}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      letterSpacing: '0.03em',
                      cursor: 'not-allowed',
                      ...(tier.highlight
                        ? { color: 'var(--background)' }
                        : {
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                          }),
                    }}
                  >
                    Pledge {tier.price} — Coming Soon
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Disclaimer */}
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 32,
                lineHeight: 1.6,
                maxWidth: '60ch',
              }}
            >
              This is a reward-based crowdfund — not equity. Supporters receive access
              and recognition in exchange for their pledge. Similar in structure to Kickstarter.
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
