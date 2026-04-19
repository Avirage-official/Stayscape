'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Current booking',
    href: '/dashboard/current-booking',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Map',
    href: '/app',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    label: 'Experience nearby',
    href: '/app',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: 'Add stay',
    href: '#add-stay',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

interface ExpandedMenuOverlayProps {
  open: boolean;
  onClose: () => void;
  onAddStay: () => void;
}

/**
 * ExpandedMenuOverlay — a premium full-screen overlay menu.
 * Smooth veil transition with staggered menu item reveals.
 */
export default function ExpandedMenuOverlay({
  open,
  onClose,
  onAddStay,
}: ExpandedMenuOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (item.href === '#add-stay') {
        onClose();
        onAddStay();
        return;
      }
      // Allow default navigation
      onClose();
    },
    [onClose, onAddStay],
  );

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, ease: REVEAL_EASE },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.35, ease: [0.4, 0, 1, 1] as const },
    },
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.07,
        delayChildren: prefersReducedMotion ? 0 : 0.15,
      },
    },
    exit: {},
  };

  const itemVariants = prefersReducedMotion
    ? { hidden: {}, visible: {}, exit: {} }
    : {
        hidden: { opacity: 0, x: -20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.6, ease: REVEAL_EASE },
        },
        exit: {
          opacity: 0,
          x: -10,
          transition: { duration: 0.2 },
        },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop — keyboard-accessible close via Escape is handled by the close button */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            role="button"
            tabIndex={-1}
            aria-label="Close menu"
          />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-6 sm:right-10 lg:right-14 z-10 w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
            aria-label="Close menu"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Menu content */}
          <div className="relative z-10 h-full flex items-center">
            <motion.nav
              className="px-10 sm:px-16 lg:px-24"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-label="Main navigation"
            >
              {/* Label */}
              <motion.p
                className="text-[11px] text-white/40 uppercase tracking-[0.25em] mb-8 sm:mb-10"
                variants={itemVariants}
              >
                Navigate
              </motion.p>

              {/* Menu items */}
              <ul className="space-y-1">
                {MENU_ITEMS.map((item) => (
                  <motion.li key={item.label} variants={itemVariants}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        if (item.href === '#add-stay') {
                          e.preventDefault();
                        }
                        handleItemClick(item);
                      }}
                      className="group flex items-center gap-5 py-4 sm:py-5 text-white/60 hover:text-white transition-colors duration-300"
                    >
                      <span className="text-white/20 group-hover:text-white/50 transition-colors duration-300">
                        {item.icon}
                      </span>
                      <span className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-[-0.01em]">
                        {item.label}
                      </span>

                      {/* Hover arrow */}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                  </motion.li>
                ))}
              </ul>

              {/* Subtle brand footer */}
              <motion.div
                className="mt-12 sm:mt-16"
                variants={itemVariants}
              >
                <div className="h-px w-16 bg-white/10 mb-5" />
                <p className="text-[11px] text-white/15 tracking-[0.14em]">
                  Your private guest experience
                </p>
              </motion.div>
            </motion.nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
