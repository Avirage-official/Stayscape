'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { CustomerStay } from '@/types/customer';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const TRIP_TYPES = ['solo', 'couple', 'family', 'friends', 'business', 'celebration'] as const;
const INTERESTS = ['food', 'sightseeing', 'shopping', 'nightlife', 'nature', 'wellness', 'culture', 'family_activities'] as const;
const PACE_OPTIONS = ['relaxed', 'balanced', 'packed'] as const;
const FOOD_OPTIONS = ['local_food', 'fine_dining', 'cafes', 'bars', 'vegetarian', 'halal', 'family_friendly'] as const;
const MAX_INTERESTS = 3;
const MAX_FOOD = 3;
const TOTAL_STEPS = 6;

type Step = 'confirm' | 'welcome' | 'trip_type' | 'interests' | 'pace' | 'food_preferences' | 'complete';

interface StayOnboardingFlowProps {
  stay: CustomerStay;
  userId: string;
  onCompleted: () => void;
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function prettyLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/* ── Chip component ────────────────────────────────────────────── */

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.94 }}
      className={`
        rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-200
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        ${active
          ? 'border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)] shadow-[0_0_12px_rgba(201,168,76,0.15)] focus-visible:outline-[var(--gold)]'
          : disabled
            ? 'cursor-not-allowed border-white/10 bg-white/[0.01] text-white/25'
            : 'cursor-pointer border-white/20 bg-white/[0.04] text-white/75 hover:border-white/40 hover:text-white focus-visible:outline-white'
        }
      `}
    >
      {label}
    </motion.button>
  );
}

/* ── Card button (trip type / pace) ───────────────────────────── */

function CardButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`
        h-12 rounded-xl border text-[14px] font-medium transition-all duration-200
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer
        ${active
          ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] shadow-[0_0_16px_rgba(201,168,76,0.12)] focus-visible:outline-[var(--gold)]'
          : 'border-white/15 bg-white/[0.04] text-white/75 hover:border-white/30 hover:text-white focus-visible:outline-white'
        }
      `}
    >
      {label}
    </motion.button>
  );
}

/* ── Main export ───────────────────────────────────────────────── */

