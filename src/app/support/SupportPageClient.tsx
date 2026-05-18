'use client'

import { useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'
import type { EarlyProgress } from './page'

const EASE = [0.16, 1, 0.3, 1] as const

// ─── Hardcoded tiers ───────────────────────────────────────────────────────
// Stripe URLs are stable and don't need to live in Supabase.
// To update a URL: change it here and redeploy.
const TIERS = [
  {
    slug: 'believer',
    name: 'Believer',
    price_sgd: 35,
    tagline: 'You believe in what we\'re building.',
    perks: [
      'Lifetime access to Stayscape Personal',
      'Early Supporter badge on your profile',
      'Founding member recognition',
    ],
    is_limited: false,
    total_spots: null,
    stripe_payment_link: 'https://buy.stripe.com/bJefZg3I2fMaf5P7fhdfG01',
  },
  {
    slug: 'wanderer',
    name: 'Wanderer',
    price_sgd: 79,
    tagline: 'For the traveller who goes often.',
    perks: [
      'Lifetime access to Stayscape Personal',
      'Priority access to new features',
      'Early Supporter badge',
      'Founding member recognition',
    ],
    is_limited: false,
    total_spots: null,
    stripe_payment_link: 'https://buy.stripe.com/4gM00i4M61Vk5vf2Z1dfG02',
  },
  {
    slug: 'globetrotter',
    name: 'Globetrotter',
    price_sgd: 149,
    tagline: 'The world is your second home.',
    perks: [
      'Lifetime access to Stayscape Personal',
      'Priority access to new features',
      'Direct feedback channel with the team',
      'Early Supporter badge',
      'Founding member recognition',
    ],
    is_limited: false,
    total_spots: null,
    stripe_payment_link: 'https://buy.stripe.com/bJe28qdiC1Vk0aVdDFdfG03',
  },
  {
    slug: 'insider',
    name: 'Insider',
    price_sgd: 299,
    tagline: 'You want to be part of how this is shaped.',
    perks: [
      'Lifetime access to Stayscape Personal',
      'Quarterly product roadmap calls',
      'Name in the product credits',
      'Direct feedback channel',
      'Priority support',
      'Early Supporter badge',
    ],
    is_limited: true,
    total_spots: 50,
    stripe_payment_link: 'https://buy.stripe.com/7sY14m1zU57w4rb2Z1dfG04',
  },
  {
    slug: 'founding-circle',
    name: 'Founding Circle',
    price_sgd: 599,
    tagline: 'A seat at the table from day one.',
    perks: [
      'Lifetime access to Stayscape Personal',
      'Monthly 1-on-1 call with the founding team',
      'Shape the product roadmap directly',
      'Name in the product credits',
      'All Insider perks included',
      'Founding Circle badge',
    ],
    is_limited: true,
    total_spots: 20,
    stripe_payment_link: 'https://buy.stripe.com/4gMbJ0emGgQe6zj2Z1dfG05',
  },
  {
    slug: 'hotel-insider',
    name: 'Hotel Insider',
    price_sgd: 1499,
    tagline: 'For hospitality teams who want Aria first.',
    perks: [
      'Early access to Stayscape for Hotels (B2B)',
      'White-glove onboarding for your property',
      'Co-design the hotel product with us',
      'Lifetime personal tier included',
      'Founding partner recognition',
    ],
    is_limited: true,
    total_spots: 5,
    stripe_payment_link: 'https://buy.stripe.com/fZu6oG6Ue57waPzfLNdfG06',
  },
] as const

type TierEntry = typeof TIERS[number]

// ─── Styles ────────────────────────────────────────────────────────────────
const HERO_STYLES = `
  @keyframes ssFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-hero-item { animation: ssFadeUp 700ms cubic-bezier(0.4, 0, 0.2, 1) both; }
  .ss-hero-cta-primary {
    background: #C9A875; color: #14100D; border: none;
    padding: 14px 28px; border-radius: 999px;
    font-family: var(--font-dm-sans), sans-serif; font-size: 15px; font-weight: 500;
    letter-spacing: 0.02em; text-decoration: none; display: inline-flex; align-items: center;
    cursor: pointer; transition: background 200ms ease, transform 200ms ease;
  }
  .ss-hero-cta-primary:hover { background: #D4B58A; transform: scale(1.015); }
  .ss-hero-cta-ghost {
    background: transparent; color: #C9A875; border: 1px solid rgba(201,168,117,0.4);
    padding: 14px 28px; border-radius: 999px;
    font-family: var(--font-dm-sans), sans-serif; font-size: 15px; font-weight: 500;
    text-decoration: none; display: inline-flex; align-items: center;
    cursor: pointer; transition: border-color 200ms ease;
  }
  .ss-hero-cta-ghost:hover { border-color: rgba(201,168,117,0.8); }
  .ss-hero-ctas { display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; }
  @media (max-width: 480px) {
    .ss-hero-ctas { flex-direction: column; width: 100%; }
    .ss-hero-cta-primary, .ss-hero-cta-ghost { width: 100%; justify-content: center; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ss-hero-item { animation: none !important; opacity: 1 !important; transform: none !important; }
  }
`

const STORY_STYLES = `
  @keyframes ssFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-story-child { opacity: 0; }
  .ss-story-section.in-view .ss-story-child { animation: ssFadeUp 700ms cubic-bezier(0.4, 0, 0.2, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    .ss-story-child { opacity: 1 !important; animation: none !important; transform: none !important; }
  }
`

const TIERS_STYLES = `
  @keyframes ssFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-tiers-card { opacity: 0; transition: border-color 200ms ease, transform 200ms ease; }
  .ss-tiers-card:hover { border-color: rgba(201,168,117,0.4) !important; transform: translateY(-2px); }
  .ss-tiers-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; align-items: stretch; }
  @media (max-width: 1023px) { .ss-tiers-grid { grid-template-columns: repeat(2,1fr); gap: 20px; } }
  @media (max-width: 767px)  { .ss-tiers-grid { grid-template-columns: 1fr; gap: 16px; } .ss-tiers-card { padding: 24px !important; } }
  .ss-tiers-perks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; flex: 1; }
  .ss-tiers-perks li { position: relative; padding-left: 22px; font-family: var(--font-dm-sans), sans-serif; font-size: 14px; line-height: 1.5; color: rgba(245,241,234,0.85); }
  .ss-tiers-perks li::before { content: ''; position: absolute; top: 8px; left: 0; width: 6px; height: 6px; border-radius: 50%; background: #C9A875; }
  .ss-tiers-pledge-btn { transition: background 200ms ease; }
  .ss-tiers-pledge-btn:hover { background: #D4B58A !important; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(1) { animation: ssFadeUp 600ms cubic-bezier(0.4,0,0.2,1) 0ms   both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(2) { animation: ssFadeUp 600ms cubic-bezier(0.4,0,0.2,1) 80ms  both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(3) { animation: ssFadeUp 600ms cubic-bezier(0.4,0,0.2,1) 160ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(4) { animation: ssFadeUp 600ms cubic-bezier(0.4,0,0.2,1) 240ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(5) { animation: ssFadeUp 600ms cubic-bezier(0.4,0,0.2,1) 320ms both; }
  .ss-tiers-section.in-view .ss-tiers-card:nth-child(6) { animation: ssFadeUp 600ms cubic-bezier(0.4,0,0.2,1) 400ms both; }
  @media (prefers-reduced-motion: reduce) {
    .ss-tiers-card { opacity: 1 !important; animation: none !important; transform: none !important; }
  }
`

const ABOUT_STYLES = `
  @keyframes ssLineReveal { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0% 0 0 0); } }
  @keyframes ssCounterUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .ss-about-section { background: #0A0908; overflow: hidden; position: relative; }
  .ss-about-section::before { content: ''; position: absolute; top: -20%; right: -10%; width: 55%; height: 80%; background: radial-gradient(ellipse at center, rgba(201,168,117,0.07) 0%, transparent 68%); pointer-events: none; z-index: 0; }
  .ss-about-section::after  { content: ''; position: absolute; bottom: -10%; left: -5%; width: 40%; height: 60%; background: radial-gradient(ellipse at center, rgba(180,100,60,0.05) 0%, transparent 70%); pointer-events: none; z-index: 0; }
  .ss-about-rule { height: 1px; background: linear-gradient(90deg,transparent,rgba(201,168,117,0.35) 30%,rgba(201,168,117,0.35) 70%,transparent); margin: 0; border: none; }
  .ss-about-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; }
  .ss-about-stat { padding: clamp(28px,3.5vw,44px) clamp(20px,3vw,40px); border-right: 1px solid rgba(201,168,117,0.12); opacity: 0; }
  .ss-about-stat:last-child { border-right: none; }
  .ss-about-section.in-view .ss-about-stat:nth-child(1) { animation: ssCounterUp 600ms cubic-bezier(0.4,0,0.2,1) 0ms   both; }
  .ss-about-section.in-view .ss-about-stat:nth-child(2) { animation: ssCounterUp 600ms cubic-bezier(0.4,0,0.2,1) 100ms both; }
  .ss-about-section.in-view .ss-about-stat:nth-child(3) { animation: ssCounterUp 600ms cubic-bezier(0.4,0,0.2,1) 200ms both; }
  .ss-about-progress-track { height: 2px; background: rgba(201,168,117,0.12); border-radius: 999px; overflow: hidden; margin-top: 10px; }
  .ss-about-progress-fill { height: 100%; background: linear-gradient(90deg,#C9A875,#E0C088); border-radius: 999px; transform-origin: left center; transform: scaleX(0); transition: transform 1s cubic-bezier(0.16,1,0.3,1) 0.4s; }
  .ss-about-section.in-view .ss-about-progress-fill { transform: scaleX(1); }
  .ss-about-line { display: block; overflow: hidden; }
  .ss-about-line-inner { display: block; clip-path: inset(100% 0 0 0); }
  .ss-about-section.in-view .ss-about-line-inner:nth-child(1) { animation: ssLineReveal 900ms cubic-bezier(0.16,1,0.3,1) 0ms   both; }
  .ss-about-section.in-view .ss-about-line-inner:nth-child(2) { animation: ssLineReveal 900ms cubic-bezier(0.16,1,0.3,1) 120ms both; }
  .ss-about-section.in-view .ss-about-line-inner:nth-child(3) { animation: ssLineReveal 900ms cubic-bezier(0.16,1,0.3,1) 240ms both; }
  .ss-about-body { opacity: 0; }
  .ss-about-section.in-view .ss-about-body:nth-of-type(1) { animation: ssCounterUp 700ms cubic-bezier(0.4,0,0.2,1) 300ms both; }
  .ss-about-section.in-view .ss-about-body:nth-of-type(2) { animation: ssCounterUp 700ms cubic-bezier(0.4,0,0.2,1) 440ms both; }
  .ss-about-section.in-view .ss-about-body:nth-of-type(3) { animation: ssCounterUp 700ms cubic-bezier(0.4,0,0.2,1) 560ms both; }
  .ss-about-cta-area { opacity: 0; }
  .ss-about-section.in-view .ss-about-cta-area { animation: ssCounterUp 700ms cubic-bezier(0.4,0,0.2,1) 680ms both; }
  .ss-about-founder-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(201,168,117,0.08); border: 1px solid rgba(201,168,117,0.18); border-radius: 999px; padding: 6px 14px 6px 8px; font-family: var(--font-dm-sans), sans-serif; font-size: 12px; font-weight: 500; color: #C9A875; letter-spacing: 0.04em; opacity: 0; }
  .ss-about-section.in-view .ss-about-founder-tag { animation: ssCounterUp 600ms cubic-bezier(0.4,0,0.2,1) 150ms both; }
  .ss-gold-btn { background: #C9A875; transition: background 200ms ease; }
  .ss-gold-btn:hover { background: #D4B58A; }
  @media (max-width: 639px) {
    .ss-about-stats { grid-template-columns: 1fr 1fr; }
    .ss-about-stat:nth-child(2) { border-right: none; }
    .ss-about-stat:nth-child(3) { grid-column: 1/-1; border-right: none; border-top: 1px solid rgba(201,168,117,0.12); }
  }
  @media (max-width: 900px) {
    .ss-about-grid { grid-template-columns: 1fr !important; }
    .ss-about-sticky { position: static !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ss-about-stat, .ss-about-line-inner, .ss-about-body, .ss-about-cta-area, .ss-about-founder-tag { opacity: 1 !important; animation: none !important; clip-path: none !important; }
    .ss-about-progress-fill { transform: scaleX(1) !important; transition: none !important; }
  }
`

interface Props {
  initialProgress: EarlyProgress
}

export default function SupportPageClient({ initialProgress }: Props) {
  const reduced = useReducedMotion()
  const progress = initialProgress

  const storyRef = useRef<HTMLElement>(null)
  const tiersRef = useRef<HTMLElement>(null)
  const aboutRef = useRef<HTMLElement>(null)

  const attachObserver = (ref: React.RefObject<HTMLElement | null>, threshold = 0.2) => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('in-view'); obs.disconnect() } },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }

  useEffect(() => attachObserver(storyRef, 0.2), [])
  useEffect(() => attachObserver(tiersRef, 0.3), [])
  useEffect(() => attachObserver(aboutRef, 0.15), [])

  const pledgedPct = Math.min(
    Math.round((progress.total_pledged_sgd / progress.goal_sgd) * 100),
    100,
  )

  return (
    <div style={{ background: '#0A0908', minHeight: '100vh' }}>
      <LandingNav />

      <main>

        {/* ── HERO ───────────────────────────────────────────────── */}
        <section style={{ position: 'relative', minHeight: '100vh', background: '#0A0908', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(80px,10vh,120px) clamp(24px,5vw,48px)' }}>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, WebkitMaskImage: 'linear-gradient(to bottom, black 52%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 52%, transparent 100%)' }}>
            <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
              <source src="/videos/support-hero.mp4" type="video/mp4" />
            </video>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1800&q=80)', backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,6,4,0.54)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(4,3,2,0.62) 100%)' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(32px,4vw,48px)', width: '100%', maxWidth: 680, textAlign: 'center' }}>
            <p className="ss-hero-item" style={{ animationDelay: '0ms', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C9A875', margin: 0 }}>Stayscape Early Support · Limited Release</p>
            <h1 className="ss-hero-item" style={{ animationDelay: '100ms', fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 'clamp(2rem,5.5vw,4rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.01em', margin: 0 }}>
              <span style={{ color: '#F5F1EA', display: 'block' }}>Travel was supposed to feel like discovery.</span>
              <span style={{ color: '#A89B8C', display: 'block', fontStyle: 'italic' }}>Somewhere along the way, it became logistics.</span>
            </h1>
            <p className="ss-hero-item" style={{ animationDelay: '250ms', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(15px,2vw,19px)', fontWeight: 400, lineHeight: 1.65, color: 'rgba(245,241,234,0.82)', maxWidth: 580, margin: 0 }}>
              We&apos;re inviting a small group of early travellers to support Stayscape Personal — the AI travel companion built for people who want their next trip to feel human again.
            </p>
            <div className="ss-hero-item ss-hero-ctas" style={{ animationDelay: '400ms' }}>
              <a href="#tiers" className="ss-hero-cta-primary">Support Stayscape</a>
              <a href="#story" className="ss-hero-cta-ghost">Read the Story</a>
            </div>
            <div className="ss-hero-item" style={{ animationDelay: '550ms', width: 'min(680px,92vw)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: '#A89B8C', textAlign: 'center', margin: '0 0 10px', lineHeight: 1.4 }}>
                S$&nbsp;{progress.total_pledged_sgd.toLocaleString('en-SG')} raised of S$&nbsp;{progress.goal_sgd.toLocaleString('en-SG')} goal &nbsp;·&nbsp;{progress.total_backers} supporters so far
              </p>
              <div style={{ width: '100%', height: 6, background: 'rgba(201,168,117,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pledgedPct}%`, background: 'linear-gradient(90deg,#C9A875,#E0C088)', borderRadius: 999, transition: 'width 600ms ease' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C9A875', textAlign: 'center', margin: '12px 0 0' }}>{pledgedPct}% funded</p>
            </div>
          </div>
        </section>

        {/* ── STORY ─────────────────────────────────────────────── */}
        <section id="story" ref={storyRef} className="ss-story-section" style={{ background: '#0A0908', padding: 'clamp(80px,12vw,160px) 24px' }}>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: STORY_STYLES }} />
          <div style={{ maxWidth: 'min(680px,92vw)', margin: '0 auto' }}>
            <p className="ss-story-child" style={{ animationDelay: '0ms', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C9A875', margin: 0 }}>The Story</p>
            <h2 className="ss-story-child" style={{ animationDelay: '100ms', fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 'clamp(1.75rem,4.5vw,3rem)', fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#F5F1EA', margin: '16px 0 0' }}>Travel deserves a companion that actually knows you.</h2>
            <div className="ss-story-child" style={{ animationDelay: '250ms', marginTop: 'clamp(32px,4vw,56px)' }}>
              {['We understand that loving travel and actually traveling are two very different things. One requires excitement — the other requires planning.', 'And for hotels, no matter how advanced operational technology becomes, hospitality has always been about enhancing the guest experience. But do you see the gap? Hotels are meant to be the gateway to a destination — a bridge between guests and the local ecosystem, culture, and experiences waiting to be discovered.', 'As technology evolves, so does the opportunity to digitalize services in ways that improve hotel operations while creating greater convenience and comfort for travelers.'].map((text, i) => (
                <p key={i} style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(16px,1.8vw,18px)', fontWeight: 400, lineHeight: 1.75, color: 'rgba(245,241,234,0.82)', margin: i === 0 ? 0 : '28px 0 0' }}>{text}</p>
              ))}
            </div>
            <hr style={{ width: 64, height: 1, border: 'none', background: 'rgba(201,168,117,0.3)', margin: '40px 0', marginLeft: 0 }} />
            <div className="ss-story-child" style={{ animationDelay: '400ms' }}>
              {['That is where StayScape comes in.', 'StayScape is designed to be an extra source of comfort throughout your journey — helping you get things done effortlessly, discover places with ease, and feel supported whenever uncertainty arises. It is an extension of the hotel experience, and when needed, a trusted guide during your travels.'].map((text, i) => (
                <p key={i} style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(16px,1.8vw,18px)', fontWeight: 400, lineHeight: 1.75, color: 'rgba(245,241,234,0.82)', margin: i === 0 ? 0 : '28px 0 0' }}>{text}</p>
              ))}
              <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(16px,1.8vw,18px)', fontWeight: 400, lineHeight: 1.75, color: 'rgba(245,241,234,0.82)', margin: '28px 0 0' }}>
                Aria is more than just an AI concierge. She is a planner, a local guide, and most importantly, a companion — there to support{' '}
                <em style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>you</em>{' '}every step of your trip.
              </p>
              <figure style={{ margin: 'clamp(32px,4vw,48px) 0 0', width: '100%', borderRadius: 6, overflow: 'hidden', lineHeight: 0 }}>
                <img src="/images/story-aria-companion.jpg" alt="Aria — your personal travel companion" style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: 6 }} />
              </figure>
            </div>
            <hr style={{ width: 64, height: 1, border: 'none', background: 'rgba(201,168,117,0.3)', margin: '40px 0', marginLeft: 0 }} />
            <div className="ss-story-child" style={{ animationDelay: '550ms', marginTop: 24 }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
                <div aria-hidden="true" style={{ width: 3, flexShrink: 0, background: '#C9A875', borderRadius: 2 }} />
                <p style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 'clamp(1.5rem,3.5vw,2.25rem)', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.3, color: '#C9A875', margin: 0 }}>Meet Aria — your personal travel concierge.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── TIERS ─────────────────────────────────────────────── */}
        <section id="tiers" ref={tiersRef} className="ss-tiers-section" style={{ background: '#0A0908', padding: 'clamp(80px,10vw,140px) 24px' }}>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: TIERS_STYLES }} />
          <div style={{ maxWidth: 'min(1200px,92vw)', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C9A875', margin: 0 }}>CHOOSE YOUR TIER</p>
              <h2 style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 400, lineHeight: 1.2, color: '#F5F1EA', margin: '16px 0 0' }}>Six ways to support.</h2>
              <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(15px,1.7vw,17px)', color: '#A89B8C', lineHeight: 1.6, maxWidth: 520, margin: '24px auto 0' }}>Every tier includes lifetime access. Limited tiers are gone when they&apos;re gone.</p>
            </div>
            <div className="ss-tiers-grid">
              {TIERS.map((tier: TierEntry) => (
                <div key={tier.slug} className="ss-tiers-card" style={{ position: 'relative', background: '#14100D', border: '1px solid rgba(201,168,117,0.18)', borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {tier.slug === 'wanderer' && (
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', background: '#C9A875', color: '#14100D', borderRadius: 999, fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>MOST POPULAR</span>
                  )}
                  {tier.is_limited && (
                    <span style={{ position: 'absolute', top: 16, right: 16, padding: '4px 10px', borderRadius: 999, background: 'rgba(201,168,117,0.15)', border: '1px solid rgba(201,168,117,0.3)', color: '#C9A875', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
                      {tier.total_spots ? `LIMITED · ${tier.total_spots} SPOTS` : 'LIMITED'}
                    </span>
                  )}
                  <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#C9A875', margin: 0 }}>{tier.name}</p>
                  <p style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 'clamp(2.5rem,3.5vw,3.25rem)', fontWeight: 400, lineHeight: 1, color: '#F5F1EA', margin: 0 }}>S$&nbsp;{tier.price_sgd.toLocaleString('en-SG')}</p>
                  <p style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 16, fontStyle: 'italic', lineHeight: 1.4, color: 'rgba(245,241,234,0.7)', margin: 0 }}>{tier.tagline}</p>
                  <hr style={{ height: 1, background: 'rgba(201,168,117,0.2)', border: 'none', margin: 0 }} />
                  <ul className="ss-tiers-perks">
                    {tier.perks.map((perk, pi) => <li key={pi}>{perk}</li>)}
                  </ul>
                  <a
                    href={tier.stripe_payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ss-tiers-pledge-btn"
                    aria-label={`Pledge S$ ${tier.price_sgd} — ${tier.name} tier`}
                    style={{ display: 'block', width: '100%', padding: '14px 24px', background: '#C9A875', color: '#14100D', borderRadius: 999, fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 15, fontWeight: 500, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                  >
                    {tier.slug === 'hotel-insider' ? 'Reserve Your Spot' : `Pledge S$ ${tier.price_sgd.toLocaleString('en-SG')}`}
                  </a>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: '#A89B8C', textAlign: 'center', marginTop: 56 }}>Secure checkout powered by Stripe · Cards accepted globally</p>
          </div>
        </section>

        {/* ── ABOUT ─────────────────────────────────────────────── */}
        <section id="about" ref={aboutRef} className="ss-about-section" aria-label="About Stayscape">
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
          <hr className="ss-about-rule" style={{ position: 'relative', zIndex: 1 }} />
          <div className="ss-about-stats" style={{ position: 'relative', zIndex: 1 }}>
            {([
              { value: '1 team',  label: 'Building this carefully, not fast' },
              { value: '0 VCs',   label: 'Raising from people who will actually use this' },
              { value: `S$${(progress.goal_sgd / 1000).toFixed(0)}k goal`, label: `${pledgedPct}% funded · ${progress.total_backers} backers`, isFundingBar: true },
            ] as { value: string; label: string; isFundingBar?: boolean }[]).map(({ value, label, isFundingBar }) => (
              <div key={value} className="ss-about-stat">
                <p style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 'clamp(2.25rem,4.5vw,3.5rem)', fontWeight: 400, lineHeight: 1, color: '#C9A875', margin: 0 }}>{value}</p>
                <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: 'rgba(245,241,234,0.45)', marginTop: 10, lineHeight: 1.5 }}>{label}</p>
                <div className="ss-about-progress-track">
                  <div className="ss-about-progress-fill" style={{ width: isFundingBar ? `${Math.max(pledgedPct, 3)}%` : '100%' }} />
                </div>
              </div>
            ))}
          </div>
          <hr className="ss-about-rule" style={{ position: 'relative', zIndex: 1 }} />
          <div className="ss-about-grid" style={{ position: 'relative', zIndex: 1, maxWidth: 'min(1200px,92vw)', margin: '0 auto', padding: 'clamp(72px,9vw,128px) 0', display: 'grid', gridTemplateColumns: 'clamp(280px,38%,460px) 1fr', gap: 'clamp(48px,7vw,112px)', alignItems: 'start' }}>
            <div className="ss-about-sticky" style={{ position: 'sticky', top: 120 }}>
              <div className="ss-about-founder-tag">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A875', flexShrink: 0 }} />
                A note from the founder
              </div>
              <h2 style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontSize: 'clamp(2rem,3.8vw,3.2rem)', fontWeight: 400, lineHeight: 1.12, letterSpacing: '-0.02em', color: '#F5F1EA', margin: '24px 0 0' }}>
                <span className="ss-about-line"><span className="ss-about-line-inner" style={{ display: 'block' }}>Built by travellers</span></span>
                <span className="ss-about-line"><span className="ss-about-line-inner" style={{ display: 'block', fontStyle: 'italic', color: '#A89B8C' }}>who got tired of losing</span></span>
                <span className="ss-about-line"><span className="ss-about-line-inner" style={{ display: 'block' }}>the magic.</span></span>
              </h2>
              <motion.div initial={reduced ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }} transition={reduced ? undefined : { duration: 0.8, ease: EASE, delay: 0.5 }} style={{ width: 40, height: 1, background: 'rgba(201,168,117,0.5)', marginTop: 32, transformOrigin: 'left center' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <p className="ss-about-body" style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(16px,1.6vw,18px)', fontWeight: 400, lineHeight: 1.8, color: 'rgba(245,241,234,0.75)' }}>We built Stayscape because we kept losing something when we travelled. That feeling — arriving somewhere new, not knowing what was around the corner, being surprised. It gets engineered out by apps that optimise for efficiency over experience.</p>
              <p className="ss-about-body" style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(16px,1.6vw,18px)', fontWeight: 400, lineHeight: 1.8, color: 'rgba(245,241,234,0.75)' }}>Stayscape Personal is our answer to that. An AI that knows you, knows the city, and helps you move through it the way a well-travelled friend would. Not a search engine. Not a booking tool.{' '}<em style={{ fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(17px,1.7vw,19px)', color: 'rgba(245,241,234,0.88)' }}>A companion.</em></p>
              <p className="ss-about-body" style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(16px,1.6vw,18px)', fontWeight: 400, lineHeight: 1.8, color: 'rgba(245,241,234,0.75)' }}>We&apos;re a small team building carefully. We&apos;re not raising from institutions right now — we&apos;re raising from the people who will actually use this. If you&apos;ve ever felt that travel should feel like more, this is for you.</p>
              <div className="ss-about-cta-area" style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                <a href="#tiers" className="ss-gold-btn" style={{ display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 32px', borderRadius: 999, fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.03em', textDecoration: 'none', color: '#14100D' }}>Back the project</a>
                <span style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: 'rgba(245,241,234,0.35)', letterSpacing: '0.02em' }}>Reward-based · No equity</span>
              </div>
            </div>
          </div>
          <hr className="ss-about-rule" style={{ position: 'relative', zIndex: 1 }} />
        </section>

      </main>

      <LandingFooter />
    </div>
  )
}
