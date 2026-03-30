'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function FinalCTA() {
  const prefersReducedMotion = useReducedMotion();

  const clipReveal = prefersReducedMotion
    ? {}
    : {
        initial: { clipPath: 'inset(100% 0 0 0)' },
        whileInView: { clipPath: 'inset(0 0 0 0)' },
        viewport: { once: true },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
      };

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80)',
        }}
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(15,14,13,0.95), rgba(15,14,13,0.6))',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.h2
          {...clipReveal}
          className="text-4xl md:text-5xl lg:text-6xl font-bold"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: '#e8e4dc',
            letterSpacing: '-0.02em',
          }}
        >
          Your guests deserve a guide.
        </motion.h2>

        <motion.p
          {...fadeIn(0.4)}
          className="text-lg md:text-xl mx-auto mt-6 text-center"
          style={{ color: '#8a8580', maxWidth: 500 }}
        >
          Stayscape is now accepting early hotel partners. Let&apos;s set up
          your property.
        </motion.p>

        <motion.div
          {...fadeIn(0.6)}
          className="flex flex-row items-center justify-center gap-4 mt-8 flex-wrap"
        >
          <button
            style={{
              background: '#c9a96e',
              color: '#0f0e0d',
              borderRadius: 4,
              padding: '14px 32px',
              fontWeight: 600,
            }}
          >
            Get Early Access
          </button>

          <a
            href="https://stayscape-kohl.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent',
              color: '#e8e4dc',
              borderRadius: 4,
              padding: '14px 32px',
              display: 'inline-block',
            }}
          >
            Explore the Live App
          </a>
        </motion.div>

        <motion.p
          {...fadeIn(0.8)}
          className="text-sm italic text-center"
          style={{ color: '#8a8580', marginTop: 16 }}
        >
          No login required — explore a live demo of Stayscape loaded with
          sample content.
        </motion.p>
      </div>
    </section>
  );
}
