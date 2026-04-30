'use client'

import { motion, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

const STEPS = [
  {
    number: '01',
    headline: 'We understand your property',
    body: 'We learn your brand, guest profile, stay journey, and operational model — so the experience reflects how your hotel actually works.',
  },
  {
    number: '02',
    headline: 'We shape the discovery experience',
    body: 'We curate places, activities, and local insights that fit your location, audience, and the level of hospitality you stand for.',
  },
  {
    number: '03',
    headline: 'We adapt the product to your needs',
    body: 'We configure Stayscape around your workflows, guest touchpoints, and the details that matter most to your team.',
  },
  {
    number: '04',
    headline: 'We refine it through real usage',
    body: 'We improve the experience over time using guest behavior, engagement patterns, and operational feedback.',
  },
] as const

const NODE_DELAYS    = [0.2,  0.5,  0.8,  1.1 ] as const
const CONTENT_DELAYS = [0.35, 0.65, 0.95, 1.25] as const

export default function HowItWorks() {
  const reduced = useReducedMotion()

  const motionProps = (extra?: object) =>
    reduced ? {} : extra

  return (
    <section
      id="how-it-works"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">

        {/* Section label + title */}
        <motion.div
          className="mb-16"
          {...motionProps({
            initial: { opacity: 0, y: 12 },
            whileInView: { opacity: 1, y: 0 },
            transition: { duration: 0.7, ease: REVEAL_EASE },
            viewport: { once: true, margin: '-80px' },
          })}
        >
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--gold)' }}
          >
            Onboarding
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
            Tailored to your property.
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative ml-[5px] pl-10 md:ml-2 md:pl-14">

          {/* Vertical connector line */}
          <motion.div
            className="absolute left-0 top-0 h-full w-px origin-top md:left-[7px]"
            style={{ background: 'var(--gold)', opacity: 0.25 }}
            {...motionProps({
              initial: { scaleY: 0 },
              whileInView: { scaleY: 1 },
              transition: { duration: 1.5, ease: REVEAL_EASE },
              viewport: { once: true, margin: '-80px' },
            })}
          />

          {/* Steps */}
          <div className="space-y-16">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">

                {/* Node circle — bg matches section so it masks the line */}
                <motion.div
                  className="absolute -left-10 top-1 md:-left-14"
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: '50%',
                    border: '1.5px solid var(--gold)',
                    background: 'var(--background)',
                    transform: 'translateX(-1px)',
                  }}
                  {...motionProps({
                    initial: { scale: 0 },
                    whileInView: { scale: 1 },
                    transition: {
                      duration: 0.4,
                      ease: REVEAL_EASE,
                      delay: NODE_DELAYS[i],
                    },
                    viewport: { once: true, margin: '-80px' },
                  })}
                />

                {/* Content */}
                <motion.div
                  {...motionProps({
                    initial: { opacity: 0, y: 8 },
                    whileInView: { opacity: 1, y: 0 },
                    transition: {
                      duration: 0.6,
                      ease: REVEAL_EASE,
                      delay: CONTENT_DELAYS[i],
                    },
                    viewport: { once: true, margin: '-80px' },
                  })}
                >
                  <span
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: 'var(--gold)' }}
                  >
                    {step.number}
                  </span>
                  <h3
                    className="mb-3 leading-[1.3] tracking-tight"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {step.headline}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '15px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.75,
                      maxWidth: '44ch',
                    }}
                  >
                    {step.body}
                  </p>
                </motion.div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
