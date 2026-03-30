'use client'

import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

const HEADLINE_LINES = [
  'Your guests arrive.',
  'They open Google.',
  'And you lose them.',
]

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

function scrollToWalkthrough() {
  const el = document.getElementById('walkthrough')
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
      <div className="relative z-[2] flex min-h-screen flex-col justify-end px-6 pb-28 sm:px-12 md:px-20 lg:px-28">
        {/* Headline */}
        <div className="mb-6">
          {HEADLINE_LINES.map((line, i) => (
            <motion.h1
              key={line}
              className="font-serif font-bold leading-[1.1]"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
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
          className="mb-8 max-w-[480px]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px',
            color: '#8a8580',
            lineHeight: 1.6,
          }}
          {...fadeIn(1.2)}
        >
          Stayscape gives every guest a personal concierge — in their pocket,
          from the moment they check in.
        </motion.p>

        {/* CTA */}
        <motion.div {...fadeIn(1.5)}>
          <button
            type="button"
            onClick={scrollToWalkthrough}
            className="cursor-pointer text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-white/10"
            style={{
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent',
              color: '#e8e4dc',
              borderRadius: '4px',
              padding: '12px 28px',
            }}
          >
            See How It Works
          </button>
        </motion.div>
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
