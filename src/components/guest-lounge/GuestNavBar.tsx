'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

const NAV_BG = 'rgba(14, 11, 8, 0.88)';
const NAV_BORDER = 'rgba(253, 249, 242, 0.08)';
const ACTIVE_COLOR = '#C8965A';
const INACTIVE_COLOR = 'rgba(253, 249, 242, 0.38)';

const tabs = [
  {
    label: 'Home',
    href: '/dashboard',
    match: (p: string) => p === '/dashboard',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Explore',
    href: '/dashboard/explore',
    match: (p: string) => p.startsWith('/dashboard/explore'),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: 'Trips',
    href: '/dashboard/trips',
    match: (p: string) => p.startsWith('/dashboard/trips'),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Wishlist',
    href: '/dashboard/wishlist',
    match: (p: string) => p.startsWith('/dashboard/wishlist'),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    match: (p: string) => p.startsWith('/dashboard/profile'),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function GuestNavBarInner() {
  const pathname = usePathname() ?? '';

  return (
    <>
      {/* ── DESKTOP: narrow left sidebar ── */}
      <nav
        aria-label="Primary navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 68,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 24,
          paddingBottom: 24,
          background: NAV_BG,
          borderRight: `1px solid ${NAV_BORDER}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        className="hidden md:flex"
      >
        {/* Logo mark */}
        <div style={{ marginBottom: 36 }}>
          <span
            className={cormorant.className}
            style={{
              fontSize: 22,
              color: ACTIVE_COLOR,
              fontWeight: 400,
              letterSpacing: '0.02em',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              display: 'block',
              lineHeight: 1,
            }}
            aria-label="Stayscape"
          >
            S
          </span>
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {tabs.map((tab) => {
            const isActive = tab.match(pathname);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                  background: isActive ? 'rgba(200, 150, 90, 0.12)' : 'transparent',
                  transition: 'color 0.2s ease, background 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill-desktop"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 14,
                        background: 'rgba(200, 150, 90, 0.12)',
                        border: '1px solid rgba(200, 150, 90, 0.22)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </AnimatePresence>
                {tab.icon(isActive)}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── MOBILE: bottom tab bar ── */}
      <div className="md:hidden">
        {/* Spacer */}
        <div style={{ height: 72 }} aria-hidden="true" />

        <nav
          aria-label="Primary navigation"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: NAV_BG,
            borderTop: `1px solid ${NAV_BORDER}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'stretch', height: 64 }}>
            {tabs.map((tab) => {
              const isActive = tab.match(pathname);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                    textDecoration: 'none',
                    position: 'relative',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {/* Top active line */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator-mobile"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 28,
                          height: 2,
                          borderRadius: 999,
                          background: ACTIVE_COLOR,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                  </AnimatePresence>
                  {tab.icon(isActive)}
                  <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em' }}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}

export default function GuestNavBar() {
  return (
    <Suspense fallback={null}>
      <GuestNavBarInner />
    </Suspense>
  );
}
