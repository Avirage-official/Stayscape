'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const AGE_BANDS = [
  { value: 'under_20', label: 'Under 20' },
  { value: '20_25',    label: '20–25' },
  { value: '26_30',    label: '26–30' },
  { value: '31_40',    label: '31–40' },
  { value: '41_55',    label: '41–55' },
  { value: '56_plus',  label: '56+' },
] as const;

const AGE_REACTIONS: Record<string, string> = {
  under_20: "Ah, the best is all ahead of you — let's make it count.",
  '20_25':  "Oh, to have that energy — we're going to have fun.",
  '26_30':  'A wonderful age to explore — you know what you like now.',
  '31_40':  'Prime time. Old enough to do it right, young enough to do it all.',
  '41_55':  'The era of travelling well — I approve.',
  '56_plus': "The finest traveller there is — you've earned the good stuff.",
};

const NOVELTY_OPTIONS = [
  { value: 'adventurous', label: 'Adventurous' },
  { value: 'balanced',    label: 'Balanced' },
  { value: 'comfortable', label: 'Comfortable' },
] as const;

const VIBE_OPTIONS = [
  { value: 'city',    label: 'City' },
  { value: 'culture', label: 'Culture' },
  { value: 'nature',  label: 'Nature' },
  { value: 'beach',   label: 'Beach' },
] as const;

const DISCOVERY_OPTIONS = [
  { value: 'icons',  label: 'The classics — I want the must-sees' },
  { value: 'hidden', label: 'Hidden gems — off the tourist trail' },
  { value: 'mix',    label: 'A bit of both' },
] as const;

const FOOD_OPTIONS = [
  { value: 'street',     label: 'Street food & markets' },
  { value: 'sit_down',   label: 'Proper sit-down restaurants' },
  { value: 'easy',       label: 'Easy and unfussy' },
  { value: 'food_first', label: 'Food is the whole point' },
] as const;

const PLANNING_OPTIONS = [
  { value: 'planner',    label: 'Spreadsheet, itinerary, sorted' },
  { value: 'loose',      label: 'Loose outline, room to wander' },
  { value: 'improviser', label: 'Wing it entirely' },
] as const;

const SPEND_OPTIONS = [
  { value: 'simple',  label: 'Keep it simple and sensible' },
  { value: 'quality', label: 'Quality over quantity' },
  { value: 'all_out', label: 'No holding back' },
] as const;

const DEALBREAKER_OPTIONS = [
  { value: 'rushed',       label: 'Feeling rushed' },
  { value: 'crowds',       label: 'Big crowds' },
  { value: 'bad_food',     label: 'Bad food' },
  { value: 'downtime',     label: 'Too much downtime' },
  { value: 'overspending', label: 'Overspending' },
  { value: 'chaos',        label: 'Disorganised chaos' },
] as const;

// Sidecar images — editorial banners above Q3–Q7.
// Drop these files in public/onboarding/scenes/ — warm, cinematic, portrait-friendly crops.
// public/onboarding/scenes/discovery.jpg   — cobbled street, lantern light, intimate
// public/onboarding/scenes/food.jpg        — beautiful food spread, natural market light
// public/onboarding/scenes/planning.jpg    — map on a café table, open notebook
// public/onboarding/scenes/spend.jpg       — elegant hotel terrace or a quiet luxury moment
// public/onboarding/scenes/dealbreakers.jpg — contrast mood image, overcrowded vs serene

const SIDECAR: Partial<Record<Step, string>> = {
  q_discovery:    '/onboarding/scenes/discovery.jpg',
  q_food:         '/onboarding/scenes/food.jpg',
  q_planning:     '/onboarding/scenes/planning.jpg',
  q_spend:        '/onboarding/scenes/spend.jpg',
  q_dealbreakers: '/onboarding/scenes/dealbreakers.jpg',
};

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
  'q_novelty', 'q_vibe', 'q_discovery',
  'q_food', 'q_planning', 'q_spend', 'q_dealbreakers',
];

