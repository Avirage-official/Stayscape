'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface HeroTopNavProps {
  onMenuOpen: () => void;
  onLogout: () => void;
  stayContext?: string | null;
}

/**
 * HeroTopNav — a very restrained top bar layered over the hero.
 * Left: Menu trigger  |  Center: Stayscape wordmark (or stay context)  |  Right: Sign out
 */
export default function HeroTopNav({
  onMenuOpen,
  onLogout,
  stayContext,
}: HeroTopNavProps) {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.3 },
      };

  return (
    <motion.header
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-10 lg:px-14 h-[64px]"
      {...fadeIn}
    >
      {/* Left — Menu trigger */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex items-center gap-2.5 text-white/80 hover:text-white transition-colors cursor-pointer group"
        aria-label="Open menu"
      >
        {/* Hamburger lines */}
        <div className="flex flex-col gap-[5px]">
          <span className="block w-5 h-[1.5px] bg-current transition-all duration-300 group-hover:w-6" />
          <span className="block w-4 h-[1.5px] bg-current transition-all duration-300 group-hover:w-6" />
        </div>
        <span className="text-[12px] font-medium tracking-[0.18em] uppercase hidden sm:inline">
          Menu
        </span>
      </button>

      {/* Center — Wordmark / stay context */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <span className="font-serif text-[18px] sm:text-[20px] text-white/90 tracking-[0.06em]">
          Stayscape
        </span>
        {stayContext && (
          <span className="text-[10px] text-white/55 tracking-[0.2em] uppercase mt-0.5 hidden sm:block">
            {stayContext}
          </span>
        )}
      </div>

      {/* Right — Sign out */}
      <button
        type="button"
        onClick={onLogout}
        className="text-[12px] text-white/60 hover:text-white/85 tracking-[0.12em] uppercase transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </motion.header>
  );
}
