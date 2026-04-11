'use client';

import { motion, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

interface ActionItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  accentClass?: string;
}

const actions: ActionItem[] = [
  {
    label: 'Itinerary',
    description: 'View and manage your trip timeline',
    href: '/app',
    accentClass: 'group-hover:text-[var(--gold)]',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="8" y1="18" x2="12" y2="18" />
      </svg>
    ),
  },
  {
    label: 'Discover',
    description: 'Explore curated local recommendations',
    href: '/app',
    accentClass: 'group-hover:text-amber-400',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: 'Map',
    description: 'Navigate your surroundings',
    href: '/app',
    accentClass: 'group-hover:text-sky-400',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    label: 'Concierge',
    description: 'Request services and assistance',
    href: '/app',
    accentClass: 'group-hover:text-rose-400',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    label: 'Manage Stay',
    description: 'Update details and preferences',
    href: '/dashboard',
    accentClass: 'group-hover:text-violet-400',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

interface QuickAccessActionsProps {
  disabled?: boolean;
}

export default function QuickAccessActions({
  disabled = false,
}: QuickAccessActionsProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5, ease: REVEAL_EASE, delay: 0.3 },
      };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: REVEAL_EASE,
        delay: 0.35 + i * 0.06,
      },
    }),
  };

  return (
    <motion.section {...containerMotion}>
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-[0.18em]">
          Quick Access
        </span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        {actions.map((action, i) => (
          <motion.a
            key={action.label}
            href={action.href}
            className="group relative flex items-start gap-4 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] transition-all duration-300 hover:border-[var(--gold)]/20 hover:bg-[var(--surface-raised)]"
            custom={i}
            variants={itemVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            style={{ textDecoration: 'none' }}
          >
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] transition-colors duration-300 ${action.accentClass ?? ''}`}
            >
              {action.icon}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">
                {action.label}
              </p>
              <p className="text-[11px] text-[var(--text-faint)] leading-relaxed mt-0.5">
                {action.description}
              </p>
            </div>

            {/* Arrow */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--text-faint)]"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}
