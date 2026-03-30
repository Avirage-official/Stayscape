'use client'

import { motion, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

const STEPS = [
  {
    number: '01',
    headline: 'We set up your property profile',
    body: 'Your check-in dates, hotel name, timezone, and branding — configured in minutes.',
  },
  {
    number: '02',
    headline: 'We curate your discovery content',
    body: 'We load your city\u2019s best places, activities, and local insights into a beautiful feed.',
  },
  {
    number: '03',
    headline: 'Guests get access at check-in',
    body: 'Via QR code, link in booking confirmation, or room card — no app download required.',
  },
  {
    number: '04',
    headline: 'You watch your guest satisfaction rise',
    body: 'With zero ongoing management required. We handle the content, you enjoy the results.',
  },
] as const

const NODE_DELAYS = [0.2, 0.5, 0.8, 1.1]
const CONTENT_DELAYS = [0.35, 0.65, 0.95, 1.25]

export default function HowItWorks() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      id="how-it-works"
      className="w-full"
      style={{
        backgroundColor: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-12 md:px-20 md:py-32 lg:px-28">
        {/* Section label + title */}
        <motion.div
          className="mb-16"
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 12 },
                whileInView: { opacity: 1, y: 0 },
                transition: { duration: 0.7, ease: REVEAL_EASE },
                viewport: { once: true },
              })}
        >
          <p
            className="mb-3 text-xs uppercase"
            style={{ letterSpacing: '0.08em', color: '#c9a96e' }}
          >
            Onboarding
          </p>
          <h2
            className="text-3xl font-bold md:text-4xl"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#e8e4dc',
            }}
          >
            Setup in a Day
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative ml-[5px] pl-10 md:ml-2 md:pl-14">
          {/* Vertical connector line */}
          <motion.div
            className="absolute left-0 top-0 h-full w-[2px] origin-top md:left-[7px]"
            style={{ backgroundColor: 'rgba(201, 169, 110, 0.3)' }}
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { scaleY: 0 },
                  whileInView: { scaleY: 1 },
                  transition: { duration: 1.5, ease: REVEAL_EASE },
                  viewport: { once: true },
                })}
          />

          {/* Steps */}
          <div className="space-y-16">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {/* Node circle */}
                <motion.div
                  className="absolute -left-10 top-1 md:-left-14"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid #c9a96e',
                    backgroundColor: '#0f0e0d',
                    /* Center the node on the line */
                    transform: 'translateX(-1px)',
                  }}
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { scale: 0 },
                        whileInView: { scale: 1 },
                        transition: {
                          duration: 0.4,
                          ease: REVEAL_EASE,
                          delay: NODE_DELAYS[i],
                        },
                        viewport: { once: true },
                      })}
                />

                {/* Content */}
                <motion.div
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 8 },
                        whileInView: { opacity: 1, y: 0 },
                        transition: {
                          duration: 0.6,
                          ease: REVEAL_EASE,
                          delay: CONTENT_DELAYS[i],
                        },
                        viewport: { once: true },
                      })}
                >
                  <span
                    className="mb-2 block text-xs font-semibold"
                    style={{ color: '#c9a96e' }}
                  >
                    {step.number}
                  </span>
                  <h3
                    className="mb-2 text-lg font-semibold md:text-xl"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      color: '#e8e4dc',
                    }}
                  >
                    {step.headline}
                  </h3>
                  <p
                    className="max-w-[360px] text-sm md:text-base"
                    style={{ color: '#8a8580', lineHeight: 1.6 }}
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
