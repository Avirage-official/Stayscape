'use client'

import { motion, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

function revealVariants(reduced: boolean | null) {
  if (reduced) return {}
  return {
    initial: { opacity: 0, y: 24 } as const,
    whileInView: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.75, ease: REVEAL_EASE },
    viewport: { once: true, margin: '-80px' },
  }
}

const CARDS = [
  {
    title: 'Brand differentiation',
    body: 'Hotels using Stayscape earn a reputation for curation and care — not just accommodation.',
  },
  {
    title: 'Data-driven insight',
    body: 'Understand what your guests love, discover patterns, and sharpen your recommendations over time.',
  },
] as const

export default function BenefitSection() {
  const reduced = useReducedMotion()
  const reveal = revealVariants(reduced)

  return (
    <section
      id="benefits"
      style={{
        background: '#F5F2EE',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">

        {/* Section label + title */}
        <motion.div className="mb-16" {...reveal}>
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--gold)' }}
          >
            For Hotels
          </p>
          <h2
            className="max-w-lg leading-[1.2] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            What a better guest experience actually delivers.
          </h2>
        </motion.div>

        {/* Row 1 — two-column: headline+body left, stat right */}
        <motion.div
          className="mb-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2"
          {...reveal}
        >
          <div>
            <h3
              className="mb-4 leading-[1.25] tracking-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Increased ancillary revenue
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                maxWidth: '44ch',
              }}
            >
              Guests who explore more spend more — on local experiences, on-property
              services, and return with higher satisfaction scores that drive repeat
              bookings.
            </p>
          </div>

          {/* Stat callout */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 12px rgba(28,26,23,0.05)',
            }}
          >
            <p
              className="leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(3.5rem, 6vw, 5rem)',
                color: 'var(--gold)',
                letterSpacing: '-0.03em',
              }}
            >
              75%
            </p>
            <p
              className="mt-3"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '28ch',
              }}
            >
              of travellers say personalised experiences improve how they feel about
              a hotel.
            </p>
          </div>
        </motion.div>

        {/* Row 2 — stat left, benefit right */}
        <motion.div
          className="mb-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2"
          {...reveal}
        >
          {/* Stat callout */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 12px rgba(28,26,23,0.05)',
            }}
          >
            <p
              className="leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(3.5rem, 6vw, 5rem)',
                color: 'var(--gold)',
                letterSpacing: '-0.03em',
              }}
            >
              60%
            </p>
            <p
              className="mt-3"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '28ch',
              }}
            >
              reduction in repetitive concierge queries when guests have access to a
              good AI layer.
            </p>
          </div>

          <div>
            <h3
              className="mb-4 leading-[1.25] tracking-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Reduced concierge load
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                maxWidth: '44ch',
              }}
            >
              Staff answer fewer "what should I do?" questions and spend more time on
              the high-value, human interactions that actually build loyalty.
            </p>
          </div>
        </motion.div>

        {/* Row 3 — Pull quote */}
        <motion.div className="mb-16" {...reveal}>
          <div
            className="rounded-2xl px-10 py-10"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
            }}
          >
            {/* Gold rule above */}
            <div
              className="mb-7"
              style={{
                width: 36,
                height: '1px',
                background: 'var(--gold)',
              }}
            />
            <blockquote>
              <p
                className="leading-[1.6]"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1.3rem, 2vw, 1.7rem)',
                  fontStyle: 'italic',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  maxWidth: '52ch',
                }}
              >
                Hotels that curate don&rsquo;t just accommodate — they become part
                of the story.
              </p>
            </blockquote>
          </div>
        </motion.div>

        {/* Row 4 — Two cards */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          {...reveal}
        >
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl p-8"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 6px rgba(28,26,23,0.04)',
              }}
            >
              <h4
                className="mb-3 leading-[1.3]"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.15rem',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {card.title}
              </h4>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
