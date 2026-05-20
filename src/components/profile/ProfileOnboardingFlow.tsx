'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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
  { value: 'icons',  label: 'The classics — the must-sees, the icons' },
  { value: 'hidden', label: 'Hidden gems — off the tourist trail' },
  { value: 'mix',    label: 'A bit of both, honestly' },
] as const;

const FOOD_OPTIONS = [
  { value: 'street',     label: 'Street food & market stalls' },
  { value: 'sit_down',   label: 'Proper sit-down restaurants' },
  { value: 'easy',       label: 'Easy and unfussy — fuel, not ritual' },
  { value: 'food_first', label: 'Food is the whole point of the trip' },
] as const;

const PLANNING_OPTIONS = [
  { value: 'planner',    label: 'Spreadsheet, itinerary, fully sorted' },
  { value: 'loose',      label: 'A loose outline with room to wander' },
  { value: 'improviser', label: 'Wing it entirely — that\'s the fun' },
] as const;

const SPEND_OPTIONS = [
  { value: 'simple',  label: 'Simple and sensible — comfort without fuss' },
  { value: 'quality', label: 'Quality over quantity, always' },
  { value: 'all_out', label: 'No holding back — you only live once' },
] as const;

const DEALBREAKER_OPTIONS = [
  { value: 'rushed',       label: 'Feeling rushed' },
  { value: 'crowds',       label: 'Big crowds' },
  { value: 'bad_food',     label: 'Bad food' },
  { value: 'downtime',     label: 'Too much downtime' },
  { value: 'overspending', label: 'Overspending' },
  { value: 'chaos',        label: 'Disorganised chaos' },
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
  'q_novelty', 'q_vibe', 'q_discovery',
  'q_food', 'q_planning', 'q_spend', 'q_dealbreakers',
];

const ALL_STEPS: Step[] = [
  'greeting', 'name', 'age_band', 'location', 'location_bridge',
  ...QUESTION_STEPS, 'close',
];

// ─────────────────────────────────────────────────────────────────────────────
// Scene background images
// Cinematic screens: greeting / name / age_band / location / location_bridge / close
// Each has a dedicated image that fills the screen behind a dark veil.
// Drop files into public/onboarding/scenes/
// ─────────────────────────────────────────────────────────────────────────────
// File list:
//   welcome.jpg          — greeting
//   intro-portrait.jpg   — name
//   age-era.jpg          — age_band
//   home-origin.jpg      — location
//   bridge-curiosity.jpg — location_bridge
//   closing.jpg          — close
//
// Editorial sidecars (banner above Q3–Q7, fades to page bg):
//   discovery-editorial.jpg
//   food-editorial.jpg
//   planning-editorial.jpg
//   spend-editorial.jpg
//   dealbreakers-editorial.jpg
// ─────────────────────────────────────────────────────────────────────────────

const SCENE_BG: Partial<Record<Step, string>> = {
  greeting:        '/onboarding/scenes/welcome.jpg',
  name:            '/onboarding/scenes/intro-portrait.jpg',
  age_band:        '/onboarding/scenes/age-era.jpg',
  location:        '/onboarding/scenes/home-origin.jpg',
  location_bridge: '/onboarding/scenes/bridge-curiosity.jpg',
  close:           '/onboarding/scenes/closing.jpg',
};

const SIDECAR: Partial<Record<Step, string>> = {
  q_discovery:    '/onboarding/scenes/discovery-editorial.jpg',
  q_food:         '/onboarding/scenes/food-editorial.jpg',
  q_planning:     '/onboarding/scenes/planning-editorial.jpg',
  q_spend:        '/onboarding/scenes/spend-editorial.jpg',
  q_dealbreakers: '/onboarding/scenes/dealbreakers-editorial.jpg',
};

