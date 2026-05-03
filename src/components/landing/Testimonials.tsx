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
      className="relative w-full overflow-hidden py-24 md:py-32"
      style={{
        backgroundColor: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1920&q=80)',
        }}
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,14,13,0.91), rgba(15,14,13,0.88))',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
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
            &ldquo;The brands winning today are the ones creating experiences
            guests can&rsquo;t stop talking about — going beyond the
            transactional, crafting moments that resonate and interactions
            so attuned to the individual that guests feel genuinely seen.&rdquo;
          </motion.blockquote>

          <motion.p
            className="mt-6 text-sm"
            style={{ color: '#8a8580' }}
            {...cardFade(prefersReducedMotion, 0.3)}
          >
            — Dr. Suzanne Godfrey, Independent Brand Consultant ·{' '}
            <a
              href="https://hospitalityinsights.ehl.edu/guest-experience"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#8a8580', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              EHL Hospitality Insights
            </a>
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
              &ldquo;Data-driven personalization is no longer optional.
              Guests expect it, technology enables it, and the brands that
              ignore it will quickly fall behind.&rdquo;
            </p>
            <p className="mt-4 text-sm" style={{ color: '#8a8580' }}>
              — Saurabh Goel, VP of Delivery, Astound Digital ·{' '}
              <a
                href="https://www.hoteldive.com/news/hyper-personalization-technology-hospitality/814218/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#8a8580', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Hotel Dive, 2026
              </a>
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
              &ldquo;Scaling personalization is less a question of size and
              more a question of intention. Technology earns its place not by
              replacing human connection, but by giving teams the information
              they need to approximate it.&rdquo;
            </p>
            <p className="mt-4 text-sm" style={{ color: '#8a8580' }}>
              — Dr. Suzanne Godfrey, Independent Brand Consultant ·{' '}
              <a
                href="https://hospitalityinsights.ehl.edu/guest-experience"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#8a8580', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                EHL Hospitality Insights
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
