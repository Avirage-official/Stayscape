'use client';

import React, { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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
  weight: ['300', '400', '500'],
  display: 'swap',
});

/* ─── Constants ─── */

const VIDEO_SRC = '/videos/postlogin.mp4';

type LoadState = 'loading' | 'ready' | 'error';

/* ─── Helpers ─── */

async function getBearerToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
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

function getGreeting(): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ─── Inline SVG icons ─── */

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ─── Shimmer & section wrapper ─── */

function Shimmer({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.18)',
        animation: 'hd-shimmer 1.6s ease-in-out infinite',
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

function MountSection({
  mounted,
  delay,
  children,
  style,
}: {
  mounted: boolean;
  delay: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        transitionDelay: `${delay}ms`,
        ...style,
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

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

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

  // Preserved: stays data still fetched for AddStayDialog activation flow
  const allStays = useMemo(() => {
    const current = data?.currentStays ?? [];
    const upcoming = data?.upcomingStays ?? [];
    return [...current, ...upcoming];
  }, [data]);
  // allStays intentionally kept for future hotel concierge feature
  void allStays;

  const firstName = data?.profile?.full_name?.split(' ')?.[0] ?? 'Guest';
  const greeting = getGreeting();
  const isNewUser = !itinLoading && loadState === 'ready' && (!itineraries || itineraries.length === 0);

  /* ─── Render ─── */

  return (
    <div
      className={`${dmSans.className} hd-body`}
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        overflowX: 'hidden',
        color: 'var(--text-primary)',
      }}
    >
      <style>{`
        @keyframes hd-shimmer {
          0% { opacity: 0.5 }
          50% { opacity: 1 }
          100% { opacity: 0.5 }
        }

        .hd-body { max-width: 100%; }

        .hd-video-wrap {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .hd-video-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hd-video-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(28, 22, 16, 0.35) 0%, rgba(28, 22, 16, 0.55) 100%),
            rgba(245, 236, 224, 0.18);
          backdrop-filter: blur(0.5px);
        }

        .hd-content {
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        .hd-topbar {
          padding: 22px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hd-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          padding: 0 24px 32px;
          min-height: 0;
        }

        @media (min-width: 900px) {
          .hd-grid {
            grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
            gap: 28px;
            padding: 8px 36px 36px;
          }
        }

        @media (min-width: 1280px) {
          .hd-grid {
            grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
            padding: 8px 48px 48px;
          }
        }

        /* Left zone */
        .hd-left {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 32px;
          color: #fdf9f2;
        }

        .hd-greeting-eyebrow {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(253, 249, 242, 0.65);
          margin: 0 0 10px;
        }

        .hd-greeting-name {
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 300;
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: #fdf9f2;
          margin: 0 0 14px;
        }

        .hd-greeting-sub {
          font-size: 15px;
          font-weight: 300;
          color: rgba(253, 249, 242, 0.75);
          margin: 0;
          line-height: 1.5;
        }

        /* Welcome cards — shown for brand new users */
        .hd-welcome-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hd-welcome-card {
          border-radius: 14px;
          border: 1px solid rgba(253, 249, 242, 0.1);
          background: rgba(253, 249, 242, 0.06);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          color: #fdf9f2;
          transition: background 0.2s ease, border-color 0.2s ease;
          text-align: left;
        }

        .hd-welcome-card:hover {
          background: rgba(253, 249, 242, 0.1);
          border-color: rgba(253, 249, 242, 0.18);
        }

        /* Shortcut row — shown when user has trips */
        .hd-shortcuts {
          display: flex;
          gap: 12px;
        }

        .hd-shortcut {
          flex: 1;
          border-radius: 14px;
          border: 1px solid rgba(253, 249, 242, 0.1);
          background: rgba(253, 249, 242, 0.06);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 16px;
          cursor: pointer;
          color: #fdf9f2;
          transition: background 0.2s ease, border-color 0.2s ease;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hd-shortcut:hover {
          background: rgba(253, 249, 242, 0.11);
          border-color: rgba(253, 249, 242, 0.2);
        }

        .hd-shortcut-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(253, 249, 242, 0.5);
          margin: 0;
        }

        .hd-shortcut-title {
          font-size: 15px;
          font-weight: 300;
          color: #fdf9f2;
          margin: 0;
        }

        /* Right panel */
        .hd-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-radius: 24px;
          border: 1px solid rgba(253, 249, 242, 0.1);
          background: rgba(14, 10, 6, 0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 28px;
          color: #fdf9f2;
          overflow: hidden;
          position: relative;
        }

        .hd-section-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(253, 249, 242, 0.5);
          margin: 0;
        }

        /* Itinerary list items */
        .hd-itin-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid rgba(253, 249, 242, 0.07);
          cursor: pointer;
          transition: opacity 0.18s ease;
        }

        .hd-itin-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .hd-itin-item:hover {
          opacity: 0.75;
        }

        /* Divider */
        .hd-divider {
          height: 1px;
          background: rgba(253, 249, 242, 0.1);
          margin: 0;
        }

        /* Coming soon badge */
        .hd-coming-soon {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 999px;
          border: 1px solid rgba(200, 150, 90, 0.35);
          background: rgba(200, 150, 90, 0.08);
          color: rgba(200, 150, 90, 0.8);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* Notification bell button */
        .hd-bell-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(253, 249, 242, 0.14);
          background: rgba(253, 249, 242, 0.07);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: rgba(253, 249, 242, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .hd-bell-btn:hover {
          background: rgba(253, 249, 242, 0.12);
          border-color: rgba(253, 249, 242, 0.24);
        }

        @media (max-width: 899px) {
          .hd-topbar { padding: 18px 24px; }
          .hd-right { border-radius: 20px; padding: 22px; }
        }
      `}</style>

      {/* ── VIDEO BACKGROUND ── */}
      <div className="hd-video-wrap" aria-hidden="true">
        <video src={VIDEO_SRC} autoPlay muted loop playsInline preload="auto" />
        <div className="hd-video-overlay" />
      </div>

      {/* ── CONTENT ── */}
      <div className="hd-content">

        {/* Top bar */}
        <div className="hd-topbar">
          <MountSection mounted={mounted} delay={0}>
            <div
              className={cormorant.className}
              style={{ fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: 'rgba(253, 249, 242, 0.9)', letterSpacing: '0.02em' }}
            >
              Stayscape
            </div>
          </MountSection>
          <MountSection mounted={mounted} delay={60}>
            <button type="button" aria-label="Open notifications" className="hd-bell-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </MountSection>
        </div>

        {/* Main grid */}
        <div className="hd-grid">

          {/* ── LEFT ZONE ── */}
          <div className="hd-left">

            {/* Greeting */}
            <MountSection mounted={mounted} delay={100}>
              <div>
                <p className={`${dmSans.className} hd-greeting-eyebrow`}>{greeting}</p>
                {loadState === 'loading' ? (
                  <Shimmer style={{ height: 96, width: '60%', borderRadius: 12 }} />
                ) : (
                  <h1 className={`${cormorant.className} hd-greeting-name`}>{firstName}.</h1>
                )}
                <p className={`${dmSans.className} hd-greeting-sub`}>
                  {itinLoading
                    ? ''
                    : itineraries && itineraries.length > 0
                    ? `${itineraries.length} trip${itineraries.length !== 1 ? 's' : ''} in your planner.`
                    : loadState === 'ready'
                    ? 'Welcome to Stayscape — your travel journal starts here.'
                    : ''}
                </p>
              </div>
            </MountSection>

            {/* New user — tab introduction cards */}
            {isNewUser && (
              <MountSection mounted={mounted} delay={200}>
                <div className="hd-welcome-cards">
                  {[
                    {
                      title: 'Explore',
                      desc: 'Browse and save places wherever you are headed.',
                      href: '/dashboard/explore',
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                        </svg>
                      ),
                    },
                    {
                      title: 'Planner',
                      desc: 'Build itineraries for trips, weekends, or just things to do.',
                      href: '/dashboard/planner',
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                        </svg>
                      ),
                    },
                    {
                      title: 'Profile',
                      desc: 'Your preferences help us tailor your experience.',
                      href: '/dashboard/profile',
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      ),
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="hd-welcome-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(card.href)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(card.href); } }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(253,249,242,0.08)', border: '1px solid rgba(253,249,242,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'rgba(253,249,242,0.7)' }}>
                        {card.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className={dmSans.className} style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#fdf9f2' }}>{card.title}</p>
                        <p className={dmSans.className} style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(253,249,242,0.55)', fontWeight: 300 }}>{card.desc}</p>
                      </div>
                      <div style={{ color: 'rgba(253,249,242,0.3)', flexShrink: 0 }}>
                        <IconArrow />
                      </div>
                    </div>
                  ))}
                </div>
              </MountSection>
            )}

            {/* Returning user — quick shortcut buttons */}
            {!isNewUser && !itinLoading && (
              <MountSection mounted={mounted} delay={220}>
                <div className="hd-shortcuts">
                  {[
                    { eyebrow: 'Discover', title: 'Explore Places', href: '/dashboard/explore' },
                    { eyebrow: 'Planner', title: 'My Trips', href: '/dashboard/planner' },
                  ].map((s) => (
                    <button
                      key={s.eyebrow}
                      type="button"
                      className={`${dmSans.className} hd-shortcut`}
                      onClick={() => router.push(s.href)}
                    >
                      <p className="hd-shortcut-eyebrow">{s.eyebrow}</p>
                      <p className="hd-shortcut-title">{s.title}</p>
                    </button>
                  ))}
                </div>
              </MountSection>
            )}
          </div>

          {/* ── RIGHT ZONE — dark panel ── */}
          <MountSection mounted={mounted} delay={200}>
            <div className="hd-right">

              {/* Your Trips header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p className={`${dmSans.className} hd-section-label`} style={{ marginBottom: 8 }}>Your Trips</p>
                  {itinLoading ? (
                    <Shimmer style={{ height: 52, width: 60, borderRadius: 8 }} />
                  ) : (
                    <p className={cormorant.className} style={{ margin: 0, fontSize: 'clamp(2.6rem, 4.5vw, 3.8rem)', fontWeight: 300, lineHeight: 0.9, color: '#fdf9f2' }}>
                      {itineraries?.length ?? 0}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Open planner"
                  onClick={() => router.push('/dashboard/planner')}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(253,249,242,0.15)', background: 'rgba(253,249,242,0.07)', color: 'rgba(253,249,242,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease', flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(253,249,242,0.14)'; e.currentTarget.style.borderColor = 'rgba(253,249,242,0.28)'; e.currentTarget.style.color = '#fdf9f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(253,249,242,0.07)'; e.currentTarget.style.borderColor = 'rgba(253,249,242,0.15)'; e.currentTarget.style.color = 'rgba(253,249,242,0.7)'; }}
                >
                  <IconArrow />
                </button>
              </div>

              {/* Itinerary list */}
              {itinLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Shimmer style={{ height: 50, borderRadius: 8 }} />
                  <Shimmer style={{ height: 50, borderRadius: 8 }} />
                </div>
              ) : itineraries && itineraries.length > 0 ? (
                <div>
                  {itineraries.slice(0, 4).map((itin) => {
                    const title = itin.title ?? itin.stays?.properties?.name ?? 'Untitled trip';
                    const start = itin.stays?.checkindate ?? itin.startdate;
                    const end = itin.stays?.checkoutdate ?? itin.enddate;
                    return (
                      <div
                        key={itin.id}
                        className="hd-itin-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push('/dashboard/planner')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/dashboard/planner'); } }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className={dmSans.className} style={{ margin: 0, fontSize: 14, fontWeight: 400, color: '#fdf9f2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {title}
                          </p>
                          {start && end ? (
                            <p className={dmSans.className} style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(253,249,242,0.5)', fontWeight: 300 }}>
                              {formatDayMonth(start)} – {formatDayMonth(end)}
                            </p>
                          ) : (
                            <p className={dmSans.className} style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(253,249,242,0.35)', fontWeight: 300 }}>
                              No dates set
                            </p>
                          )}
                        </div>
                        <div style={{ color: 'rgba(253,249,242,0.3)', flexShrink: 0 }}>
                          <IconArrow />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p className={dmSans.className} style={{ margin: 0, fontSize: 13, color: 'rgba(253,249,242,0.5)', fontWeight: 300, lineHeight: 1.65 }}>
                    Nothing planned yet. Head to the Planner to start building your first trip.
                  </p>
                  <button
                    type="button"
                    className={dmSans.className}
                    onClick={() => router.push('/dashboard/planner')}
                    style={{ alignSelf: 'flex-start', height: 36, padding: '0 16px', borderRadius: 10, border: '1px solid rgba(253,249,242,0.2)', background: 'rgba(253,249,242,0.07)', color: 'rgba(253,249,242,0.85)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(253,249,242,0.12)'; e.currentTarget.style.borderColor = 'rgba(253,249,242,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(253,249,242,0.07)'; e.currentTarget.style.borderColor = 'rgba(253,249,242,0.2)'; }}
                  >
                    Open Planner
                  </button>
                </div>
              )}

              <div className="hd-divider" />

              {/* Hotel Concierge — Coming Soon */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p className={`${dmSans.className} hd-section-label`} style={{ margin: 0 }}>Hotel Concierge</p>
                  <span className="hd-coming-soon">Coming Soon</span>
                </div>
                <p className={dmSans.className} style={{ margin: 0, fontSize: 12, color: 'rgba(253,249,242,0.38)', fontWeight: 300, lineHeight: 1.6 }}>
                  Link your hotel stay to unlock concierge services, in-room requests, and a curated local experience.
                </p>
              </div>

            </div>
          </MountSection>

        </div>
      </div>

      {/* ── ADD STAY DIALOG — preserved for hotel concierge launch ── */}
      <AddStayDialog
        open={addStayOpen}
        onOpenChange={setAddStayOpen}
        userId={user?.id}
        onActivated={loadDashboard}
      />
    </div>
  );
}
