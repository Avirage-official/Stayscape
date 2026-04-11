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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--card-bg)] via-[var(--surface)] to-[var(--card-bg)] border border-[var(--card-border)]">
        {/* Decorative gold accent */}
        <div
          className="absolute top-0 right-0 w-72 h-72 opacity-[0.03]"
          style={{
            background:
              'radial-gradient(circle at top right, var(--gold) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 px-6 sm:px-10 py-10 sm:py-14 text-center">
          {/* Icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--gold)]/[0.06] border border-[var(--gold)]/[0.12] flex items-center justify-center"
            {...fadeIn(0.3)}
          >
            <svg
              width="36"
              height="36"
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
            className="font-serif text-2xl text-[var(--text-primary)] mb-3"
            {...fadeIn(0.35)}
          >
            Your journey begins here
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-[14px] text-[var(--text-muted)] max-w-sm mx-auto mb-8 leading-relaxed"
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
              className="inline-flex items-center gap-2.5 h-12 px-8 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[13px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] transition-all duration-300 cursor-pointer shadow-gold-glow"
            >
              <svg
                width="16"
                height="16"
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
          <motion.div className="mt-5" {...fadeIn(0.55)}>
            <a
              href="/app"
              className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors tracking-wide"
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
