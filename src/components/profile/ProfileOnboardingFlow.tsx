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

const ALL_STEPS: Step[] = [
  'greeting', 'name', 'age_band', 'location', 'location_bridge',
  'q_novelty', 'q_vibe', 'q_discovery', 'q_food', 'q_planning',
  'q_spend', 'q_dealbreakers', 'close',
];

// ─────────────────────────────────────────────────────────────────────────────
// Image maps — right panel scenes + tile images
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

// All images to preload on mount so crossfades are instant
const ALL_IMAGES: string[] = [
  ...Object.values(PANEL_IMAGE) as string[],
  '/onboarding/novelty/adventurous.jpg',
  '/onboarding/novelty/balanced.jpg',
  '/onboarding/novelty/comfortable.jpg',
  '/onboarding/vibe/city.jpg',
  '/onboarding/vibe/culture.jpg',
  '/onboarding/vibe/nature.jpg',
  '/onboarding/vibe/beach.jpg',
];

const NOVELTY_IMG: Record<string, string> = {
  adventurous: '/onboarding/novelty/adventurous.jpg',
  balanced:    '/onboarding/novelty/balanced.jpg',
  comfortable: '/onboarding/novelty/comfortable.jpg',
};

const VIBE_IMG: Record<string, string> = {
  city:    '/onboarding/vibe/city.jpg',
  culture: '/onboarding/vibe/culture.jpg',
  nature:  '/onboarding/vibe/nature.jpg',
  beach:   '/onboarding/vibe/beach.jpg',
};

// ─────────────────────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:           '#FAF8F5',
  surface:      '#FFFFFF',
  text:         '#2C1A08',
  soft:         'rgba(44,26,8,0.60)',
  muted:        'rgba(44,26,8,0.40)',
  faint:        'rgba(44,26,8,0.28)',
  amber:        '#C17F3A',
  amberHover:   '#D6A252',
  amberAlpha:   'rgba(193,127,58,0.08)',
  amberBorder:  'rgba(193,127,58,0.28)',
  border:       'rgba(193,127,58,0.28)',
  borderSubtle: 'rgba(44,26,8,0.10)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseLocation(raw: string): { city: string; country: string } {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
  return { city: raw.trim(), country: '' };
}

