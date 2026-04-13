'use client';

import { useState, type FormEvent, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { DEMO_BOOKING_META } from '@/lib/data/demo-bookings';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

type DialogTab = 'demo' | 'manual';
type ActivationState = 'idle' | 'loading' | 'success' | 'error';

interface AddStayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required for demo activation — the logged-in user's ID. */
  userId?: string;
  /** Called after a successful demo activation so the parent can refetch. */
  onActivated?: () => void;
}

interface StayFormData {
  country: string;
  city: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  contactEmail: string;
  contactPhone: string;
  guests: string;
  tripType: string;
  roomType: string;
  bookingReference: string;
  notes: string;
}

const INITIAL_FORM: StayFormData = {
  country: '',
  city: '',
  hotelName: '',
  checkIn: '',
  checkOut: '',
  contactEmail: '',
  contactPhone: '',
  guests: '2',
  tripType: '',
  roomType: '',
  bookingReference: '',
  notes: '',
};

const TRIP_TYPES = [
  'Leisure',
  'Business',
  'Romantic',
  'Family',
  'Adventure',
  'Wellness',
];

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--dashboard-text-muted)] uppercase tracking-[0.14em] mb-2">
        {label}
        {required && <span className="text-[var(--gold)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  'w-full h-11 px-4 rounded-lg bg-[var(--dashboard-input-bg)] border border-[var(--dashboard-card-border)] text-[14px] text-[var(--dashboard-text-primary)] placeholder:text-[var(--dashboard-text-faint)] focus:outline-none focus:border-[var(--gold)]/40 focus:ring-1 focus:ring-[var(--gold)]/15 transition-colors';

const selectClassName =
  'w-full h-11 px-4 rounded-lg bg-[var(--dashboard-input-bg)] border border-[var(--dashboard-card-border)] text-[14px] text-[var(--dashboard-text-primary)] focus:outline-none focus:border-[var(--gold)]/40 focus:ring-1 focus:ring-[var(--gold)]/15 transition-colors appearance-none cursor-pointer';

/* ─── Demo activation panel (compact, fits inside dialog) ─── */

function DemoActivationPanel({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: () => void;
}) {
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
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: REVEAL_EASE, delay },
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

      // Brief success pause, then trigger parent refetch and close dialog
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setActivationState('error');
    }
  }

  // ── Loading state ──
  if (activationState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 gap-6">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-[var(--gold)]/30 border-t-[var(--gold)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="space-y-1.5">
          <p className="text-[var(--dashboard-text-primary)] text-[15px] font-medium">
            Setting up your stay…
          </p>
          <p className="text-[var(--dashboard-text-faint)] text-[13px]">
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

  // ── Success state ──
  if (activationState === 'success') {
    return (
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
          <p className="text-[var(--dashboard-text-primary)] text-[15px] font-medium">
            Stay activated!
          </p>
          <p className="text-[var(--dashboard-text-faint)] text-[13px]">
            Loading your curated experience…
          </p>
        </div>
      </div>
    );
  }

  // ── Default / Error state ──
  return (
    <div className="py-2 space-y-5">
      {/* Explainer */}
      <motion.p
        className="text-[13px] text-[var(--dashboard-text-faint)] leading-relaxed"
        {...fadeIn(0)}
      >
        In production, your stay appears automatically when your hotel&apos;s
        booking system confirms your reservation. Select a demo property below.
      </motion.p>

      {/* Hotel cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" {...fadeIn(0.05)}>
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
                relative text-left rounded-xl p-3.5 border transition-all duration-300 cursor-pointer
                ${
                  isSelected
                    ? 'bg-[var(--gold)]/[0.06] border-[var(--gold)]/40 shadow-[0_0_16px_rgba(201,168,76,0.08)]'
                    : 'bg-[var(--dashboard-input-bg)] border-[var(--dashboard-card-border)] hover:border-[var(--gold)]/20'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{hotel.flag}</span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-[var(--gold)]/20 border border-[var(--gold)]/50 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="8"
                      height="8"
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
              <p
                className={`text-[13px] font-semibold mb-0.5 leading-snug transition-colors ${
                  isSelected ? 'text-[var(--dashboard-text-primary)]' : 'text-[var(--dashboard-text-secondary)]'
                }`}
              >
                {hotel.hotelName}
              </p>
              <p className="text-[11px] text-[var(--dashboard-text-faint)] mb-2">
                {hotel.city}, {hotel.country}
              </p>
              <div className="pt-2 border-t border-[var(--dashboard-border-subtle)]">
                <code
                  className={`text-[10px] tracking-wider font-mono transition-colors ${
                    isSelected ? 'text-[var(--gold)]/70' : 'text-[var(--dashboard-text-faint)]/60'
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
      <motion.div {...fadeIn(0.1)}>
        <div className="relative">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Or enter a booking ID manually…"
            className={inputClassName}
            autoComplete="off"
            spellCheck={false}
          />
          {manualId.trim() && (
            <button
              type="button"
              onClick={() => setManualId('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-secondary)] transition-colors cursor-pointer p-1"
              aria-label="Clear"
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* Error */}
      {activationState === 'error' && (
        <motion.p
          className="text-red-400/80 text-[13px] text-center"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {errorMsg}
        </motion.p>
      )}

      {/* Activate button */}
      <button
        type="button"
        onClick={handleActivate}
        disabled={!effectiveBookingId}
        className="w-full h-11 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[13px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-[0_2px_16px_rgba(201,168,76,0.2)]"
      >
        Activate PMS Webhook
      </button>

      <p className="text-[11px] text-[var(--dashboard-text-faint)]/60 text-center leading-relaxed">
        This triggers the same webhook that a hotel&apos;s Property Management
        System calls when a booking is confirmed.
      </p>
    </div>
  );
}

