'use client';

import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { DashboardData } from '@/types/customer';
import type { DbItineraryListed } from '@/lib/supabase/itinerary-repository';
import AddStayDialog from '@/components/guest-lounge/AddStayDialog';

/* ─── Fonts ─── */

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

/* ─── Constants ─── */

const VIDEO_SRC = '/videos/postlogin.mp4';
const EXPLORE_REGION_KEY = 'stayscape_explore_region';

/* ─── Types ─── */

type Region = {
  id: string;
  name: string;
  slug: string;
  country_code: string | null;
  image_url: string | null;
};

type LoadState = 'loading' | 'ready' | 'error';

/* ─── Helpers ─── */

async function getBearerToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function regionImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = imagePath.replace(/^region-images\//, '');
  return `${base}/storage/v1/object/public/region-images/${clean}`;
}

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function formatDayMonth(dateStr: string | null): string {
  if (!dateStr) return '—';
  return parseLocalDate(dateStr)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .toUpperCase();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function regionInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ─── Gradient placeholders for regions without images ─── */
const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #2C1A08 0%, #C17F3A 100%)',
  'linear-gradient(135deg, #1A1208 0%, #8B5E2A 100%)',
  'linear-gradient(135deg, #0E1A18 0%, #2A6B5E 100%)',
  'linear-gradient(135deg, #0E0B18 0%, #3A2A6B 100%)',
  'linear-gradient(135deg, #18100E 0%, #6B2A2A 100%)',
];

function placeholderGradient(index: number): string {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
}

/* ─── Sub-components ─── */

function Shimmer({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.08)',
        animation: 'hd-shimmer 1.6s ease-in-out infinite',
        borderRadius: 10,
        ...style,
      }}
    />
  );
}

