'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// ── Constants ──────────────────────────────────────────────────────────────────

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
  '56_plus':"The finest traveller there is — you've earned the good stuff.",
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
  { value: 'icons',  label: 'Icons — the must-sees' },
  { value: 'hidden', label: 'Hidden — what locals know' },
  { value: 'mix',    label: 'A bit of both' },
] as const;

const FOOD_OPTIONS = [
  { value: 'street',     label: 'Street food & markets' },
  { value: 'sit_down',   label: 'Proper sit-down' },
  { value: 'easy',       label: 'Easy & convenient' },
  { value: 'food_first', label: 'Food is the whole trip' },
] as const;

const PLANNING_OPTIONS = [
  { value: 'planner',    label: 'Spreadsheet planner' },
  { value: 'loose',      label: 'Loose outline' },
  { value: 'improviser', label: 'Pure wing it' },
] as const;

const SPEND_OPTIONS = [
  { value: 'simple',  label: 'Simple & good' },
  { value: 'quality', label: 'Quality over quantity' },
  { value: 'all_out', label: 'All out' },
] as const;

const DEALBREAKER_OPTIONS = [
  { value: 'rushed',      label: 'Feeling rushed' },
  { value: 'crowds',      label: 'Crowds' },
  { value: 'bad_food',    label: 'Bad food' },
  { value: 'downtime',    label: 'Too much downtime' },
  { value: 'overspending',label: 'Overspending' },
  { value: 'chaos',       label: 'Chaos & disorganisation' },
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

// Scene backgrounds for non-question screens
const SCENE_BG: Partial<Record<Step, string>> = {
  greeting:        '/onboarding/scenes/welcome.jpg',
  name:            '/onboarding/scenes/intro-portrait.jpg',
  age_band:        '/onboarding/scenes/age-era.jpg',
  location:        '/onboarding/scenes/home-origin.jpg',
  location_bridge: '/onboarding/scenes/bridge-curiosity.jpg',
  close:           '/onboarding/scenes/closing.jpg',
};

// Editorial sidecar images for text-only question steps
const Q_SIDECAR: Partial<Record<Step, string>> = {
  q_discovery:    '/onboarding/scenes/discovery-editorial.jpg',
  q_food:         '/onboarding/scenes/food-editorial.jpg',
  q_planning:     '/onboarding/scenes/planning-editorial.jpg',
  q_spend:        '/onboarding/scenes/spend-editorial.jpg',
  q_dealbreakers: '/onboarding/scenes/dealbreakers-editorial.jpg',
};

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  bg:          '#FAF7F2',
  text:        '#2C1A08',
  soft:        'rgba(44,26,8,0.55)',
  muted:       'rgba(44,26,8,0.35)',
  amber:       '#C17F3A',
  amberHover:  '#D6A252',
  amberLight:  'rgba(193,127,58,0.12)',
  border:      'rgba(193,127,58,0.28)',
  white:       '#FFFFFF',
  textOnImage: '#FAF8F5',
  scrim:       'rgba(20,10,2,0.52)',
  scrimLight:  'rgba(20,10,2,0.32)',
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseLocation(raw: string): { city: string; country: string } {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
  return { city: raw.trim(), country: '' };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

// Animated background image with ambient zoom
function SceneBg({ src, visible }: { src: string; visible: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        transition: 'opacity 0.7s ease',
        opacity: visible && loaded && !error ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          animation: 'ambientZoom 14s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
      />
    </div>
  );
}

// Sidecar editorial image strip
function SidecarImage({ src }: { src: string }) {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [src]);

  if (error) return null;

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        aspectRatio: '16 / 9',
        background: 'rgba(193,127,58,0.1)',
        transition: 'opacity 0.55s ease, transform 0.55s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt=""
        onError={() => setError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

function Btn({
  onClick, disabled, children, variant = 'primary', fullWidth = true,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  fullWidth?: boolean;
  onDark?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const base: CSSProperties = {
    height: '50px',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background 0.18s, border-color 0.18s, opacity 0.18s',
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

// On-image CTA — for scene screens where the bg is a photo
function SceneBtn({
  onClick, disabled, children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '52px',
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        transition: 'background 0.2s, opacity 0.2s',
        opacity: disabled ? 0.45 : 1,
        outline: 'none',
        border: 'none',
        width: '100%',
        background: hovered && !disabled
          ? 'rgba(255,255,255,0.22)'
          : 'rgba(255,255,255,0.14)',
        color: C.textOnImage,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset',
      }}
    >
      {children}
    </button>
  );
}

function TextOption({
  label, sublabel, selected, onClick, disabled,
}: {
  label: string;
  sublabel?: string;
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
        alignItems: sublabel ? 'flex-start' : 'center',
        justifyContent: sublabel ? 'flex-start' : 'center',
        flexDirection: sublabel ? 'column' : 'row',
        gap: sublabel ? '2px' : '0',
        minHeight: sublabel ? '56px' : '48px',
        borderRadius: '12px',
        border: `1.5px solid ${selected ? C.amber : C.border}`,
        background: selected
          ? C.amberLight
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
        padding: sublabel ? '12px 14px' : '0 14px',
        textAlign: 'left',
      }}
    >
      <span>{label}</span>
      {sublabel && (
        <span style={{ fontSize: '11.5px', color: selected ? C.amberHover : C.muted, fontWeight: 400 }}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

function ImageTile({
  src, label, selected, onClick, disabled,
}: {
  src: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
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
        borderRadius: '16px',
        overflow: 'hidden',
        border: `2.5px solid ${selected ? C.amber : 'transparent'}`,
        cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        background: imgError
          ? 'linear-gradient(135deg, #E8D5B8 0%, #D4B896 100%)'
          : '#2C1A08',
        outline: 'none',
        transition: 'border-color 0.18s, transform 0.18s',
        transform: selected ? 'scale(0.975)' : 'scale(1)',
        padding: 0,
        display: 'block',
        width: '100%',
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
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s ease',
              transform: selected ? 'scale(1.04)' : 'scale(1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)',
              padding: '32px 12px 14px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontSize: '17px',
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
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontStyle: 'italic',
              fontSize: '17px',
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
            background: 'rgba(193,127,58,0.2)',
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
}

// ── Progress rail ──────────────────────────────────────────────────────────────

function ProgressRail({ current }: { current: number }) {
  return (
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
        zIndex: 20,
      }}
    >
      {QUESTION_STEPS.map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '3px',
            borderRadius: '99px',
            background: i < current
              ? C.amber
              : i === current
                ? 'transparent'
                : 'rgba(193,127,58,0.2)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {i === current && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '99px',
                background: C.amber,
                animation: 'railFill 0.4s ease-out both',
                transformOrigin: 'left',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ProfileOnboardingFlowProps {
  userId: string;
  onCompleted: () => void;
}

export default function ProfileOnboardingFlow({ userId: _userId, onCompleted }: ProfileOnboardingFlowProps) {
  const [step, setStep]                       = useState<Step>('greeting');
  const [prevStep, setPrevStep]               = useState<Step | null>(null);
  const [transitioning, setTransitioning]     = useState(false);
  const [userName, setUserName]               = useState('');
  const [nameInput, setNameInput]             = useState('');
  const [ageBand, setAgeBand]                 = useState('');
  const [ageReaction, setAgeReaction]         = useState('');
  const [locationInput, setLocationInput]     = useState('');
  const [locationCity, setLocationCity]       = useState('');
  const [novelty, setNovelty]                 = useState('');
  const [vibe, setVibe]                       = useState<string[]>([]);
  const [discovery, setDiscovery]             = useState('');
  const [food, setFood]                       = useState('');
  const [planning, setPlanning]               = useState('');
  const [spend, setSpend]                     = useState('');
  const [dealbreakers, setDealbreakers]       = useState<string[]>([]);
  const [isSaving, setIsSaving]               = useState(false);
  const [saveError, setSaveError]             = useState<string | null>(null);

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
  }, [step]);

  const advance = useCallback((to: Step) => {
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    setTransitioning(true);
    setTimeout(() => {
      setPrevStep(step);
      setStep(to);
      setTransitioning(false);
    }, 260);
  }, [step]);

  function scheduleAdvance(to: Step, ms: number) {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => advance(to), ms);
  }

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

  const questionIndex = QUESTION_STEPS.indexOf(step);
  const isQuestion    = questionIndex !== -1;
  const isSceneStep   = !isQuestion && step !== 'close';
  const sceneBg       = SCENE_BG[step];
  const sidecar       = Q_SIDECAR[step];
  const isImageQ      = step === 'q_novelty' || step === 'q_vibe';
  const displayName   = userName || 'you';
  const displayCity   = locationCity || 'that';
  const isSceneCover  = Boolean(sceneBg);

  // Close screen also gets scene treatment
  const isFullSceneCover = isSceneCover || step === 'close';

  return (
    <div
      style={{
        minHeight: '100dvh',
        position: 'relative',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-dm-sans)',
        color: C.text,
        overflowX: 'hidden',
      }}
    >
      {/* ── Global keyframes ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes ambientZoom {
          from { transform: scale(1); }
          to   { transform: scale(1.06); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-14px); }
        }
        @keyframes textShake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%     { transform: translateX(-2px) rotate(-0.4deg); }
          30%     { transform: translateX(2px) rotate(0.4deg); }
          50%     { transform: translateX(-2px) rotate(-0.3deg); }
          70%     { transform: translateX(1.5px) rotate(0.3deg); }
          85%     { transform: translateX(-1px) rotate(-0.2deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 0.3; transform: scale(0.85); }
          50%     { opacity: 1;   transform: scale(1); }
        }
        @keyframes railFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .step-content {
          animation: stepIn 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }
        .step-content.exiting {
          animation: stepOut 0.22s ease-in both;
        }
      `}</style>

      {/* ── Scene background layer ──────────────────────────────────────────── */}
      {isFullSceneCover && sceneBg && (
        <SceneBg src={sceneBg} visible={!transitioning} />
      )}
      {/* close screen bg */}
      {step === 'close' && (
        <SceneBg src="/onboarding/scenes/closing.jpg" visible={!transitioning} />
      )}

      {/* ── Scrim over scene backgrounds ───────────────────────────────────── */}
      {isFullSceneCover && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, ${C.scrim} 0%, rgba(20,10,2,0.18) 55%, ${C.scrimLight} 100%)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* ── Content shell ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isFullSceneCover ? 'flex-end' : 'center',
          padding: isFullSceneCover
            ? `32px 24px ${isQuestion ? '80px' : '44px'}`
            : `40px 24px ${isQuestion ? '80px' : '40px'}`,
          boxSizing: 'border-box',
        }}
      >
        <div
          key={step}
          className={`step-content${transitioning ? ' exiting' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
        >

          {/* ═══════════════════════════════════════════════════════════════
              SCENE SCREENS — full-bleed photo with text floating above
          ═══════════════════════════════════════════════════════════════ */}

          {/* ── Greeting ──────────────────────────────────────────────────── */}
          {step === 'greeting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(32px, 9vw, 42px)',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: sceneBg ? C.textOnImage : C.text,
                  margin: 0,
                  animation: 'textShake 0.9s ease-in-out 0.5s, fadeUp 0.5s ease-out both',
                  textShadow: sceneBg ? '0 1px 16px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                Hello! I&apos;m so happy you&apos;re here.
              </p>
              <p
                style={{
                  fontSize: '15px',
                  color: sceneBg ? 'rgba(250,248,245,0.72)' : C.soft,
                  margin: 0,
                  lineHeight: 1.6,
                  animation: 'fadeUp 0.5s ease-out 0.15s both',
                }}
              >
                A few quick questions and I'll know exactly what kind of traveller you are.
              </p>
              <div style={{ animation: 'fadeUp 0.5s ease-out 0.28s both' }}>
                {sceneBg
                  ? <SceneBtn onClick={() => advance('name')}>Get started</SceneBtn>
                  : <Btn onClick={() => advance('name')}>Get started</Btn>
                }
              </div>
            </div>
          )}

          {/* ── Name ──────────────────────────────────────────────────────── */}
          {step === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(28px, 7.5vw, 36px)',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: sceneBg ? C.textOnImage : C.text,
                  margin: 0,
                  textShadow: sceneBg ? '0 1px 12px rgba(0,0,0,0.35)' : 'none',
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
                  background: sceneBg ? 'rgba(255,255,255,0.15)' : C.white,
                  backdropFilter: sceneBg ? 'blur(8px)' : undefined,
                  WebkitBackdropFilter: sceneBg ? 'blur(8px)' : undefined,
                  border: sceneBg ? '1.5px solid rgba(255,255,255,0.3)' : `1.5px solid ${C.border}`,
                  borderRadius: '12px',
                  padding: '15px 16px',
                  fontSize: '16px',
                  fontFamily: 'var(--font-dm-sans)',
                  color: sceneBg ? C.textOnImage : C.text,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              {sceneBg
                ? <SceneBtn onClick={() => { setUserName(nameInput.trim()); advance('age_band'); }} disabled={!nameInput.trim()}>Continue</SceneBtn>
                : <Btn onClick={() => { setUserName(nameInput.trim()); advance('age_band'); }} disabled={!nameInput.trim()}>Continue</Btn>
              }
            </div>
          )}

          {/* ── Age band ──────────────────────────────────────────────────── */}
          {step === 'age_band' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(24px, 6.5vw, 30px)',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: sceneBg ? C.textOnImage : C.text,
                  margin: 0,
                  textShadow: sceneBg ? '0 1px 12px rgba(0,0,0,0.35)' : 'none',
                }}
              >
                Lovely to meet you{userName ? `, ${userName}` : ''}. And roughly which era do I have the pleasure of?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '9px' }}>
                {AGE_BANDS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={Boolean(ageBand)}
                    onClick={() => {
                      if (ageBand) return;
                      setAgeBand(value);
                      setAgeReaction(AGE_REACTIONS[value] ?? '');
                      scheduleAdvance('location', 1700);
                    }}
                    style={{
                      height: '44px',
                      borderRadius: '10px',
                      border: `1.5px solid ${
                        ageBand === value
                          ? C.amber
                          : sceneBg ? 'rgba(255,255,255,0.28)' : C.border
                      }`,
                      background: ageBand === value
                        ? sceneBg ? 'rgba(193,127,58,0.32)' : C.amberLight
                        : sceneBg ? 'rgba(255,255,255,0.1)' : C.white,
                      color: ageBand === value ? (sceneBg ? '#FFE0A8' : C.amber) : (sceneBg ? C.textOnImage : C.text),
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '13.5px',
                      fontWeight: ageBand === value ? 600 : 400,
                      cursor: ageBand ? 'default' : 'pointer',
                      transition: 'all 0.18s ease',
                      outline: 'none',
                      backdropFilter: sceneBg ? 'blur(6px)' : undefined,
                      WebkitBackdropFilter: sceneBg ? 'blur(6px)' : undefined,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {ageReaction && (
                <p
                  key={ageReaction}
                  style={{
                    fontSize: '14.5px',
                    fontStyle: 'italic',
                    color: sceneBg ? '#FFD48A' : C.amber,
                    margin: 0,
                    lineHeight: 1.55,
                    animation: 'fadeUp 0.35s ease-out both',
                    textShadow: sceneBg ? '0 1px 8px rgba(0,0,0,0.4)' : 'none',
                  }}
                >
                  {ageReaction}
                </p>
              )}
            </div>
          )}

          {/* ── Location ──────────────────────────────────────────────────── */}
          {step === 'location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(26px, 7vw, 32px)',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: sceneBg ? C.textOnImage : C.text,
                  margin: 0,
                  textShadow: sceneBg ? '0 1px 12px rgba(0,0,0,0.35)' : 'none',
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
                  background: sceneBg ? 'rgba(255,255,255,0.15)' : C.white,
                  backdropFilter: sceneBg ? 'blur(8px)' : undefined,
                  WebkitBackdropFilter: sceneBg ? 'blur(8px)' : undefined,
                  border: sceneBg ? '1.5px solid rgba(255,255,255,0.3)' : `1.5px solid ${C.border}`,
                  borderRadius: '12px',
                  padding: '15px 16px',
                  fontSize: '16px',
                  fontFamily: 'var(--font-dm-sans)',
                  color: sceneBg ? C.textOnImage : C.text,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              {sceneBg
                ? <SceneBtn
                    onClick={() => { const { city } = parseLocation(locationInput); setLocationCity(city); advance('location_bridge'); }}
                    disabled={!locationInput.trim()}
                  >Continue</SceneBtn>
                : <Btn
                    onClick={() => { const { city } = parseLocation(locationInput); setLocationCity(city); advance('location_bridge'); }}
                    disabled={!locationInput.trim()}
                  >Continue</Btn>
              }
            </div>
          )}

          {/* ── Location bridge ───────────────────────────────────────────── */}
          {step === 'location_bridge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(27px, 7.5vw, 34px)',
                    fontWeight: 500,
                    lineHeight: 1.25,
                    color: sceneBg ? C.textOnImage : C.text,
                    margin: 0,
                    textShadow: sceneBg ? '0 1px 14px rgba(0,0,0,0.4)' : 'none',
                  }}
                >
                  {displayCity} — noted. Perfect.<br />Thank you, {displayName}.
                </p>
                <p
                  style={{
                    fontSize: '14.5px',
                    lineHeight: 1.7,
                    color: sceneBg ? 'rgba(250,248,245,0.75)' : C.soft,
                    margin: 0,
                    animation: 'fadeUp 0.4s ease-out 0.12s both',
                  }}
                >
                  Now — the real questions. This is how I learn your taste, so every place and plan I suggest actually fits you.{' '}
                  <span style={{ color: sceneBg ? '#FFD48A' : C.amber, fontStyle: 'italic' }}>
                    I&apos;m a little too excited for this.
                  </span>
                </p>
              </div>
              <div style={{ animation: 'fadeUp 0.4s ease-out 0.24s both' }}>
                {sceneBg
                  ? <SceneBtn onClick={() => advance('q_novelty')}>Let&apos;s go</SceneBtn>
                  : <Btn onClick={() => advance('q_novelty')}>Let&apos;s go</Btn>
                }
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              QUESTION SCREENS
          ═══════════════════════════════════════════════════════════════ */}

          {/* ── Q1 novelty — image tiles ───────────────────────────────────── */}
          {step === 'q_novelty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>1 of 7</p>
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {NOVELTY_OPTIONS.map(({ value, label }) => (
                  <ImageTile
                    key={value}
                    src={`/onboarding/novelty/${value}.jpg`}
                    label={label}
                    selected={novelty === value}
                    onClick={() => {
                      if (novelty) return;
                      setNovelty(value);
                      scheduleAdvance('q_vibe', 540);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q2 vibe — image tiles multi-select ───────────────────────────── */}
          {step === 'q_vibe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>2 of 7</p>
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
                <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>Pick up to 2</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

          {/* ── Q3–Q7: editorial layout with sidecar image ───────────────────── */}

          {/* ── Q3 discovery ──────────────────────────────────────────────── */}
          {step === 'q_discovery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sidecar && <SidecarImage src={sidecar} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>3 of 7</p>
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
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {DISCOVERY_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={discovery === value}
                    onClick={() => {
                      if (discovery) return;
                      setDiscovery(value);
                      scheduleAdvance('q_food', 480);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q4 food ───────────────────────────────────────────────────── */}
          {step === 'q_food' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sidecar && <SidecarImage src={sidecar} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>4 of 7</p>
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                {FOOD_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={food === value}
                    onClick={() => {
                      if (food) return;
                      setFood(value);
                      scheduleAdvance('q_planning', 480);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q5 planning ───────────────────────────────────────────────── */}
          {step === 'q_planning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sidecar && <SidecarImage src={sidecar} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>5 of 7</p>
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
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {PLANNING_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={planning === value}
                    onClick={() => {
                      if (planning) return;
                      setPlanning(value);
                      scheduleAdvance('q_spend', 480);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q6 spend ──────────────────────────────────────────────────── */}
          {step === 'q_spend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sidecar && <SidecarImage src={sidecar} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>6 of 7</p>
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
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {SPEND_OPTIONS.map(({ value, label }) => (
                  <TextOption
                    key={value}
                    label={label}
                    selected={spend === value}
                    onClick={() => {
                      if (spend) return;
                      setSpend(value);
                      scheduleAdvance('q_dealbreakers', 480);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Q7 dealbreakers ───────────────────────────────────────────── */}
          {step === 'q_dealbreakers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sidecar && <SidecarImage src={sidecar} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>7 of 7</p>
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
                <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>Pick up to 2</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
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
                          prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
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

          {/* ── Close / saving ────────────────────────────────────────────── */}
          {step === 'close' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(28px, 7.5vw, 36px)',
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: C.textOnImage,
                  margin: 0,
                  textShadow: '0 1px 16px rgba(0,0,0,0.45)',
                  animation: 'fadeUp 0.5s ease-out both',
                }}
              >
                That&apos;s all I need{userName ? `, ${userName}` : ''}. I&apos;ve got a real feel for you now — let&apos;s go find your kind of places.
              </p>

              {isSaving && !saveError && (
                <div style={{ display: 'flex', gap: '8px', animation: 'fadeUp 0.4s ease-out 0.2s both' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'rgba(250,248,245,0.7)',
                        animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}

              {saveError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeUp 0.35s ease-out both' }}>
                  <p style={{ fontSize: '13.5px', color: 'rgba(255,180,180,0.9)', margin: 0, lineHeight: 1.5 }}>
                    {saveError}
                  </p>
                  <SceneBtn onClick={() => { void handleSave(); }}>
                    Try again
                  </SceneBtn>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Progress rail (questions only) ──────────────────────────────────── */}
      {isQuestion && <ProgressRail current={questionIndex} />}

      {/* Suppress unused var warning */}
      {void prevStep}
      {void isSceneStep}
      {void isImageQ}
    </div>
  );
}
