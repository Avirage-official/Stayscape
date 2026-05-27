'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { value: 'pioneer',  label: "I go where others haven't" },
  { value: 'explorer', label: 'I love discovering, with some comfort' },
  { value: 'homebody', label: 'I find a neighbourhood and live in it' },
] as const;

const VIBE_OPTIONS = [
  { value: 'city',    label: 'City' },
  { value: 'culture', label: 'Culture' },
  { value: 'nature',  label: 'Nature' },
  { value: 'beach',   label: 'Beach' },
] as const;

const DISCOVERY_OPTIONS = [
  { value: 'word_of_mouth',   label: "Locals or friends who've been — I need that personal tip" },
  { value: 'deep_research',   label: 'I read everything before I go' },
  { value: 'spontaneous',     label: 'I just wander and see what happens' },
  { value: 'curated_lists',   label: 'I trust editors and best-of guides' },
] as const;

const FOOD_OPTIONS = [
  { value: 'local_markets',      label: 'Street food, hawkers, market stalls' },
  { value: 'neighbourhood_gems', label: 'Unpretentious local restaurants' },
  { value: 'destination_dining', label: 'The place everyone is talking about' },
  { value: 'fuel_not_ritual',    label: 'Easy and unfussy — I eat to keep going' },
] as const;

const PLANNING_OPTIONS = [
  { value: 'planner',      label: 'Spreadsheet, itinerary, fully sorted' },
  { value: 'loose_plan',   label: 'A few anchors, rest is open' },
  { value: 'first_day',    label: 'I plan the first day, then improvise' },
  { value: 'full_improv',  label: "Wing it entirely — that's the fun" },
] as const;

const SPEND_OPTIONS = [
  { value: 'value_first',    label: 'Best value — I research before every spend' },
  { value: 'comfort_floor',  label: 'Comfort baseline, splurge on what matters' },
  { value: 'quality_always', label: 'Quality over quantity, always' },
  { value: 'no_limits',      label: 'No holding back — you only live once' },
] as const;

const DEALBREAKER_OPTIONS = [
  { value: 'rushed',       label: 'Feeling rushed' },
  { value: 'crowds',       label: 'Big crowds' },
  { value: 'bad_food',     label: 'Bad food' },
  { value: 'downtime',     label: 'Too much downtime' },
  { value: 'overspending', label: 'Overspending' },
  { value: 'chaos',        label: 'Disorganised chaos' },
] as const;

// ─── Country / city data ──────────────────────────────────────────────────────
// A curated list of popular travel countries with major cities.
// Covers the most common home-base selections globally.

const COUNTRY_CITY_MAP: Record<string, string[]> = {
  'Australia':           ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra'],
  'Austria':             ['Vienna', 'Salzburg', 'Graz', 'Innsbruck'],
  'Belgium':             ['Brussels', 'Antwerp', 'Ghent', 'Bruges'],
  'Brazil':              ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte'],
  'Canada':              ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Quebec City'],
  'China':               ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Xi\'an'],
  'Czech Republic':      ['Prague', 'Brno', 'Ostrava'],
  'Denmark':             ['Copenhagen', 'Aarhus', 'Odense'],
  'Egypt':               ['Cairo', 'Alexandria', 'Hurghada', 'Sharm el-Sheikh'],
  'Finland':             ['Helsinki', 'Tampere', 'Turku'],
  'France':              ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Toulouse', 'Strasbourg'],
  'Germany':             ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf'],
  'Greece':              ['Athens', 'Thessaloniki', 'Heraklion', 'Patras'],
  'Hong Kong':           ['Hong Kong'],
  'Hungary':             ['Budapest', 'Debrecen', 'Pécs'],
  'India':               ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'],
  'Indonesia':           ['Jakarta', 'Bali', 'Surabaya', 'Bandung', 'Yogyakarta', 'Medan'],
  'Ireland':             ['Dublin', 'Cork', 'Galway', 'Limerick'],
  'Israel':              ['Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat'],
  'Italy':               ['Rome', 'Milan', 'Florence', 'Venice', 'Naples', 'Turin', 'Bologna', 'Palermo'],
  'Japan':               ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Hiroshima'],
  'Jordan':              ['Amman', 'Aqaba', 'Petra'],
  'Malaysia':            ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Kota Kinabalu', 'Ipoh'],
  'Mexico':              ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla', 'Oaxaca'],
  'Morocco':             ['Casablanca', 'Marrakech', 'Fez', 'Rabat', 'Tangier'],
  'Netherlands':         ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  'New Zealand':         ['Auckland', 'Wellington', 'Christchurch', 'Queenstown', 'Hamilton'],
  'Norway':              ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
  'Philippines':         ['Manila', 'Cebu City', 'Davao', 'Quezon City', 'Makati'],
  'Poland':              ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań'],
  'Portugal':            ['Lisbon', 'Porto', 'Faro', 'Braga', 'Coimbra'],
  'Saudi Arabia':        ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'],
  'Singapore':           ['Singapore'],
  'South Africa':        ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria'],
  'South Korea':         ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'],
  'Spain':               ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Bilbao', 'Málaga', 'Granada'],
  'Sweden':              ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'],
  'Switzerland':         ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
  'Taiwan':              ['Taipei', 'Taichung', 'Kaohsiung', 'Tainan'],
  'Thailand':            ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Hua Hin'],
  'Turkey':              ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
  'United Kingdom':      ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Liverpool', 'Bristol'],
  'United States':       ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Seattle', 'Boston', 'Washington DC', 'Las Vegas', 'Dallas', 'Denver', 'Atlanta', 'Austin'],
  'Vietnam':             ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Nha Trang'],
};