// ─────────────────────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:         '#FAF7F2',
  text:       '#2C1A08',
  soft:       'rgba(44,26,8,0.55)',
  muted:      'rgba(44,26,8,0.35)',
  amber:      '#C17F3A',
  amberHover: '#D6A252',
  amberAlpha: 'rgba(193,127,58,0.12)',
  border:     'rgba(193,127,58,0.28)',
  white:      '#FFFFFF',
  onImage:    '#FAF8F5',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseLocation(raw: string): { city: string; country: string } {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
  return { city: raw.trim(), country: '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Global CSS — keyframes only, no component styles
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  /* Content entrance */
  @keyframes ob-up {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  /* Staggered text lines */
  @keyframes ob-line {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  /* Image tiles entrance */
  @keyframes ob-tile {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  /* Slow ambient image zoom */
  @keyframes ob-zoom {
    from { transform: scale(1); }
    to   { transform: scale(1.06); }
  }
  /* Scene bg crossfade in */
  @keyframes ob-bgfade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  /* Greeting headline shake */
  @keyframes ob-shake {
    0%,100% { transform: translateX(0) rotate(0deg); }
    15%     { transform: translateX(-3px) rotate(-0.4deg); }
    30%     { transform: translateX(3px)  rotate(0.4deg); }
    55%     { transform: translateX(-2px) rotate(-0.25deg); }
    75%     { transform: translateX(2px)  rotate(0.25deg); }
    90%     { transform: translateX(-1px) rotate(-0.1deg); }
  }
  /* Save dots */
  @keyframes ob-dot {
    0%,100% { opacity: 0.22; transform: scale(0.75); }
    50%     { opacity: 1;    transform: scale(1); }
  }
  /* Age reaction fade in */
  @keyframes ob-reaction {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  /* Smooth progress bar fill — driven by JS width changes, no keyframe needed */
`;

// ─────────────────────────────────────────────────────────────────────────────
// SceneBg — full-viewport cinematic background layer
// Only renders when a scene image is assigned to the step.
// Falls back gracefully: if image fails to load the veil stays (warm dark gradient).
// Uses ambient slow zoom via ob-zoom keyframe.
// ─────────────────────────────────────────────────────────────────────────────

function SceneBg({ src, animKey }: { src: string; animKey: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
  return (
    <div
      key={`scene-${animKey}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        animation: 'ob-bgfade 0.7s ease-out both',
      }}
    >
      {/* Ambient zoom layer */}
      {!error && (
        <div style={{
          position: 'absolute',
          inset: 0,
          animation: 'ob-zoom 18s ease-in-out alternate infinite',
          transformOrigin: 'center center',
        }}>
          <img
            src={src}
            alt=""
            onLoad={()  => setLoaded(true)}
            onError={() => setError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.8s ease',
            }}
          />
        </div>
      )}
      {/* Warm dark veil — always present so text is readable even before image loads */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: error
          ? 'linear-gradient(160deg, #2C1A08 0%, #1A0C02 100%)'
          : 'linear-gradient(to bottom, rgba(20,10,2,0.45) 0%, rgba(20,10,2,0.72) 60%, rgba(20,10,2,0.88) 100%)',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidecarImage — editorial banner above Q3–Q7
// Bleeds edge-to-edge, fades into the warm page bg below.
// If image is missing → returns null (step renders cleanly without it).
// ─────────────────────────────────────────────────────────────────────────────

function SidecarImage({ src }: { src: string }) {
  const [error,  setError]  = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (error) return null;
  return (
    <div style={{
      width: 'calc(100% + 40px)',
      marginLeft: '-20px',
      marginRight: '-20px',
      height: '220px',
      marginBottom: '-28px',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      borderRadius: '0',
    }}>
      <img
        src={src}
        alt=""
        onLoad={()  => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
          transform: 'scale(1.02)',  /* subtle scale prevents edge artifacts */
        }}
      />
      {/* Fade to warm page bg */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '75%',
        background: `linear-gradient(to bottom, transparent 0%, ${C.bg} 90%)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopProgress — thin amber bar, fixed at top
// ─────────────────────────────────────────────────────────────────────────────

function TopProgress({ step }: { step: Step }) {
  const idx = ALL_STEPS.indexOf(step);
  const pct = Math.round((idx / (ALL_STEPS.length - 1)) * 100);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '2px',
      background: 'rgba(250,247,242,0.18)',
      zIndex: 100,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: C.amber,
        transition: 'width 0.55s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: '0 2px 2px 0',
        boxShadow: `0 0 6px ${C.amber}`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Btn
// ─────────────────────────────────────────────────────────────────────────────

function Btn({
  onClick, disabled, children, variant = 'primary', fullWidth = true,
}: {
  onClick: () => void; disabled?: boolean; children: ReactNode;
  variant?: 'primary' | 'ghost' | 'image'; fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base: CSSProperties = {
    height: '52px',
    borderRadius: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s',
    opacity: disabled ? 0.38 : 1,
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    letterSpacing: '0.01em',
    padding: '0 24px',
  };
  const variants: Record<string, CSSProperties> = {
    primary: {
      background: hovered && !disabled ? C.amberHover : C.amber,
      color: '#FAF7F2',
      boxShadow: hovered && !disabled ? '0 4px 18px rgba(193,127,58,0.4)' : '0 2px 8px rgba(193,127,58,0.2)',
    },
    ghost: {
      background: 'rgba(250,247,242,0.08)',
      color: hovered ? C.onImage : 'rgba(250,248,245,0.75)',
      border: '1.5px solid rgba(250,248,245,0.28)',
    },
    image: {
      background: hovered && !disabled ? 'rgba(250,247,242,0.18)' : 'rgba(250,247,242,0.10)',
      color: C.onImage,
      border: '1.5px solid rgba(250,248,245,0.3)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
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

// ─────────────────────────────────────────────────────────────────────────────
// TextOption — pill-style option button on warm bg
// ─────────────────────────────────────────────────────────────────────────────

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
        minHeight: '52px',
        padding: '13px 18px',
        borderRadius: '14px',
        border: `1.5px solid ${selected ? C.amber : C.border}`,
        background: selected
          ? C.amberAlpha
          : hovered
            ? 'rgba(193,127,58,0.05)'
            : C.white,
        color: selected ? C.amber : disabled ? C.muted : C.text,
        fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
        fontSize: '14px',
        fontWeight: selected ? 600 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        opacity: disabled && !selected ? 0.38 : 1,
        textAlign: 'left',
        lineHeight: 1.45,
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: selected ? `0 0 0 1px ${C.amber}` : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageTile — portrait 4:5 image option
// ─────────────────────────────────────────────────────────────────────────────

function ImageTile({
  src, label, selected, onClick, disabled, delay = 0,
}: {
  src: string; label: string; selected: boolean;
  onClick: () => void; disabled?: boolean; delay?: number;
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
        border: 'none',
        outline: selected ? `2.5px solid ${C.amber}` : '2.5px solid transparent',
        outlineOffset: selected ? '2px' : '0px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: imgError
          ? 'linear-gradient(135deg, #E4CDA4 0%, #B88A4E 100%)'
          : '#1A0E04',
        transition: 'outline 0.2s, box-shadow 0.2s, transform 0.2s',
        padding: 0,
        display: 'block',
        width: '100%',
        boxShadow: selected
          ? `0 6px 24px rgba(193,127,58,0.38)`
          : '0 4px 16px rgba(20,10,2,0.18)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        opacity: disabled && !selected ? 0.38 : 1,
        animation: `ob-tile 0.42s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
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
            }}
          />
          {/* gradient veil for label legibility */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '55%',
            background: 'linear-gradient(to top, rgba(14,7,2,0.80) 0%, rgba(14,7,2,0.18) 60%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          <span style={{
            position: 'absolute', bottom: '14px', left: '14px', right: '14px',
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
            fontStyle: 'italic',
            fontSize: '18px',
            fontWeight: 500,
            color: C.onImage,
            pointerEvents: 'none',
            textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          }}>
            {label}
          </span>
        </>
      ) : (
        /* Fallback: amber-tinted solid tile */
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #E4CDA4 0%, #B88A4E 100%)',
        }}>
          <span style={{
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
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
      {/* Amber overlay on selection */}
      {selected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(193,127,58,0.20)',
          pointerEvents: 'none',
        }} />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene text styles — light text for use over dark image backgrounds
// ─────────────────────────────────────────────────────────────────────────────

const sHead: CSSProperties = {
  fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
  fontStyle: 'italic',
  color: '#FAF8F5',
  margin: 0,
  textShadow: '0 2px 12px rgba(0,0,0,0.4)',
};

const sSub: CSSProperties = {
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
  fontSize: '15px',
  color: 'rgba(250,248,245,0.72)',
  margin: 0,
  lineHeight: 1.65,
};

// Light input style used on dark scene screens
const sceneInputStyle: CSSProperties = {
  background: 'rgba(250,247,242,0.10)',
  border: '1.5px solid rgba(250,248,245,0.28)',
  borderRadius: '14px',
  padding: '15px 18px',
  fontSize: '16px',
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
  color: '#FAF8F5',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

// Shared question headline (warm bg steps)
const qHead: CSSProperties = {
  fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
  fontStyle: 'italic',
  fontSize: 'clamp(22px, 6vw, 28px)',
  fontWeight: 500,
  lineHeight: 1.35,
  color: '#2C1A08',
  margin: 0,
};

const qCounter: CSSProperties = {
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
  fontSize: '11px',
  color: '#C17F3A',
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase' as const,
  margin: 0,
};

// Stagger animation helper
const stagger = (i: number, base = 0.08): CSSProperties => ({
  animation: `ob-line 0.45s cubic-bezier(0.22,1,0.36,1) ${i * base}s both`,
});

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  onCompleted: () => void;
}

export default function ProfileOnboardingFlow({ userId: _userId, onCompleted }: Props) {
  const [step,    setStep]    = useState<Step>('greeting');
  const [animKey, setAnimKey] = useState(0);

  const [userName,      setUserName]      = useState('');
  const [nameInput,     setNameInput]     = useState('');
  const [ageBand,       setAgeBand]       = useState('');
  const [ageReaction,   setAgeReaction]   = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationCity,  setLocationCity]  = useState('');
  const [novelty,       setNovelty]       = useState('');
  const [vibe,          setVibe]          = useState<string[]>([]);
  const [discovery,     setDiscovery]     = useState('');
  const [food,          setFood]          = useState('');
  const [planning,      setPlanning]      = useState('');
  const [spend,         setSpend]         = useState('');
  const [dealbreakers,  setDealbreakers]  = useState<string[]>([]);
  const [isSaving,      setIsSaving]      = useState(false);
  const [saveError,     setSaveError]     = useState<string | null>(null);

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
          name:             userName   || undefined,
          age_band:         ageBand    || undefined,
          location_city:    city       || undefined,
          location_country: country    || undefined,
          novelty:          novelty    || undefined,
          vibe:             vibe.length          ? vibe          : undefined,
          discovery:        discovery  || undefined,
          food:             food       || undefined,
          planning:         planning   || undefined,
          spend:            spend      || undefined,
          dealbreakers:     dealbreakers.length  ? dealbreakers  : undefined,
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

  const sceneSrc   = SCENE_BG[step];
  const sidecarSrc = SIDECAR[step];
  const isScene    = !!sceneSrc;          // cinematic dark-bg steps
  const isQuestion = QUESTION_STEPS.includes(step);
  const displayName = userName || 'you';
  const displayCity = locationCity || 'That';

  return (
    <div style={{
      minHeight: '100dvh',
      position: 'relative',
      background: isScene ? 'transparent' : C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
      color: C.text,
      overflowX: 'hidden',
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Scene background layer (cinematic steps only) */}
      {sceneSrc && <SceneBg src={sceneSrc} animKey={animKey} />}

      {/* ── Fixed progress bar */}
      <TopProgress step={step} />

      {/* ── Scrollable content column */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '460px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isScene ? 'flex-end' : 'center',
        padding: isScene
          ? '0 24px 52px'
          : `64px 20px ${isQuestion ? '88px' : '52px'}`,
        boxSizing: 'border-box',
      }}>

        {/* ── Sidecar image (Q3–Q7 only, warm-bg steps) */}
        {sidecarSrc && (
          <div
            key={`sidecar-${step}-${animKey}`}
            style={{ animation: 'ob-bgfade 0.5s ease-out both' }}
          >
            <SidecarImage src={sidecarSrc} />
          </div>
        )}

        {/* ── Step content */}
        <div
          key={`content-${step}-${animKey}`}
          style={{ animation: 'ob-up 0.42s cubic-bezier(0.22,1,0.36,1) both' }}
        >

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* GREETING — scene bg                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'greeting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{
                  ...sHead,
                  fontSize: 'clamp(36px, 10vw, 52px)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                  ...stagger(0, 0.1),
                  // override animation with shake on greeting
                  animation: 'ob-shake 1s ease-in-out 0.6s, ob-line 0.5s cubic-bezier(0.22,1,0.36,1) both',
                }}>
                  Hello! I&apos;m so happy you&apos;re here.
                </p>
                <p style={{ ...sSub, ...stagger(1, 0.12) }}>
                  I&apos;m Aria — your personal travel curator. A couple of honest questions and I&apos;ll know your taste better than most apps ever will.
                </p>
              </div>
              <div style={stagger(2, 0.12)}>
                <Btn variant="image" onClick={() => advance('name')}>Let&apos;s begin →</Btn>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* NAME — scene bg                                               */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p style={{
                ...sHead,
                fontSize: 'clamp(30px, 8vw, 40px)',
                fontWeight: 500,
                lineHeight: 1.2,
                ...stagger(0),
              }}>
                I&apos;m Aria — and you are?
              </p>
              <div style={stagger(1)}>
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
                  style={sceneInputStyle}
                />
              </div>
              <div style={stagger(2)}>
                <Btn
                  variant="image"
                  onClick={() => { setUserName(nameInput.trim()); advance('age_band'); }}
                  disabled={!nameInput.trim()}
                >
                  Continue
                </Btn>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* AGE BAND — scene bg                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'age_band' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p style={{
                ...sHead,
                fontSize: 'clamp(24px, 6.5vw, 34px)',
                fontWeight: 500,
                lineHeight: 1.3,
                ...stagger(0),
              }}>
                Lovely to meet you{userName ? `, ${userName}` : ''}. And roughly which era do I have the pleasure of?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', ...stagger(1) }}>
                {AGE_BANDS.map(({ value, label }) => {
                  const sel = ageBand === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!!ageBand}
                      onClick={() => {
                        if (ageBand) return;
                        setAgeBand(value);
                        setAgeReaction(AGE_REACTIONS[value] ?? '');
                        schedule('location', 1800);
                      }}
                      style={{
                        height: '48px',
                        borderRadius: '12px',
                        border: `1.5px solid ${sel ? C.amber : 'rgba(250,248,245,0.28)'}`,
                        background: sel
                          ? `rgba(193,127,58,0.28)`
                          : 'rgba(250,247,242,0.10)',
                        color: sel ? C.amber : 'rgba(250,248,245,0.88)',
                        fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
                        fontSize: '14px',
                        fontWeight: sel ? 700 : 400,
                        cursor: ageBand ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {ageReaction && (
                <p key={ageReaction} style={{
                  ...sSub,
                  fontStyle: 'italic',
                  color: C.amber,
                  animation: 'ob-reaction 0.4s ease-out both',
                }}>
                  {ageReaction}
                </p>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* LOCATION — scene bg                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <p style={{
                ...sHead,
                fontSize: 'clamp(30px, 8vw, 40px)',
                fontWeight: 500,
                lineHeight: 1.2,
                ...stagger(0),
              }}>
                And where do you call mi casa?
              </p>
              <div style={stagger(1)}>
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
                  style={sceneInputStyle}
                />
              </div>
              <div style={stagger(2)}>
                <Btn
                  variant="image"
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
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* LOCATION BRIDGE — scene bg                                    */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'location_bridge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{
                  ...sHead,
                  fontSize: 'clamp(28px, 7.5vw, 38px)',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  ...stagger(0),
                }}>
                  {displayCity} — noted. Perfect. Thank you, {displayName}.
                </p>
                <p style={{ ...sSub, ...stagger(1) }}>
                  Now — the real questions. This is how I learn your taste, so every place and plan I suggest actually fits you.
                </p>
                <p style={{
                  ...sSub,
                  fontStyle: 'italic',
                  color: C.amber,
                  ...stagger(2),
                }}>
                  I&apos;m a little too excited for this.
                </p>
              </div>
              <div style={stagger(3)}>
                <Btn variant="image" onClick={() => advance('q_novelty')}>Let&apos;s go →</Btn>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* Q1 NOVELTY — image tiles, warm bg                             */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'q_novelty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ ...qCounter, ...stagger(0) }}>Q1 · 7</p>
                <p style={{ ...qHead, fontSize: 'clamp(22px, 6vw, 28px)', ...stagger(1) }}>
                  New place, new food, new everything — thrilling, or a bit much?
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {NOVELTY_OPTIONS.map(({ value, label }, i) => (
                  <ImageTile
                    key={value}
                    src={`/onboarding/novelty/${value}.jpg`}
                    label={label}
                    selected={novelty === value}
                    delay={(i + 2) * 60}
                    onClick={() => {
                      if (novelty) return;
                      setNovelty(value);
                      schedule('q_vibe', 580);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* Q2 VIBE — image tiles, warm bg                                */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'q_vibe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ ...qCounter, ...stagger(0) }}>Q2 · 7</p>
                <p style={{ ...qHead, fontSize: 'clamp(22px, 6vw, 28px)', ...stagger(1) }}>
                  If you could return to one kind of place again and again — where&apos;s pulling you?
                </p>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0, ...stagger(2) }}>Pick up to 2</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {VIBE_OPTIONS.map(({ value, label }, i) => (
                  <ImageTile
                    key={value}
                    src={`/onboarding/vibe/${value}.jpg`}
                    label={label}
                    selected={vibe.includes(value)}
                    disabled={!vibe.includes(value) && vibe.length >= 2}
                    delay={(i + 3) * 60}
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

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* Q3 DISCOVERY — text options, sidecar image                    */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'q_discovery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ ...qCounter, ...stagger(0) }}>Q3 · 7</p>
                <p style={{ ...qHead, ...stagger(1) }}>Somewhere new — the famous must-sees, or the things only locals know?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DISCOVERY_OPTIONS.map(({ value, label }, i) => (
                  <div key={value} style={stagger(i + 2)}>
                    <TextOption
                      label={label}
                      selected={discovery === value}
                      onClick={() => { if (discovery) return; setDiscovery(value); schedule('q_food', 520); }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* Q4 FOOD — text options, sidecar image                         */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'q_food' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ ...qCounter, ...stagger(0) }}>Q4 · 7</p>
                <p style={{ ...qHead, ...stagger(1) }}>And a great meal away is…?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FOOD_OPTIONS.map(({ value, label }, i) => (
                  <div key={value} style={stagger(i + 2)}>
                    <TextOption
                      label={label}
                      selected={food === value}
                      onClick={() => { if (food) return; setFood(value); schedule('q_planning', 520); }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* Q5 PLANNING — text options, sidecar image                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'q_planning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ ...qCounter, ...stagger(0) }}>Q5 · 7</p>
                <p style={{ ...qHead, ...stagger(1) }}>Before a trip — spreadsheet, or wing it?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PLANNING_OPTIONS.map(({ value, label }, i) => (
                  <div key={value} style={stagger(i + 2)}>
                    <TextOption
                      label={label}
                      selected={planning === value}
                      onClick={() => { if (planning) return; setPlanning(value); schedule('q_spend', 520); }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* Q6 SPEND — text options, sidecar image                        */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'q_spend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ ...qCounter, ...stagger(0) }}>Q6 · 7</p>
                <p style={{ ...qHead, ...stagger(1) }}>When you treat yourself away, it&apos;s usually…</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SPEND_OPTIONS.map(({ value, label }, i) => (
                  <div key={value} style={stagger(i + 2)}>
                    <TextOption
                      label={label}
                      selected={spend === value}
                      onClick={() => { if (spend) return; setSpend(value); schedule('q_dealbreakers', 520); }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* Q7 DEALBREAKERS — text multi-select, sidecar image            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'q_dealbreakers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ ...qCounter, ...stagger(0) }}>Q7 · 7</p>
                <p style={{ ...qHead, ...stagger(1) }}>Be honest — what quietly ruins a trip for you?</p>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0, ...stagger(2) }}>Choose up to 2</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {DEALBREAKER_OPTIONS.map(({ value, label }, i) => {
                  const sel = dealbreakers.includes(value);
                  const dis = !sel && dealbreakers.length >= 2;
                  return (
                    <div key={value} style={stagger(i + 3)}>
                      <TextOption
                        label={label}
                        selected={sel}
                        disabled={dis}
                        onClick={() => {
                          if (dis) return;
                          setDealbreakers((prev) =>
                            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <Btn
                onClick={() => { advance('close'); void handleSave(); }}
                disabled={dealbreakers.length === 0}
              >
                Done — show me my kind of places
              </Btn>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CLOSE — scene bg                                              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 'close' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{
                  ...sHead,
                  fontSize: 'clamp(30px, 8.5vw, 44px)',
                  fontWeight: 600,
                  lineHeight: 1.18,
                  ...stagger(0),
                }}>
                  That&apos;s all I need{userName ? `, ${userName}` : ''}.
                </p>
                <p style={{ ...sSub, ...stagger(1) }}>
                  I&apos;ve got a real feel for you now.
                </p>
                <p style={{ ...sSub, fontStyle: 'italic', color: C.amber, ...stagger(2) }}>
                  Let&apos;s go find your kind of places.
                </p>
              </div>
              {isSaving && !saveError && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: C.amber,
                      animation: `ob-dot 1.2s ease-in-out ${i * 0.22}s infinite`,
                    }} />
                  ))}
                </div>
              )}
              {saveError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', ...stagger(3) }}>
                  <p style={{ fontSize: '14px', color: 'rgba(240,160,80,0.9)', margin: 0, lineHeight: 1.5 }}>
                    {saveError}
                  </p>
                  <Btn variant="image" fullWidth={false} onClick={() => { void handleSave(); }}>Try again</Btn>
                </div>
              )}
            </div>
          )}

        </div>{/* /content */}
      </div>{/* /column */}
    </div>
  );
}
