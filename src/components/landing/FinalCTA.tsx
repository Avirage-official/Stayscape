'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

export default function FinalCTA() {
  const reduced = useReducedMotion()

  const clipReveal = reduced
    ? {}
    : {
        initial: { clipPath: 'inset(100% 0 0 0)' },
        whileInView: { clipPath: 'inset(0 0 0 0)' },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.85, ease: EASE },
      }

  const fadeIn = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-80px' },
          transition: { duration: 0.65, delay, ease: EASE },
        }

  return (
    <section
      id="cta"
      className="flex min-h-screen items-center justify-center"
      style={{
        background: '#F5F2EE',
        borderTop: '1px solid var(--border)',
        paddingBlock: 'clamp(80px, 10vw, 120px)',
      }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">

        {/* Eyebrow */}
        <motion.p
          className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--gold)' }}
          {...fadeIn(0)}
        >
          Early Access
        </motion.p>

        {/* Gold rule */}
        <motion.div
          className="mx-auto mb-8"
          style={{ width: 36, height: '1px', background: 'var(--gold)' }}
          {...fadeIn(0.1)}
        />

        {/* Headline */}
        <div className="overflow-hidden mb-8">
          <motion.h2
            className="leading-[1.1] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.6rem, 5.5vw, 5rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
            {...clipReveal}
          >
            Your guests deserve a guide.
          </motion.h2>
        </div>

        {/* Body */}
        <motion.p
          className="mx-auto mb-10"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            maxWidth: '46ch',
          }}
          {...fadeIn(0.4)}
        >
          Stayscape is now accepting early hotel partners. Let&apos;s set up
          your property.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          {...fadeIn(0.6)}
        >
          <button
            type="button"
            style={{
              background: 'var(--gold)',
              color: '#FAF8F5',
              borderRadius: '8px',
              padding: '13px 28px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Get Early Access
          </button>

          <Link
            href="/login"
            style={{
              border: '1.5px solid var(--border-strong, #C4BBB2)',
              background: 'transparent',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '12px 28px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              display: 'inline-block',
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            Try the App
          </Link>
        </motion.div>

        {/* Demo note */}
        <motion.p
          className="mt-6 text-[13px] italic"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
          }}
          {...fadeIn(0.8)}
        >
          Use the demo credentials on the login page to explore Stayscape.
        </motion.p>

      </div>
    </section>
  )
}
