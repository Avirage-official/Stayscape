'use client';

import { useState, useRef, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const AGE_BANDS = [
  { value: 'under_20', label: 'Under 20' },
  { value: '20_25', label: '20–25' },
  { value: '26_30', label: '26–30' },
  { value: '31_40', label: '31–40' },
  { value: '41_55', label: '41–55' },
  { value: '56_plus', label: '56+' },
] as const;

const AGE_REACTIONS: Record<string, string> = {
  under_20: "Ah, the best is all ahead of you — let's make it count.",
  '20_25': "Oh, to have that energy — we're going to have fun.",
  '26_30': 'A wonderful age to explore — you know what you like now.',
  '31_40': 'Prime time. Old enough to do it right, young enough to do it all.',
  '41_55': 'The era of travelling well — I approve.',
  '56_plus': "The finest traveller there is — you've earned the good stuff.",
};

const NOVELTY_OPTIONS = [
  { value: 'adventurous', label: 'Adventurous' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'comfortable', label: 'Comfortable' },
] as const;

const VIBE_OPTIONS = [
  { value: 'city', label: 'City' },
  { value: 'culture', label: 'Culture' },
  { value: 'nature', label: 'Nature' },
  { value: 'beach', label: 'Beach' },
  { value: 'mixed', label: 'Mixed' },
] as const;

const DISCOVERY_OPTIONS = [
  { value: 'icons', label: 'Icons' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'mix', label: 'Mix' },
] as const;

const FOOD_OPTIONS = [
  { value: 'street', label: 'Street' },
  { value: 'sit_down', label: 'Sit-down' },
  { value: 'easy', label: 'Easy' },
  { value: 'food_first', label: 'Food first' },
] as const;

const PLANNING_OPTIONS = [
  { value: 'planner', label: 'Planner' },
  { value: 'loose', label: 'Loose' },
  { value: 'improviser', label: 'Improviser' },
] as const;

const SPEND_OPTIONS = [
  { value: 'simple', label: 'Simple' },
  { value: 'quality', label: 'Quality' },
  { value: 'all_out', label: 'All out' },
] as const;

const DEALBREAKER_OPTIONS = [
  { value: 'rushed', label: 'Rushed' },
  { value: 'crowds', label: 'Crowds' },
  { value: 'bad_food', label: 'Bad food' },
  { value: 'downtime', label: 'Downtime' },
  { value: 'overspending', label: 'Overspending' },
  { value: 'chaos', label: 'Chaos' },
] as const;

type Step =
  | 'greeting'
  | 'name'
  | 'age_band'
  | 'location'
  | 'location_bridge'
  | 'q_novelty'
  | 'q_vibe'
  | 'q_discovery'
  | 'q_food'
  | 'q_planning'
  | 'q_spend'
  | 'q_dealbreakers'
  | 'close';

const QUESTION_STEPS: Step[] = [
  'q_novelty',
  'q_vibe',
  'q_discovery',
  'q_food',
  'q_planning',
  'q_spend',
  'q_dealbreakers',
];

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#FAF7F2',
  text: '#2C1A08',
  soft: 'rgba(44,26,8,0.55)',
  muted: 'rgba(44,26,8,0.35)',
  amber: '#C17F3A',
  amberHover: '#D6A252',
  border: 'rgba(193,127,58,0.28)',
  white: '#FFFFFF',
  textOnImage: '#FAF8F5',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLocation(raw: string): { city: string; country: string } {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1] };
  }
  return { city: raw.trim(), country: '' };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Btn({
  onClick,
  disabled,
  children,
  variant = 'primary',
  fullWidth = true,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const base: CSSProperties = {
    height: '50px',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background 0.18s, border-color 0.18s',
    opacity: disabled ? 0.4 : 1,
    outline: 'none',
    width: fullWidth ? '100%' : undefined,
    border: 'none',
    letterSpacing: '0.01em',
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      background: hovered && !disabled ? C.amberHover : C.amber,
      color: '#FAF7F2',
      padding: '0 24px',
    },
    ghost: {
      background: 'transparent',
      color: C.soft,
      border: `1.5px solid ${C.border}`,
      padding: '0 20px',
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
}

function TextOption({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '48px',
        borderRadius: '12px',
        border: `1.5px solid ${selected ? C.amber : C.border}`,
        background: selected
          ? 'rgba(193,127,58,0.09)'
          : hovered
            ? 'rgba(193,127,58,0.04)'
            : C.white,
        color: selected ? C.amber : disabled ? C.muted : C.text,
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '14px',
        fontWeight: selected ? 600 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s ease',
        outline: 'none',
        opacity: disabled && !selected ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  );
}

function ImageTile({
  src,
  label,
  selected,
  onClick,
}: {
  src: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '4 / 5',
        borderRadius: '16px',
        overflow: 'hidden',
        border: `2.5px solid ${selected ? C.amber : 'transparent'}`,
        cursor: 'pointer',
        background: imgError
          ? 'linear-gradient(135deg, #E8D5B8 0%, #D4B896 100%)'
          : '#2C1A08',
        outline: 'none',
        transition: 'border-color 0.18s',
        padding: 0,
        display: 'block',
        width: '100%',
      }}
    >
      {!imgError ? (
        <>
          <img
            src={src}
            alt={label}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)',
              padding: '28px 12px 14px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontSize: '18px',
                fontWeight: 500,
                color: C.textOnImage,
                display: 'block',
              }}
            >
              {label}
            </span>
          </div>
        </>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '4 / 5',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontStyle: 'italic',
              fontSize: '18px',
              fontWeight: 500,
              color: C.text,
              padding: '8px',
              textAlign: 'center',
            }}
          >
            {label}
          </span>
        </div>
      )}
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(193, 127, 58, 0.22)',
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ProfileOnboardingFlowProps {
  userId: string;
  onCompleted: () => void;
}

