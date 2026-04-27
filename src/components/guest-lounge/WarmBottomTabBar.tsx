'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense } from 'react';

type TabDef = {
  label: string;
  href: string;
  /** Match function to decide active state. */
  match: (pathname: string, search: URLSearchParams) => boolean;
  icon: (active: boolean) => React.ReactNode;
};

const ICON_PROPS = (active: boolean) =>
  ({
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2 : 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }) as const;

const TABS: TabDef[] = [
  {
    label: 'Home',
    href: '/dashboard',
    match: (p) => p === '/dashboard',
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Concierge',
    href: '/app',
    match: (p, s) => p.startsWith('/app') && s.get('tab') !== 'map' && s.get('tab') !== 'itinerary',
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Discover',
    href: '/app?tab=map',
    match: (p, s) => p.startsWith('/app') && s.get('tab') === 'map',
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    label: 'Itinerary',
    href: '/app?tab=itinerary',
    match: (p, s) => p.startsWith('/app') && s.get('tab') === 'itinerary',
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    match: (p) => p.startsWith('/dashboard/profile'),
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function WarmBottomTabBarInner() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const search = searchParams ?? new URLSearchParams();

  return (
    <>
      {/* Spacer so content doesn't hide behind tab bar */}
      <div className="h-[80px]" aria-hidden="true" />

      {/* Tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--tab-bg)',
          borderTop: '1px solid var(--tab-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Primary"
      >
        <div className="flex items-stretch h-[64px]">
          {TABS.map((tab) => {
            const isActive = tab.match(pathname, search);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-1
                  transition-colors duration-200 cursor-pointer relative"
                style={{
                  color: isActive ? 'var(--tab-active)' : 'var(--tab-inactive)',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator dot above icon */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2
                        w-8 h-[3px] rounded-full"
                      style={{ background: 'var(--tab-active)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                </AnimatePresence>

                {tab.icon(isActive)}

                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{
                    color: isActive ? 'var(--tab-active)' : 'var(--tab-inactive)',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default function WarmBottomTabBar() {
  return (
    <Suspense fallback={<div className="h-[80px]" aria-hidden="true" />}>
      <WarmBottomTabBarInner />
    </Suspense>
  );
}
