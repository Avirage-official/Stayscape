'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// Constants — all workflow logic unchanged
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
  under_20:  "Ah, the best is all ahead of you — let's make it count.",
  '20_25':   "Oh, to have that energy — we're going to have fun.",
  '26_30':   'A wonderful age to explore — you know what you like now.',
  '31_40':   'Prime time. Old enough to do it right, young enough to do it all.',
  '41_55':   'The era of travelling well — I approve.',
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
  { value: 'improviser', label: "Wing it entirely — that's the fun" },
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
// Right-panel image map — one dedicated image per step
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_IMAGE: Partial<Record<Step, string>> = {
  greeting:        '/onboarding/scenes/welcome.jpg',
  name:            '/onboarding/scenes/intro-portrait.jpg',
  age_band:        '/onboarding/scenes/age-era.jpg',
  location:        '/onboarding/scenes/home-origin.jpg',
  location_bridge: '/onboarding/scenes/bridge-curiosity.jpg',
  q_novelty:       '/onboarding/scenes/discovery-editorial.jpg',
  q_vibe:          '/onboarding/scenes/discovery-editorial.jpg',
  q_discovery:     '/onboarding/scenes/discovery-editorial.jpg',
  q_food:          '/onboarding/scenes/food-editorial.jpg',
  q_planning:      '/onboarding/scenes/planning-editorial.jpg',
  q_spend:         '/onboarding/scenes/spend-editorial.jpg',
  q_dealbreakers:  '/onboarding/scenes/dealbreakers-editorial.jpg',
  close:           '/onboarding/scenes/closing.jpg',
};

