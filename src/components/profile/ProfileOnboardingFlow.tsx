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
  { value: 'icons',  label: 'The classics' },
  { value: 'hidden', label: 'Hidden gems' },
  { value: 'mix',    label: 'A bit of both' },
] as const;

const FOOD_OPTIONS = [
  { value: 'street',    label: 'Street food & markets' },
  { value: 'sit_down',  label: 'Proper sit-down' },
  { value: 'easy',      label: 'Easy & unfussy' },
  { value: 'food_first', label: 'Food is the whole trip' },
] as const;

const PLANNING_OPTIONS = [
  { value: 'planner',   label: 'Spreadsheet ready' },
  { value: 'loose',     label: 'Loose outline' },
  { value: 'improviser', label: 'Wing it entirely' },
] as const;

const SPEND_OPTIONS = [
  { value: 'simple',  label: 'Keep it simple' },
  { value: 'quality', label: 'Quality over quantity' },
  { value: 'all_out', label: 'No holding back' },
] as const;

const DEALBREAKER_OPTIONS = [
  { value: 'rushed',      label: 'Feeling rushed' },
  { value: 'crowds',      label: 'Big crowds' },
  { value: 'bad_food',    label: 'Bad food' },
  { value: 'downtime',    label: 'Too much downtime' },
  { value: 'overspending', label: 'Overspending' },
  { value: 'chaos',       label: 'Disorganised chaos' },
] as const;

// Scene images — drop these files at the listed paths
// public/onboarding/scenes/welcome.jpg         — warm editorial, open landscape, golden light
// public/onboarding/scenes/name.jpg            — quiet portrait, soft interior, candlelit
// public/onboarding/scenes/age.jpg             — timeless travel scene, film-grain warm tone
// public/onboarding/scenes/location.jpg        — aerial city-home feel, warm dusk
// public/onboarding/scenes/bridge.jpg          — anticipation — a doorway, plane window, or open road
// public/onboarding/scenes/discovery.jpg       — cobbled street, lantern light, iconic yet intimate
// public/onboarding/scenes/food.jpg            — beautiful spread, natural light, market table
// public/onboarding/scenes/planning.jpg        — map on a cafe table, open notebook
// public/onboarding/scenes/spend.jpg           — elegant hotel terrace or thoughtful luxury moment
// public/onboarding/scenes/dealbreakers.jpg    — overcrowded street or a contrast-mood image
// public/onboarding/scenes/close.jpg           — sunset or arrival — expansive, warm, resolving

const SCENES: Record<string, string> = {
  greeting:        '/onboarding/scenes/welcome.jpg',
  name:            '/onboarding/scenes/name.jpg',
  age_band:        '/onboarding/scenes/age.jpg',
  location:        '/onboarding/scenes/location.jpg',
  location_bridge: '/onboarding/scenes/bridge.jpg',
  q_discovery:     '/onboarding/scenes/discovery.jpg',
  q_food:          '/onboarding/scenes/food.jpg',
  q_planning:      '/onboarding/scenes/planning.jpg',
  q_spend:         '/onboarding/scenes/spend.jpg',
  q_dealbreakers:  '/onboarding/scenes/dealbreakers.jpg',
  close:           '/onboarding/scenes/close.jpg',
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
  'q_novelty',
  'q_vibe',
  'q_discovery',
  'q_food',
  'q_planning',
  'q_spend',
  'q_dealbreakers',
];

// Full step order for progress calculation
const ALL_STEPS: Step[] = [
  'greeting',
  'name',
  'age_band',
  'location',
  'location_bridge',
  ...QUESTION_STEPS,
  'close',
];

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg:          '#FAF7F2',
  text:        '#2C1A08',
  soft:        'rgba(44,26,8,0.55)',
  muted:       'rgba(44,26,8,0.35)',
  amber:       '#C17F3A',
  amberHover:  '#D6A252',
  amberAlpha:  'rgba(193,127,58,0.12)',
  border:      'rgba(193,127,58,0.28)',
  white:       '#FFFFFF',
  onImage:     '#FAF8F5',
  cardBg:      'rgba(250,247,242,0.92)',
  veil:        'rgba(20,10,2,0.38)',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLocation(raw: string): { city: string; country: string } {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
  return { city: raw.trim(), country: '' };
}

// ── CSS keyframes (injected once) ─────────────────────────────────────────────