const ALL_STEPS: Step[] = [
  'greeting', 'name', 'age_band', 'location', 'location_bridge',
  ...QUESTION_STEPS, 'close',
];

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg:         '#FAF7F2',
  text:       '#2C1A08',
  soft:       'rgba(44,26,8,0.55)',
  muted:      'rgba(44,26,8,0.35)',
  amber:      '#C17F3A',
  amberHover: '#D6A252',
  amberAlpha: 'rgba(193,127,58,0.10)',
  border:     'rgba(193,127,58,0.28)',
  white:      '#FFFFFF',
  onImage:    '#FAF8F5',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLocation(raw: string): { city: string; country: string } {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
  return { city: raw.trim(), country: '' };
}

// ── Global CSS ────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @keyframes ob-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes ob-shake {
    0%,100% { transform: translateX(0) rotate(0deg); }
    15%     { transform: translateX(-3px) rotate(-0.5deg); }
    30%     { transform: translateX(3px)  rotate(0.5deg); }
    50%     { transform: translateX(-2px) rotate(-0.3deg); }
    70%     { transform: translateX(2px)  rotate(0.3deg); }
    85%     { transform: translateX(-1px) rotate(-0.15deg); }
  }
  @keyframes ob-dot {
    0%,100% { opacity: 0.25; transform: scale(0.8); }
    50%     { opacity: 1;    transform: scale(1); }
  }
  @keyframes ob-s1 {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-s2 {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-s3 {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ── Sub-components ────────────────────────────────────────────────────────────

function Btn({
  onClick, disabled, children, variant = 'primary', fullWidth = true,
}: {
  onClick: () => void; disabled?: boolean; children: ReactNode;
  variant?: 'primary' | 'ghost'; fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base: CSSProperties = {
    height: '52px',
    borderRadius: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background 0.18s, color 0.18s, border-color 0.18s',
    opacity: disabled ? 0.38 : 1,
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    letterSpacing: '0.01em',
    padding: '0 24px',
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: hovered && !disabled ? C.amberHover : C.amber, color: '#FAF7F2' },
    ghost:   { background: 'transparent', color: hovered ? C.amber : C.soft, border: `1.5px solid ${C.border}` },
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
}

function TextOption({
  label, selected, onClick, disabled,
}: {
  label: string; selected: boolean; onClick: () => void; disabled?: boolean;
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
        minHeight: '50px',
        padding: '12px 16px',
        borderRadius: '14px',
        border: `1.5px solid ${selected ? C.amber : C.border}`,
        background: selected
          ? C.amberAlpha
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
        opacity: disabled && !selected ? 0.4 : 1,
        textAlign: 'left',
        lineHeight: 1.4,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {label}
    </button>
  );
}

function ImageTile({
  src, label, selected, onClick, disabled,
}: {
  src: string; label: string; selected: boolean; onClick: () => void; disabled?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        aspectRatio: '4 / 5',
        borderRadius: '18px',
        overflow: 'hidden',
        border: `2.5px solid ${selected ? C.amber : 'transparent'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: imgError
          ? 'linear-gradient(135deg, #E8D5B8 0%, #C49A5A 100%)'
          : '#1A0E04',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        padding: 0,
        display: 'block',
        width: '100%',
        boxShadow: selected
          ? `0 0 0 2px ${C.amber}, 0 8px 20px rgba(193,127,58,0.3)`
          : '0 4px 14px rgba(20,10,2,0.14)',
        opacity: disabled && !selected ? 0.45 : 1,
      }}
    >
      {!imgError ? (
        <>
          <img
            src={src}
            alt={label}
            onError={() => setImgError(true)}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              display: 'block',
              transform: selected ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.35s ease',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 85%)',
            padding: '32px 14px 16px',
          }} />
          <span style={{
            position: 'absolute', bottom: '14px', left: '14px',
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontSize: '19px',
            fontWeight: 500,
            color: C.onImage,
            pointerEvents: 'none',
          }}>
            {label}
          </span>
        </>
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontSize: '18px',
            fontWeight: 500,
            color: C.text,
            textAlign: 'center',
            padding: '8px',
          }}>
            {label}
          </span>
        </div>
      )}
      {selected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(193,127,58,0.18)',
          pointerEvents: 'none',
          borderRadius: '16px',
        }} />
      )}
    </button>
  );
}

// Sidecar: editorial image banner above a question. Fades into the warm page background.
function SidecarImage({ src }: { src: string }) {
  const [error,  setError]  = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (error) return null; // if image missing, step just shows without it — no ugly gradient
  return (
    <div style={{
      width: 'calc(100% + 40px)',
      marginLeft: '-20px',
      marginRight: '-20px',
      height: '200px',
      marginBottom: '-24px',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <img
        src={src}
        alt=""
        onLoad={()  => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
      {/* fade to page bg so it bleeds softly into content below */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '70%',
        background: `linear-gradient(to bottom, transparent, ${C.bg})`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// Thin amber progress bar at top of screen
function TopProgress({ step }: { step: Step }) {
  const idx = ALL_STEPS.indexOf(step);
  const pct = Math.min(100, (idx / (ALL_STEPS.length - 1)) * 100);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '2px',
      background: 'rgba(193,127,58,0.15)',
      zIndex: 50,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: C.amber,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  );
}

// Shared question headline style
const qHead: CSSProperties = {
  fontFamily: 'var(--font-cormorant)',
  fontStyle: 'italic',
  fontSize: 'clamp(22px, 6vw, 28px)',
  fontWeight: 500,
  lineHeight: 1.35,
  color: '#2C1A08',
  margin: 0,
};

const qCounter: CSSProperties = {
  fontSize: '11px',
  color: '#C17F3A',
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase' as const,
  margin: 0,
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  onCompleted: () => void;
}

export default function ProfileOnboardingFlow({ userId: _userId, onCompleted }: Props) {
  const [step,      setStep]      = useState<Step>('greeting');
  const [animKey,   setAnimKey]   = useState(0);

  const [userName,       setUserName]       = useState('');
  const [nameInput,      setNameInput]      = useState('');
  const [ageBand,        setAgeBand]        = useState('');
  const [ageReaction,    setAgeReaction]    = useState('');
  const [locationInput,  setLocationInput]  = useState('');
  const [locationCity,   setLocationCity]   = useState('');
  const [novelty,        setNovelty]        = useState('');
  const [vibe,           setVibe]           = useState<string[]>([]);
  const [discovery,      setDiscovery]      = useState('');
  const [food,           setFood]           = useState('');
  const [planning,       setPlanning]       = useState('');
  const [spend,          setSpend]          = useState('');
  const [dealbreakers,   setDealbreakers]   = useState<string[]>([]);
  const [isSaving,       setIsSaving]       = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, [step]);

  const advance = useCallback((to: Step) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setAnimKey((k) => k + 1);
    setStep(to);
  }, []);

  const schedule = useCallback((to: Step, ms: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => advance(to), ms);
  }, [advance]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    const supabase = getSupabaseBrowser();
    let token: string | null = null;
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token ?? null;
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const { city, country } = parseLocation(locationInput);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'POST', headers,
        body: JSON.stringify({
          name:             userName || undefined,
          age_band:         ageBand || undefined,
          location_city:    city || undefined,
          location_country: country || undefined,
          novelty:          novelty || undefined,
          vibe:             vibe.length ? vibe : undefined,
          discovery:        discovery || undefined,
          food:             food || undefined,
          planning:         planning || undefined,
          spend:            spend || undefined,
          dealbreakers:     dealbreakers.length ? dealbreakers : undefined,
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
  }, [userName, ageBand, locationInput, novelty, vibe, discovery, food, planning, spend, dealbreakers, onCompleted]);

  const isQuestion = QUESTION_STEPS.includes(step);
  const displayName = userName || 'you';
  const displayCity = locationCity || 'That';
  const sidecarSrc  = SIDECAR[step];

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'var(--font-dm-sans)',
      color: C.text,
      overflowX: 'hidden',
    }}>
      <style>{GLOBAL_CSS}</style>

      <TopProgress step={step} />

      {/* Centered column — 390px max, vertically centered on screen */}
      <div style={{
        width: '100%',
        maxWidth: '390px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `52px 20px ${isQuestion ? '80px' : '48px'}`,
        boxSizing: 'border-box',
      }}>

        {/* Sidecar image — only on Q3–Q7, sits above the content, bleeds to page bg */}
        {sidecarSrc && (
          <div key={`sidecar-${step}`} style={{ animation: 'ob-fade 0.45s ease-out both' }}>
            <SidecarImage src={sidecarSrc} />
          </div>
        )}

        {/* Animated content block */}
        <div
          key={`content-${step}-${animKey}`}
          style={{ animation: 'ob-in 0.38s cubic-bezier(0.22,1,0.36,1) both' }}
        >

          {/* ── GREETING ───────────────────────────────────────────── */}
          {step === 'greeting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(32px, 9vw, 44px)',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: C.text,
                  margin: 0,
                  animation: 'ob-shake 0.9s ease-in-out 0.5s',
                }}>
                  Hello! I&apos;m so happy you&apos;re here.
                </p>
                <p style={{ fontSize: '15px', color: C.soft, margin: 0, lineHeight: 1.65 }}>
                  I&apos;m Aria — your personal travel curator. A couple of questions and I&apos;ll know your taste.
                </p>
              </div>
              <Btn onClick={() => advance('name')}>Let&apos;s begin</Btn>
            </div>
          )}

          {/* ── NAME ───────────────────────────────────────────────── */}
          {step === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontSize: 'clamp(28px, 7.5vw, 36px)',
                fontWeight: 500,
                lineHeight: 1.25,
                color: C.text,
                margin: 0,
              }}>
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
                placeholder="Your first name"
                autoFocus
                style={{
                  background: C.white,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '14px',
                  padding: '15px 18px',
                  fontSize: '16px',
                  fontFamily: 'var(--font-dm-sans)',
                  color: C.text,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <Btn
                onClick={() => { setUserName(nameInput.trim()); advance('age_band'); }}
                disabled={!nameInput.trim()}
              >
                Continue
              </Btn>
            </div>
          )}

          {/* ── AGE BAND ───────────────────────────────────────────── */}
          {step === 'age_band' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontSize: 'clamp(24px, 6.5vw, 32px)',
                fontWeight: 500,
                lineHeight: 1.3,
                color: C.text,
                margin: 0,
              }}>
                Lovely to meet you{userName ? `, ${userName}` : ''}. And roughly which era do I have the pleasure of?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {AGE_BANDS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={ageBand === value}
                    onClick={() => {
                      if (ageBand) return;
                      setAgeBand(value);
                      setAgeReaction(AGE_REACTIONS[value] ?? '');
                      schedule('location', 1700);
                    }}
                  />
                ))}
              </div>
              {ageReaction && (
                <p key={ageReaction} style={{
                  fontSize: '15px',
                  fontStyle: 'italic',
                  color: C.amber,
                  margin: 0,
                  lineHeight: 1.55,
                  animation: 'ob-fade 0.35s ease-out both',
                }}>
                  {ageReaction}
                </p>
              )}
            </div>
          )}

          {/* ── LOCATION ────────────────────────────────────────────── */}
          {step === 'location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontSize: 'clamp(28px, 7.5vw, 36px)',
                fontWeight: 500,
                lineHeight: 1.25,
                color: C.text,
                margin: 0,
              }}>
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
                  borderRadius: '14px',
                  padding: '15px 18px',
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

          {/* ── LOCATION BRIDGE ─────────────────────────────────────── */}
          {step === 'location_bridge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(28px, 7.5vw, 36px)',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: C.text,
                  margin: 0,
                  animation: 'ob-s1 0.45s ease-out both',
                }}>
                  {displayCity} — noted. Perfect. Thank you, {displayName}.
                </p>
                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: C.soft,
                  margin: 0,
                  animation: 'ob-s2 0.45s ease-out 0.1s both',
                }}>
                  Now — the real questions. This is how I learn your taste, so every place and plan I suggest actually fits you.{' '}
                  <span style={{ color: C.amber, fontStyle: 'italic' }}>I&apos;m a little too excited for this.</span>
                </p>
              </div>
              <div style={{ animation: 'ob-s3 0.45s ease-out 0.2s both' }}>
                <Btn onClick={() => advance('q_novelty')}>Let&apos;s go →</Btn>
              </div>
            </div>
          )}

          {/* ── Q1 NOVELTY — image tiles ──────────────────────────────── */}
          {step === 'q_novelty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={qCounter}>Q1 · 7</p>
                <p style={qHead}>New place, new food, new everything — thrilling, or a bit much?</p>
              </div>
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
                      schedule('q_vibe', 560);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q2 VIBE — image tiles ────────────────────────────────── */}
          {step === 'q_vibe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={qCounter}>Q2 · 7</p>
                <p style={qHead}>If you could return to one kind of place again and again — where&apos;s pulling you?</p>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Choose up to 2</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {VIBE_OPTIONS.map(({ value, label }) => (
                  <ImageTile
                    key={value}
                    src={`/onboarding/vibe/${value}.jpg`}
                    label={label}
                    selected={vibe.includes(value)}
                    disabled={!vibe.includes(value) && vibe.length >= 2}
                    onClick={() => {
                      if (!vibe.includes(value) && vibe.length >= 2) return;
                      setVibe((prev) =>
                        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
                      );
                    }}
                  />
                ))}
              </div>
              <Btn onClick={() => advance('q_discovery')} disabled={vibe.length === 0}>
                Continue
              </Btn>
            </div>
          )}

          {/* ── Q3 DISCOVERY ──────────────────────────────────────────── */}
          {step === 'q_discovery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={qCounter}>Q3 · 7</p>
                <p style={qHead}>Somewhere new — the famous must-sees, or the things only locals know?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DISCOVERY_OPTIONS.map(({ value, label }) => (
                  <TextOption key={value} label={label} selected={discovery === value}
                    onClick={() => { if (discovery) return; setDiscovery(value); schedule('q_food', 520); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q4 FOOD ──────────────────────────────────────────────── */}
          {step === 'q_food' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={qCounter}>Q4 · 7</p>
                <p style={qHead}>And a great meal away is…?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FOOD_OPTIONS.map(({ value, label }) => (
                  <TextOption key={value} label={label} selected={food === value}
                    onClick={() => { if (food) return; setFood(value); schedule('q_planning', 520); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q5 PLANNING ────────────────────────────────────────────── */}
          {step === 'q_planning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={qCounter}>Q5 · 7</p>
                <p style={qHead}>Before a trip — spreadsheet, or wing it?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PLANNING_OPTIONS.map(({ value, label }) => (
                  <TextOption key={value} label={label} selected={planning === value}
                    onClick={() => { if (planning) return; setPlanning(value); schedule('q_spend', 520); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q6 SPEND ───────────────────────────────────────────────── */}
          {step === 'q_spend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={qCounter}>Q6 · 7</p>
                <p style={qHead}>When you treat yourself away, it&apos;s usually…</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SPEND_OPTIONS.map(({ value, label }) => (
                  <TextOption key={value} label={label} selected={spend === value}
                    onClick={() => { if (spend) return; setSpend(value); schedule('q_dealbreakers', 520); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q7 DEALBREAKERS ─────────────────────────────────────────── */}
          {step === 'q_dealbreakers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={qCounter}>Q7 · 7</p>
                <p style={qHead}>Be honest — what quietly ruins a trip for you?</p>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Choose up to 2</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {DEALBREAKER_OPTIONS.map(({ value, label }) => {
                  const sel = dealbreakers.includes(value);
                  const dis = !sel && dealbreakers.length >= 2;
                  return (
                    <TextOption key={value} label={label} selected={sel} disabled={dis}
                      onClick={() => {
                        if (dis) return;
                        setDealbreakers((prev) =>
                          prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
                        );
                      }}
                    />
                  );
                })}
              </div>
              <Btn onClick={() => { advance('close'); void handleSave(); }}>
                Done — show me my kind of places
              </Btn>
            </div>
          )}

          {/* ── CLOSE ─────────────────────────────────────────────────── */}
          {step === 'close' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(28px, 8vw, 40px)',
                  fontWeight: 500,
                  lineHeight: 1.22,
                  color: C.text,
                  margin: 0,
                  animation: 'ob-s1 0.5s ease-out both',
                }}>
                  That&apos;s all I need{userName ? `, ${userName}` : ''}.
                </p>
                <p style={{
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: C.soft,
                  margin: 0,
                  animation: 'ob-s2 0.5s ease-out 0.12s both',
                }}>
                  I&apos;ve got a real feel for you now — let&apos;s go find your kind of places.
                </p>
              </div>
              {isSaving && !saveError && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: C.amber,
                      animation: `ob-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              )}
              {saveError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(180,40,40,0.85)', margin: 0, lineHeight: 1.5 }}>
                    {saveError}
                  </p>
                  <Btn fullWidth={false} onClick={() => { void handleSave(); }}>Try again</Btn>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
