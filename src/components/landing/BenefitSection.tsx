'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

function revealVariants(prefersReducedMotion: boolean | null) {
  return prefersReducedMotion
    ? {}
    : {
        initial: { clipPath: 'inset(100% 0 0 0)' } as const,
        whileInView: { clipPath: 'inset(0 0 0 0)' } as const,
        transition: { duration: 0.7, ease: REVEAL_EASE },
        viewport: { once: true },
      }
}

export default function BenefitSection() {
  const prefersReducedMotion = useReducedMotion()

  const { ref: statRef, formattedValue: statDisplay } = useCountUp({
    end: 60,
    suffix: '%',
  })

  const reveal = revealVariants(prefersReducedMotion)

  return (
    <section
      id="benefits"
      className="w-full"
      style={{
        backgroundColor: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-12 md:px-20 lg:px-28">
        {/* Section label + title */}
        <motion.div className="mb-16" {...reveal}>
          <p
            className="mb-3 text-xs uppercase"
            style={{
              letterSpacing: '0.08em',
              color: '#c9a96e',
            }}
          >
            For Hotels
          </p>
          <h2
            className="text-3xl font-bold md:text-4xl"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#e8e4dc',
            }}
          >
            What Hotels Gain
          </h2>
        </motion.div>

        {/* Row 1 — Two-column: headline+body left, image right */}
        <motion.div
          className="mb-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2"
          {...reveal}
        >
          <div>
            <h3
              className="mb-3 text-xl font-bold md:text-2xl"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#e8e4dc',
              }}
            >
              Increased ancillary revenue
            </h3>
            <p
              className="max-w-md text-base"
              style={{ color: '#8a8580', lineHeight: 1.7 }}
            >
              Guests who use Stayscape spend more on local experiences and
              return with higher satisfaction scores.
            </p>
          </div>

          <motion.div
            className="overflow-hidden"
            style={{ borderRadius: '6px' }}
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.98 },
                  whileInView: { opacity: 1, scale: 1 },
                  transition: { duration: 0.9, ease: REVEAL_EASE },
                  viewport: { once: true },
                })}
          >
            <Image
              src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80"
              alt="Hotel guest enjoying a curated local experience"
              width={800}
              height={533}
              className="block h-auto w-full"
              style={{
                borderRadius: '6px',
                boxShadow: '0 8px 32px rgba(140,110,60,0.15)',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Row 2 — Stat left, benefit text right */}
        <motion.div
          className="mb-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2"
          {...reveal}
        >
          <div className="flex flex-col">
            <span
              ref={statRef as React.RefObject<HTMLSpanElement>}
              className="text-6xl font-bold md:text-7xl"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#c9a96e',
                lineHeight: 1,
              }}
            >
              {statDisplay}
            </span>
            <span
              className="mt-2 text-sm"
              style={{ color: '#8a8580' }}
            >
              reduction in repetitive concierge queries
            </span>
          </div>

          <div>
            <h3
              className="mb-3 text-xl font-bold md:text-2xl"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#e8e4dc',
              }}
            >
              Reduced concierge load
            </h3>
            <p
              className="max-w-md text-base"
              style={{ color: '#8a8580', lineHeight: 1.7 }}
            >
              Staff answer fewer &ldquo;what should I do?&rdquo; questions and
              focus on high-value guest interactions instead.
            </p>
          </div>
        </motion.div>

        {/* Row 3 — Pull quote */}
        <motion.blockquote
          className="mb-20"
          style={{
            borderLeft: '3px solid #c9a96e',
            paddingLeft: '24px',
          }}
          {...reveal}
        >
          <p
            className="text-2xl md:text-3xl"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              color: '#e8e4dc',
              lineHeight: 1.5,
            }}
          >
            Hotels that curate don&rsquo;t just accommodate — they become part
            of the story.
          </p>
        </motion.blockquote>

        {/* Row 4 — Two asymmetric cards */}
        <motion.div
          className="grid grid-cols-1 items-start gap-6 md:grid-cols-2"
          {...reveal}
        >
          {/* Card 1 — taller */}
          <div
            className="rounded-md p-8"
            style={{
              backgroundColor: '#171613',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '220px',
            }}
          >
            <h4
              className="mb-3 text-lg font-semibold"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#e8e4dc',
              }}
            >
              Brand differentiation
            </h4>
            <p
              className="text-base"
              style={{ color: '#8a8580', lineHeight: 1.7 }}
            >
              Hotels using Stayscape earn a reputation for curation, not just
              accommodation.
            </p>
          </div>

          {/* Card 2 — shorter */}
          <div
            className="rounded-md p-8"
            style={{
              backgroundColor: '#1c1b18',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '180px',
            }}
          >
            <h4
              className="mb-3 text-lg font-semibold"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#e8e4dc',
              }}
            >
              Data-driven insights
            </h4>
            <p
              className="text-base"
              style={{ color: '#8a8580', lineHeight: 1.7 }}
            >
              Understand what your guests love, discover patterns, optimize your
              property&rsquo;s recommendations.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