// ─────────────────────────────────────────────────────────────────────────────
// Palette — content on dark background
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  // Left content — on dark bg
  text:           '#FAF8F5',
  soft:           'rgba(250,248,245,0.70)',
  muted:          'rgba(250,248,245,0.44)',
  amber:          '#C17F3A',
  amberHover:     '#D6A252',
  amberAlpha:     'rgba(193,127,58,0.18)',
  amberBorder:    'rgba(193,127,58,0.40)',
  border:         'rgba(250,248,245,0.14)',
  // Input — slightly raised surface on dark bg
  inputBg:        'rgba(255,255,255,0.07)',
  inputBorder:    'rgba(250,248,245,0.18)',
  // Age band chip hover
  chipHover:      'rgba(250,248,245,0.06)',
  // Right card overlay text
  onImage:        '#FAF8F5',
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
// Global CSS — pure keyframes, no component styles
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  /* Left panel content entrance */
  @keyframes ob-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  /* Staggered text lines */
  @keyframes ob-line {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  /* Image tile entrance */
  @keyframes ob-tile {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  /* Slow ambient zoom on right card image */
  @keyframes ob-zoom {
    from { transform: scale(1); }
    to   { transform: scale(1.055); }
  }
  /* Greeting headline warmth shake */
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
  /* Age reaction reveal */
  @keyframes ob-reaction {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Input styles — glass-like on dark background */
  .ob-input {
    background: rgba(255,255,255,0.07) !important;
    color: #FAF8F5 !important;
  }
  .ob-input:focus {
    border-color: #C17F3A !important;
    box-shadow: 0 0 0 3px rgba(193,127,58,0.18) !important;
    background: rgba(255,255,255,0.10) !important;
  }
  .ob-input::placeholder { color: rgba(250,248,245,0.32); }

  /* Right panel card on mobile — hide on small screens */
  @media (max-width: 767px) {
    .ob-right-panel { display: none !important; }
    .ob-layout      { padding: 0 !important; }
    .ob-left-panel  {
      border-radius: 0 !important;
      min-height: 100dvh !important;
      max-width: 100% !important;
      width: 100% !important;
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// RightImageCard — the floating editorial image card
// Pure CSS crossfade: renders two layers, transitions opacity on src change
// ─────────────────────────────────────────────────────────────────────────────

function RightImageCard({ src }: { src: string }) {
  const [current,   setCurrent]   = useState(src);
  const [next,      setNext]      = useState<string | null>(null);
  const [fading,    setFading]    = useState(false);
  const [nextReady, setNextReady] = useState(false);

  useEffect(() => {
    if (src === current) return;
    setNext(src);
    setNextReady(false);
  }, [src, current]);

  const handleNextLoad = useCallback(() => {
    setNextReady(true);
    setFading(true);
    const t = setTimeout(() => {
      setCurrent((prev) => { void prev; return src; });
      setNext(null);
      setFading(false);
      setNextReady(false);
    }, 820);
    return () => clearTimeout(t);
  }, [src]);

  return (
    <div
      className="ob-right-panel"
      style={{
        flex: '0 0 42%',
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(20,10,2,0.38), 0 4px 16px rgba(20,10,2,0.18)',
        background: '#1A0E04',
        margin: '20px 20px 20px 0',
        minHeight: 0,
      }}
    >
      {/* Current image */}
      <div style={{
        position: 'absolute', inset: 0,
        animation: 'ob-zoom 22s ease-in-out alternate infinite',
        transformOrigin: 'center center',
      }}>
        <img
          src={current}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Next image — fades in on top when ready */}
      {next && (
        <div style={{
          position: 'absolute', inset: 0,
          opacity: fading && nextReady ? 1 : 0,
          transition: 'opacity 0.78s cubic-bezier(0.4,0,0.2,1)',
          animation: nextReady ? 'ob-zoom 22s ease-in-out alternate infinite' : 'none',
          transformOrigin: 'center center',
        }}>
          <img
            src={next}
            alt=""
            onLoad={handleNextLoad}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Darker overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(14,7,2,0.22) 0%, rgba(14,7,2,0.52) 55%, rgba(14,7,2,0.82) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Subtle amber vignette at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '35%',
        background: 'linear-gradient(to top, rgba(193,127,58,0.14) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopProgress — thin amber bar across the full top
// ─────────────────────────────────────────────────────────────────────────────

function TopProgress({ step }: { step: Step }) {
  const idx = ALL_STEPS.indexOf(step);
  const pct = Math.round((idx / (ALL_STEPS.length - 1)) * 100);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '2px',
      background: 'rgba(250,248,245,0.08)',
      zIndex: 200,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: C.amber,
        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: '0 2px 2px 0',
        boxShadow: `0 0 6px ${C.amber}88`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Btn — button on dark/transparent background
// ─────────────────────────────────────────────────────────────────────────────

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
    fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background 0.22s, color 0.22s, box-shadow 0.22s, border-color 0.22s',
    opacity: disabled ? 0.38 : 1,
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    letterSpacing: '0.01em',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const variants: Record<string, CSSProperties> = {
    primary: {
      background: hovered && !disabled ? C.amberHover : C.amber,
      color: '#FAF7F2',
      boxShadow: hovered && !disabled
        ? '0 6px 22px rgba(193,127,58,0.42)'
        : '0 2px 10px rgba(193,127,58,0.22)',
    },
    ghost: {
      background: hovered && !disabled ? 'rgba(250,248,245,0.08)' : 'transparent',
      color: hovered && !disabled ? C.text : C.soft,
      border: `1.5px solid ${C.border}`,
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
// TextOption — pill option on dark background
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
            ? 'rgba(250,248,245,0.06)'
            : 'rgba(255,255,255,0.05)',
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
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageTile — portrait 4:5 option tile (Q1 novelty, Q2 vibe)
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
        background: imgError ? 'linear-gradient(135deg, #2A1A08 0%, #4A2E10 100%)' : '#1A0E04',
        transition: 'outline 0.2s, box-shadow 0.2s, transform 0.2s',
        padding: 0,
        display: 'block',
        width: '100%',
        boxShadow: selected
          ? `0 6px 24px rgba(193,127,58,0.38)`
          : '0 4px 16px rgba(20,10,2,0.28)',
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
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
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #2A1A08 0%, #4A2E10 100%)',
        }}>
          <span style={{
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
            fontStyle: 'italic', fontSize: '18px', fontWeight: 500,
            color: C.text, textAlign: 'center', padding: '8px',
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
        }} />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared left-panel text styles — light on dark
// ─────────────────────────────────────────────────────────────────────────────

const lHead: CSSProperties = {
  fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
  fontStyle: 'italic',
  color: C.text,
  margin: 0,
  lineHeight: 1.2,
};

const lSub: CSSProperties = {
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
  fontSize: '15px',
  color: C.soft,
  margin: 0,
  lineHeight: 1.68,
};

const qCounter: CSSProperties = {
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
  fontSize: '11px',
  color: C.amber,
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase' as const,
  margin: 0,
};

const qHead: CSSProperties = {
  fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
  fontStyle: 'italic',
  fontSize: 'clamp(22px, 4vw, 28px)',
  fontWeight: 500,
  lineHeight: 1.35,
  color: C.text,
  margin: 0,
};

const inputStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: `1.5px solid rgba(250,248,245,0.18)`,
  borderRadius: '14px',
  padding: '15px 18px',
  fontSize: '16px',
  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
  color: C.text,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.22s, box-shadow 0.22s, background 0.22s',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
};

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
          vibe:             vibe.length         ? vibe         : undefined,
          discovery:        discovery  || undefined,
          food:             food       || undefined,
          planning:         planning   || undefined,
          spend:            spend      || undefined,
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

  const panelSrc    = PANEL_IMAGE[step] ?? '/onboarding/scenes/welcome.jpg';
  const displayName = userName || 'you';
  const displayCity = locationCity || 'That';

  return (
    <div style={{
      minHeight: '100dvh',
      position: 'relative',
      fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
      overflowX: 'hidden',
      background: '#100902',
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Persistent background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/onboarding/scenes/Onboarding-Background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(12,6,2,0.72)',
        }} />
      </div>

      {/* ── Progress bar */}
      <TopProgress step={step} />

      {/* ── Full-viewport split layout */}
      <div
        className="ob-layout"
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'stretch',
          padding: '0 0 0 20px',
          gap: '20px',
          boxSizing: 'border-box',
        }}
      >

        {/* ════════════════════════════════════════════════════
            LEFT — transparent, content directly on dark bg
        ════════════════════════════════════════════════════ */}
        <div
          className="ob-left-panel"
          style={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(40px, 6vh, 72px) clamp(32px, 5vw, 64px)',
            boxSizing: 'border-box',
            overflowY: 'auto',
            position: 'relative',
            // No background — transparent over the dark scene
          }}
        >
          {/* Aria wordmark top-left */}
          <div style={{
            position: 'absolute',
            top: '28px', left: 'clamp(32px, 5vw, 64px)',
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)',
            fontStyle: 'italic',
            fontSize: '22px',
            fontWeight: 500,
            color: C.amber,
            letterSpacing: '0.01em',
            userSelect: 'none',
          }}>
            Aria
          </div>

          {/* Step content */}
          <div
            key={`content-${step}-${animKey}`}
            style={{ animation: 'ob-up 0.44s cubic-bezier(0.22,1,0.36,1) both' }}
          >

            {/* ══════════════════════════════════════════════ */}
            {/* GREETING                                       */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'greeting' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{
                    ...lHead,
                    fontSize: 'clamp(34px, 5vw, 48px)',
                    fontWeight: 600,
                    animation: 'ob-shake 1s ease-in-out 0.6s, ob-line 0.5s cubic-bezier(0.22,1,0.36,1) both',
                  }}>
                    Hello! I&apos;m so happy you&apos;re here.
                  </p>
                  <p style={{ ...lSub, ...stagger(1, 0.12), maxWidth: '38ch' }}>
                    I&apos;m Aria — your personal travel curator. A couple of honest questions and I&apos;ll know your taste better than most apps ever will.
                  </p>
                </div>
                <div style={stagger(2, 0.12)}>
                  <Btn onClick={() => advance('name')}>Let&apos;s begin →</Btn>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* NAME                                           */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'name' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <p style={{
                  ...lHead,
                  fontSize: 'clamp(28px, 4.5vw, 40px)',
                  fontWeight: 500,
                  ...stagger(0),
                }}>
                  I&apos;m Aria — and you are?
                </p>
                <div style={stagger(1)}>
                  <input
                    className="ob-input"
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
                    style={inputStyle}
                  />
                </div>
                <div style={stagger(2)}>
                  <Btn
                    onClick={() => { setUserName(nameInput.trim()); advance('age_band'); }}
                    disabled={!nameInput.trim()}
                  >
                    Continue
                  </Btn>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* AGE BAND                                       */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'age_band' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <p style={{
                  ...lHead,
                  fontSize: 'clamp(22px, 3.5vw, 32px)',
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
                          border: `1.5px solid ${sel ? C.amber : C.border}`,
                          background: sel ? C.amberAlpha : 'rgba(255,255,255,0.05)',
                          color: sel ? C.amber : C.text,
                          fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
                          fontSize: '14px',
                          fontWeight: sel ? 700 : 400,
                          cursor: ageBand ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          boxShadow: sel ? `0 0 0 1px ${C.amber}` : 'none',
                          backdropFilter: 'blur(4px)',
                          WebkitBackdropFilter: 'blur(4px)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {ageReaction && (
                  <p key={ageReaction} style={{
                    ...lSub,
                    fontStyle: 'italic',
                    color: C.amber,
                    animation: 'ob-reaction 0.4s ease-out both',
                  }}>
                    {ageReaction}
                  </p>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* LOCATION                                       */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'location' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <p style={{
                  ...lHead,
                  fontSize: 'clamp(28px, 4.5vw, 40px)',
                  fontWeight: 500,
                  ...stagger(0),
                }}>
                  And where do you call mi casa?
                </p>
                <div style={stagger(1)}>
                  <input
                    className="ob-input"
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
                    style={inputStyle}
                  />
                </div>
                <div style={stagger(2)}>
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
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* LOCATION BRIDGE                                */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'location_bridge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{
                    ...lHead,
                    fontSize: 'clamp(26px, 4vw, 36px)',
                    fontWeight: 500,
                    ...stagger(0),
                  }}>
                    {displayCity} — noted. Perfect. Thank you, {displayName}.
                  </p>
                  <p style={{ ...lSub, ...stagger(1), maxWidth: '40ch' }}>
                    Now — the real questions. This is how I learn your taste, so every place and plan I suggest actually fits you.
                  </p>
                  <p style={{
                    ...lSub,
                    fontStyle: 'italic',
                    color: C.amber,
                    ...stagger(2),
                  }}>
                    I&apos;m a little too excited for this.
                  </p>
                </div>
                <div style={stagger(3)}>
                  <Btn onClick={() => advance('q_novelty')}>Let&apos;s go →</Btn>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* Q1 NOVELTY                                     */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'q_novelty' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ ...qCounter, ...stagger(0) }}>Q1 · 7</p>
                  <p style={{ ...qHead, ...stagger(1) }}>
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

            {/* ══════════════════════════════════════════════ */}
            {/* Q2 VIBE                                        */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'q_vibe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ ...qCounter, ...stagger(0) }}>Q2 · 7</p>
                  <p style={{ ...qHead, ...stagger(1) }}>
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

            {/* ══════════════════════════════════════════════ */}
            {/* Q3 DISCOVERY                                   */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'q_discovery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

            {/* ══════════════════════════════════════════════ */}
            {/* Q4 FOOD                                        */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'q_food' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

            {/* ══════════════════════════════════════════════ */}
            {/* Q5 PLANNING                                    */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'q_planning' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

            {/* ══════════════════════════════════════════════ */}
            {/* Q6 SPEND                                       */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'q_spend' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

            {/* ══════════════════════════════════════════════ */}
            {/* Q7 DEALBREAKERS                                */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'q_dealbreakers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

            {/* ══════════════════════════════════════════════ */}
            {/* CLOSE                                          */}
            {/* ══════════════════════════════════════════════ */}
            {step === 'close' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{
                    ...lHead,
                    fontSize: 'clamp(28px, 4.5vw, 42px)',
                    fontWeight: 600,
                    lineHeight: 1.18,
                    ...stagger(0),
                  }}>
                    That&apos;s all I need{userName ? `, ${userName}` : ''}.
                  </p>
                  <p style={{ ...lSub, ...stagger(1) }}>
                    I&apos;ve got a real feel for you now.
                  </p>
                  <p style={{ ...lSub, fontStyle: 'italic', color: C.amber, ...stagger(2) }}>
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
                    <p style={{ fontSize: '14px', color: '#e07a3a', margin: 0, lineHeight: 1.5 }}>
                      {saveError}
                    </p>
                    <Btn variant="ghost" fullWidth={false} onClick={() => { void handleSave(); }}>Try again</Btn>
                  </div>
                )}
              </div>
            )}

          </div>{/* /step content */}
        </div>{/* /left panel */}

        {/* ════════════════════════════════════════════════════
            RIGHT PANEL — editorial image card, CSS crossfade
        ════════════════════════════════════════════════════ */}
        <RightImageCard src={panelSrc} />

      </div>{/* /layout */}
    </div>
  );
}
