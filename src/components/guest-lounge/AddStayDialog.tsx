'use client';

import { useState, type FormEvent, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

interface AddStayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function AddStayDialog({
  open,
  onOpenChange,
}: AddStayDialogProps) {
  const prefersReducedMotion = useReducedMotion();
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
                        {step === 1
                          ? 'Tell us about your destination'
                          : 'Additional details & preferences'}
                      </Dialog.Description>
                    </div>

                    <Dialog.Close asChild>
                      <button
                        type="button"
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

                  {/* Step indicators */}
                  <div className="px-8 pt-5 flex items-center gap-2">
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
                  <form onSubmit={handleSubmit} className="px-8 py-6">
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

                        {/* Step 1 actions */}
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

                        {/* Step 2 actions */}
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
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
