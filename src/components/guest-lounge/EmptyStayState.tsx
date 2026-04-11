'use client';

import { motion, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

interface EmptyStayStateProps {
  onAddStay: () => void;
}

export default function EmptyStayState({ onAddStay }: EmptyStayStateProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: REVEAL_EASE, delay: 0.2 },
      };

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: REVEAL_EASE, delay },
        };

  return (
    <motion.section {...containerMotion}>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--dashboard-card-bg)] via-[var(--dashboard-bg)] to-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)]">
        {/* Decorative gold accent */}
        <div
          className="absolute top-0 right-0 w-72 h-72 opacity-[0.04]"
          style={{
            background:
              'radial-gradient(circle at top right, var(--gold) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 px-8 sm:px-12 py-12 sm:py-16 text-center">
          {/* Icon */}
          <motion.div
            className="w-22 h-22 mx-auto mb-7 rounded-2xl bg-[var(--gold)]/[0.06] border border-[var(--gold)]/[0.12] flex items-center justify-center"
            style={{ width: '5.5rem', height: '5.5rem' }}
            {...fadeIn(0.3)}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--gold)]"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </motion.div>

          {/* Title */}
          <motion.h3
            className="font-serif text-3xl text-[var(--dashboard-text-primary)] mb-4"
            {...fadeIn(0.35)}
          >
            Your journey begins here
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-[15px] text-[var(--dashboard-text-muted)] max-w-md mx-auto mb-8 leading-relaxed"
            {...fadeIn(0.4)}
          >
            Add your upcoming stay to unlock your personal concierge,
            curated recommendations, itinerary planning, and a complete
            guest experience.
          </motion.p>

          {/* Primary CTA */}
          <motion.div {...fadeIn(0.5)}>
            <button
              type="button"
              onClick={onAddStay}
              className="inline-flex items-center gap-2.5 h-13 px-10 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[14px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] transition-all duration-300 cursor-pointer shadow-gold-glow"
              style={{ height: '3.25rem' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Your Stay
            </button>
          </motion.div>

          {/* Secondary link */}
          <motion.div className="mt-6" {...fadeIn(0.55)}>
            <a
              href="/app"
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-muted)] transition-colors tracking-wide"
            >
              Or explore Stayscape first
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
