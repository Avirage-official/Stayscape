'use client'

import { motion, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

export default function AppPreview() {
  const prefersReducedMotion = useReducedMotion()

  const fade = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.7, ease: REVEAL_EASE, delay },
        }

  const phoneFade = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.95 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true },
        transition: { duration: 0.9, ease: REVEAL_EASE },
      }

  return (
    <section
      className="relative w-full py-24 md:py-32"
      style={{
        backgroundColor: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Section label */}
      <motion.p
        className="mb-6 text-center text-xs uppercase"
        style={{ letterSpacing: '0.08em', color: '#c9a96e' }}
        {...fade(0)}
      >
        Experience
      </motion.p>

      {/* Headline */}
      <motion.h2
        className="text-center text-3xl font-bold md:text-4xl"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          color: '#e8e4dc',
        }}
        {...fade(0.1)}
      >
        See what your guests see.
      </motion.h2>

      {/* Sub-line */}
      <motion.p
        className="mx-auto mt-4 max-w-[500px] text-center text-base md:text-lg"
        style={{ color: '#8a8580' }}
        {...fade(0.2)}
      >
        Stayscape loaded with sample content for a Tokyo hotel stay. Explore it.
      </motion.p>

      {/* Phone frame */}
      <motion.div
        className="relative mx-auto mt-14 flex flex-col items-center"
        {...phoneFade}
      >
        {/* Warm ambient glow */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            width: 500,
            height: 200,
            top: '100%',
            marginTop: -60,
            background:
              'radial-gradient(ellipse, rgba(201,169,110,0.08) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Phone shell */}
        <div
          className="relative"
          style={{
            width: 320,
            height: 693,
            borderRadius: 44,
            border: '4px solid #2a2a2a',
            overflow: 'hidden',
            background: '#000',
            boxShadow:
              '0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(201,169,110,0.06)',
          }}
        >
          {/* Dynamic island / notch */}
          <div
            className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
            style={{
              width: 120,
              height: 28,
              borderRadius: 20,
              background: '#000',
              top: 8,
            }}
            aria-hidden="true"
          />

          <iframe
            src="https://stayscape-kohl.vercel.app"
            title="Stayscape App Preview"
            width="100%"
            height="100%"
            style={{ border: 'none', borderRadius: 40 }}
            allow="clipboard-write"
            loading="lazy"
          />
        </div>
      </motion.div>

      {/* Open full app link */}
      <motion.div className="mt-8 text-center" {...fade(0.3)}>
        <a
          href="https://stayscape-kohl.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:underline"
          style={{ color: '#8a8580' }}
        >
          Open full app in new tab →
        </a>
      </motion.div>

      {/* CTA */}
      <motion.div className="mt-10 text-center" {...fade(0.4)}>
        <p className="mb-4 text-base" style={{ color: '#8a8580' }}>
          Ready to set up your property?
        </p>
        <a
          href="#get-early-access"
          style={{
            display: 'inline-block',
            backgroundColor: '#c9a96e',
            color: '#0f0e0d',
            borderRadius: 4,
            padding: '12px 28px',
            fontWeight: 600,
          }}
        >
          Get Early Access
        </a>
      </motion.div>
    </section>
  )
}
