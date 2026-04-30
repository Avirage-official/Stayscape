'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

export default function PitchStory() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const reduced = useReducedMotion()

  const lineReveal = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { clipPath: 'inset(100% 0 0 0)' },
          animate: inView ? { clipPath: 'inset(0 0 0 0)' } : {},
          transition: { duration: 0.9, ease: REVEAL_EASE, delay },
        }

  const fadeUp = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: inView ? { opacity: 1, y: 0 } : {},
          transition: { duration: 0.75, ease: REVEAL_EASE, delay },
        }

  return (
    <section
      id="story"
      ref={ref}
      style={{
        background: '#F5F2EE',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
      }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">

        {/* Eyebrow */}
        <motion.p
          className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--gold)' }}
          {...fadeUp(0)}
        >
          Our belief
        </motion.p>

        {/* Headline — two lines, clip-path reveal */}
        <div className="mb-10 overflow-hidden space-y-1">
          <motion.h2
            className="block leading-[1.15] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
            {...lineReveal(0.1)}
          >
            Hospitality is personal.
          </motion.h2>
          <motion.h2
            className="block leading-[1.15] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}
            {...lineReveal(0.28)}
          >
            Technology should be too.
          </motion.h2>
        </div>

        {/* Gold rule */}
        <motion.div
          className="mx-auto mb-10"
          style={{
            height: '1px',
            background: 'var(--gold)',
            width: '40px',
          }}
          {...fadeUp(0.45)}
        />

        {/* Body — paragraph 1 */}
        <motion.p
          className="mx-auto mb-7 leading-[1.85]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: 'var(--text-secondary)',
            maxWidth: '62ch',
          }}
          {...fadeUp(0.55)}
        >
          The best stays aren't remembered for the thread count or the view —
          they're remembered because someone made you feel looked after.
          A recommendation that felt right. A request that just happened.
          A moment that felt effortless.
        </motion.p>

        {/* Body — paragraph 2 */}
        <motion.p
          className="mx-auto leading-[1.85]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: 'var(--text-secondary)',
            maxWidth: '62ch',
          }}
          {...fadeUp(0.7)}
        >
          Being closer to your stay means being closer to what the trip is
          actually for — a quiet dinner for two, a day out with the kids,
          something new with friends. Stayscape brings it together: an AI
          that knows your hotel, your context, and what you need — backed
          by a concierge layer that makes sure nothing falls through the
          cracks. So every part of the trip is looked after, not left to chance.
        </motion.p>

      </div>
    </section>
  )
}