export default function ProfileOnboardingFlow({ userId: _userId, onCompleted }: ProfileOnboardingFlowProps) {
  const [step, setStep] = useState<Step>('greeting');
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [ageBand, setAgeBand] = useState('');
  const [ageReaction, setAgeReaction] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [novelty, setNovelty] = useState('');
  const [vibe, setVibe] = useState('');
  const [discovery, setDiscovery] = useState('');
  const [food, setFood] = useState('');
  const [planning, setPlanning] = useState('');
  const [spend, setSpend] = useState('');
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [step]);

  function advance(to: Step) {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setStep(to);
  }

  function scheduleAdvance(to: Step, ms: number) {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => advance(to), ms);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    const supabase = getSupabaseBrowser();
    let token: string | null = null;
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      token = session?.access_token ?? null;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const { city, country } = parseLocation(locationInput);

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: userName || undefined,
          age_band: ageBand || undefined,
          location_city: city || undefined,
          location_country: country || undefined,
          novelty: novelty || undefined,
          vibe: vibe || undefined,
          discovery: discovery || undefined,
          food: food || undefined,
          planning: planning || undefined,
          spend: spend || undefined,
          dealbreakers: dealbreakers.length ? dealbreakers : undefined,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');

      onCompleted();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save your profile');
    } finally {
      setIsSaving(false);
    }
  }

  const questionIndex = QUESTION_STEPS.indexOf(step);
  const isQuestion = questionIndex !== -1;

  const displayName = userName || 'you';
  const displayCity = locationCity || 'that';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--font-dm-sans)',
        color: C.text,
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @keyframes screenIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes textShake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%     { transform: translateX(-2px) rotate(-0.4deg); }
          30%     { transform: translateX(2px) rotate(0.4deg); }
          50%     { transform: translateX(-2px) rotate(-0.3deg); }
          70%     { transform: translateX(1.5px) rotate(0.3deg); }
          85%     { transform: translateX(-1px) rotate(-0.2deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 0.3; transform: scale(0.85); }
          50%     { opacity: 1;   transform: scale(1); }
        }
      `}</style>

      {/* ── Progress segments fixed at bottom ───────────────────────────── */}
      {isQuestion && (
        <div
          aria-label="Question progress"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(358px, calc(100vw - 32px))',
            display: 'flex',
            gap: '5px',
            zIndex: 10,
          }}
        >
          {QUESTION_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '99px',
                background: i <= questionIndex ? C.amber : 'rgba(193,127,58,0.2)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Screen content ───────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: '390px',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `32px 20px ${isQuestion ? '72px' : '40px'}`,
          boxSizing: 'border-box',
        }}
      >
        <div
          key={step}
          style={{
            animation: 'screenIn 0.35s ease-out both',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
          }}
        >

          {/* ── Greeting ─────────────────────────────────────────────────── */}
          {step === 'greeting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(30px, 8vw, 38px)',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: C.text,
                  margin: 0,
                  animation: 'textShake 0.9s ease-in-out 0.4s',
                }}
              >
                Hello! I&apos;m so happy you&apos;re here.
              </p>
              <Btn onClick={() => advance('name')}>Continue</Btn>
            </div>
          )}

          {/* ── Name input ───────────────────────────────────────────────── */}
          {step === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(26px, 7vw, 32px)',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: C.text,
                  margin: 0,
                }}
              >
                I&apos;m Aria — and you are?
              </p>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nameInput.trim()) {
                    setUserName(nameInput.trim());
                    advance('age_band');
                  }
                }}
                placeholder="Your name"
                autoFocus
                style={{
                  background: C.white,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontSize: '16px',
                  fontFamily: 'var(--font-dm-sans)',
                  color: C.text,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <Btn
                onClick={() => {
                  const n = nameInput.trim();
                  setUserName(n);
                  advance('age_band');
                }}
                disabled={!nameInput.trim()}
              >
                Continue
              </Btn>
            </div>
          )}

          {/* ── Age band ─────────────────────────────────────────────────── */}
          {step === 'age_band' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(24px, 6.5vw, 30px)',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: C.text,
                  margin: 0,
                }}
              >
                Lovely to meet you{userName ? `, ${userName}` : ''}. And roughly which era do I have the pleasure of?
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                }}
              >
                {AGE_BANDS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={ageBand === value}
                    onClick={() => {
                      if (ageBand) return;
                      setAgeBand(value);
                      setAgeReaction(AGE_REACTIONS[value] ?? '');
                      scheduleAdvance('location', 1700);
                    }}
                  />
                ))}
              </div>
              {ageReaction && (
                <p
                  key={ageReaction}
                  style={{
                    fontSize: '15px',
                    fontStyle: 'italic',
                    color: C.amber,
                    margin: 0,
                    lineHeight: 1.5,
                    animation: 'fadeIn 0.35s ease-out both',
                  }}
                >
                  {ageReaction}
                </p>
              )}
            </div>
          )}

          {/* ── Location ─────────────────────────────────────────────────── */}
          {step === 'location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(26px, 7vw, 32px)',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: C.text,
                  margin: 0,
                }}
              >
                And where do you call mi casa?
              </p>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && locationInput.trim()) {
                    const { city } = parseLocation(locationInput);
                    setLocationCity(city);
                    advance('location_bridge');
                  }
                }}
                placeholder="City, Country"
                autoFocus
                style={{
                  background: C.white,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontSize: '16px',
                  fontFamily: 'var(--font-dm-sans)',
                  color: C.text,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <Btn
                onClick={() => {
                  const { city } = parseLocation(locationInput);
                  setLocationCity(city);
                  advance('location_bridge');
                }}
                disabled={!locationInput.trim()}
              >
                Continue
              </Btn>
            </div>
          )}

          {/* ── Location bridge ──────────────────────────────────────────── */}
          {step === 'location_bridge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(26px, 7vw, 32px)',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  {displayCity} — noted. Perfect. Thank you, {displayName}.
                </p>
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.65,
                    color: C.soft,
                    margin: 0,
                  }}
                >
                  Now — the real questions. This is how I learn your taste, so every place and plan I suggest actually fits you.{' '}
                  <span style={{ color: C.amber, fontStyle: 'italic' }}>
                    I&apos;m a little too excited for this.
                  </span>
                </p>
              </div>
              <Btn onClick={() => advance('q_novelty')}>Let&apos;s go</Btn>
            </div>
          )}

          {/* ── Q1 novelty ───────────────────────────────────────────────── */}
          {step === 'q_novelty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(22px, 6vw, 27px)',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: C.text,
                  margin: 0,
                }}
              >
                New place, new food, new everything — thrilling, or a bit much?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {NOVELTY_OPTIONS.map(({ value, label }) => (
                  <ImageTile
                    key={value}
                    src={`/onboarding/novelty/${value}.jpg`}
                    label={label}
                    selected={novelty === value}
                    onClick={() => {
                      if (novelty) return;
                      setNovelty(value);
                      scheduleAdvance('q_vibe', 560);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q2 vibe ──────────────────────────────────────────────────── */}
          {step === 'q_vibe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(22px, 6vw, 27px)',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: C.text,
                  margin: 0,
                }}
              >
                If you could return to one kind of place again and again — where&apos;s pulling you?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {VIBE_OPTIONS.map(({ value, label }) => (
                  <ImageTile
                    key={value}
                    src={`/onboarding/vibe/${value}.jpg`}
                    label={label}
                    selected={vibe === value}
                    onClick={() => {
                      if (vibe) return;
                      setVibe(value);
                      scheduleAdvance('q_discovery', 560);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q3 discovery ─────────────────────────────────────────────── */}
          {step === 'q_discovery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(22px, 6vw, 27px)',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: C.text,
                  margin: 0,
                }}
              >
                Somewhere new — the famous must-sees, or the things only locals know?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {DISCOVERY_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={discovery === value}
                    onClick={() => {
                      if (discovery) return;
                      setDiscovery(value);
                      scheduleAdvance('q_food', 500);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q4 food ──────────────────────────────────────────────────── */}
          {step === 'q_food' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(22px, 6vw, 27px)',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: C.text,
                  margin: 0,
                }}
              >
                And a great meal away is…?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {FOOD_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={food === value}
                    onClick={() => {
                      if (food) return;
                      setFood(value);
                      scheduleAdvance('q_planning', 500);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q5 planning ──────────────────────────────────────────────── */}
          {step === 'q_planning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(22px, 6vw, 27px)',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: C.text,
                  margin: 0,
                }}
              >
                Before a trip — spreadsheet, or wing it?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {PLANNING_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={planning === value}
                    onClick={() => {
                      if (planning) return;
                      setPlanning(value);
                      scheduleAdvance('q_spend', 500);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q6 spend ─────────────────────────────────────────────────── */}
          {step === 'q_spend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(22px, 6vw, 27px)',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: C.text,
                  margin: 0,
                }}
              >
                When you treat yourself away, it&apos;s usually…
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {SPEND_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={spend === value}
                    onClick={() => {
                      if (spend) return;
                      setSpend(value);
                      scheduleAdvance('q_dealbreakers', 500);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q7 dealbreakers ──────────────────────────────────────────── */}
          {step === 'q_dealbreakers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(22px, 6vw, 27px)',
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  Be honest — what quietly ruins a trip for you?
                </p>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
                  Choose up to 2
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {DEALBREAKER_OPTIONS.map(({ value, label }) => {
                  const selected = dealbreakers.includes(value);
                  const disabled = !selected && dealbreakers.length >= 2;
                  return (
                    <TextOption
                      key={value}
                      label={label}
                      selected={selected}
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        setDealbreakers((prev) =>
                          prev.includes(value)
                            ? prev.filter((v) => v !== value)
                            : [...prev, value],
                        );
                      }}
                    />
                  );
                })}
              </div>
              <Btn
                onClick={() => {
                  advance('close');
                  void handleSave();
                }}
              >
                Continue
              </Btn>
            </div>
          )}

          {/* ── Close / saving ───────────────────────────────────────────── */}
          {step === 'close' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(26px, 7vw, 34px)',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: C.text,
                  margin: 0,
                }}
              >
                That&apos;s all I need{userName ? `, ${userName}` : ''}. I&apos;ve got a real feel for you now — let&apos;s go find your kind of places.
              </p>

              {isSaving && !saveError && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: C.amber,
                        animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}

              {saveError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'rgba(180,40,40,0.8)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {saveError}
                  </p>
                  <Btn
                    fullWidth={false}
                    onClick={() => { void handleSave(); }}
                  >
                    Try again
                  </Btn>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
