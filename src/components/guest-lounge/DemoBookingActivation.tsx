'use client';

/**
 * DemoBookingActivation
 *
 * Shown on the dashboard when no current stay exists.
 * Lets buyers/stakeholders simulate a PMS webhook booking confirmation
 * so they can see the full AI curation pipeline working live.
 *
 * Design: follows the post-login cinematic aesthetic —
 * dark background, gold accents, elegant serif/sans typography.
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DEMO_BOOKING_META } from '@/lib/data/demo-bookings';

interface DemoBookingActivationProps {
  userId: string;
  firstName: string;
  /** Called after a successful activation so the parent can refetch dashboard data. */
  onActivated: () => void;
}

type ActivationState = 'idle' | 'loading' | 'success' | 'error';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

export default function DemoBookingActivation({
  userId,
  firstName,
  onActivated,
}: DemoBookingActivationProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>(DEMO_BOOKING_META[0].id);
  const [manualId, setManualId] = useState('');
  const [activationState, setActivationState] = useState<ActivationState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const effectiveBookingId = manualId.trim() || selectedId;

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: REVEAL_EASE, delay },
        };

  async function handleActivate() {
    if (!effectiveBookingId) return;
    setActivationState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/demo/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: effectiveBookingId, user_id: userId }),
      });

      const json = (await res.json()) as { data?: unknown; error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? 'Activation failed');
      }

      setActivationState('success');

      // Brief success pause, then trigger dashboard refetch
      setTimeout(() => {
        onActivated();
      }, 1800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setActivationState('error');
    }
  }

  // ── Loading state ──────────────────────────────────────────────
  if (activationState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-8">
        <motion.div
          className="w-16 h-16 rounded-full border-2 border-[var(--gold)]/30 border-t-[var(--gold)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="space-y-2">
          <p className="text-white/90 text-[17px] font-medium tracking-tight">
            Setting up your stay experience…
          </p>
          <p className="text-white/40 text-[13px]">
            Running the PMS webhook and curating your stay with AI
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.div
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────
  if (activationState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-6">
        <motion.div
          className="w-16 h-16 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
        <div className="space-y-2">
          <p className="text-white/90 text-[17px] font-medium">Stay activated!</p>
          <p className="text-white/40 text-[13px]">Loading your curated experience…</p>
        </div>
      </div>
    );
  }

  // ── Default / Error state ──────────────────────────────────────
  return (
    <div className="flex flex-col items-center px-4 sm:px-6 py-10 sm:py-14 max-w-2xl mx-auto w-full">
      {/* Header */}
      <motion.div className="text-center mb-10 space-y-3" {...fadeIn(0.4)}>
        <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--gold)]/70 font-medium">
          Demo Mode
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-white leading-tight">
          Good {getGreeting()}, {firstName}.
        </h2>
        <p className="text-[14px] sm:text-[15px] text-white/50 max-w-md mx-auto leading-relaxed">
          In production, your stay appears here automatically when your hotel&apos;s booking system
          confirms your reservation. For this demo, select a property below.
        </p>
      </motion.div>

      {/* Hotel cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8"
        {...fadeIn(0.6)}
      >
        {DEMO_BOOKING_META.map((hotel) => {
          const isSelected = selectedId === hotel.id && !manualId.trim();
          return (
            <button
              key={hotel.id}
              type="button"
              onClick={() => {
                setSelectedId(hotel.id);
                setManualId('');
              }}
              className={`
                relative text-left rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer
                ${
                  isSelected
                    ? 'bg-white/[0.08] border-[var(--gold)]/50 shadow-[0_0_24px_rgba(201,168,76,0.12)]'
                    : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]'
                }
              `}
            >
              {/* Flag + selected indicator */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{hotel.flag}</span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[var(--gold)]/20 border border-[var(--gold)]/50 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Hotel details */}
              <p
                className={`text-[14px] font-semibold mb-0.5 leading-snug transition-colors ${
                  isSelected ? 'text-white' : 'text-white/80'
                }`}
              >
                {hotel.hotelName}
              </p>
              <p className="text-[12px] text-white/40 mb-2">
                {hotel.city}, {hotel.country}
              </p>
              <p className="text-[11px] text-white/30 leading-relaxed">{hotel.tagline}</p>

              {/* Booking ID badge */}
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <code
                  className={`text-[10px] tracking-wider font-mono transition-colors ${
                    isSelected ? 'text-[var(--gold)]/80' : 'text-white/25'
                  }`}
                >
                  {hotel.id}
                </code>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* Manual input */}
      <motion.div className="w-full mb-6" {...fadeIn(0.8)}>
        <label htmlFor="manual-booking-id" className="sr-only">
          Or enter a booking ID manually
        </label>
        <div className="relative">
          <input
            id="manual-booking-id"
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Or enter a booking ID manually..."
            className="
              w-full bg-white/[0.05] border border-white/[0.10] rounded-xl
              px-5 py-3.5 text-[14px] text-white/80 placeholder:text-white/25
              focus:outline-none focus:border-[var(--gold)]/40 focus:bg-white/[0.07]
              transition-all duration-300
            "
            autoComplete="off"
            spellCheck={false}
          />
          {manualId.trim() && (
            <button
              type="button"
              onClick={() => setManualId('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer p-1"
              aria-label="Clear"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* Error message */}
      {activationState === 'error' && (
        <motion.p
          className="text-red-400/80 text-[13px] mb-4 text-center"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {errorMsg}
        </motion.p>
      )}

      {/* Activate button */}
      <motion.button
        type="button"
        onClick={handleActivate}
        disabled={!effectiveBookingId}
        className="
          w-full sm:w-auto px-10 py-4 rounded-2xl font-medium text-[14px] tracking-wide
          bg-[var(--gold)] text-black
          hover:bg-[var(--gold-soft)] active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-300 cursor-pointer
          shadow-[0_4px_24px_rgba(201,168,76,0.25)]
          hover:shadow-[0_6px_32px_rgba(201,168,76,0.35)]
        "
        {...fadeIn(1.0)}
      >
        Activate PMS Webhook
      </motion.button>

      {/* Footnote */}
      <motion.p
        className="text-[11px] text-white/25 text-center mt-5 max-w-sm leading-relaxed"
        {...fadeIn(1.2)}
      >
        This triggers the same webhook that a hotel&apos;s Property Management System calls when a
        booking is confirmed
      </motion.p>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
