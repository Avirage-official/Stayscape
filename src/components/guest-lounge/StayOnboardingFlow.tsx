'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { CustomerStay } from '@/types/customer';

const TRIP_TYPES = ['solo', 'couple', 'family', 'friends', 'business', 'celebration'] as const;
const INTERESTS = ['food', 'sightseeing', 'shopping', 'nightlife', 'nature', 'wellness', 'culture', 'family_activities'] as const;
const PACE_OPTIONS = ['relaxed', 'balanced', 'packed'] as const;
const FOOD_OPTIONS = ['local_food', 'fine_dining', 'cafes', 'bars', 'vegetarian', 'halal', 'family_friendly'] as const;
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
    const response = await fetch(`/api/customer/stays/${encodeURIComponent(stay.id)}/onboarding?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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

  async function handleNextTripType() {
    if (!tripType) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await sendAction({ action: 'set_trip_type', trip_type: tripType });
      setStep('interests');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save trip type');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNextInterests() {
    setIsSubmitting(true);
    setError(null);
    try {
      await sendAction({
        action: 'set_preference',
        preference_type: 'interests',
        preference_data: { values: interests },
      });
      setStep('pace');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save interests');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNextPace() {
    if (!pace) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await sendAction({
        action: 'set_preference',
        preference_type: 'pace',
        preference_data: { value: pace },
      });
      setStep('food_preferences');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save pace');
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
        action: 'set_preference',
        preference_type: 'food_preferences',
        preference_data: { values: foodPreferences },
      });
      await sendAction({ action });
      setStep('complete');
      onCompleted();
    } catch (submitError) {
      setCurationFailed(true);
      setError(submitError instanceof Error ? submitError.message : 'Unable to start curation');
    } finally {
      setIsSubmitting(false);
    }
  }

  const panelMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28 },
      };

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]/70">Stay onboarding</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={progressStep}>
            <motion.div
              className="h-full rounded-full bg-[var(--gold)]"
              animate={{ width: `${(progressStep / TOTAL_STEPS) * 100}%` }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section key={step} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8" {...panelMotion}>
            {step === 'confirm' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-serif text-3xl text-white">Yay — we found your stay.</h1>
                  <p className="mt-2 text-sm text-white/65">Is this your stay?</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                  <p className="font-medium text-white">{stay.property?.name ?? 'Your hotel'}</p>
                  <p className="mt-1 text-white/60">{[stay.property?.city, stay.property?.country].filter(Boolean).join(', ') || 'Location unavailable'}</p>
                  <p className="mt-3">Check-in: {formatDate(stay.check_in)} · Check-out: {formatDate(stay.check_out)}</p>
                  {stay.room_type ? <p className="mt-1">Room: {stay.room_type}</p> : null}
                  {stay.booking_reference ? <p className="mt-1">Booking ref: {stay.booking_reference}</p> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => void handleConfirm(true)} disabled={isSubmitting} className="h-11 rounded-xl bg-[var(--gold)] px-4 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:opacity-50">
                    Yes, that&apos;s right
                  </button>
                  <button type="button" onClick={() => void handleConfirm(false)} disabled={isSubmitting} className="h-11 rounded-xl border border-white/20 bg-white/[0.02] px-4 text-sm font-medium text-white/90 transition hover:border-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50">
                    No, this looks wrong
                  </button>
                </div>
                {isIncorrect ? (
                  <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">
                    <p className="font-medium">Thanks for flagging this.</p>
                    <p className="mt-1 text-amber-100/80">Our hotel team can help fix your booking details before we personalise anything.</p>
                    <a href={`mailto:hello@stayscape.app?subject=${encodeURIComponent(`Help with stay ${stay.booking_reference ?? stay.id}`)}`} className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-amber-200 px-4 text-xs font-semibold text-black transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100">
                      Contact hotel
                    </a>
                  </div>
                ) : null}
              </div>
            )}

            {step === 'welcome' && (
              <div className="space-y-6 text-center">
                <h1 className="font-serif text-3xl text-white">We&apos;d love to make this trip amazing for you.</h1>
                <p className="text-sm text-white/65">Just a few quick details so we can personalise everything.</p>
                <button type="button" onClick={() => setStep('trip_type')} className="h-11 rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                  Let&apos;s personalise your trip
                </button>
              </div>
            )}

            {step === 'trip_type' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl">What kind of trip is this?</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TRIP_TYPES.map((option) => {
                    const active = tripType === option;
                    return (
                      <button key={option} type="button" onClick={() => setTripType(option)} className={`h-11 rounded-xl border text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] focus-visible:outline-[var(--gold)]' : 'border-white/15 bg-white/[0.02] text-white/80 hover:border-white/30 focus-visible:outline-white'}`}>
                        {prettyLabel(option)}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => void handleNextTripType()} disabled={!tripType || isSubmitting} className="h-11 rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50">
                  Continue
                </button>
              </div>
            )}

            {step === 'interests' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl">What are you most in the mood for?</h2>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((option) => {
                    const active = interests.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setInterests((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]))}
                        className={`rounded-full border px-3 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] focus-visible:outline-[var(--gold)]' : 'border-white/20 bg-white/[0.02] text-white/80 hover:border-white/35 focus-visible:outline-white'}`}
                      >
                        {prettyLabel(option)}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => void handleNextInterests()} disabled={isSubmitting} className="h-11 rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50">
                  Continue
                </button>
              </div>
            )}

            {step === 'pace' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl">How would you like your days to feel?</h2>
                <div className="grid gap-2 sm:grid-cols-3">
                  {PACE_OPTIONS.map((option) => {
                    const active = pace === option;
                    return (
                      <button key={option} type="button" onClick={() => setPace(option)} className={`h-11 rounded-xl border text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] focus-visible:outline-[var(--gold)]' : 'border-white/15 bg-white/[0.02] text-white/80 hover:border-white/30 focus-visible:outline-white'}`}>
                        {prettyLabel(option)}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => void handleNextPace()} disabled={!pace || isSubmitting} className="h-11 rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50">
                  Continue
                </button>
              </div>
            )}

            {step === 'food_preferences' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl">Any food preferences we should keep in mind?</h2>
                <div className="flex flex-wrap gap-2">
                  {FOOD_OPTIONS.map((option) => {
                    const active = foodPreferences.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFoodPreferences((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]))}
                        className={`rounded-full border px-3 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] focus-visible:outline-[var(--gold)]' : 'border-white/20 bg-white/[0.02] text-white/80 hover:border-white/35 focus-visible:outline-white'}`}
                      >
                        {prettyLabel(option)}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => void completeOnboarding('complete_onboarding')} disabled={isSubmitting} className="h-11 rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50">
                  Perfect — curate my stay
                </button>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-3 text-center">
                <h2 className="font-serif text-3xl">Perfect — we&apos;re curating your stay.</h2>
                <p className="text-sm text-white/65">You&apos;re all set. We&apos;re preparing recommendations tailored to your trip.</p>
              </div>
            )}

            {curationFailed ? (
              <div className="mt-6 rounded-2xl border border-red-300/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-100">We couldn&apos;t finish curation just yet.</p>
                <button type="button" onClick={() => void completeOnboarding('retry_curation')} disabled={isSubmitting} className="mt-3 h-10 rounded-lg border border-red-200/50 px-4 text-xs font-semibold text-red-100 transition hover:bg-red-200/10 disabled:opacity-50">
                  Retry curation
                </button>
              </div>
            ) : null}

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
