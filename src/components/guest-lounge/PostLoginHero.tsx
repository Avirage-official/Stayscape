'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';

/**
 * PostLoginHero — full-viewport cinematic background with slow drift animation.
 * Renders a luxury hotel image behind a subtle dark overlay.
 * Children are layered on top.
 */

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80&auto=format&fit=crop';

export default function PostLoginHero({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Cinematic background image with slow zoom */}
      <motion.div
        className="absolute inset-0"
        initial={prefersReducedMotion ? undefined : { scale: 1.05 }}
        animate={prefersReducedMotion ? undefined : { scale: 1 }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }
        }
      >
        <Image
          src={HERO_IMAGE}
          alt="Luxury hotel interior"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
      </motion.div>

      {/* Dark overlay for readability — keeps the image emotionally present */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* Warm vignette edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