const ALL_COUNTRIES = Object.keys(COUNTRY_CITY_MAP).sort();

// ─── Step types ───────────────────────────────────────────────────────────────

type Step =
  | 'greeting' | 'name' | 'age_band' | 'location' | 'location_bridge'
  | 'q_novelty' | 'q_vibe' | 'q_discovery' | 'q_food'
  | 'q_planning' | 'q_spend' | 'q_dealbreakers' | 'close';

const ALL_STEPS: Step[] = [
  'greeting', 'name', 'age_band', 'location', 'location_bridge',
  'q_novelty', 'q_vibe', 'q_discovery', 'q_food', 'q_planning',
  'q_spend', 'q_dealbreakers', 'close',
];

// ─── Image maps ───────────────────────────────────────────────────────────────

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

const ALL_IMAGES: string[] = [
  ...Object.values(PANEL_IMAGE) as string[],
  '/onboarding/novelty/pioneer.jpg',
  '/onboarding/novelty/explorer.jpg',
  '/onboarding/novelty/homebody.jpg',
  '/onboarding/vibe/city.jpg',
  '/onboarding/vibe/culture.jpg',
  '/onboarding/vibe/nature.jpg',
  '/onboarding/vibe/beach.jpg',
];

const NOVELTY_IMG: Record<string, string> = {
  pioneer:  '/onboarding/novelty/pioneer.jpg',
  explorer: '/onboarding/novelty/explorer.jpg',
  homebody: '/onboarding/novelty/homebody.jpg',
};

const VIBE_IMG: Record<string, string> = {
  city:    '/onboarding/vibe/city.jpg',
  culture: '/onboarding/vibe/culture.jpg',
  nature:  '/onboarding/vibe/nature.jpg',
  beach:   '/onboarding/vibe/beach.jpg',
};

// ─── Floating card copy per step ──────────────────────────────────────────────

type CardCopy = { label: string; text: string };

