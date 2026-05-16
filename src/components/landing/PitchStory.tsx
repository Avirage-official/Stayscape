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
      id="our-belief"
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

        {/* Headline */}
        <div className="mb-10 overflow-hidden space-y-1">
          <motion.h2
            className="block leading-[1.15] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
              color: '#1C1A17',
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
              color: '#1C1A17',
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
            color: '#6B6158',
            maxWidth: '62ch',
          }}
          {...fadeUp(0.55)}
        >
          Great hospitality has always been about people — the way a stay feels, not just how it runs. 
          But as expectations grow and teams get busier, it becomes harder to keep that same level of care 
          consistent in every moment. The opportunity isn&apos;t to change what hospitality is,
          but to support it — making it easier for teams to deliver thoughtful, 
          seamless experiences while building a stronger connection with every guest.
        </motion.p>

        {/* Body — paragraph 2 */}
        <motion.p
          className="mx-auto leading-[1.85]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: '#6B6158',
            maxWidth: '62ch',
          }}
          {...fadeUp(0.7)}
        >
         StayScape gives hotels an AI concierge that knows the property, learns what each guest actually needs, 
         and handles the routine quietly — so staff spend less time fielding the same questions and more time 
         creating the moments that matter. For guests, it means answers when they need them, 
         requests that actually land, and a stay that feels considered from the moment they arrive.
        </motion.p>

      </div>
    </section>
  )
}
