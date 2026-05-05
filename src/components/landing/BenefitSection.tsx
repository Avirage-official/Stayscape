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

function revealProps(reduced: boolean | null, delay = 0) {
  if (reduced) return {}
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.7, ease: REVEAL_EASE, delay },
  }
}

function SourceLink({ href, label }: { href: string; label: string }) {
  const linkStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '11px' as const,
    color: 'var(--text-muted)',
    textDecoration: 'underline' as const,
    textUnderlineOffset: '3px',
    width: 'fit-content' as const,
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
      Source: {label}
    </a>
  )
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

        <motion.div
          className="grid grid-cols-1 gap-px sm:grid-cols-3"
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

      </div>
    </section>
  )
}
