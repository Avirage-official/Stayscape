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
    <div className="space-y-6">
      {/* ──── 1. Upcoming Itinerary Snapshot ──── */}
      <motion.section {...fadeIn(0.45)}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Upcoming on your itinerary
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>

        <div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-xl p-6">
          <div className="space-y-4">
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
            className="inline-flex items-center gap-1.5 mt-5 text-[12px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
          >
            View full itinerary
            <ChevronRightIcon />
          </a>
        </div>
      </motion.section>

      {/* ──── 2. Suggested Places + 3. Concierge — two-column ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Suggested places */}
        <motion.div {...fadeIn(0.55)}>
          <div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-xl p-6 h-full">
            <h4 className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.14em] mb-4">
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
              className="inline-flex items-center gap-1.5 mt-5 text-[12px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Discover more
              <ChevronRightIcon />
            </a>
          </div>
        </motion.div>

        {/* Concierge / Request Status */}
        <motion.div {...fadeIn(0.65)}>
          <div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-xl p-6 h-full">
            <h4 className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.14em] mb-4">
              Concierge
            </h4>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] text-[var(--dashboard-text-secondary)]">
                  Available now
                </p>
                <p className="text-[11px] text-[var(--dashboard-text-faint)]">
                  Average response: 2 min
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--dashboard-surface-raised)] border border-[var(--dashboard-border-subtle)]">
              <p className="text-[12px] text-[var(--dashboard-text-muted)] leading-relaxed">
                Need a restaurant reservation, spa booking, or local tip?
                Your concierge is here to help.
              </p>
            </div>

            <a
              href="/app"
              className="inline-flex items-center gap-1.5 mt-5 text-[12px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Send a request
              <ChevronRightIcon />
            </a>
          </div>
        </motion.div>
      </div>

      {/* ──── 4. Saved Places / Recently Viewed ──── */}
      <motion.section {...fadeIn(0.75)}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Saved &amp; Recently Viewed
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>

        <div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SavedPlaceCard
              name="Rooftop Lounge"
              type="Bar & Lounge"
              saved
            />
            <SavedPlaceCard
              name={city ? `${city} Art Museum` : 'City Art Museum'}
              type="Culture"
              saved={false}
            />
            <SavedPlaceCard
              name="Botanical Garden"
              type="Nature"
              saved
            />
          </div>
          <a
            href="/app"
            className="inline-flex items-center gap-1.5 mt-5 text-[12px] text-[var(--gold)] hover:text-[var(--gold-soft)] transition-colors"
          >
            View all saved places
            <ChevronRightIcon />
          </a>
        </div>
      </motion.section>

      {/* ──── 5. Hotel Contact / Communication Panel ──── */}
      <motion.section {...fadeIn(0.85)}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-medium text-[var(--dashboard-text-faint)] uppercase tracking-[0.18em]">
            Hotel Contact
          </span>
          <div className="flex-1 h-px bg-[var(--dashboard-border-subtle)]" />
        </div>

        <div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-xl p-6">
          <div className="flex items-start gap-5">
            {/* Hotel icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--gold)]/[0.08] border border-[var(--gold)]/[0.15] flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--gold)]"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-medium text-[var(--dashboard-text-primary)] mb-1">
                {hotelName ?? 'Your Hotel'}
              </h4>
              <p className="text-[12px] text-[var(--dashboard-text-muted)] mb-4">
                {city ?? 'Your destination'} · Front Desk
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ContactAction
                  label="Call"
                  detail="Front Desk"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  }
                />
                <ContactAction
                  label="Email"
                  detail="Guest Services"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  }
                />
                <ContactAction
                  label="Chat"
                  detail="Live Support"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

/* ─── Sub-components ─── */

function ChevronRightIcon() {
  return (
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
  );
}

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
      <div className="flex-shrink-0 w-10 text-right">
        <span className="text-[11px] text-[var(--dashboard-text-faint)] font-medium">
          {time}
        </span>
      </div>
      <div className="w-px h-8 bg-[var(--dashboard-border-subtle)] flex-shrink-0" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-[var(--dashboard-text-secondary)] truncate">
            {title}
          </p>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
              type === 'dining'
                ? 'text-amber-400/80 bg-amber-400/8'
                : 'text-sky-400/80 bg-sky-400/8'
            }`}
          >
            {type}
          </span>
        </div>
        <p className="text-[11px] text-[var(--dashboard-text-faint)] mt-0.5">
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
        <div className="w-7 h-7 rounded-md bg-[var(--dashboard-surface-raised)] border border-[var(--dashboard-border-subtle)] flex items-center justify-center">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--dashboard-text-faint)] group-hover:text-[var(--gold)] transition-colors"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <p className="text-[13px] text-[var(--dashboard-text-secondary)] group-hover:text-[var(--dashboard-text-primary)] transition-colors">
          {name}
        </p>
      </div>
      <span className="text-[10px] text-[var(--dashboard-text-faint)] uppercase tracking-wider">
        {category}
      </span>
    </div>
  );
}

function SavedPlaceCard({
  name,
  type,
  saved,
}: {
  name: string;
  type: string;
  saved: boolean;
}) {
  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg bg-[var(--dashboard-surface-raised)] border border-[var(--dashboard-border-subtle)] cursor-pointer hover:border-[var(--gold)]/20 transition-all">
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-border-subtle)] flex items-center justify-center">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={saved ? 'text-[var(--gold)]' : 'text-[var(--dashboard-text-faint)]'}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[var(--dashboard-text-secondary)] group-hover:text-[var(--dashboard-text-primary)] transition-colors truncate">
          {name}
        </p>
        <p className="text-[10px] text-[var(--dashboard-text-faint)] mt-0.5">
          {type} {saved ? '· Saved' : '· Recently viewed'}
        </p>
      </div>
    </div>
  );
}

function ContactAction({
  label,
  detail,
  icon,
}: {
  label: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dashboard-surface-raised)] border border-[var(--dashboard-border-subtle)] hover:border-[var(--gold)]/20 transition-all cursor-pointer group"
    >
      <div className="flex-shrink-0 text-[var(--dashboard-text-muted)] group-hover:text-[var(--gold)] transition-colors">
        {icon}
      </div>
      <div className="text-left min-w-0">
        <p className="text-[12px] font-medium text-[var(--dashboard-text-secondary)] group-hover:text-[var(--dashboard-text-primary)] transition-colors">
          {label}
        </p>
        <p className="text-[10px] text-[var(--dashboard-text-faint)]">
          {detail}
        </p>
      </div>
    </button>
  );
}
