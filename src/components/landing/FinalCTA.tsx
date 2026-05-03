'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const
const DEMO_EMAIL = 'hello@stayscape.app'

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
      id="final-cta"
      className="flex min-h-screen items-center justify-center"
      style={{
        background: '#F5F2EE',
        borderTop: '1px solid var(--border)',
        paddingBlock: 'clamp(80px, 10vw, 120px)',
      }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">

        <motion.p
          className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--gold)' }}
          {...fadeIn(0)}
        >
          Early Access
        </motion.p>

        <motion.div
          className="mx-auto mb-8"
          style={{ width: 36, height: '1px', background: 'var(--gold)' }}
          {...fadeIn(0.1)}
        />

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
          StayScape is now accepting early hotel partners. Let&apos;s set up
          your property.
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          {...fadeIn(0.6)}
        >
          <motion.a
            href={`mailto:${DEMO_EMAIL}?subject=StayScape%20Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20request%20a%20demo%20for%20my%20property.`}
            style={{
              background: 'var(--gold)',
              color: '#FAF8F5',
              borderRadius: '8px',
              padding: '13px 28px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              display: 'inline-block',
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            Request a Demo
          </motion.a>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
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
        </motion.div>

        <motion.p
          className="mt-6 text-[13px] italic"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
          }}
          {...fadeIn(0.8)}
        >
          Use the demo credentials on the login page to explore StayScape.
        </motion.p>

      </div>
    </section>
  )
}
