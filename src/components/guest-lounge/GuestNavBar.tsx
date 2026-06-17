'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cormorant_Garamond } from 'next/font/google';
import { useAuth } from '@/lib/context/auth-context';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

const NAV_BG = 'rgba(14, 11, 8, 0.88)';
const NAV_BORDER = 'rgba(253, 249, 242, 0.08)';
const ACTIVE_COLOR = '#C8965A';
const INACTIVE_COLOR = 'rgba(253, 249, 242, 0.38)';
const NAV_W = 52;

const tabs = [
  {
    label: 'Home',
    href: '/dashboard',
    match: (p: string) => p === '/dashboard',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: 'Planner',
    href: '/dashboard/planner',
    match: (p: string) => p.startsWith('/dashboard/planner'),
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <line x1="9" y1="14" x2="13" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Aria',
    href: '/dashboard/aria',
    match: (p: string) => p.startsWith('/dashboard/aria'),
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
      </svg>
    ),
  },
  {
    label: 'History',
    href: '/dashboard/history',
    match: (p: string) => p.startsWith('/dashboard/history'),
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="12 8 12 12 14 14" />
        <path d="M3.05 11a9 9 0 1 0 .5-4" />
        <polyline points="3 3 3 7 7 7" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    match: (p: string) => p.startsWith('/dashboard/profile'),
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function GuestNavBarInner() {
  const pathname = usePathname() ?? '';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-w',
      isCollapsed ? '0px' : `${NAV_W}px`,
    );
    return () => {
      document.documentElement.style.removeProperty('--sidebar-w');
    };
  }, [isCollapsed]);

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
          width: NAV_W,
          zIndex: 50,
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 20,
          paddingBottom: 20,
          background: NAV_BG,
          borderRight: `1px solid ${NAV_BORDER}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isCollapsed ? `translateX(-${NAV_W}px)` : 'translateX(0)',
        }}
        className="hidden md:flex"
      >
        {/* Logo mark */}
        <div style={{ marginBottom: 28 }}>
          <span
            className={cormorant.className}
            style={{
              fontSize: 20,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
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
                  width: 40,
                  height: 40,
                  borderRadius: 12,
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
                        borderRadius: 12,
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

        {/* Logout button */}
        <button
          onClick={logout}
          aria-label="Log out"
          title="Log out"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'transparent',
            border: '1px solid rgba(253,249,242,0.08)',
            color: 'rgba(253,249,242,0.28)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            transition: 'color 200ms ease, border-color 200ms ease, background 200ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'rgba(220,80,60,0.85)';
            e.currentTarget.style.borderColor = 'rgba(220,80,60,0.30)';
            e.currentTarget.style.background = 'rgba(220,80,60,0.07)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(253,249,242,0.28)';
            e.currentTarget.style.borderColor = 'rgba(253,249,242,0.08)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(true)}
          aria-label="Collapse navigation"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid rgba(253,249,242,0.1)',
            color: 'rgba(253,249,242,0.28)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 200ms ease, border-color 200ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = ACTIVE_COLOR;
            e.currentTarget.style.borderColor = 'rgba(200,150,90,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(253,249,242,0.28)';
            e.currentTarget.style.borderColor = 'rgba(253,249,242,0.1)';
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </nav>

      {/* Expand handle — appears when sidebar is collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand navigation"
          className="hidden md:flex"
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 51,
            width: 18,
            height: 52,
            borderRadius: '0 8px 8px 0',
            background: NAV_BG,
            border: `1px solid ${NAV_BORDER}`,
            borderLeft: 'none',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: INACTIVE_COLOR,
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 200ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = ACTIVE_COLOR; }}
          onMouseLeave={e => { e.currentTarget.style.color = INACTIVE_COLOR; }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

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

            {/* Logout */}
            <button
              onClick={logout}
              aria-label="Log out"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                color: 'rgba(220,80,60,0.60)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(220,80,60,0.85)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(220,80,60,0.60)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em' }}>
                Log out
              </span>
            </button>
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
