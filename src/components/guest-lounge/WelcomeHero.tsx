'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

interface WelcomeHeroProps {
  firstName: string;
  hasStay: boolean;
  hotelName?: string | null;
  city?: string | null;
}

export default function WelcomeHero({
  firstName,
  hasStay,
  hotelName,
  city,
}: WelcomeHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  // Compute greeting once on mount so it stays stable across re-renders
  const [greeting] = useState(() => getTimeOfDay());

  const contextLine = hasStay
    ? `Your stay at ${hotelName ?? 'your hotel'}${city ? `, ${city}` : ''} awaits.`
    : 'Your next extraordinary stay is waiting to be discovered.';

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: REVEAL_EASE, delay },
        };

  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#151518] via-[#18181C] to-[#121215]" />

      {/* Subtle gold accent glow */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-[0.06] dashboard-bg-drift"
        style={{
          background:
            'radial-gradient(circle, var(--gold) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-[0.04]"
        style={{
          background:
            'radial-gradient(circle, var(--gold) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-8 sm:px-12 py-12 sm:py-16">
        {/* Greeting label */}
        <motion.div
          className="flex items-center gap-2 mb-6"
          {...fadeIn(0.1)}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] opacity-70" />
          <span className="text-[11px] font-medium text-[var(--gold)] uppercase tracking-[0.2em]">
            Welcome back
          </span>
        </motion.div>

        {/* Welcome heading */}
        <motion.h1
          className="font-serif text-4xl sm:text-5xl text-[var(--dashboard-text-primary)] leading-[1.15] mb-4"
          style={{ letterSpacing: '-0.01em' }}
          {...fadeIn(0.25)}
        >
          Good{' '}
          <span className="text-[var(--gold)]">
            {greeting}
          </span>
          , {firstName}.
        </motion.h1>

        {/* Context line */}
        <motion.p
          className="text-[16px] text-[var(--dashboard-text-muted)] leading-relaxed max-w-xl"
          {...fadeIn(0.4)}
        >
          {contextLine}
        </motion.p>

        {/* Decorative bottom border */}
        <motion.div
          className="mt-10 h-px w-full"
          style={{
            background:
              'linear-gradient(to right, var(--gold), transparent 60%)',
            opacity: 0.2,
          }}
          {...fadeIn(0.55)}
        />
      </div>
    </section>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
