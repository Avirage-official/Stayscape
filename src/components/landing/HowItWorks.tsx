'use client'

import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const STAGES = [
  {
    number: '01',
    headline: 'The hotel joins',
    body: 'StayScape is configured around your property, brand, and local area. Your PMS connects automatically — no manual data entry.',
  },
  {
    number: '02',
    headline: 'The guest books',
    body: 'Your guest books through their usual channel. Their confirmation email includes a link to activate their StayScape experience.',
  },
  {
    number: '03',
    headline: 'The stay unlocks',
    body: 'The guest enters their booking reference. Their room, dates, and property are already waiting — no forms, no friction.',
  },
  {
    number: '04',
    headline: 'The experience begins',
    body: 'Aria is ready from day one. Requests land instantly, local recommendations surface, and every interaction feels considered.',
  },
  {
    number: '05',
    headline: 'A stay worth remembering',
    body: 'The guest departs having felt genuinely looked after. The hotel leaves with cleaner data and a concierge that handled the routine.',
  },
] as const

export default function HowItWorks() {
  const reduced = useReducedMotion()

  return (
    <section
      id="how-it-works"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
        overflow: 'hidden',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">

        {/* Section header */}
        <motion.div
          className="mb-16 md:mb-20"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--gold)' }}
          >
            How it works
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              maxWidth: '28ch',
            }}
          >
            From first booking to final impression.
          </h2>
        </motion.div>

        {/* ── Desktop: horizontal timeline ── */}
        <div className="hidden md:block">

          {/* The rule */}
          <motion.div
            style={{
              height: '1px',
              background: 'var(--gold)',
              opacity: 0.3,
              transformOrigin: 'left center',
            }}
            initial={reduced ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1.2, ease: EASE }}
          />

          {/* Stages */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0',
            }}
          >
            {STAGES.map((stage, i) => (
              <motion.div
                key={stage.number}
                style={{
                  paddingTop: '36px',
                  paddingRight: i < STAGES.length - 1 ? '32px' : '0',
                }}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.65, ease: EASE, delay: i * 0.1 }}
              >
                {/* Large numeral */}
                <p
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3.5rem, 5vw, 5.5rem)',
                    fontWeight: 700,
                    color: 'var(--gold)',
                    opacity: 0.18,
                    lineHeight: 1,
                    marginBottom: '16px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {stage.number}
                </p>

                {/* Headline */}
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    marginBottom: '12px',
                  }}
                >
                  {stage.headline}
                </h3>

                {/* Body */}
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.75,
                  }}
                >
                  {stage.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Mobile: vertical timeline ── */}
        <div className="md:hidden">
          <div
            style={{
              position: 'relative',
              paddingLeft: '28px',
              borderLeft: '1px solid rgba(193,127,58,0.25)',
            }}
          >
            {STAGES.map((stage, i) => (
              <motion.div
                key={stage.number}
                style={{
                  marginBottom: i < STAGES.length - 1 ? '48px' : '0',
                }}
                initial={reduced ? false : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: EASE, delay: i * 0.08 }}
              >
                {/* Large numeral */}
                <p
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '4rem',
                    fontWeight: 700,
                    color: 'var(--gold)',
                    opacity: 0.18,
                    lineHeight: 1,
                    marginBottom: '12px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {stage.number}
                </p>

                {/* Headline */}
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.15rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    marginBottom: '10px',
                  }}
                >
                  {stage.headline}
                </h3>

                {/* Body */}
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.75,
                  }}
                >
                  {stage.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