// Preload all images immediately so crossfades never lag
function useImagePreloader(urls: string[]) {
  useEffect(() => {
    urls.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Global CSS
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes ob-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-line {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-tile {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes ob-zoom {
    from { transform: scale(1); }
    to   { transform: scale(1.05); }
  }
  @keyframes ob-dot {
    0%,100% { opacity: 0.25; transform: scale(0.75); }
    50%     { opacity: 1;    transform: scale(1); }
  }
  @keyframes ob-reaction {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ob-input {
    background: #FFFFFF !important;
    color: #2C1A08 !important;
    -webkit-text-fill-color: #2C1A08 !important;
  }
  .ob-input:focus {
    border-color: #C17F3A !important;
    box-shadow: 0 0 0 3px rgba(193,127,58,0.13) !important;
    outline: none;
  }
  .ob-input::placeholder { color: rgba(44,26,8,0.30); }
  .ob-input:-webkit-autofill,
  .ob-input:-webkit-autofill:hover,
  .ob-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #2C1A08 !important;
    -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
    caret-color: #C17F3A !important;
  }

  .ob-option:hover:not(:disabled) {
    background: rgba(193,127,58,0.05) !important;
    border-color: rgba(193,127,58,0.38) !important;
  }
  .ob-chip:hover:not(:disabled) {
    border-color: rgba(193,127,58,0.48) !important;
    background: rgba(193,127,58,0.05) !important;
  }
  .ob-tile-btn:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.01) !important;
    box-shadow: 0 6px 22px rgba(44,26,8,0.15) !important;
  }

  @media (max-width: 767px) {
    .ob-right { display: none !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// RightImageCard — smooth crossfade, preloaded images, slow ken burns
// ─────────────────────────────────────────────────────────────────────────────

function RightImageCard({ src }: { src: string }) {
  const [layers, setLayers] = useState<{ src: string; key: number; opacity: number }[]>([
    { src, key: 0, opacity: 1 },
  ]);
  const keyRef = useRef(1);

  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.src === src) return prev;
      const newKey = keyRef.current++;
      // Add new layer on top at opacity 0 — will fade in on load
      return [...prev.slice(-1), { src, key: newKey, opacity: 0 }];
    });
  }, [src]);

  const handleLoad = useCallback((key: number) => {
    // Fade new layer to 1, then drop old layer after transition completes
    setLayers((prev) => {
      const updated = prev.map((l) => l.key === key ? { ...l, opacity: 1 } : l);
      return updated;
    });
    setTimeout(() => {
      setLayers((prev) => prev.length > 1 ? prev.slice(-1) : prev);
    }, 1050);
  }, []);

  return (
    <div
      className="ob-right"
      style={{
        flex: '0 0 42%',
        margin: '16px 16px 16px 0',
        borderRadius: '18px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 18px 56px rgba(44,26,8,0.16), 0 4px 14px rgba(44,26,8,0.08)',
        background: '#D6C9B8',
        minHeight: 0,
      }}
    >
      {layers.map(({ src: lSrc, key, opacity }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            inset: 0,
            opacity,
            transition: 'opacity 1s cubic-bezier(0.25,0,0,1)',
            animation: 'ob-zoom 26s ease-in-out alternate infinite',
            transformOrigin: 'center',
          }}
        >
          <img
            src={lSrc}
            alt=""
            onLoad={() => handleLoad(key)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ))}

      {/* Dark overlay — stronger at bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(8,5,2,0.08) 0%, rgba(8,5,2,0.28) 50%, rgba(8,5,2,0.65) 100%)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />
      {/* Amber warmth at base */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%',
        background: 'linear-gradient(to top, rgba(193,127,58,0.08) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 11,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Buttons & inputs
// ─────────────────────────────────────────────────────────────────────────────

function Btn({
  onClick, disabled, children, variant = 'primary', fullWidth = true,
}: {
  onClick: () => void; disabled?: boolean; children: ReactNode;
  variant?: 'primary' | 'ghost'; fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const base: CSSProperties = {
    height: '46px',
    borderRadius: '10px',       // slightly more round
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    transition: 'background 180ms ease, opacity 180ms ease, box-shadow 180ms ease',
    opacity: disabled ? 0.42 : 1,
    border: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box' as const,
  };

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: hovered && !disabled ? C.amberHover : C.amber,
      color: '#FAF8F5',
      boxShadow: hovered && !disabled
        ? '0 6px 18px rgba(193,127,58,0.32)'
        : '0 3px 12px rgba(193,127,58,0.22)',
    },
    ghost: {
      background: 'transparent',
      color: hovered && !disabled ? C.text : C.soft,
      border: `1px solid ${C.borderSubtle}`,
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

function TextOption({
  label, selected, onClick, disabled,
}: {
  label: string; selected: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="ob-option"
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        padding: '11px 16px',
        borderRadius: '10px',
        border: `1px solid ${selected ? C.amber : C.borderSubtle}`,
        background: selected ? C.amberAlpha : C.surface,
        color: selected ? C.amber : disabled ? C.faint : C.text,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        fontWeight: selected ? 600 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 180ms ease',
        outline: 'none',
        opacity: disabled && !selected ? 0.42 : 1,
        textAlign: 'left',
        lineHeight: 1.5,
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: selected
          ? `0 0 0 1px ${C.amber}, 0 2px 8px rgba(193,127,58,0.12)`
          : '0 1px 3px rgba(44,26,8,0.04)',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageTile — compact portrait card, correct paths
// ─────────────────────────────────────────────────────────────────────────────

function ImageTile({
  src, label, selected, onClick, disabled, delay = 0,
}: {
  src: string; label: string; selected: boolean;
  onClick: () => void; disabled?: boolean; delay?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="ob-tile-btn"
      style={{
        position: 'relative',
        aspectRatio: '2 / 3',      // taller-portrait tiles, not huge
        maxHeight: '180px',        // cap height so they don't dominate
        borderRadius: '12px',
        overflow: 'hidden',
        border: selected ? `2px solid ${C.amber}` : '2px solid transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: '#D6C9B8',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 220ms ease',
        padding: 0,
        display: 'block',
        width: '100%',
        boxShadow: selected
          ? `0 4px 20px rgba(193,127,58,0.28), 0 0 0 1px ${C.amber}`
          : '0 2px 8px rgba(44,26,8,0.09)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        opacity: disabled && !selected ? 0.40 : 1,
        animation: `ob-tile 0.38s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
      }}
    >
      <img
        src={src}
        alt={label}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '55%',
        background: 'linear-gradient(to top, rgba(8,5,2,0.75) 0%, rgba(8,5,2,0.08) 60%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {selected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(193,127,58,0.13)',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{
        position: 'absolute', bottom: '10px', left: '10px', right: '10px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        color: '#FAF8F5',
        pointerEvents: 'none',
        textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        letterSpacing: '0.02em',
      }}>
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared text styles — Playfair Display for headings, DM Sans body
// ─────────────────────────────────────────────────────────────────────────────

const DISPLAY = "'Playfair Display', Georgia, serif";
const BODY    = "'DM Sans', system-ui, sans-serif";

const eyebrow: CSSProperties = {
  fontFamily: BODY,
  fontSize: '10.5px',
  fontWeight: 600,
  color: C.amber,
  letterSpacing: '0.20em',
  textTransform: 'uppercase' as const,
  margin: 0,
};

const lHead: CSSProperties = {
  fontFamily: DISPLAY,
  fontStyle: 'italic',
  color: C.text,
  fontWeight: 500,
  lineHeight: 1.22,
  margin: 0,
};

const lSub: CSSProperties = {
  fontFamily: BODY,
  fontSize: '14px',
  color: C.soft,
  margin: 0,
  lineHeight: 1.65,
};

const qHead: CSSProperties = {
  fontFamily: DISPLAY,
  fontStyle: 'italic',
  fontSize: 'clamp(19px, 2.4vw, 24px)',
  fontWeight: 500,
  lineHeight: 1.3,
  color: C.text,
  margin: 0,
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.muted,
  marginBottom: '7px',
  fontFamily: BODY,
};

const inputStyle: CSSProperties = {
  width: '100%',
  height: '46px',
  padding: '0 16px',
  borderRadius: '10px',      // more rounded
  background: C.surface,
  border: `1px solid ${C.amberBorder}`,
  color: C.text,
  fontSize: '14px',
  fontFamily: BODY,
  outline: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  boxSizing: 'border-box' as const,
};

const stagger = (i: number, base = 0.065): CSSProperties => ({
  animation: `ob-line 0.40s cubic-bezier(0.22,1,0.36,1) ${i * base}s both`,
});

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  onCompleted: () => void;
}

export default function ProfileOnboardingFlow({ userId: _userId, onCompleted }: Props) {
  // Preload everything on mount so zero lag on any crossfade
  useImagePreloader(ALL_IMAGES);

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

  // Progress %
  const stepIdx = ALL_STEPS.indexOf(step);
  const progress = Math.round((stepIdx / (ALL_STEPS.length - 1)) * 100);
  const panelSrc = PANEL_IMAGE[step] ?? '/onboarding/scenes/welcome.jpg';
  const displayName = userName || 'you';
  const displayCity = locationCity || 'That';

  return (
    <div
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: C.bg,
        fontFamily: BODY,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* ── Progress bar — top of cream bg, always visible ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '3px',
        background: 'rgba(44,26,8,0.08)',
        zIndex: 100,
        flexShrink: 0,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: C.amber,
          transition: 'width 0.55s cubic-bezier(0.25,0,0,1)',
          borderRadius: '0 3px 3px 0',
        }} />
      </div>

      {/* ── Split layout ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'stretch',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* ══ LEFT PANEL ══ */}
        <div
          style={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: 0,
            maxWidth: '600px',
          }}
        >
          {/* Wordmark */}
          <div style={{
            flexShrink: 0,
            padding: 'clamp(24px,3.5vh,36px) clamp(32px,5vw,64px) 0',
          }}>
            <span style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: '18px',
              fontWeight: 600,
              color: C.text,
            }}>
              Stay<span style={{
                fontFamily: BODY,
                fontStyle: 'normal',
                fontWeight: 700,
                color: C.amber,
              }}>scape</span>
            </span>
          </div>

          {/* Scrollable content area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 'clamp(24px,4vh,48px) clamp(32px,5vw,64px)',
              minHeight: 0,
            }}
          >
            <div
              key={`content-${step}-${animKey}`}
              style={{ animation: 'ob-up 0.38s cubic-bezier(0.22,1,0.36,1) both' }}
            >

              {/* ── GREETING ── */}
              {step === 'greeting' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Welcome</p>
                    <h1 style={{
                      ...lHead,
                      fontSize: 'clamp(2rem,3.4vw,2.9rem)',
                      ...stagger(1),
                    }}>
                      Hello! I&apos;m so happy you&apos;re here.
                    </h1>
                    <p style={{ ...lSub, ...stagger(2), maxWidth: '36ch' }}>
                      I&apos;m Aria — your personal travel curator. A couple of honest questions and I&apos;ll know your taste better than most apps ever will.
                    </p>
                  </div>
                  <div style={stagger(3)}>
                    <Btn onClick={() => advance('name')}>Let&apos;s begin →</Btn>
                  </div>
                </div>
              )}

              {/* ── NAME ── */}
              {step === 'name' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>About you</p>
                    <h2 style={{ ...lHead, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', ...stagger(1) }}>
                      I&apos;m Aria — and you are?
                    </h2>
                  </div>
                  <div style={stagger(2)}>
                    <label style={labelStyle}>Your name</label>
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
                  <div style={stagger(3)}>
                    <Btn
                      onClick={() => { setUserName(nameInput.trim()); advance('age_band'); }}
                      disabled={!nameInput.trim()}
                    >
                      Continue
                    </Btn>
                  </div>
                </div>
              )}

              {/* ── AGE BAND ── */}
              {step === 'age_band' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>About you</p>
                    <h2 style={{ ...lHead, fontSize: 'clamp(1.5rem,2.6vw,2.1rem)', ...stagger(1) }}>
                      Lovely to meet you{userName ? `, ${userName}` : ''}. Which era do I have the pleasure of?
                    </h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', ...stagger(2) }}>
                    {AGE_BANDS.map(({ value, label }) => {
                      const sel = ageBand === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!!ageBand}
                          className="ob-chip"
                          onClick={() => {
                            if (ageBand) return;
                            setAgeBand(value);
                            setAgeReaction(AGE_REACTIONS[value] ?? '');
                            schedule('location', 1800);
                          }}
                          style={{
                            height: '44px',
                            borderRadius: '10px',
                            border: `1px solid ${sel ? C.amber : C.borderSubtle}`,
                            background: sel ? C.amberAlpha : C.surface,
                            color: sel ? C.amber : C.text,
                            fontFamily: BODY,
                            fontSize: '13px',
                            fontWeight: sel ? 700 : 400,
                            cursor: ageBand ? 'not-allowed' : 'pointer',
                            transition: 'all 180ms ease',
                            outline: 'none',
                            boxShadow: sel
                              ? `0 0 0 1px ${C.amber}, 0 4px 12px rgba(193,127,58,0.14)`
                              : '0 1px 3px rgba(44,26,8,0.05)',
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
                      animation: 'ob-reaction 0.38s ease-out both',
                    }}>
                      {ageReaction}
                    </p>
                  )}
                </div>
              )}

              {/* ── LOCATION ── */}
              {step === 'location' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Home base</p>
                    <h2 style={{ ...lHead, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', ...stagger(1) }}>
                      And where do you call mi casa?
                    </h2>
                  </div>
                  <div style={stagger(2)}>
                    <label style={labelStyle}>City, Country</label>
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
                      placeholder="e.g. Singapore, Singapore"
                      autoFocus
                      style={inputStyle}
                    />
                  </div>
                  <div style={stagger(3)}>
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

              {/* ── LOCATION BRIDGE ── */}
              {step === 'location_bridge' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h2 style={{ ...lHead, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', ...stagger(0) }}>
                      {displayCity} — noted. Perfect. Thank you, {displayName}.
                    </h2>
                    <p style={{ ...lSub, ...stagger(1), maxWidth: '38ch' }}>
                      Now — the real questions. This is how I learn your taste, so every place I suggest actually fits you.
                    </p>
                    <p style={{ ...lSub, fontStyle: 'italic', color: C.amber, ...stagger(2) }}>
                      I&apos;m a little too excited for this.
                    </p>
                  </div>
                  <div style={stagger(3)}>
                    <Btn onClick={() => advance('q_novelty')}>Let&apos;s go →</Btn>
                  </div>
                </div>
              )}

              {/* ── Q1 NOVELTY ── */}
              {step === 'q_novelty' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Q1 of 7</p>
                    <h2 style={{ ...qHead, ...stagger(1) }}>
                      New place, new food, new everything — thrilling, or a bit much?
                    </h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {NOVELTY_OPTIONS.map(({ value, label }, i) => (
                      <ImageTile
                        key={value}
                        src={NOVELTY_IMG[value] ?? '/onboarding/scenes/discovery-editorial.jpg'}
                        label={label}
                        selected={novelty === value}
                        delay={(i + 2) * 55}
                        onClick={() => {
                          if (novelty) return;
                          setNovelty(value);
                          schedule('q_vibe', 650);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Q2 VIBE ── */}
              {step === 'q_vibe' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Q2 of 7</p>
                    <h2 style={{ ...qHead, ...stagger(1) }}>
                      If you could return to one kind of place again and again — where&apos;s pulling you?
                    </h2>
                    <p style={{ fontSize: '11.5px', color: C.muted, margin: 0, ...stagger(2), fontFamily: BODY }}>
                      Pick up to 2
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {VIBE_OPTIONS.map(({ value, label }, i) => (
                      <ImageTile
                        key={value}
                        src={VIBE_IMG[value] ?? '/onboarding/scenes/discovery-editorial.jpg'}
                        label={label}
                        selected={vibe.includes(value)}
                        disabled={!vibe.includes(value) && vibe.length >= 2}
                        delay={(i + 2) * 50}
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

              {/* ── Q3 DISCOVERY ── */}
              {step === 'q_discovery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Q3 of 7</p>
                    <h2 style={{ ...qHead, ...stagger(1) }}>Somewhere new — the famous must-sees, or the things only locals know?</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

              {/* ── Q4 FOOD ── */}
              {step === 'q_food' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Q4 of 7</p>
                    <h2 style={{ ...qHead, ...stagger(1) }}>And a great meal away is…?</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

              {/* ── Q5 PLANNING ── */}
              {step === 'q_planning' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Q5 of 7</p>
                    <h2 style={{ ...qHead, ...stagger(1) }}>Before a trip — spreadsheet, or wing it?</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

              {/* ── Q6 SPEND ── */}
              {step === 'q_spend' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Q6 of 7</p>
                    <h2 style={{ ...qHead, ...stagger(1) }}>When you treat yourself away, it&apos;s usually…</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

              {/* ── Q7 DEALBREAKERS ── */}
              {step === 'q_dealbreakers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>Q7 of 7</p>
                    <h2 style={{ ...qHead, ...stagger(1) }}>Be honest — what quietly ruins a trip for you?</h2>
                    <p style={{ fontSize: '11.5px', color: C.muted, margin: 0, ...stagger(2), fontFamily: BODY }}>
                      Choose up to 2
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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

              {/* ── CLOSE ── */}
              {step === 'close' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ ...eyebrow, ...stagger(0) }}>All done</p>
                    <h2 style={{ ...lHead, fontSize: 'clamp(1.7rem,2.8vw,2.6rem)', ...stagger(1) }}>
                      That&apos;s all I need{userName ? `, ${userName}` : ''}.
                    </h2>
                    <p style={{ ...lSub, ...stagger(2) }}>I&apos;ve got a real feel for you now.</p>
                    <p style={{ ...lSub, fontStyle: 'italic', color: C.amber, ...stagger(3) }}>
                      Let&apos;s go find your kind of places.
                    </p>
                  </div>
                  {isSaving && !saveError && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: '7px', height: '7px',
                          borderRadius: '50%',
                          background: C.amber,
                          animation: `ob-dot 1.2s ease-in-out ${i * 0.22}s infinite`,
                        }} />
                      ))}
                    </div>
                  )}
                  {saveError && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(193,58,58,0.05)',
                      border: '1px solid rgba(193,58,58,0.16)',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                      ...stagger(4),
                    }}>
                      <p style={{ fontSize: '13px', color: '#C13A3A', margin: 0, lineHeight: 1.5 }}>
                        {saveError}
                      </p>
                      <Btn variant="ghost" fullWidth={false} onClick={() => { void handleSave(); }}>
                        Try again
                      </Btn>
                    </div>
                  )}
                </div>
              )}

            </div>{/* /animated content */}
          </div>{/* /scrollable */}
        </div>{/* /left */}

        {/* ══ RIGHT IMAGE CARD ══ */}
        <RightImageCard src={panelSrc} />

      </div>{/* /split layout */}
    </div>
  );
}