export default function StayOnboardingFlow({ stay, userId, onCompleted }: StayOnboardingFlowProps) {
  const prefersReducedMotion = useReducedMotion();

  const [step, setStep] = useState<Step>(
    stay.stay_confirmation_status === 'confirmed' ? 'welcome' : 'confirm',
  );
  const [tripType, setTripType] = useState<string>(stay.trip_type ?? '');
  const [interests, setInterests] = useState<string[]>([]);
  const [pace, setPace] = useState<string>('');
  const [foodPreferences, setFoodPreferences] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIncorrect, setIsIncorrect] = useState(stay.stay_confirmation_status === 'incorrect');
  const [curationFailed, setCurationFailed] = useState(stay.curation_status === 'failed');

  const progressStep = useMemo(() => {
    const map: Record<Step, number> = {
      confirm: 1,
      welcome: 1,
      trip_type: 2,
      interests: 3,
      pace: 4,
      food_preferences: 5,
      complete: 6,
    };
    return map[step];
  }, [step]);

  async function sendAction(payload: Record<string, unknown>) {
    const response = await fetch(
      `/api/customer/stays/${encodeURIComponent(stay.id)}/onboarding?userId=${encodeURIComponent(userId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(json.error ?? 'Something went wrong');
    }
  }

  async function handleConfirm(confirmed: boolean) {
    setIsSubmitting(true);
    setError(null);
    try {
      await sendAction({ action: 'confirm_stay', confirmed });
      if (!confirmed) {
        setIsIncorrect(true);
        return;
      }
      setIsIncorrect(false);
      setStep('welcome');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to confirm stay');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeOnboarding(action: 'complete_onboarding' | 'retry_curation') {
    setIsSubmitting(true);
    setError(null);
    setCurationFailed(false);
    try {
      await sendAction({
        action,
        ...(action === 'complete_onboarding'
          ? { trip_type: tripType, interests, pace, food_preferences: foodPreferences }
          : {}),
      });
      setStep('complete');
      onCompleted();
    } catch (submitError) {
      setCurationFailed(true);
      setError(submitError instanceof Error ? submitError.message : 'Unable to start curation');
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Motion config ──────────────────────────────────────────── */

  const panelMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.3, ease: EASE_OUT_EXPO },
      };

  /* ── Helper: max-N chip toggle ──────────────────────────────── */

  function toggleChip(
    value: string,
    setter: (fn: (prev: string[]) => string[]) => void,
    max: number,
  ) {
    setter((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      if (prev.length >= max) return prev;
      return [...prev, value];
    });
  }

  /* ── Layout ──────────────────────────────────────────────────── */

  return (
    <div className="relative min-h-[100dvh] text-white overflow-x-hidden">
      {/* Cinematic background */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&q=80&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Layered overlay: dark gradient from bottom, solid top, warm middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
        <div className="absolute inset-0 bg-[#0a0a0f]/40" />
      </div>

      {/* Full-height flex container: centers card vertically on desktop,
          natural scroll on mobile */}
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Inner constrained width */}
        <div className="w-full max-w-[480px]">

          {/* Progress bar (hidden on complete + confirm) */}
          {step !== 'complete' && (
            <div className="mb-6 px-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]/60 mb-3 font-medium">
                Stay onboarding
              </p>
              <div
                className="h-1 w-full rounded-full bg-white/10"
                role="progressbar"
                aria-label="Onboarding progress"
                aria-valuemin={1}
                aria-valuemax={TOTAL_STEPS}
                aria-valuenow={progressStep}
              >
                <motion.div
                  className="h-full rounded-full bg-[var(--gold)]"
                  animate={{ width: `${(progressStep / TOTAL_STEPS) * 100}%` }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Step card */}
          <AnimatePresence mode="wait">
            <motion.section
              key={step}
              className="rounded-3xl border border-white/[0.10] bg-black/50 backdrop-blur-2xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-8"
              {...panelMotion}
            >

              {/* ── STEP: confirm ─────────────────────────────── */}
              {step === 'confirm' && (
                <div className="space-y-6">
                  <div>
                    <motion.h1
                      className="font-serif text-[28px] sm:text-[32px] text-white leading-snug"
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      Yay — we found your stay. ✨
                    </motion.h1>
                    <p className="mt-2 text-[14px] text-white/60">
                      Is this your stay?
                    </p>
                  </div>

                  {/* Stay details card */}
                  <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] p-4 text-[14px] space-y-1.5">
                    <p className="font-semibold text-white text-[16px]">
                      {stay.property?.name ?? 'Your hotel'}
                    </p>
                    <p className="text-white/55">
                      {[stay.property?.city, stay.property?.country].filter(Boolean).join(', ') || 'Location unavailable'}
                    </p>
                    <div className="pt-1 border-t border-white/[0.07] mt-2 space-y-1 text-white/70">
                      <p>Check-in: <span className="text-white/90">{formatDate(stay.check_in)}</span></p>
                      <p>Check-out: <span className="text-white/90">{formatDate(stay.check_out)}</span></p>
                      {stay.room_type ? <p>Room: <span className="text-white/90">{stay.room_type}</span></p> : null}
                      {stay.booking_reference ? <p>Ref: <span className="text-white/90">{stay.booking_reference}</span></p> : null}
                    </div>
                  </div>

                  {/* Confirmation buttons */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleConfirm(true)}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl bg-[var(--gold)] px-4 text-[14px] font-semibold text-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:opacity-50 cursor-pointer"
                    >
                      Yes, that&apos;s right
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirm(false)}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl border border-white/20 bg-white/[0.04] px-4 text-[14px] font-medium text-white/85 transition hover:border-white/35 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 cursor-pointer"
                    >
                      No, this looks wrong
                    </button>
                  </div>

                  {/* Incorrect stay notice */}
                  {isIncorrect && (
                    <motion.div
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-[13px] text-amber-100"
                    >
                      <p className="font-semibold text-amber-200">Thanks for flagging this.</p>
                      <p className="mt-1 text-amber-100/75 leading-relaxed">
                        Our hotel team can help correct your booking details. Reach out and we&apos;ll sort it together.
                      </p>
                      <a
                        href={`mailto:hello@stayscape.app?subject=${encodeURIComponent(`Help with stay ${stay.booking_reference ?? stay.id}`)}`}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-amber-200 px-4 text-[12px] font-semibold text-black transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100"
                      >
                        Contact hotel support
                      </a>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── STEP: welcome ─────────────────────────────── */}
              {step === 'welcome' && (
                <div className="space-y-6 text-center">
                  <motion.div
                    initial={prefersReducedMotion ? {} : { scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                    className="mx-auto w-14 h-14 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 flex items-center justify-center text-2xl"
                  >
                    ✦
                  </motion.div>
                  <div className="space-y-2">
                    <h1 className="font-serif text-[28px] sm:text-[32px] text-white leading-snug">
                      Let&apos;s make this trip feel a little more like yours.
                    </h1>
                    <p className="text-[14px] text-white/55 leading-relaxed">
                      Just a few quick details so we can personalise everything.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('trip_type')}
                    className="h-12 w-full rounded-xl bg-[var(--gold)] px-5 text-[14px] font-semibold text-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] cursor-pointer"
                  >
                    Let&apos;s personalise your trip
                  </button>
                </div>
              )}

              {/* ── STEP: trip_type ───────────────────────────── */}
              {step === 'trip_type' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-[24px] sm:text-[28px] text-white">
                      What kind of trip is this?
                    </h2>
                    <p className="mt-1.5 text-[13px] text-white/50">Pick the one that fits best.</p>
                  </div>

                  <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3">
                    {TRIP_TYPES.map((option) => (
                      <CardButton
                        key={option}
                        label={prettyLabel(option)}
                        active={tripType === option}
                        onClick={() => setTripType(option)}
                      />
                    ))}
                  </div>

                  {/* Sticky CTA */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('welcome')}
                      className="h-12 px-4 rounded-xl border border-white/15 text-[14px] text-white/60 hover:text-white/85 hover:border-white/30 transition cursor-pointer"
                      aria-label="Back"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('interests')}
                      disabled={!tripType}
                      className="flex-1 h-12 rounded-xl bg-[var(--gold)] px-5 text-[14px] font-semibold text-black transition hover:brightness-110 disabled:opacity-40 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: interests ───────────────────────────── */}
              {step === 'interests' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-[24px] sm:text-[28px] text-white">
                      What are you most in the mood for?
                    </h2>
                    <p className="mt-1.5 text-[13px] text-white/50">Choose up to {MAX_INTERESTS}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((option) => {
                      const active = interests.includes(option);
                      const disabled = !active && interests.length >= MAX_INTERESTS;
                      return (
                        <Chip
                          key={option}
                          label={prettyLabel(option)}
                          active={active}
                          disabled={disabled}
                          onClick={() => toggleChip(option, setInterests, MAX_INTERESTS)}
                        />
                      );
                    })}
                  </div>

                  {interests.length >= MAX_INTERESTS && (
                    <p className="text-[12px] text-white/40">
                      {MAX_INTERESTS} selected — remove one to change your picks.
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('trip_type')}
                      className="h-12 px-4 rounded-xl border border-white/15 text-[14px] text-white/60 hover:text-white/85 hover:border-white/30 transition cursor-pointer"
                      aria-label="Back"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('pace')}
                      className="flex-1 h-12 rounded-xl bg-[var(--gold)] px-5 text-[14px] font-semibold text-black transition hover:brightness-110 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: pace ────────────────────────────────── */}
              {step === 'pace' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-[24px] sm:text-[28px] text-white">
                      How would you like your days to feel?
                    </h2>
                    <p className="mt-1.5 text-[13px] text-white/50">Pick your preferred rhythm.</p>
                  </div>

                  <div className="grid gap-2.5 grid-cols-3">
                    {PACE_OPTIONS.map((option) => (
                      <CardButton
                        key={option}
                        label={prettyLabel(option)}
                        active={pace === option}
                        onClick={() => setPace(option)}
                      />
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('interests')}
                      className="h-12 px-4 rounded-xl border border-white/15 text-[14px] text-white/60 hover:text-white/85 hover:border-white/30 transition cursor-pointer"
                      aria-label="Back"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('food_preferences')}
                      disabled={!pace}
                      className="flex-1 h-12 rounded-xl bg-[var(--gold)] px-5 text-[14px] font-semibold text-black transition hover:brightness-110 disabled:opacity-40 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: food_preferences ────────────────────── */}
              {step === 'food_preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-[24px] sm:text-[28px] text-white">
                      Any food preferences we should know?
                    </h2>
                    <p className="mt-1.5 text-[13px] text-white/50">Choose up to {MAX_FOOD}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {FOOD_OPTIONS.map((option) => {
                      const active = foodPreferences.includes(option);
                      const disabled = !active && foodPreferences.length >= MAX_FOOD;
                      return (
                        <Chip
                          key={option}
                          label={prettyLabel(option)}
                          active={active}
                          disabled={disabled}
                          onClick={() => toggleChip(option, setFoodPreferences, MAX_FOOD)}
                        />
                      );
                    })}
                  </div>

                  {foodPreferences.length >= MAX_FOOD && (
                    <p className="text-[12px] text-white/40">
                      {MAX_FOOD} selected — remove one to change your picks.
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('pace')}
                      className="h-12 px-4 rounded-xl border border-white/15 text-[14px] text-white/60 hover:text-white/85 hover:border-white/30 transition cursor-pointer"
                      aria-label="Back"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => void completeOnboarding('complete_onboarding')}
                      disabled={isSubmitting}
                      className="flex-1 h-12 rounded-xl bg-[var(--gold)] px-5 text-[14px] font-semibold text-black transition hover:brightness-110 disabled:opacity-50 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                    >
                      {isSubmitting ? 'Curating…' : 'Perfect — curate my stay'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: complete ────────────────────────────── */}
              {step === 'complete' && (
                <div className="space-y-5 text-center py-4">
                  <motion.div
                    initial={prefersReducedMotion ? {} : { scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                    className="mx-auto w-16 h-16 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/15 flex items-center justify-center text-2xl"
                  >
                    ✦
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="font-serif text-[28px] sm:text-[32px] text-white leading-snug">
                      Perfect — we&apos;re curating your stay now.
                    </h2>
                    <p className="text-[14px] text-white/55 leading-relaxed">
                      We&apos;re preparing personalised recommendations for your trip. This only takes a moment.
                    </p>
                  </div>
                  {/* Animated dots */}
                  <div className="flex justify-center gap-2 pt-2">
                    {[0, 0.18, 0.36].map((delay) => (
                      <motion.div
                        key={delay}
                        className="w-2 h-2 rounded-full bg-[var(--gold)]/60"
                        animate={prefersReducedMotion ? {} : { opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Curation failure banner */}
              {curationFailed && step !== 'complete' && (
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4"
                >
                  <p className="text-[13px] text-red-200 leading-relaxed">
                    We couldn&apos;t finish curation just yet. No worries — give it another go.
                  </p>
                  <button
                    type="button"
                    onClick={() => void completeOnboarding('retry_curation')}
                    disabled={isSubmitting}
                    className="mt-3 h-10 rounded-lg border border-red-200/40 px-4 text-[12px] font-semibold text-red-200 transition hover:bg-red-200/10 disabled:opacity-50 cursor-pointer"
                  >
                    Retry curation
                  </button>
                </motion.div>
              )}

              {/* Inline error */}
              {error && (
                <p className="mt-4 text-[13px] text-red-300 leading-relaxed">{error}</p>
              )}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