const GLOBAL_CSS = `
  @keyframes ob-in {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes ob-shake {
    0%,100% { transform: translateX(0) rotate(0deg); }
    15%     { transform: translateX(-3px) rotate(-0.5deg); }
    30%     { transform: translateX(3px) rotate(0.5deg); }
    50%     { transform: translateX(-2px) rotate(-0.3deg); }
    70%     { transform: translateX(2px) rotate(0.3deg); }
    85%     { transform: translateX(-1px) rotate(-0.15deg); }
  }
  @keyframes ob-dot {
    0%,100% { opacity: 0.25; transform: scale(0.8); }
    50%     { opacity: 1;    transform: scale(1); }
  }
  @keyframes ob-ken {
    from { transform: scale(1.0); }
    to   { transform: scale(1.06); }
  }
  @keyframes ob-progress {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes ob-stagger-1 { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ob-stagger-2 { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ob-stagger-3 { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
`;

// ── Sub-components ────────────────────────────────────────────────────────────

function SceneBg({ src, active }: { src: string; active: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
        transition: 'opacity 0.6s ease',
        opacity: active ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      {!error && (
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
            transition: 'opacity 0.5s ease',
            animation: active ? 'ob-ken 14s ease-in-out both' : 'none',
            transformOrigin: 'center center',
          }}
        />
      )}
      {/* warm amber-espresso fallback gradient */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #3D2410 0%, #7A4A20 45%, #C49A5A 100%)',
        }} />
      )}
      {/* dark veil */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(15,7,2,0.72) 0%, rgba(15,7,2,0.38) 50%, rgba(15,7,2,0.18) 100%)',
      }} />
    </div>
  );
}

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
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background 0.18s, border-color 0.18s, opacity 0.18s',
    opacity: disabled ? 0.38 : 1,
    outline: 'none',
    width: fullWidth ? '100%' : undefined,
    border: 'none',
    letterSpacing: '0.01em',
  };
  const variants: Record<string, CSSProperties> = {
    primary: {
      background: hovered && !disabled ? C.amberHover : C.amber,
      color: '#FAF7F2',
      padding: '0 24px',
    },
    ghost: {
      background: 'transparent',
      color: hovered ? C.amber : C.soft,
      border: `1.5px solid ${C.border}`,
      padding: '0 20px',
    },
    // on-image variant — frosted glass look for scene screens
    image: {
      background: hovered && !disabled
        ? 'rgba(250,247,242,0.22)'
        : 'rgba(250,247,242,0.14)',
      color: C.onImage,
      border: `1.5px solid rgba(250,247,242,0.35)`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '0 24px',
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
  label, sublabel, selected, onClick, disabled,
}: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void; disabled?: boolean;
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
        flexDirection: sublabel ? 'column' : 'row',
        alignItems: sublabel ? 'flex-start' : 'center',
        justifyContent: sublabel ? 'center' : 'center',
        minHeight: sublabel ? '64px' : '50px',
        padding: sublabel ? '12px 14px' : '0 14px',
        borderRadius: '14px',
        border: `1.5px solid ${selected ? C.amber : C.border}`,
        background: selected
          ? C.amberAlpha
          : hovered
            ? 'rgba(193,127,58,0.05)'
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
        gap: '2px',
        lineHeight: 1.35,
      }}
    >
      <span>{label}</span>
      {sublabel && (
        <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: 400, color: selected ? C.amber : C.soft }}>
          {sublabel}
        </span>
      )}
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
          : '#2C1A08',
        outline: 'none',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        padding: 0,
        display: 'block',
        width: '100%',
        transform: selected ? 'scale(0.97)' : 'scale(1)',
        boxShadow: selected
          ? `0 0 0 3px ${C.amber}, 0 8px 24px rgba(193,127,58,0.35)`
          : '0 4px 16px rgba(20,10,2,0.18)',
        opacity: disabled && !selected ? 0.5 : 1,
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
              transition: 'transform 0.4s ease',
              transform: selected ? 'scale(1.04)' : 'scale(1)',
            }}
          />
          {/* gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)',
            padding: '32px 14px 16px',
          }} />
          {/* label */}
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
        }} />
      )}
    </button>
  );
}

