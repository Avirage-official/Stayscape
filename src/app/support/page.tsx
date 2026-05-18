'use client'

import { motion, useReducedMotion } from 'framer-motion'
import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'

const EASE = [0.16, 1, 0.3, 1] as const

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

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, ease: EASE, delay },
        }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <LandingNav />

      <main>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            minHeight: '90vh',
            background: 'var(--background)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* Background — masked at bottom so it bleeds into page bg */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
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
            {/* Cinematic still fallback — swap src for your own asset */}
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
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,6,4,0.52)' }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 35%, rgba(4,3,2,0.6) 100%)',
              }}
            />
          </div>

          {/* Gold shimmer rule — top */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: '0 0 auto 0', zIndex: 5, height: 2, overflow: 'hidden' }}
          >
            <motion.div
              style={{
                width: '200%',
                height: '100%',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(201,168,117,0.3) 20%, rgba(214,162,82,1) 50%, rgba(201,168,117,0.3) 80%, transparent 100%)',
              }}
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 0.8 }}
            />
          </div>

          {/* Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 6,
              width: '100%',
              maxWidth: 1280,
              margin: '0 auto',
              padding:
                'clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px) clamp(60px, 8vw, 100px)',
            }}
          >
            {/* Label */}
            <motion.p
              {...fade(0.15)}
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                color: 'rgba(214,162,82,0.9)',
                marginBottom: 28,
              }}
            >
              Stayscape Founders Collective · Limited Release
            </motion.p>

            {/* Heading */}
            <motion.h1 {...fade(0.3)} style={{ margin: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                  fontSize: 'clamp(2.8rem, 6vw, 5.8rem)',
                  fontWeight: 600,
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  textShadow: '0 2px 40px rgba(0,0,0,0.5)',
                }}
              >
                Travel was supposed to feel like discovery.
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-cormorant), var(--font-playfair), Georgia, serif',
                  fontSize: 'clamp(2.8rem, 6vw, 5.8rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-secondary)',
                  textShadow: '0 2px 40px rgba(0,0,0,0.5)',
                  marginTop: '0.12em',
                }}
              >
                Somewhere along the way, it became logistics.
              </span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              {...fade(0.5)}
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 'clamp(16px, 2vw, 22px)',
                fontWeight: 400,
                lineHeight: 1.7,
                color: 'rgba(245,230,204,0.7)',
                maxWidth: 560,
                marginTop: 28,
                marginBottom: 40,
              }}
            >
              We&apos;re inviting a small group of early travellers to back Stayscape Personal —
              the AI travel companion built for people who want their next trip to feel human again.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fade(0.65)}
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 44 }}
            >
              <a
                href="#tiers"
                className="ss-gold-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 50,
                  padding: '0 36px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  letterSpacing: '0.03em',
                  textDecoration: 'none',
                  color: 'var(--background)',
                }}
              >
                Become a Founder
              </a>
              <a
                href="#story"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 50,
                  padding: '0 32px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  letterSpacing: '0.02em',
                  textDecoration: 'none',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold)',
                  background: 'transparent',
                  transition: 'background 200ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,117,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                Read the Story
              </a>
            </motion.div>

            {/* Progress bar */}
            <motion.div {...fade(0.8)} data-pledged="0" style={{ maxWidth: 440 }}>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 12,
                  color: 'rgba(245,230,204,0.45)',
                  marginBottom: 10,
                  letterSpacing: '0.02em',
                }}
              >
                S$ 0 raised of S$ 15,000 goal · 0 founders so far
              </p>
              <div
                style={{
                  height: 8,
                  background: 'rgba(245,230,204,0.08)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: '0%',
                    background: 'var(--gold)',
                    borderRadius: 999,
                    transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </motion.div>
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
