'use client'

import { motion, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

function primaryReveal(prefersReducedMotion: boolean | null) {
  return prefersReducedMotion
    ? {}
    : {
        initial: { clipPath: 'inset(100% 0 0 0)' },
        whileInView: { clipPath: 'inset(0 0 0 0)' },
        transition: { duration: 0.8, ease: REVEAL_EASE },
        viewport: { once: true },
      }
}

function cardFade(prefersReducedMotion: boolean | null, delay: number) {
  return prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        transition: { duration: 0.6, ease: REVEAL_EASE, delay },
        viewport: { once: true },
      }
}

function decorativeQuoteFade(prefersReducedMotion: boolean | null) {
  return prefersReducedMotion
    ? { style: { opacity: 0.06 } }
    : {
        initial: { opacity: 0 },
        whileInView: { opacity: 0.06 },
        transition: { duration: 1.5, ease: [0, 0, 0.58, 1] as const },
        viewport: { once: true },
      }
}

export default function Testimonials() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="w-full py-24 md:py-32"
      style={{
        backgroundColor: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        {/* Section label */}
        <p
          className="mb-16 text-xs uppercase"
          style={{ letterSpacing: '0.08em', color: '#c9a96e' }}
        >
          Perspectives
        </p>

        {/* Primary quote */}
        <div className="relative mb-16 md:mb-20">
          {/* Decorative quotation mark */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -top-16 -left-4 select-none text-[12rem] leading-none"
            style={{ color: '#c9a96e' }}
            {...decorativeQuoteFade(prefersReducedMotion)}
          >
            &ldquo;
          </motion.span>

          <motion.blockquote
            className="relative text-2xl md:text-3xl"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              color: '#e8e4dc',
              lineHeight: 1.4,
            }}
            {...primaryReveal(prefersReducedMotion)}
          >
            &ldquo;Great hospitality doesn&rsquo;t end at the lobby.
            The best hotels guide their guests through the entire stay —
            not just the check-in.&rdquo;
          </motion.blockquote>

          <motion.p
            className="mt-6 text-sm"
            style={{ color: '#8a8580' }}
            {...cardFade(prefersReducedMotion, 0.3)}
          >
            — A principle behind every Stayscape partnership
          </motion.p>
        </div>

        {/* Two smaller quote cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            className="p-6"
            style={{
              backgroundColor: '#171613',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px',
            }}
            {...cardFade(prefersReducedMotion, 0)}
          >
            <p className="text-lg" style={{ color: '#e8e4dc' }}>
              &ldquo;Guests don&rsquo;t need more options — they need better
              guidance. When a hotel curates the journey, confidence goes up,
              planning friction goes down, and on-property spend follows.&rdquo;
            </p>
            <p className="mt-4 text-sm" style={{ color: '#8a8580' }}>
              — On personalization and guest spend
            </p>
          </motion.div>

          <motion.div
            className="p-6"
            style={{
              backgroundColor: '#171613',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px',
            }}
            {...cardFade(prefersReducedMotion, 0.12)}
          >
            <p className="text-lg" style={{ color: '#e8e4dc' }}>
              &ldquo;Every hotel sits in a destination worth exploring.
              The ones that own that narrative — instead of losing it to
              search engines and travel apps — build deeper guest
              loyalty.&rdquo;
            </p>
            <p className="mt-4 text-sm" style={{ color: '#8a8580' }}>
              — On owning the guest journey
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
