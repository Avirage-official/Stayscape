'use client';

import { motion, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

interface SecondaryModulesProps {
  hasStay: boolean;
  hotelName?: string | null;
  city?: string | null;
}

export default function SecondaryModules({
  hasStay,
  hotelName,
  city,
}: SecondaryModulesProps) {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: REVEAL_EASE, delay },
        };

  if (!hasStay) return null;

  return (
    <div className="space-y-5">
      {/* Itinerary snapshot */}
      <motion.section {...fadeIn(0.45)}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-[0.18em]">
            Upcoming on your itinerary
          </span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <div className="space-y-4">
            {/* Sample itinerary items */}
            <ItineraryItem
              time="9:00 AM"
              title="Breakfast at the Hotel"
              subtitle={hotelName ?? 'Your hotel'}
              type="dining"
            />
            <ItineraryItem
              time="11:30 AM"
              title="Local Walking Tour"
              subtitle={city ? `Explore ${city}` : 'Explore the area'}
              type="activity"
            />
            <ItineraryItem
              time="7:00 PM"
              title="Dinner Reservation"
              subtitle="Recommended by concierge"
              type="dining"
            />
          </div>

          <a
            href="/app"
            className="inline-flex items-center gap-1.5 mt-4 text-[11px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
          >
            View full itinerary
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
        </div>
      </motion.section>

      {/* Suggested places + Concierge status — two-column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Suggested places */}
        <motion.div {...fadeIn(0.55)}>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 h-full">
            <h4 className="text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-[0.14em] mb-3">
              Suggested for You
            </h4>
            <div className="space-y-3">
              <SuggestedPlace
                name={city ? `${city} Old Town` : 'Historic District'}
                category="Heritage"
              />
              <SuggestedPlace
                name="Seaside Promenade"
                category="Walk"
              />
              <SuggestedPlace
                name="Local Market"
                category="Shopping"
              />
            </div>
            <a
              href="/app"
              className="inline-flex items-center gap-1.5 mt-4 text-[11px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Discover more
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
          </div>
        </motion.div>

        {/* Concierge status */}
        <motion.div {...fadeIn(0.65)}>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 h-full">
            <h4 className="text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-[0.14em] mb-3">
              Concierge
            </h4>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Available now
                </p>
                <p className="text-[10px] text-[var(--text-faint)]">
                  Average response: 2 min
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Need a restaurant reservation, spa booking, or local tip?
                Your concierge is here to help.
              </p>
            </div>

            <a
              href="/app"
              className="inline-flex items-center gap-1.5 mt-4 text-[11px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Send a request
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ItineraryItem({
  time,
  title,
  subtitle,
  type,
}: {
  time: string;
  title: string;
  subtitle: string;
  type: 'dining' | 'activity';
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 text-right">
        <span className="text-[10px] text-[var(--text-faint)] font-medium">
          {time}
        </span>
      </div>
      <div className="w-px h-8 bg-[var(--border-subtle)] flex-shrink-0" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-medium text-[var(--text-secondary)] truncate">
            {title}
          </p>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
              type === 'dining'
                ? 'text-amber-400/80 bg-amber-400/8'
                : 'text-sky-400/80 bg-sky-400/8'
            }`}
          >
            {type}
          </span>
        </div>
        <p className="text-[10px] text-[var(--text-faint)] mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function SuggestedPlace({
  name,
  category,
}: {
  name: string;
  category: string;
}) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-[var(--surface-raised)] border border-[var(--border-subtle)] flex items-center justify-center">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-faint)] group-hover:text-[var(--gold)] transition-colors"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <p className="text-[12px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          {name}
        </p>
      </div>
      <span className="text-[9px] text-[var(--text-faint)] uppercase tracking-wider">
        {category}
      </span>
    </div>
  );
}
