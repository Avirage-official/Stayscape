'use client';

import { useState, type FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;
const SUCCESS_REDIRECT_DELAY_MS = 1500;

type ActivationState = 'idle' | 'loading' | 'success' | 'error';
type ActivationResponse = {
  data?: {
    stay_id?: string;
    redirect_stay_id?: string;
    stay_existed?: boolean;
    message?: string;
  };
  error?: string;
};

interface AddStayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The logged-in user's ID. */
  userId?: string;
  /** Called after a successful activation so the parent can refetch. */
  onActivated?: () => void;
}

const inputClassName =
  'w-full h-11 px-4 rounded-xl bg-white/[0.10] border border-white/[0.12] text-[14px] text-white/85 placeholder:text-white/40 focus:outline-none focus:border-[var(--gold)]/40 focus:bg-white/[0.13] transition-all duration-300';

export default function AddStayDialog({
  open,
  onOpenChange,
  userId,
  onActivated,
}: AddStayDialogProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<ActivationState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [bookingRef, setBookingRef] = useState('');

  const reset = useCallback(() => {
    setState('idle');
    setErrorMsg('');
    setBookingRef('');
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    reset();
  }, [onOpenChange, reset]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!userId) return;

      setState('loading');
      setErrorMsg('');

      try {
        const res = await fetch('/api/customer/stays/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_reference: bookingRef.trim(),
            user_id: userId,
          }),
        });

        const json = (await res.json()) as ActivationResponse;
        if (!res.ok) {
          throw new Error(json.error ?? 'Activation failed');
        }

        const stayId = json.data?.redirect_stay_id ?? json.data?.stay_id;
        setState('success');
        setTimeout(() => {
          onOpenChange(false);
          reset();
          if (stayId) {
            router.push('/dashboard');
          }
          onActivated?.();
        }, SUCCESS_REDIRECT_DELAY_MS);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
        setState('error');
      }
    },
    [userId, bookingRef, onOpenChange, onActivated, reset, router],
  );

  const overlayMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      };

  const contentMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 8 },
        transition: { duration: 0.3, ease: REVEAL_EASE },
      };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
                {...overlayMotion}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                {...contentMotion}
              >
                <div
                  className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.10] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
                  style={{
                    background:
                      'linear-gradient(160deg, rgba(20,18,16,0.95) 0%, rgba(12,11,10,0.97) 100%)',
                    backdropFilter: 'blur(24px)',
                  }}
                >
                  {/* Header */}
                  <div
                    className="sticky top-0 z-10 px-8 py-5 flex items-center justify-between border-b border-white/[0.07]"
                    style={{
                      background:
                        'linear-gradient(160deg, rgba(20,18,16,0.98) 0%, rgba(14,13,12,0.98) 100%)',
                      backdropFilter: 'blur(24px)',
                    }}
                  >
                    <div>
                      <Dialog.Title className="font-serif text-xl text-white/90">
                        Find Your Stay
                      </Dialog.Title>
                      <Dialog.Description className="text-[12px] text-white/50 mt-1">
                        Enter your booking reference to access your stay
                      </Dialog.Description>
                    </div>

                    <Dialog.Close asChild>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <svg
                          width="14"
                          height="14"
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
                    </Dialog.Close>
                  </div>

                  {/* Content */}
                  <div className="px-8 py-6">
                    {state === 'loading' ? (
                      <div className="flex flex-col items-center justify-center text-center py-12 gap-6">
                        <motion.div
                          className="w-12 h-12 rounded-full border-2 border-[var(--gold)]/30 border-t-[var(--gold)]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="space-y-1.5">
                          <p className="text-white/90 text-[15px] font-medium">
                            Setting up your stay…
                          </p>
                          <p className="text-white/40 text-[13px]">
                            Pulling your stay details so we can start your personalised onboarding
                          </p>
                        </div>
                      </div>
                    ) : state === 'success' ? (
                      <div className="flex flex-col items-center justify-center text-center py-12 gap-5">
                        <motion.div
                          className="w-12 h-12 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <svg
                            width="22"
                            height="22"
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
                        <div className="space-y-1.5">
                          <p className="text-white/90 text-[15px] font-medium">Stay added!</p>
                          <p className="text-white/40 text-[13px]">Loading your curated experience…</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {state === 'error' && errorMsg && (
                          <motion.p
                            className="text-red-400/80 text-[13px] text-center mb-4"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {errorMsg}
                          </motion.p>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-medium text-white/55 uppercase tracking-[0.14em] mb-2">
                              Booking Reference <span className="text-[var(--gold)]/60">*</span>
                            </label>
                            <input
                              type="text"
                              value={bookingRef}
                              onChange={(e) => setBookingRef(e.target.value)}
                              className={inputClassName}
                              placeholder="e.g. RES-123456"
                              autoComplete="off"
                              spellCheck={false}
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={!bookingRef.trim() || !userId}
                            className="w-full h-11 rounded-2xl bg-[var(--gold)] text-black text-[13px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(201,168,76,0.2)]"
                          >
                            Find Stay
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
