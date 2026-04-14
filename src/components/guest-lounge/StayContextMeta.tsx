'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface StayContextMetaProps {
  hotelName?: string | null;
  city?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string | null;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * StayContextMeta — a subtle, restrained stay-awareness strip at the bottom
 * of the hero. Hotel name, dates, city. Elegant, not data-heavy.
 */
export default function StayContextMeta({
  hotelName,
  city,
  checkIn,
  checkOut,
  status,
}: StayContextMetaProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!hotelName && !city) return null;

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const, delay: 1.4 },
      };

  return (
    <motion.div
      className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center px-6"
      {...fadeIn}
    >
      <div className="flex items-center gap-3 sm:gap-5 text-white/50 text-[11px] sm:text-[12px] tracking-[0.14em] uppercase backdrop-blur-sm">
        {hotelName && <span>{hotelName}</span>}

        {city && hotelName && (
          <span className="w-px h-3 bg-white/15" aria-hidden="true" />
        )}

        {city && <span>{city}</span>}

        {checkIn && checkOut && (
          <>
            <span className="w-px h-3 bg-white/15" aria-hidden="true" />
            <span>
              {formatShortDate(checkIn)} – {formatShortDate(checkOut)}
            </span>
          </>
        )}

        {status && (
          <>
            <span className="w-px h-3 bg-white/15" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
              {status}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