const CARD_COPY: Partial<Record<Step, CardCopy>> = {
  greeting:        { label: 'FIRST MEETING', text: "Tell me who you are, and I'll find your kind of places." },
  name:            { label: 'ABOUT YOU',     text: 'A name is where every great trip begins.' },
  age_band:        { label: 'YOUR ERA',      text: 'Every age travels differently. Beautifully so.' },
  location:        { label: 'HOME BASE',     text: 'Where you come from shapes how you see the world.' },
  location_bridge: { label: 'NOTED',         text: 'Now — the questions that actually matter.' },
  q_novelty:       { label: 'TRAVEL STYLE',  text: 'The best trips are the ones that feel right for you.' },
  q_vibe:          { label: 'YOUR VIBE',     text: 'What pulls you back to a place, again and again.' },
  q_discovery:     { label: 'EXPLORATION',   text: 'How you find things reveals how you want to feel.' },
  q_food:          { label: 'FOOD & DRINK',  text: 'A great meal can be the whole point of a trip.' },
  q_planning:      { label: 'YOUR STYLE',    text: 'There is no wrong way to travel — only yours.' },
  q_spend:         { label: 'PHILOSOPHY',    text: 'How you spend says everything about what you value.' },
  q_dealbreakers:  { label: 'PREFERENCES',   text: 'Honesty here makes everything better.' },
  close:           { label: 'ALL DONE',      text: "I know you now. Let's find your places." },
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:      '#F7F6F3',
  surface: '#FFFFFF',
  ink:     '#0F0F0F',
  soft:    '#5A5855',
  muted:   '#9E9B97',
  line:    '#E6E4DF',
} as const;

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS  = "'Outfit', system-ui, sans-serif";

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Outfit:wght@300;400;500;600&display=swap');

  @keyframes ob-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-fade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-tile {
    from { opacity: 0; transform: translateY(10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes ob-zoom {
    from { transform: scale(1); }
    to   { transform: scale(1.04); }
  }
  @keyframes ob-dot {
    0%,100% { opacity: 0.2; transform: scale(0.75); }
    50%     { opacity: 1;   transform: scale(1); }
  }
  @keyframes ob-reaction {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-card {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes ob-dropdown {
    from { opacity: 0; transform: translateY(6px) scaleY(0.96); }
    to   { opacity: 1; transform: translateY(0) scaleY(1); }
  }

  .ob-input {
    background: #FFFFFF !important;
    color: #0F0F0F !important;
    -webkit-text-fill-color: #0F0F0F !important;
  }
  .ob-input:focus {
    border-color: #0F0F0F !important;
    box-shadow: none !important;
    outline: none;
  }
  .ob-input::placeholder { color: #C4C2BE; }
  .ob-input:-webkit-autofill,
  .ob-input:-webkit-autofill:hover,
  .ob-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #0F0F0F !important;
    -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
  }

  .ob-option:hover:not(:disabled) {
    border-color: #0F0F0F !important;
    background: #FAFAF8 !important;
  }
  .ob-chip-btn:hover:not(:disabled) {
    border-color: #0F0F0F !important;
    background: #FAFAF8 !important;
  }
  .ob-tile-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02) !important;
    box-shadow: 0 10px 28px rgba(0,0,0,0.20) !important;
  }
  .ob-dd-item:hover {
    background: #F7F6F3 !important;
    color: #0F0F0F !important;
  }

  @media (max-width: 767px) {
    .ob-right { display: none !important; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useImagePreloader(urls: string[]) {
  useEffect(() => {
    urls.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const stagger = (i: number, base = 0.06): CSSProperties => ({
  animation: `ob-fade 0.44s cubic-bezier(0.22,1,0.36,1) ${(i * base).toFixed(3)}s both`,
});

// ─── Progress dots ────────────────────────────────────────────────────────────

const CHAPTERS: Step[][] = [
  ['greeting', 'name', 'age_band', 'location', 'location_bridge'],
  ['q_novelty', 'q_vibe', 'q_discovery', 'q_food', 'q_planning', 'q_spend', 'q_dealbreakers'],
  ['close'],
];

function ProgressDots({ step }: { step: Step }) {
  const current = CHAPTERS.findIndex((c) => c.includes(step));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {CHAPTERS.map((_, i) => (
        <div
          key={i}
          style={{
            height: '5px',
            width: i === current ? '28px' : '5px',
            borderRadius: '100px',
            background: i <= current ? C.ink : C.line,
            transition: 'all 0.45s cubic-bezier(0.22,1,0.36,1)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Searchable dropdown ──────────────────────────────────────────────────────

interface SearchDropdownProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

function SearchDropdown({ options, value, onChange, placeholder, label, disabled, autoFocus }: SearchDropdownProps) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const containerRef        = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function select(option: string) {
    onChange(option);
    setOpen(false);
    setQuery('');
  }

  function handleTriggerClick() {
    if (disabled) return;
    setOpen((v) => !v);
    // Focus the search input when opening
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  const fieldLabelStyle: CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: '8px',
    fontFamily: SANS,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={fieldLabelStyle}>{label}</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        style={{
          width: '100%',
          height: '52px',
          padding: '0 18px',
          borderRadius: '14px',
          background: C.surface,
          border: `1px solid ${open ? C.ink : C.line}`,
          color: value ? C.ink : C.muted,
          fontSize: '15px',
          fontFamily: SANS,
          fontWeight: 400,
          outline: 'none',
          transition: 'border-color 150ms ease',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          opacity: disabled ? 0.42 : 1,
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={C.muted} strokeWidth={2.2}
          style={{ flexShrink: 0, transition: 'transform 180ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: C.surface,
          border: `1px solid ${C.line}`,
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'ob-dropdown 0.22s cubic-bezier(0.22,1,0.36,1) both',
          transformOrigin: 'top',
        }}>
          {/* Search input */}
          <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${C.line}` }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: C.bg,
              borderRadius: '10px',
              padding: '0 12px',
              height: '38px',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                autoFocus={autoFocus}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontFamily: SANS,
                  fontSize: '13px',
                  color: C.ink,
                  fontWeight: 400,
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '6px 6px 8px', scrollbarWidth: 'thin' }}>
            {filtered.length === 0 ? (
              <p style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: '14px',
                color: C.muted,
                textAlign: 'center',
                padding: '14px 0',
                margin: 0,
              }}>
                Nothing found
              </p>
            ) : filtered.map((option) => {
              const isSel = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => select(option)}
                  className="ob-dd-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isSel ? '#F7F6F3' : 'transparent',
                    color: isSel ? C.ink : C.soft,
                    fontFamily: SANS,
                    fontSize: '14px',
                    fontWeight: isSel ? 500 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 100ms ease, color 100ms ease',
                    outline: 'none',
                  }}
                >
                  <span>{option}</span>
                  {isSel && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.5} style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Right panel ──────────────────────────────────────────────────────────────

function RightPanel({ src, step }: { src: string; step: Step }) {
  const [layers, setLayers] = useState<{ src: string; key: number; opacity: number }[]>([
    { src, key: 0, opacity: 1 },
  ]);
  const keyRef = useRef(1);
  const card = CARD_COPY[step];

  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.src === src) return prev;
      const k = keyRef.current++;
      return [...prev.slice(-1), { src, key: k, opacity: 0 }];
    });
  }, [src]);

  const handleLoad = useCallback((key: number) => {
    setLayers((prev) => prev.map((l) => l.key === key ? { ...l, opacity: 1 } : l));
    setTimeout(() => setLayers((prev) => prev.length > 1 ? prev.slice(-1) : prev), 1100);
  }, []);

  return (
    <div
      className="ob-right"
      style={{
        flex: '1 1 0',
        margin: '14px 14px 14px 0',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.06)',
        background: '#CCC9C1',
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {layers.map(({ src: lSrc, key, opacity }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            inset: 0,
            opacity,
            transition: 'opacity 1.1s cubic-bezier(0.25,0,0,1)',
            animation: 'ob-zoom 30s ease-in-out alternate infinite',
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

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(150deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.20) 45%, rgba(0,0,0,0.52) 100%)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {card && (
        <div
          key={`card-${step}`}
          style={{
            position: 'relative',
            zIndex: 20,
            width: 'calc(100% - 52px)',
            maxWidth: '370px',
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '26px 26px 22px',
            boxShadow: '0 22px 56px rgba(0,0,0,0.24), 0 4px 14px rgba(0,0,0,0.06)',
            animation: 'ob-card 0.52s cubic-bezier(0.22,1,0.36,1) both',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <div style={{
              width: '28px', height: '28px', flexShrink: 0,
              borderRadius: '50%',
              border: `1px solid ${C.line}`,
              background: C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', color: C.soft,
              fontFamily: SANS,
              userSelect: 'none',
            }}>
              ←
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#0F0F0F',
              borderRadius: '100px',
              padding: '5px 12px 5px 9px',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFF', flexShrink: 0 }} />
              <span style={{
                fontFamily: SANS,
                fontSize: '9.5px',
                fontWeight: 600,
                letterSpacing: '0.13em',
                color: '#FFFFFF',
              }}>
                {card.label}
              </span>
            </div>
          </div>

          <p style={{
            fontFamily: SERIF,
            fontSize: 'clamp(20px, 2vw, 25px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#0F0F0F',
            lineHeight: 1.38,
            margin: '0 0 26px',
          }}>
            {card.text}
          </p>

          <div style={{ height: '1px', background: C.line, marginBottom: '16px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['PREFERENCES', 'TRAVEL STYLE', 'PLACES'].map((l) => (
              <span key={l} style={{
                fontFamily: SANS,
                fontSize: '9.5px',
                fontWeight: 600,
                letterSpacing: '0.13em',
                color: '#C4C2BE',
              }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

function Btn({
  onClick, disabled, children, variant = 'primary', fullWidth = true,
}: {
  onClick: () => void; disabled?: boolean; children: ReactNode;
  variant?: 'primary' | 'ghost'; fullWidth?: boolean;
}) {
  const [hov, setHov] = useState(false);

  const base: CSSProperties = {
    height: '48px',
    borderRadius: '100px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: SANS,
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.01em',
    opacity: disabled ? 0.36 : 1,
    border: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    padding: '0 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box' as const,
    transition: 'background 150ms ease, opacity 150ms ease',
    flexShrink: 0,
  };

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: hov && !disabled ? '#2A2A2A' : '#0F0F0F',
      color: '#FFFFFF',
    },
    ghost: {
      background: 'transparent',
      color: hov && !disabled ? C.ink : C.soft,
      border: `1px solid ${C.line}`,
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
}

// ─── Text option row ──────────────────────────────────────────────────────────

function TextOption({ label, selected, onClick, disabled }: {
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
        minHeight: '50px',
        padding: '12px 18px',
        borderRadius: '14px',
        border: `1px solid ${selected ? C.ink : C.line}`,
        background: selected ? '#FAFAF8' : C.surface,
        color: selected ? C.ink : disabled ? C.muted : C.soft,
        fontFamily: SANS,
        fontSize: '14px',
        fontWeight: selected ? 500 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease',
        outline: 'none',
        opacity: disabled && !selected ? 0.38 : 1,
        textAlign: 'left',
        lineHeight: 1.5,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {label}
    </button>
  );
}

// ─── Image tile ───────────────────────────────────────────────────────────────

function ImageTile({ src, label, selected, onClick, disabled, delay = 0 }: {
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
        aspectRatio: '2 / 3',
        maxHeight: '190px',
        borderRadius: '14px',
        overflow: 'hidden',
        border: `2px solid ${selected ? C.ink : 'transparent'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: '#CCC9C1',
        transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 200ms ease',
        padding: 0,
        display: 'block',
        width: '100%',
        boxShadow: selected ? '0 6px 22px rgba(0,0,0,0.20)' : '0 2px 8px rgba(0,0,0,0.08)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        opacity: disabled && !selected ? 0.36 : 1,
        animation: `ob-tile 0.40s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
      }}
    >
      <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.06) 60%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {selected && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      )}
      <span style={{
        position: 'absolute', bottom: '10px', left: '10px', right: '10px',
        fontFamily: SANS, fontSize: '12px', fontWeight: 500,
        color: '#FFFFFF', pointerEvents: 'none',
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        letterSpacing: '0.01em',
      }}>
        {label}
      </span>
    </button>
  );
}

// ─── Shared text styles ───────────────────────────────────────────────────────

const heading: CSSProperties = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  color: C.ink,
  fontWeight: 500,
  lineHeight: 1.24,
  margin: 0,
};

const subtext: CSSProperties = {
  fontFamily: SANS,
  fontSize: '15px',
  color: C.soft,
  margin: 0,
  lineHeight: 1.65,
  fontWeight: 300,
};

const stepLabel: CSSProperties = {
  fontFamily: SANS,
  fontSize: '11px',
  fontWeight: 500,
  color: C.muted,
  letterSpacing: '0.04em',
  margin: 0,
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { userId: string; onCompleted: () => void; }

export default function ProfileOnboardingFlow({ userId: _userId, onCompleted }: Props) {
  useImagePreloader(ALL_IMAGES);

  const [step,           setStep]          = useState<Step>('greeting');
  const [animKey,        setAnimKey]       = useState(0);
  const [userName,       setUserName]      = useState('');
  const [nameInput,      setNameInput]     = useState('');
  const [ageBand,        setAgeBand]       = useState('');
  const [ageReaction,    setAgeReaction]   = useState('');
  // Location: separate country + city dropdowns
  const [locCountry,     setLocCountry]    = useState('');
  const [locCity,        setLocCity]       = useState('');
  const [novelty,        setNovelty]       = useState('');
  const [vibe,           setVibe]          = useState<string[]>([]);
  const [discovery,      setDiscovery]     = useState('');
  const [food,           setFood]          = useState('');
  const [planning,       setPlanning]      = useState('');
  const [spend,          setSpend]         = useState('');
  const [dealbreakers,   setDealbreakers]  = useState<string[]>([]);
  const [isSaving,       setIsSaving]      = useState(false);
  const [saveError,      setSaveError]     = useState<string | null>(null);

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

  const goBack = useCallback(() => {
    const idx = ALL_STEPS.indexOf(step);
    if (idx <= 0) return;
    const prev = ALL_STEPS[idx - 1];
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (prev === 'age_band')    { setAgeBand(''); setAgeReaction(''); }
    if (prev === 'q_novelty')   setNovelty('');
    if (prev === 'q_discovery') setDiscovery('');
    if (prev === 'q_food')      setFood('');
    if (prev === 'q_planning')  setPlanning('');
    if (prev === 'q_spend')     setSpend('');
    setAnimKey((k) => k + 1);
    setStep(prev);
  }, [step]);

  // Cities for the selected country
  const cityOptions = useMemo(
    () => (locCountry ? (COUNTRY_CITY_MAP[locCountry] ?? []) : []),
    [locCountry],
  );

  // Clear city when country changes
  const handleCountryChange = useCallback((country: string) => {
    setLocCountry(country);
    setLocCity('');
  }, []);

  const locationReady = !!locCountry && !!locCity;

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
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'POST', headers,
        body: JSON.stringify({
          name:             userName    || undefined,
          age_band:         ageBand     || undefined,
          location_city:    locCity     || undefined,
          location_country: locCountry  || undefined,
          novelty:          novelty     || undefined,
          vibe:             vibe.length         ? vibe         : undefined,
          discovery:        discovery   || undefined,
          food:             food        || undefined,
          planning:         planning    || undefined,
          spend:            spend       || undefined,
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
  }, [userName, ageBand, locCity, locCountry, novelty, vibe, discovery, food, planning, spend, dealbreakers, onCompleted]);

  const panelSrc    = PANEL_IMAGE[step] ?? '/onboarding/scenes/welcome.jpg';
  const displayName = userName || 'you';
  const displayCity = locCity || locCountry || 'That';

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      background: C.bg,
      fontFamily: SANS,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflow: 'hidden', minHeight: 0 }}>

        {/* ═══ LEFT PANEL ═══ */}
        <div style={{
          flex: '0 0 46%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          {/* Header */}
          <div style={{
            flexShrink: 0,
            padding: 'clamp(22px,3vh,34px) clamp(32px,5vw,60px) 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: '18px',
              fontWeight: 600,
              color: C.ink,
              letterSpacing: '-0.01em',
            }}>
              Stayscape
            </span>
            <ProgressDots step={step} />
          </div>

          {/* Scrollable content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(28px,4.5vh,52px) clamp(32px,5vw,64px)',
            minHeight: 0,
          }}>
            <div style={{ maxWidth: '520px' }}>
            <div
              key={`content-${step}-${animKey}`}
              style={{ animation: 'ob-up 0.42s cubic-bezier(0.22,1,0.36,1) both' }}
            >

              {/* ── GREETING ── */}
              {step === 'greeting' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h1 style={{ ...heading, fontSize: 'clamp(2rem,3.4vw,2.9rem)', ...stagger(0) }}>
                      Hello! I&apos;m so happy you&apos;re here.
                    </h1>
                    <p style={{ ...subtext, maxWidth: '36ch', ...stagger(1) }}>
                      I&apos;m Aria — your personal travel curator. A couple of honest questions and I&apos;ll know your taste better than most apps ever will.
                    </p>
                  </div>
                  <div style={stagger(2)}>
                    <Btn onClick={() => advance('name')}>Let&apos;s begin</Btn>
                  </div>
                </div>
              )}

              {/* ── NAME ── */}
              {step === 'name' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  <h2 style={{ ...heading, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', ...stagger(0) }}>
                    I&apos;m Aria — and you are?
                  </h2>
                  <div style={stagger(1)}>
                    <label style={{
                      display: 'block', fontSize: '11px', fontWeight: 500,
                      letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                      color: C.muted, marginBottom: '8px', fontFamily: SANS,
                    }}>
                      Your name
                    </label>
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
                      style={{
                        width: '100%', height: '52px', padding: '0 18px',
                        borderRadius: '14px', background: C.surface,
                        border: `1px solid ${C.line}`, color: C.ink,
                        fontSize: '15px', fontFamily: SANS, fontWeight: 400,
                        outline: 'none', transition: 'border-color 150ms ease',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', ...stagger(2) }}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.6vw,2.1rem)', ...stagger(0) }}>
                    Lovely to meet you{userName ? `, ${userName}` : ''}. Which era do I have the pleasure of?
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', ...stagger(1) }}>
                    {AGE_BANDS.map(({ value, label }) => {
                      const sel = ageBand === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!!ageBand}
                          className="ob-chip-btn"
                          onClick={() => {
                            if (ageBand) return;
                            setAgeBand(value);
                            setAgeReaction(AGE_REACTIONS[value] ?? '');
                            schedule('location', 1800);
                          }}
                          style={{
                            height: '48px',
                            borderRadius: '12px',
                            border: `1px solid ${sel ? C.ink : C.line}`,
                            background: sel ? '#FAFAF8' : C.surface,
                            color: sel ? C.ink : C.soft,
                            fontFamily: SANS,
                            fontSize: '13.5px',
                            fontWeight: sel ? 600 : 400,
                            cursor: ageBand ? 'not-allowed' : 'pointer',
                            transition: 'all 150ms ease',
                            outline: 'none',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {ageReaction && (
                    <p key={ageReaction} style={{
                      fontFamily: SERIF, fontStyle: 'italic', fontSize: '16px',
                      color: C.soft, margin: 0,
                      animation: 'ob-reaction 0.38s ease-out both',
                    }}>
                      {ageReaction}
                    </p>
                  )}
                  {!ageBand && (
                    <div style={stagger(2)}>
                      <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                    </div>
                  )}
                </div>
              )}

              {/* ── LOCATION ── */}
              {step === 'location' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  <h2 style={{ ...heading, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', ...stagger(0) }}>
                    And where do you call mi casa?
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', ...stagger(1) }}>
                    {/* Country dropdown */}
                    <SearchDropdown
                      label="Country"
                      options={ALL_COUNTRIES}
                      value={locCountry}
                      onChange={handleCountryChange}
                      placeholder="Select your country"
                      autoFocus
                    />

                    {/* City dropdown — appears once a country is chosen */}
                    {locCountry && (
                      <div style={{ animation: 'ob-fade 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
                        <SearchDropdown
                          label="City"
                          options={cityOptions}
                          value={locCity}
                          onChange={setLocCity}
                          placeholder="Select your city"
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', ...stagger(2) }}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                    <Btn
                      onClick={() => advance('location_bridge')}
                      disabled={!locationReady}
                    >
                      Continue
                    </Btn>
                  </div>
                </div>
              )}

              {/* ── LOCATION BRIDGE ── */}
              {step === 'location_bridge' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', ...stagger(0) }}>
                      {displayCity} — noted. Perfect. Thank you, {displayName}.
                    </h2>
                    <p style={{ ...subtext, maxWidth: '38ch', ...stagger(1) }}>
                      Now — the real questions. This is how I learn your taste, so every place I suggest actually fits you.
                    </p>
                    <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '16px', color: C.soft, margin: 0, ...stagger(2) }}>
                      I&apos;m a little too excited for this.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', ...stagger(3) }}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                    <Btn onClick={() => advance('q_novelty')}>Let&apos;s go</Btn>
                  </div>
                </div>
              )}

              {/* ── Q1 NOVELTY ── */}
              {step === 'q_novelty' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...stepLabel, ...stagger(0) }}>01 / 07</p>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.4vw,2rem)', ...stagger(1) }}>
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
                  <div style={stagger(5)}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                  </div>
                </div>
              )}

              {/* ── Q2 VIBE ── */}
              {step === 'q_vibe' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...stepLabel, ...stagger(0) }}>02 / 07</p>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.4vw,2rem)', ...stagger(1) }}>
                      If you could return to one kind of place again and again — where&apos;s pulling you?
                    </h2>
                    <p style={{ fontFamily: SANS, fontSize: '12px', color: C.muted, margin: 0, fontWeight: 400, ...stagger(2) }}>
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
                  <div style={{ display: 'flex', gap: '10px', ...stagger(7) }}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                    <Btn onClick={() => advance('q_discovery')} disabled={vibe.length === 0}>Continue</Btn>
                  </div>
                </div>
              )}

              {/* ── Q3 DISCOVERY ── */}
              {step === 'q_discovery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...stepLabel, ...stagger(0) }}>03 / 07</p>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.4vw,2rem)', ...stagger(1) }}>
                      Somewhere new — how do you find the places worth going to?
                    </h2>
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
                  <div style={stagger(7)}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                  </div>
                </div>
              )}

              {/* ── Q4 FOOD ── */}
              {step === 'q_food' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...stepLabel, ...stagger(0) }}>04 / 07</p>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.4vw,2rem)', ...stagger(1) }}>
                      And a great meal away is…?
                    </h2>
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
                  <div style={stagger(7)}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                  </div>
                </div>
              )}

              {/* ── Q5 PLANNING ── */}
              {step === 'q_planning' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...stepLabel, ...stagger(0) }}>05 / 07</p>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.4vw,2rem)', ...stagger(1) }}>
                      Before a trip — how does it usually come together?
                    </h2>
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
                  <div style={stagger(7)}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                  </div>
                </div>
              )}

              {/* ── Q6 SPEND ── */}
              {step === 'q_spend' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...stepLabel, ...stagger(0) }}>06 / 07</p>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.4vw,2rem)', ...stagger(1) }}>
                      When you treat yourself away, it&apos;s usually…
                    </h2>
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
                  <div style={stagger(7)}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                  </div>
                </div>
              )}

              {/* ── Q7 DEALBREAKERS ── */}
              {step === 'q_dealbreakers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ ...stepLabel, ...stagger(0) }}>07 / 07</p>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.5rem,2.4vw,2rem)', ...stagger(1) }}>
                      Be honest — what quietly ruins a trip for you?
                    </h2>
                    <p style={{ fontFamily: SANS, fontSize: '12px', color: C.muted, margin: 0, fontWeight: 400, ...stagger(2) }}>
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
                  <div style={{ display: 'flex', gap: '10px', ...stagger(10) }}>
                    <Btn variant="ghost" fullWidth={false} onClick={goBack}>Back</Btn>
                    <Btn
                      onClick={() => { advance('close'); void handleSave(); }}
                      disabled={dealbreakers.length === 0}
                    >
                      Done — show me my kind of places
                    </Btn>
                  </div>
                </div>
              )}

              {/* ── CLOSE ── */}
              {step === 'close' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h2 style={{ ...heading, fontSize: 'clamp(1.8rem,3vw,2.7rem)', ...stagger(0) }}>
                      That&apos;s all I need{userName ? `, ${userName}` : ''}.
                    </h2>
                    <p style={{ ...subtext, ...stagger(1) }}>I&apos;ve got a real feel for you now.</p>
                    <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '16px', color: C.soft, margin: 0, ...stagger(2) }}>
                      Let&apos;s go find your kind of places.
                    </p>
                  </div>
                  {isSaving && !saveError && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: C.ink,
                          animation: `ob-dot 1.2s ease-in-out ${i * 0.22}s infinite`,
                        }} />
                      ))}
                    </div>
                  )}
                  {saveError && (
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: '14px',
                      background: 'rgba(200,50,50,0.04)',
                      border: '1px solid rgba(200,50,50,0.14)',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                      ...stagger(3),
                    }}>
                      <p style={{ fontSize: '13px', color: '#C13A3A', margin: 0, lineHeight: 1.5, fontFamily: SANS }}>
                        {saveError}
                      </p>
                      <Btn variant="ghost" fullWidth={false} onClick={() => { void handleSave(); }}>
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

        {/* ═══ RIGHT PANEL ═══ */}
        <RightPanel src={panelSrc} step={step} />

      </div>
    </div>
  );
}