function MountSection({
  mounted,
  delay,
  children,
}: {
  mounted: boolean;
  delay: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Main Component ─── */

export default function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [mounted, setMounted] = useState(false);
  const [addStayOpen, setAddStayOpen] = useState(false);

  const [itineraries, setItineraries] = useState<DbItineraryListed[] | null>(null);
  const [itinLoading, setItinLoading] = useState(true);

  const [historyStats, setHistoryStats] = useState<{
    total_trips: number;
    cities: number;
    countries: number;
    countries_list: Array<{ country_code: string; flag_emoji: string | null }>;
  } | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);

  // Last region the user picked on explore page
  const [savedRegionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(EXPLORE_REGION_KEY); } catch { return null; }
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/dashboard', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = (await res.json()) as DashboardData;
      setData(json);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  /* Fetch itineraries */
  useEffect(() => {
    async function loadItineraries() {
      const token = await getBearerToken();
      if (!token) { setItinLoading(false); return; }
      try {
        const res = await fetch('/api/customer/itineraries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const json = await res.json() as { itineraries: DbItineraryListed[] };
        setItineraries(json.itineraries);
      } catch {
        setItineraries([]);
      } finally {
        setItinLoading(false);
      }
    }
    void loadItineraries();
  }, []);

  /* Fetch history stats for passport mini card */
  useEffect(() => {
    async function loadHistory() {
      const token = await getBearerToken();
      if (!token) return;
      try {
        const res = await fetch('/api/customer/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json() as {
          stats: { total_trips: number; cities: number; countries: number };
          countries: Array<{ country_code: string; flag_emoji: string | null }>;
        };
        setHistoryStats({
          total_trips: json.stats.total_trips,
          cities: json.stats.cities,
          countries: json.stats.countries,
          countries_list: json.countries,
        });
      } catch { /* ignore */ }
    }
    void loadHistory();
  }, []);

  /* Fetch regions from Supabase directly */
  useEffect(() => {
    async function loadRegions() {
      const supabase = getSupabaseBrowser();
      if (!supabase) { setRegionsLoading(false); return; }
      try {
        const { data: rows } = await supabase
          .from('regions')
          .select('id, name, slug, country_code, image_path, is_active')
          .eq('is_active', true)
          .order('name');

        if (!rows) { setRegionsLoading(false); return; }

        // Put last-picked region first
        const mapped: Region[] = rows.map(r => ({
          id: r.id as string,
          name: r.name as string,
          slug: r.slug as string,
          country_code: (r.country_code as string | null) ?? null,
          image_url: regionImageUrl((r.image_path as string | null) ?? null),
        }));

        if (savedRegionId) {
          const idx = mapped.findIndex(r => r.id === savedRegionId);
          if (idx > 0) {
            const [saved] = mapped.splice(idx, 1);
            mapped.unshift(saved);
          }
        }

        setRegions(mapped);
      } catch {
        setRegions([]);
      } finally {
        setRegionsLoading(false);
      }
    }
    void loadRegions();
  }, [savedRegionId]);

  function handleRegionClick(region: Region) {
    try { localStorage.setItem(EXPLORE_REGION_KEY, region.id); } catch { /* ignore */ }
    router.push('/dashboard/explore');
  }

  const firstName = data?.profile?.full_name?.split(' ')?.[0] ?? null;
  const greeting = getGreeting();

  /* ─── Render ─── */

  return (
    <div
      className={dmSans.className}
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        overflowX: 'hidden',
        background: '#0A0806',
      }}
    >
      <style>{`
        @keyframes hd-shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        .hd-region-card:hover .hd-region-img {
          transform: scale(1.06);
        }
        .hd-trip-row:hover {
          background: rgba(253,249,242,0.06) !important;
        }
        /* Hide scrollbar on region strip */
        .hd-region-strip::-webkit-scrollbar { display: none; }
        .hd-region-strip { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── VIDEO BACKGROUND ── */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}
      >
        <video src={VIDEO_SRC} autoPlay muted loop playsInline preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.70) 100%)',
        }} />
      </div>

      {/* ── CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <MountSection mounted={mounted} delay={0}>
            <span className={cormorant.className} style={{
              fontSize: 20, fontWeight: 400, fontStyle: 'italic',
              color: 'rgba(253,249,242,0.85)', letterSpacing: '0.02em',
            }}>
              Stayscape
            </span>
          </MountSection>
          <MountSection mounted={mounted} delay={60}>
            <button
              type="button"
              aria-label="Open notifications"
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: '1px solid rgba(253,249,242,0.12)',
                background: 'rgba(253,249,242,0.06)',
                color: 'rgba(253,249,242,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </MountSection>
        </div>

        {/* Main scroll area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0 48px',
        }}>
          <div className="lg:flex lg:items-start lg:gap-8 lg:px-10 lg:max-w-screen-xl lg:mx-auto">

            {/* ── LEFT COLUMN: Greeting + Where to next ── */}
            <div className="lg:flex-1 lg:min-w-0" style={{ padding: '0 28px 36px', marginBottom: 0 }}>
              <MountSection mounted={mounted} delay={80}>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12, fontWeight: 500,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: 'rgba(253,249,242,0.45)',
                  margin: '0 0 8px',
                }}>
                  {greeting}
                </p>

                {loadState === 'loading' ? (
                  <Shimmer style={{ height: 56, width: '45%', marginBottom: 6 }} />
                ) : (
                  <h1 className={cormorant.className} style={{
                    fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
                    fontWeight: 300, fontStyle: 'italic',
                    lineHeight: 1, letterSpacing: '-0.01em',
                    color: '#FAF8F5', margin: '0 0 6px',
                  }}>
                    {firstName ? `${firstName}.` : 'Welcome.'}
                  </h1>
                )}

                <p style={{
                  fontSize: 15, fontWeight: 300,
                  color: 'rgba(253,249,242,0.55)',
                  margin: 0, lineHeight: 1.5,
                }}>
                  Where to next?
                </p>
              </MountSection>

              {/* Region cards */}
              <MountSection mounted={mounted} delay={160}>
                <div style={{ marginTop: 20 }}>
                  {regionsLoading ? (
                    <div style={{ display: 'flex', gap: 12, overflowX: 'hidden' }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ flexShrink: 0, width: 140, height: 180, borderRadius: 16 }}>
                          <Shimmer style={{ width: '100%', height: '100%', borderRadius: 16 }} />
                        </div>
                      ))}
                    </div>
                  ) : regions.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'rgba(253,249,242,0.35)', fontWeight: 300 }}>
                      No destinations available yet.
                    </p>
                  ) : (
                    <>
                      {/* Mobile: horizontal scroll strip */}
                      <div
                        className="hd-region-strip lg:hidden"
                        style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}
                      >
                        {regions.map((region: Region, i: number) => (
                          <RegionCard
                            key={region.id}
                            region={region}
                            index={i}
                            isActive={region.id === savedRegionId}
                            onClick={() => handleRegionClick(region)}
                          />
                        ))}
                      </div>
                      {/* Desktop: wrapped grid that fills the left column */}
                      <div
                        className="hidden lg:grid"
                        style={{
                          gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
                          gap: 12,
                        }}
                      >
                        {regions.map((region: Region, i: number) => (
                          <RegionCard
                            key={region.id}
                            region={region}
                            index={i}
                            isActive={region.id === savedRegionId}
                            onClick={() => handleRegionClick(region)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </MountSection>
            </div>

            {/* ── RIGHT COLUMN: Trips + Aria ── */}
            <div
              className="lg:w-80 xl:w-96 lg:flex-shrink-0 lg:sticky lg:top-0"
              style={{ padding: '0 20px 28px' }}
            >

              {/* ── Your Trips ── */}
              <MountSection mounted={mounted} delay={240}>
                <div style={{
                  borderRadius: 20,
                  border: '1px solid rgba(253,249,242,0.09)',
                  background: 'rgba(10,8,6,0.55)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  overflow: 'hidden',
                  marginBottom: 16,
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid rgba(253,249,242,0.07)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{
                        fontSize: 10, fontWeight: 600,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: 'rgba(253,249,242,0.45)', margin: 0,
                      }}>
                        Your Trips
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/history')}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          fontSize: 10, color: 'rgba(193,127,58,0.70)', cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}
                      >
                        See all →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/planner')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(193,127,58,0.15)',
                        border: '1px solid rgba(193,127,58,0.30)',
                        borderRadius: 999, padding: '5px 12px',
                        fontSize: 11, fontWeight: 600,
                        color: '#C17F3A', cursor: 'pointer',
                        letterSpacing: '0.04em',
                        transition: 'background 180ms ease',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,127,58,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(193,127,58,0.15)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add
                    </button>
                  </div>

                  {/* Trip list */}
                  <div>
                    {itinLoading ? (
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Shimmer style={{ height: 44, borderRadius: 8 }} />
                        <Shimmer style={{ height: 44, borderRadius: 8 }} />
                      </div>
                    ) : itineraries && itineraries.length > 0 ? (
                      itineraries.slice(0, 5).map((itin: DbItineraryListed, i: number) => {
                        const title = itin.title ?? itin.stays?.properties?.name ?? 'Untitled trip';
                        const start = itin.stays?.checkindate ?? itin.startdate;
                        const end = itin.stays?.checkoutdate ?? itin.enddate;
                        const isLast = i === Math.min(itineraries.length, 5) - 1;
                        return (
                          <div
                            key={itin.id}
                            className="hd-trip-row"
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push('/dashboard/planner')}
                            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/dashboard/planner'); } }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '14px 20px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(253,249,242,0.06)',
                              cursor: 'pointer',
                              transition: 'background 150ms ease',
                              borderRadius: isLast ? '0 0 20px 20px' : 0,
                            }}
                          >
                            <div style={{
                              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                              background: 'rgba(193,127,58,0.12)',
                              border: '1px solid rgba(193,127,58,0.20)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C17F3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: '#FAF8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {title}
                              </p>
                              <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 300, color: 'rgba(253,249,242,0.45)' }}>
                                {start && end ? `${formatDayMonth(start)} – ${formatDayMonth(end)}` : 'No dates set'}
                              </p>
                            </div>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(253,249,242,0.25)', flexShrink: 0 }} aria-hidden="true">
                              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p className={cormorant.className} style={{
                          margin: 0, fontSize: 17, fontStyle: 'italic',
                          fontWeight: 400, color: 'rgba(253,249,242,0.38)',
                        }}>
                          Nothing planned yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push('/dashboard/planner')}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            fontSize: 12, color: '#C17F3A', cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                            letterSpacing: '0.02em',
                            transition: 'color 180ms ease',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#D6A252'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#C17F3A'; }}
                        >
                          Start planning →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </MountSection>

              {/* ── Passport mini card ── */}
              {historyStats && historyStats.total_trips > 0 && (
                <MountSection mounted={mounted} delay={280}>
                  <div style={{
                    borderRadius: 20,
                    border: '1px solid rgba(253,249,242,0.09)',
                    background: 'rgba(10,8,6,0.55)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    marginBottom: 16,
                    padding: '16px 20px',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <p style={{
                        fontSize: 10, fontWeight: 600,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: 'rgba(253,249,242,0.45)', margin: 0,
                      }}>
                        Passport
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/history')}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          fontSize: 10, color: 'rgba(193,127,58,0.70)', cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}
                      >
                        View all →
                      </button>
                    </div>

                    {/* Stats row */}
                    <div style={{
                      display: 'flex',
                      marginBottom: historyStats.countries_list.length > 0 ? 14 : 0,
                    }}>
                      {([
                        { value: historyStats.total_trips, label: 'Trips' },
                        { value: historyStats.cities, label: 'Cities' },
                        { value: historyStats.countries, label: 'Countries' },
                      ] as { value: number; label: string }[]).map((s, i) => (
                        <div key={s.label} style={{
                          flex: 1,
                          textAlign: 'center',
                          borderRight: i < 2 ? '1px solid rgba(253,249,242,0.08)' : 'none',
                        }}>
                          <p className={cormorant.className} style={{
                            margin: 0, fontSize: 26, fontWeight: 400, fontStyle: 'italic',
                            color: '#FAF8F5', lineHeight: 1,
                          }}>
                            {s.value}
                          </p>
                          <p style={{
                            margin: '4px 0 0', fontSize: 9, fontWeight: 600,
                            letterSpacing: '0.16em', textTransform: 'uppercase',
                            color: 'rgba(253,249,242,0.35)',
                          }}>
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Flag chips */}
                    {historyStats.countries_list.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {historyStats.countries_list.slice(0, 8).map(c => (
                          <span key={c.country_code} style={{
                            fontSize: 16, lineHeight: 1,
                            width: 28, height: 28, borderRadius: 8,
                            background: 'rgba(253,249,242,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {c.flag_emoji ?? c.country_code}
                          </span>
                        ))}
                        {historyStats.countries_list.length > 8 && (
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: 'rgba(253,249,242,0.38)',
                            width: 28, height: 28, borderRadius: 8,
                            background: 'rgba(253,249,242,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            +{historyStats.countries_list.length - 8}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </MountSection>
              )}

              {/* ── Aria ── */}
              <MountSection mounted={mounted} delay={320}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '17px 20px',
                  borderRadius: 20,
                  border: '1px solid rgba(193,127,58,0.18)',
                  background: 'rgba(193,127,58,0.06)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  opacity: 0.65,
                  cursor: 'default',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: 'rgba(193,127,58,0.15)',
                      border: '1px solid rgba(193,127,58,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#C17F3A', fontSize: 16,
                    }}>
                      ✦
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#FAF8F5' }}>
                        Chat with Aria
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 300, color: 'rgba(253,249,242,0.40)' }}>
                        Your AI travel concierge
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'rgba(193,127,58,0.70)',
                    border: '1px solid rgba(193,127,58,0.25)',
                    borderRadius: 999, padding: '4px 9px',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    Coming Soon
                  </span>
                </div>
              </MountSection>

            </div>
          </div>
        </div>
      </div>

      {/* ── ADD STAY DIALOG ── */}
      <AddStayDialog
        open={addStayOpen}
        onOpenChange={setAddStayOpen}
        userId={user?.id}
        onActivated={loadDashboard}
      />
    </div>
  );
}

/* ─── Region Card ─── */

function RegionCard({
  region,
  index,
  isActive,
  onClick,
}: {
  region: Region;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hd-region-card"
      style={{
        flexShrink: 0,
        width: 140,
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        border: isActive ? '2px solid #C17F3A' : '2px solid transparent',
        background: 'transparent',
        padding: 0,
        transition: 'border-color 180ms ease, box-shadow 180ms ease',
        boxShadow: isActive ? '0 0 0 1px rgba(193,127,58,0.40)' : 'none',
      }}
    >
      {/* Image or gradient placeholder */}
      {region.image_url ? (
        <div
          className="hd-region-img"
          style={{
            position: 'absolute', inset: 0,
            transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={region.image_url}
            alt={region.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: placeholderGradient(index),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 28, fontWeight: 300,
            color: 'rgba(253,249,242,0.35)',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
          }}>
            {regionInitials(region.name)}
          </span>
        </div>
      )}

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(8,5,2,0.82) 0%, rgba(8,5,2,0.20) 55%, transparent 100%)',
      }} />

      {/* City name */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 12px 13px',
        textAlign: 'left',
      }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 600,
          color: '#FAF8F5', lineHeight: 1.2,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {region.name}
        </p>
        {isActive && (
          <p style={{
            margin: '3px 0 0', fontSize: 10, fontWeight: 500,
            color: '#C17F3A', letterSpacing: '0.08em',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Last visited
          </p>
        )}
      </div>
    </button>
  );
}
