'use client'

import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

const HEADLINE_LINES = [
  "Today's guests expect",
  'more than a room.',
]

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

const STORY_CARDS = [
  {
    label: '01 — THE SHIFT',
    headline: 'Expectations',
    body: 'Guests want seamless, personal guidance.',
  },
  {
    label: '02 — THE OPPORTUNITY',
    headline: 'Guidance',
    body: 'Better recommendations create stronger stays.',
  },
  {
    label: '03 — WHAT WE DO',
    headline: 'Concierge',
    body: 'A branded digital layer across the journey.',
  },
] as const

function scrollToStory() {
  const el =
    document.getElementById('pitch-story') ??
    document.getElementById('walkthrough')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Parallax: translate background image up to 20% of viewport
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const topCardY = useTransform(scrollYProgress, [0, 1], ['0%', '-28%'])
  const middleCardY = useTransform(scrollYProgress, [0, 1], ['18px', '-6%'])
  const bottomCardY = useTransform(scrollYProgress, [0, 1], ['36px', '16px'])

  const lineVariants = {
    hidden: {
      clipPath: 'inset(100% 0 0 0)',
    },
    visible: (i: number) => ({
      clipPath: 'inset(0 0 0 0)',
      transition: {
        duration: 0.8,
        ease: REVEAL_EASE,
        delay: i * 0.2,
      },
    }),
  }

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: REVEAL_EASE, delay },
        }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Background image with parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: prefersReducedMotion ? 0 : bgY }}
      >
        <div
          className="absolute inset-0 h-[120%] w-full bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80)',
          }}
        />
      </motion.div>

      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,14,13,0.7), rgba(15,14,13,0.95))',
        }}
      />

      {/* Content — lower-left positioning */}
      <div className="relative z-[2] flex min-h-screen items-end px-6 pb-28 sm:px-12 md:px-20 lg:px-28">
        <div className="grid w-full items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {/* Headline */}
            <div className="mb-6">
              {HEADLINE_LINES.map((line, i) => (
                <motion.h1
                  key={line}
                  className="font-serif font-bold leading-[1.1]"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3rem, 5.5vw, 5rem)',
                    letterSpacing: '-0.02em',
                    color: '#e8e4dc',
                  }}
                  custom={i}
                  variants={lineVariants}
                  initial={prefersReducedMotion ? 'visible' : 'hidden'}
                  animate="visible"
                >
                  {line}
                </motion.h1>
              ))}
            </div>

            {/* Sub-line */}
            <motion.p
              className="mb-8 max-w-[620px]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '18px',
                color: '#8a8580',
                lineHeight: 1.6,
              }}
              {...fadeIn(1.2)}
            >
              Stayscape gives every hotel a branded concierge layer —
              seamless, personal, and built around the guest journey.
            </motion.p>

            {/* CTA */}
            <motion.div
              className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
              {...fadeIn(1.5)}
            >
              <button
                type="button"
                onClick={scrollToStory}
                className="min-h-11 cursor-pointer text-sm font-semibold tracking-wide transition-opacity duration-200 hover:opacity-90"
                style={{
                  backgroundColor: '#c9a96e',
                  color: '#0f0e0d',
                  borderRadius: '4px',
                  padding: '14px 32px',
                }}
              >
                Explore the Stayscape Story
              </button>
              <a
                href="/stayscape-pitch.pdf"
                download
                className="inline-flex min-h-11 items-center text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-white/5"
                style={{
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#e8e4dc',
                  background: 'transparent',
                  borderRadius: '4px',
                  padding: '14px 32px',
                }}
              >
                Download the Pitch Deck
              </a>
            </motion.div>
          </div>

          <motion.div
            className="relative hidden h-[340px] w-full lg:col-span-5 lg:block"
            {...fadeIn(1.1)}
          >
            {STORY_CARDS.map((card, index) => {
              const rotate = index === 0 ? -1 : index === 1 ? 0 : 1
              const cardY =
                index === 0
                  ? prefersReducedMotion
                    ? '0%'
                    : topCardY
                  : index === 1
                    ? prefersReducedMotion
                      ? '18px'
                      : middleCardY
                    : prefersReducedMotion
                      ? '36px'
                      : bottomCardY

              return (
                <motion.div
                  key={card.label}
                  className="absolute right-0 w-[92%] max-w-[420px] p-7"
                  style={{
                    y: cardY,
                    rotate: `${rotate}deg`,
                    background: '#1a1916',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span
                    className="block text-[11px] uppercase"
                    style={{
                      color: '#c9a96e',
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: '0.2em',
                      opacity: 0.9,
                    }}
                  >
                    {card.label}
                  </span>
                  <h3
                    className="mt-4 text-2xl font-semibold"
                    style={{
                      color: '#e8e4dc',
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {card.headline}
                  </h3>
                  <p
                    className="mt-2 text-sm"
                    style={{
                      color: '#8a8580',
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.6,
                    }}
                  >
                    {card.body}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator — bottom center */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-[2] -translate-x-1/2"
        animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ color: '#8a8580', opacity: 0.5 }}
      >
        <svg
          width="20"
          height="28"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="1"
            y="1"
            width="18"
            height="26"
            rx="9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <motion.circle
            cx="10"
            cy="9"
            r="2.5"
            fill="currentColor"
            animate={prefersReducedMotion ? {} : { cy: [9, 17, 9] }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        </svg>
      </motion.div>
    </section>
  )
}