// Sidecar image panel for editorial text-questions (discovery, food, planning, spend, dealbreakers)
function SidecarImage({ src }: { src: string }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{
      width: '100%',
      height: '180px',
      borderRadius: '18px',
      overflow: 'hidden',
      background: error
        ? 'linear-gradient(135deg, #3D2410 0%, #C49A5A 100%)'
        : 'rgba(44,26,8,0.06)',
      marginBottom: '4px',
      flexShrink: 0,
      position: 'relative',
    }}>
      {!error && (
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
            transition: 'opacity 0.45s ease',
          }}
        />
      )}
      {/* subtle bottom veil so image bleeds into card */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '50%',
        background: 'linear-gradient(to top, rgba(250,247,242,0.9), transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// Progress bar — thin, full-width, at the very top of the screen
function TopProgress({ step }: { step: Step }) {
  const idx   = ALL_STEPS.indexOf(step);
  const total = ALL_STEPS.length - 1; // exclude 'close'
  const pct   = Math.min(100, (idx / total) * 100);

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

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  onCompleted: () => void;
}

export default function ProfileOnboardingFlow({ userId: _userId, onCompleted }: Props) {
  const [step, setStep]                   = useState<Step>('greeting');
  const [dir,  setDir]                    = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey]             = useState(0);

  const [userName, setUserName]           = useState('');
  const [nameInput, setNameInput]         = useState('');
  const [ageBand, setAgeBand]             = useState('');
  const [ageReaction, setAgeReaction]     = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationCity, setLocationCity]   = useState('');
  const [novelty, setNovelty]             = useState('');
  const [vibe, setVibe]                   = useState<string[]>([]);
  const [discovery, setDiscovery]         = useState('');
  const [food, setFood]                   = useState('');
  const [planning, setPlanning]           = useState('');
  const [spend, setSpend]                 = useState('');
  const [dealbreakers, setDealbreakers]   = useState<string[]>([]);
  const [isSaving, setIsSaving]           = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, [step]);

  const advance = useCallback((to: Step) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setDir('forward');
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
        method: 'POST',
        headers,
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

  // Determine if current step uses a scene background
  const sceneSrc     = SCENES[step] ?? null;
  const isSceneStep  = sceneSrc !== null;
  const isImageGrid  = step === 'q_novelty' || step === 'q_vibe';
  const isSidecar    = ['q_discovery','q_food','q_planning','q_spend','q_dealbreakers'].includes(step);
  const isQuestion   = QUESTION_STEPS.includes(step);

  const displayName = userName || 'you';
  const displayCity = locationCity || 'That';

  // Animation class based on direction
  const screenAnim = dir === 'forward'
    ? 'ob-in 0.38s cubic-bezier(0.22,1,0.36,1) both'
    : 'ob-in 0.38s cubic-bezier(0.22,1,0.36,1) both';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-dm-sans)',
        color: C.text,
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* ── Top progress bar ───────────────────────────────────────────── */}
      <TopProgress step={step} />

      {/* ── Scene background (scene steps) ─────────────────────────────── */}
      {isSceneStep && !isImageGrid && !isSidecar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <SceneBg src={sceneSrc!} active />
        </div>
      )}

      {/* ── Main scroll container ───────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          boxSizing: 'border-box',
        }}
      >

        {/* ── Content card ───────────────────────────────────────────────── */}
        <div
          style={{
            // On scene steps: frosted card anchored to bottom
            // On grid/sidecar steps: normal card on warm bg
            background: isSceneStep && !isImageGrid && !isSidecar
              ? C.cardBg
              : C.bg,
            borderRadius: isSceneStep && !isImageGrid && !isSidecar
              ? '24px 24px 0 0'
              : '0',
            padding: isQuestion ? '28px 20px 88px' : '40px 20px 48px',
            boxShadow: isSceneStep && !isImageGrid && !isSidecar
              ? '0 -8px 40px rgba(20,10,2,0.18)'
              : 'none',
            backdropFilter: isSceneStep && !isImageGrid && !isSidecar
              ? 'blur(12px)'
              : 'none',
            WebkitBackdropFilter: isSceneStep && !isImageGrid && !isSidecar
              ? 'blur(12px)'
              : 'none',
            minHeight: isSceneStep && !isImageGrid && !isSidecar ? undefined : '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isSceneStep && !isImageGrid && !isSidecar ? 'flex-end' : 'center',
          }}
        >
          <div
            key={`${step}-${animKey}`}
            style={{
              animation: screenAnim,
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >

            {/* ── GREETING ─────────────────────────────────────────────── */}
            {step === 'greeting' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(32px, 9vw, 42px)',
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: C.text,
                    margin: 0,
                    animation: 'ob-shake 0.9s ease-in-out 0.5s',
                  }}>
                    Hello! I&apos;m so happy you&apos;re here.
                  </p>
                  <p style={{ fontSize: '15px', color: C.soft, margin: 0, lineHeight: 1.6 }}>
                    I&apos;m Aria — your personal travel curator.
                  </p>
                </div>
                <Btn onClick={() => advance('name')}>Let&apos;s begin</Btn>
              </div>
            )}

            {/* ── NAME ─────────────────────────────────────────────────── */}
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
                    background: 'rgba(255,255,255,0.85)',
                    border: `1.5px solid ${C.border}`,
                    borderRadius: '14px',
                    padding: '16px 18px',
                    fontSize: '16px',
                    fontFamily: 'var(--font-dm-sans)',
                    color: C.text,
                    outline: 'none',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
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

            {/* ── AGE BAND ─────────────────────────────────────────────── */}
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

            {/* ── LOCATION ─────────────────────────────────────────────── */}
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
                    background: 'rgba(255,255,255,0.85)',
                    border: `1.5px solid ${C.border}`,
                    borderRadius: '14px',
                    padding: '16px 18px',
                    fontSize: '16px',
                    fontFamily: 'var(--font-dm-sans)',
                    color: C.text,
                    outline: 'none',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
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

            {/* ── LOCATION BRIDGE ──────────────────────────────────────── */}
            {step === 'location_bridge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(28px, 7.5vw, 36px)',
                    fontWeight: 500,
                    lineHeight: 1.25,
                    color: C.text,
                    margin: 0,
                    animation: 'ob-stagger-1 0.45s ease-out both',
                  }}>
                    {displayCity} — noted. Perfect. Thank you, {displayName}.
                  </p>
                  <p style={{
                    fontSize: '15px',
                    lineHeight: 1.65,
                    color: C.soft,
                    margin: 0,
                    animation: 'ob-stagger-2 0.45s ease-out 0.1s both',
                  }}>
                    Now — the real questions. This is how I learn your taste, so every place and plan I suggest actually fits you.{' '}
                    <span style={{ color: C.amber, fontStyle: 'italic' }}>I&apos;m a little too excited for this.</span>
                  </p>
                </div>
                <div style={{ animation: 'ob-stagger-3 0.45s ease-out 0.22s both' }}>
                  <Btn onClick={() => advance('q_novelty')}>Let&apos;s go →</Btn>
                </div>
              </div>
            )}

            {/* ── Q1 NOVELTY — image grid ───────────────────────────────── */}
            {step === 'q_novelty' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingTop: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ fontSize: '12px', color: C.amber, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Q1 / 7</p>
                  <p style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(22px, 6vw, 28px)',
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: C.text,
                    margin: 0,
                  }}>
                    New place, new food, new everything — thrilling, or a bit much?
                  </p>
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

            {/* ── Q2 VIBE — image grid ─────────────────────────────────── */}
            {step === 'q_vibe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingTop: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ fontSize: '12px', color: C.amber, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Q2 / 7</p>
                  <p style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(22px, 6vw, 28px)',
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: C.text,
                    margin: 0,
                  }}>
                    If you could return to one kind of place again and again — where&apos;s pulling you?
                  </p>
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

            {/* ── Q3 DISCOVERY — sidecar ───────────────────────────────── */}
            {step === 'q_discovery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <SidecarImage src={SCENES.q_discovery} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '12px', color: C.amber, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Q3 / 7</p>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontStyle: 'italic',
                      fontSize: 'clamp(22px, 6vw, 28px)',
                      fontWeight: 500,
                      lineHeight: 1.35,
                      color: C.text,
                      margin: 0,
                    }}>
                      Somewhere new — the famous must-sees, or the things only locals know?
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {DISCOVERY_OPTIONS.map(({ value, label }) => (
                      <TextOption
                        key={value}
                        label={label}
                        selected={discovery === value}
                        onClick={() => {
                          if (discovery) return;
                          setDiscovery(value);
                          schedule('q_food', 520);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Q4 FOOD — sidecar ────────────────────────────────────── */}
            {step === 'q_food' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <SidecarImage src={SCENES.q_food} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '12px', color: C.amber, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Q4 / 7</p>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontStyle: 'italic',
                      fontSize: 'clamp(22px, 6vw, 28px)',
                      fontWeight: 500,
                      lineHeight: 1.35,
                      color: C.text,
                      margin: 0,
                    }}>
                      And a great meal away is…?
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {FOOD_OPTIONS.map(({ value, label }) => (
                      <TextOption
                        key={value}
                        label={label}
                        selected={food === value}
                        onClick={() => {
                          if (food) return;
                          setFood(value);
                          schedule('q_planning', 520);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Q5 PLANNING — sidecar ────────────────────────────────── */}
            {step === 'q_planning' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <SidecarImage src={SCENES.q_planning} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '12px', color: C.amber, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Q5 / 7</p>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontStyle: 'italic',
                      fontSize: 'clamp(22px, 6vw, 28px)',
                      fontWeight: 500,
                      lineHeight: 1.35,
                      color: C.text,
                      margin: 0,
                    }}>
                      Before a trip — spreadsheet, or wing it?
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {PLANNING_OPTIONS.map(({ value, label }) => (
                      <TextOption
                        key={value}
                        label={label}
                        selected={planning === value}
                        onClick={() => {
                          if (planning) return;
                          setPlanning(value);
                          schedule('q_spend', 520);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Q6 SPEND — sidecar ───────────────────────────────────── */}
            {step === 'q_spend' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <SidecarImage src={SCENES.q_spend} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '12px', color: C.amber, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Q6 / 7</p>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontStyle: 'italic',
                      fontSize: 'clamp(22px, 6vw, 28px)',
                      fontWeight: 500,
                      lineHeight: 1.35,
                      color: C.text,
                      margin: 0,
                    }}>
                      When you treat yourself away, it&apos;s usually…
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {SPEND_OPTIONS.map(({ value, label }) => (
                      <TextOption
                        key={value}
                        label={label}
                        selected={spend === value}
                        onClick={() => {
                          if (spend) return;
                          setSpend(value);
                          schedule('q_dealbreakers', 520);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Q7 DEALBREAKERS — sidecar ─────────────────────────────── */}
            {step === 'q_dealbreakers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <SidecarImage src={SCENES.q_dealbreakers} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '12px', color: C.amber, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Q7 / 7</p>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontStyle: 'italic',
                      fontSize: 'clamp(22px, 6vw, 28px)',
                      fontWeight: 500,
                      lineHeight: 1.35,
                      color: C.text,
                      margin: 0,
                    }}>
                      Be honest — what quietly ruins a trip for you?
                    </p>
                    <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Choose up to 2</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {DEALBREAKER_OPTIONS.map(({ value, label }) => {
                      const selected  = dealbreakers.includes(value);
                      const isDisabled = !selected && dealbreakers.length >= 2;
                      return (
                        <TextOption
                          key={value}
                          label={label}
                          selected={selected}
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
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
                    onClick={() => { advance('close'); void handleSave(); }}
                  >
                    Done — show me my kind of places
                  </Btn>
                </div>
              </div>
            )}

            {/* ── CLOSE / saving ───────────────────────────────────────── */}
            {step === 'close' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(28px, 8vw, 38px)',
                    fontWeight: 500,
                    lineHeight: 1.25,
                    color: C.text,
                    margin: 0,
                    animation: 'ob-stagger-1 0.5s ease-out both',
                  }}>
                    That&apos;s all I need{userName ? `, ${userName}` : ''}.
                  </p>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: 1.65,
                    color: C.soft,
                    margin: 0,
                    animation: 'ob-stagger-2 0.5s ease-out 0.12s both',
                  }}>
                    I&apos;ve got a real feel for you now — let&apos;s go find your kind of places.
                  </p>
                </div>

                {isSaving && !saveError && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '8px', height: '8px',
                          borderRadius: '50%',
                          background: C.amber,
                          animation: `ob-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {saveError && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ fontSize: '14px', color: 'rgba(180,40,40,0.85)', margin: 0, lineHeight: 1.5 }}>
                      {saveError}
                    </p>
                    <Btn fullWidth={false} onClick={() => { void handleSave(); }}>
                      Try again
                    </Btn>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
