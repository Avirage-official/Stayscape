'use client'

import { motion, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

const STATS = [
  {
    value: '+18%',
    label: 'Guest Satisfaction',
    description: 'Average satisfaction score increase within the first quarter of AI concierge implementation.',
    source: 'Vynta, 2025',
    sourceUrl: 'https://vynta.ai/blog/guest-satisfaction-in-hotels/',
  },
  {
    value: '40%',
    label: 'Staff Efficiency',
    description: 'Drop in front desk inquiries when AI handles routine requests, freeing staff for high-value interactions.',
    source: 'Coir Consulting, 2025',
    sourceUrl: 'https://coirconsulting.com/ai-concierge-services-in-luxury-hospitality/',
  },
  {
    value: '+23%',
    label: 'Ancillary Revenue',
    description: 'Boost in ancillary revenue at properties using AI-driven personalised upselling.',
    source: 'Operto via Coir Consulting, 2025',
    sourceUrl: 'https://coirconsulting.com/ai-concierge-services-in-luxury-hospitality/',
  },
] as const

const CARDS = [
  {
    title: 'Brand differentiation',
    body: 'Hotels using StayScape earn a reputation for curation and care — not just accommodation.',
  },
  {
    title: 'Data-driven insight',
    body: 'Understand what your guests love, discover patterns, and sharpen your recommendations over time.',
  },
] as const

function revealProps(reduced: boolean | null, delay = 0) {
  if (reduced) return {}
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.7, ease: REVEAL_EASE, delay },
  }
}

function StatCard({ stat }: { stat: typeof STATS[number] }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        padding: 'clamp(24px, 4vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <p
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(2.8rem, 4vw, 4rem)',
          fontWeight: 700,
          color: 'var(--gold)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {stat.value}
      </p>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.15em',
          color: 'var(--text-primary)',
        }}
      >
        {stat.label}
      </p>

      <div style={{ height: '1px', background: 'var(--border)', width: '32px' }} />

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          flex: 1,
        }}
      >
        {stat.description}
      </p>

      <SourceLink href={stat.sourceUrl} label={stat.source} />
    </div>
  )
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px',
        color: 'var(--text-muted)',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        width: 'fit-content',
      }}
    >
      Source: {label}
    </a>
  )
}

export default function BenefitSection() {
  const reduced = useReducedMotion()

  return (
    <section
      id="for-hotels"
      style={{
        background: '#F5F2EE',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">

        <motion.div className="mb-16" {...revealProps(reduced)}>
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

        {/* Three-column stat block */}
        <motion.div
          className="mb-20 grid grid-cols-1 gap-px sm:grid-cols-3"
          style={{
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
          {...revealProps(reduced, 0.1)}
        >
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Row 1 */}
        <motion.div
          className="mb-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2"
          {...revealProps(reduced, 0.15)}
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

        {/* Row 2 */}
        <motion.div
          className="mb-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2"
          {...revealProps(reduced, 0.2)}
        >
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

        {/* Pull quote */}
        <motion.div className="mb-16" {...revealProps(reduced, 0.25)}>
          <div
            className="rounded-2xl px-10 py-10"
            style={{ background: '#FFFFFF', border: '1px solid var(--border)' }}
          >
            <div
              className="mb-7"
              style={{ width: 36, height: '1px', background: 'var(--gold)' }}
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

        {/* Two cards */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          {...revealProps(reduced, 0.3)}
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