/* ─── Main export ─── */

export default function AddStayDialog({
  open,
  onOpenChange,
  userId,
  onActivated,
}: AddStayDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<DialogTab>('demo');
  const [form, setForm] = useState<StayFormData>(INITIAL_FORM);
  const [step, setStep] = useState<1 | 2>(1);

  const updateField = useCallback(
    (field: keyof StayFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      // Future: POST to API
      onOpenChange(false);
      setForm(INITIAL_FORM);
      setStep(1);
    },
    [onOpenChange],
  );

  const handleNext = useCallback(() => {
    setStep(2);
  }, []);

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setForm(INITIAL_FORM);
    setStep(1);
    setActiveTab('demo');
  }, [onOpenChange]);

  const handleDemoSuccess = useCallback(() => {
    handleClose();
    onActivated?.();
  }, [handleClose, onActivated]);

  const canProceed = form.country && form.city && form.hotelName && form.checkIn && form.checkOut && form.checkOut > form.checkIn;

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
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                {...overlayMotion}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                {...contentMotion}
              >
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] shadow-medium">
                  {/* Header */}
                  <div className="sticky top-0 z-10 bg-[var(--dashboard-card-bg)] border-b border-[var(--dashboard-border-subtle)] px-8 py-5 flex items-center justify-between">
                    <div>
                      <Dialog.Title className="font-serif text-xl text-[var(--dashboard-text-primary)]">
                        Add Your Stay
                      </Dialog.Title>
                      <Dialog.Description className="text-[12px] text-[var(--dashboard-text-faint)] mt-1">
                        {activeTab === 'demo'
                          ? 'Activate a demo property via PMS webhook'
                          : step === 1
                          ? 'Tell us about your destination'
                          : 'Additional details & preferences'}
                      </Dialog.Description>
                    </div>

                    <Dialog.Close asChild>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg bg-[var(--dashboard-surface-raised)] border border-[var(--dashboard-border-subtle)] flex items-center justify-center text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-muted)] transition-colors cursor-pointer"
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

                  {/* Tab switcher */}
                  <div className="px-8 pt-5 flex gap-1 bg-[var(--dashboard-card-bg)]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('demo')}
                      className={`px-4 py-2 rounded-lg text-[12px] font-medium tracking-wide transition-colors cursor-pointer ${
                        activeTab === 'demo'
                          ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30'
                          : 'text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-muted)]'
                      }`}
                    >
                      Demo Stays
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className={`px-4 py-2 rounded-lg text-[12px] font-medium tracking-wide transition-colors cursor-pointer ${
                        activeTab === 'manual'
                          ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30'
                          : 'text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-muted)]'
                      }`}
                    >
                      Manual Entry
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-8 py-6">
                    {activeTab === 'demo' ? (
                      userId ? (
                        <DemoActivationPanel
                          userId={userId}
                          onSuccess={handleDemoSuccess}
                        />
                      ) : (
                        <p className="text-[13px] text-[var(--dashboard-text-faint)] text-center py-8">
                          Demo activation requires you to be logged in.
                        </p>
                      )
                    ) : (
                      <>
                        {/* Step indicators */}
                        <div className="flex items-center gap-2 mb-6">
                          <div
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              step >= 1
                                ? 'bg-[var(--gold)]'
                                : 'bg-[var(--dashboard-border-subtle)]'
                            }`}
                          />
                          <div
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              step >= 2
                                ? 'bg-[var(--gold)]'
                                : 'bg-[var(--dashboard-border-subtle)]'
                            }`}
                          />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                          {step === 1 ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <FormField label="Country" required>
                                  <input
                                    type="text"
                                    value={form.country}
                                    onChange={(e) =>
                                      updateField('country', e.target.value)
                                    }
                                    className={inputClassName}
                                    placeholder="e.g. France"
                                  />
                                </FormField>
                                <FormField label="City" required>
                                  <input
                                    type="text"
                                    value={form.city}
                                    onChange={(e) =>
                                      updateField('city', e.target.value)
                                    }
                                    className={inputClassName}
                                    placeholder="e.g. Paris"
                                  />
                                </FormField>
                              </div>

                              <FormField label="Hotel Name" required>
                                <input
                                  type="text"
                                  value={form.hotelName}
                                  onChange={(e) =>
                                    updateField('hotelName', e.target.value)
                                  }
                                  className={inputClassName}
                                  placeholder="e.g. Le Bristol"
                                />
                              </FormField>

                              <div className="grid grid-cols-2 gap-3">
                                <FormField label="Check-in" required>
                                  <input
                                    type="date"
                                    value={form.checkIn}
                                    onChange={(e) =>
                                      updateField('checkIn', e.target.value)
                                    }
                                    className={inputClassName}
                                  />
                                </FormField>
                                <FormField label="Check-out" required>
                                  <input
                                    type="date"
                                    value={form.checkOut}
                                    onChange={(e) =>
                                      updateField('checkOut', e.target.value)
                                    }
                                    className={inputClassName}
                                  />
                                </FormField>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <FormField label="Guests">
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={form.guests}
                                    onChange={(e) =>
                                      updateField('guests', e.target.value)
                                    }
                                    className={inputClassName}
                                  />
                                </FormField>
                                <FormField label="Trip Type">
                                  <select
                                    value={form.tripType}
                                    onChange={(e) =>
                                      updateField('tripType', e.target.value)
                                    }
                                    className={selectClassName}
                                  >
                                    <option value="">Select…</option>
                                    {TRIP_TYPES.map((t) => (
                                      <option key={t} value={t}>
                                        {t}
                                      </option>
                                    ))}
                                  </select>
                                </FormField>
                              </div>

                              <div className="pt-4 flex justify-end">
                                <button
                                  type="button"
                                  onClick={handleNext}
                                  disabled={!canProceed}
                                  className="h-11 px-8 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[13px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                  Continue
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <FormField label="Room Type">
                                <input
                                  type="text"
                                  value={form.roomType}
                                  onChange={(e) =>
                                    updateField('roomType', e.target.value)
                                  }
                                  className={inputClassName}
                                  placeholder="e.g. Deluxe Suite"
                                />
                              </FormField>

                              <FormField label="Booking Reference">
                                <input
                                  type="text"
                                  value={form.bookingReference}
                                  onChange={(e) =>
                                    updateField('bookingReference', e.target.value)
                                  }
                                  className={inputClassName}
                                  placeholder="e.g. BK-12345"
                                />
                              </FormField>

                              <div className="grid grid-cols-2 gap-3">
                                <FormField label="Hotel Email">
                                  <input
                                    type="email"
                                    value={form.contactEmail}
                                    onChange={(e) =>
                                      updateField('contactEmail', e.target.value)
                                    }
                                    className={inputClassName}
                                    placeholder="hotel@example.com"
                                  />
                                </FormField>
                                <FormField label="Hotel Phone / WhatsApp">
                                  <input
                                    type="tel"
                                    value={form.contactPhone}
                                    onChange={(e) =>
                                      updateField('contactPhone', e.target.value)
                                    }
                                    className={inputClassName}
                                    placeholder="+33 1 234 567"
                                  />
                                </FormField>
                              </div>

                              <FormField label="Notes & Preferences">
                                <textarea
                                  value={form.notes}
                                  onChange={(e) =>
                                    updateField('notes', e.target.value)
                                  }
                                  rows={4}
                                  className="w-full px-4 py-3 rounded-lg bg-[var(--dashboard-input-bg)] border border-[var(--dashboard-card-border)] text-[14px] text-[var(--dashboard-text-primary)] placeholder:text-[var(--dashboard-text-faint)] focus:outline-none focus:border-[var(--gold)]/40 focus:ring-1 focus:ring-[var(--gold)]/15 transition-colors resize-none"
                                  placeholder="Any special requests, dietary needs, accessibility requirements…"
                                />
                              </FormField>

                              <div className="pt-4 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={handleBack}
                                  className="text-[13px] text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-secondary)] transition-colors cursor-pointer"
                                >
                                  ← Back
                                </button>
                                <button
                                  type="submit"
                                  className="h-11 px-8 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[13px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] transition-colors cursor-pointer"
                                >
                                  Add Stay
                                </button>
                              </div>
                            </div>
                          )}
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

