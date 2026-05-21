'use client';

/**
 * CookieConsent
 *
 * Minimal PDPA/GDPR cookie notice for non-essential (analytics) cookies.
 * Essential auth cookies do not require consent and are unaffected by this.
 *
 * Behaviour:
 *  - Shows once until the visitor accepts or declines.
 *  - Choice persisted in a first-party cookie ("ss_cookie_consent") for 6 months.
 *  - On "Accept", dispatches a window event ("ss-analytics-consent") your
 *    analytics loader can listen for. Until then, do NOT load analytics.
 *
 * Usage: render <CookieConsent /> once in your root layout (app/layout.tsx),
 * just before </body>.
 */

import { useEffect, useState } from 'react';

const COOKIE_NAME = 'ss_cookie_consent';
const SIX_MONTHS = 60 * 60 * 24 * 182;

function readConsent(): 'accepted' | 'declined' | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  const value = match?.split('=')[1];
  return value === 'accepted' || value === 'declined' ? value : null;
}

function writeConsent(value: 'accepted' | 'declined') {
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${SIX_MONTHS}; Path=/; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no choice has been made yet.
    if (readConsent() === null) {
      // Small delay so it doesn't fight the page load animation.
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
    // If already accepted on a previous visit, re-fire the consent event
    // so analytics can initialise on this page load too.
    if (readConsent() === 'accepted') {
      window.dispatchEvent(new CustomEvent('ss-analytics-consent'));
    }
  }, []);

  function accept() {
    writeConsent('accepted');
    window.dispatchEvent(new CustomEvent('ss-analytics-consent'));
    setVisible(false);
  }

  function decline() {
    writeConsent('declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(560px, calc(100vw - 32px))',
        background: '#1E1814',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: "'DM Sans', sans-serif",
        animation: 'ssCookieIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <style>{`
        @keyframes ssCookieIn {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: 'rgba(232,226,216,0.78)',
        }}
      >
        We use essential cookies to keep you signed in, and — with your consent —
        analytics cookies to improve Stayscape. See our{' '}
        <a
          href="/privacy"
          style={{ color: '#C9A875', textDecoration: 'none', borderBottom: '1px solid rgba(201,168,117,0.4)' }}
        >
          Privacy Policy
        </a>
        .
      </p>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={decline}
          style={{
            height: 38,
            padding: '0 16px',
            borderRadius: 9,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(232,226,216,0.7)',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'border-color 180ms ease, color 180ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
            e.currentTarget.style.color = '#E8E2D8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
            e.currentTarget.style.color = 'rgba(232,226,216,0.7)';
          }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={accept}
          style={{
            height: 38,
            padding: '0 18px',
            borderRadius: 9,
            background: '#C9A875',
            border: 'none',
            color: '#14100D',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'background 180ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#d8bb8c')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#C9A875')}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
