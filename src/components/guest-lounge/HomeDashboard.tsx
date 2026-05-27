'use client';

import React, { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';
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

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&auto=format&fit=crop';

const VIDEO_SRC = '/videos/postlogin.mp4';

type LoadState = 'loading' | 'ready' | 'error';

/* ─── Date helpers ─── */

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

function IconAirplane() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
  const [selectedStayIdx, setSelectedStayIdx] = useState(0);

  // Mount animation trigger
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Reusable dashboard fetcher (used for initial load + after AddStayDialog success)
  const loadDashboard = React.useCallback(async () => {
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

  // All stays (current + upcoming) — drives the selected-stay index
  const allStays = useMemo(() => {
    const current = data?.currentStays ?? [];
    const upcoming = data?.upcomingStays ?? [];
    return [...current, ...upcoming];
  }, [data]);

  // Derived stay values from the currently selected stay
  const stay = allStays[selectedStayIdx] ?? null;
  const firstName = data?.profile?.full_name?.split(' ')?.[0] ?? 'Guest';
  const propertyName = stay?.property?.name ?? '';
  const propertyCity = stay?.property?.city ?? '';
  const propertyCountry = stay?.property?.country ?? '';
  const propertyImage = stay?.property?.image_url ?? HERO_FALLBACK;
  const checkIn = stay?.check_in ?? null;
  const checkOut = stay?.check_out ?? null;
  const guestCount = stay?.guests ?? null;
  const stayId = stay?.id ?? null;

  const today = useMemo(() => new Date(), []);
  const checkoutDate = checkOut ? parseLocalDate(checkOut) : null;
  const nightsLeft = checkoutDate
    ? Math.max(0, Math.ceil((checkoutDate.getTime() - today.getTime()) / 86400000))
    : null;
  const checkOutFormatted = checkOut ? formatDayMonth(checkOut) : null;
  const greeting = getGreeting();

  const otherStays = allStays.filter((_, i) => i !== selectedStayIdx);
  const hasOtherStays = allStays.length > 1;

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
        @keyframes hd-fade-in {
          from { opacity: 0 }
          to { opacity: 1 }
        }

        .hd-body { max-width: 100%; }

        /* Video background */
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
        /* Soft warm linen tint over the video for legibility */
        .hd-video-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(28, 22, 16, 0.35) 0%, rgba(28, 22, 16, 0.55) 100%),
            rgba(245, 236, 224, 0.18);
          backdrop-filter: blur(0.5px);
        }

        /* Content layer above the video */
        .hd-content {
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        /* Top bar */
        .hd-topbar {
          padding: 22px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Two-column grid */
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

        /* Left zone — editorial */
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

        .hd-greeting-property {
          font-size: 15px;
          font-weight: 300;
          color: rgba(253, 249, 242, 0.75);
          margin: 0;
          line-height: 1.5;
        }

        /* Stats strip */
        .hd-stats {
          display: flex;
          gap: 28px;
        }

        .hd-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hd-stat-value {
          font-size: clamp(1.6rem, 2.8vw, 2.4rem);
          font-weight: 300;
          line-height: 1;
          color: #fdf9f2;
          margin: 0;
        }

        .hd-stat-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(253, 249, 242, 0.5);
          margin: 0;
        }

        /* Soft card (Bookings & Reservations) */
        .hd-soft-card {
          border-radius: 16px;
          border: 1px solid rgba(253, 249, 242, 0.12);
          background: rgba(253, 249, 242, 0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 16px 18px;
        }

        /* Other stays row */
        .hd-other-stays-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hd-other-stay {
          border-radius: 14px;
          border: 1px solid rgba(253, 249, 242, 0.1);
          background: rgba(253, 249, 242, 0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: #fdf9f2;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .hd-other-stay:hover {
          background: rgba(253, 249, 242, 0.1);
          border-color: rgba(253, 249, 242, 0.2);
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

        .hd-right-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .hd-right-title {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(253, 249, 242, 0.5);
          margin: 0 0 8px;
        }

        .hd-countdown-num {
          font-size: clamp(3.5rem, 6vw, 5rem);
          font-weight: 300;
          line-height: 0.9;
          color: #fdf9f2;
          margin: 0 0 10px;
        }

        .hd-countdown-sub {
          font-size: 12px;
          font-weight: 400;
          color: rgba(253, 249, 242, 0.5);
          margin: 0;
          letter-spacing: 0.04em;
        }

        /* Arrow nav buttons */
        .hd-arrow-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(253, 249, 242, 0.15);
          background: rgba(253, 249, 242, 0.07);
          color: rgba(253, 249, 242, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }

        .hd-arrow-btn:hover {
          background: rgba(253, 249, 242, 0.14);
          border-color: rgba(253, 249, 242, 0.28);
          color: #fdf9f2;
        }

        /* Property image card */
        .hd-property-card {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          flex: 1;
          min-height: 180px;
          background: rgba(253, 249, 242, 0.04);
        }

        .hd-property-card[role="button"] {
          cursor: pointer;
        }

        .hd-property-card[role="button"]:hover .hd-property-overlay {
          background: rgba(14, 10, 6, 0.30);
        }

        .hd-property-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(14, 10, 6, 0.05) 0%,
            rgba(14, 10, 6, 0.55) 100%
          );
          transition: background 0.3s ease;
        }

        .hd-property-label {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
        }

        .hd-property-city {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(253, 249, 242, 0.6);
          margin: 0 0 4px;
        }

        .hd-property-name {
          font-size: 18px;
          font-weight: 300;
          color: #fdf9f2;
          margin: 0;
          line-height: 1.25;
        }

        /* Divider */
        .hd-divider {
          height: 1px;
          background: rgba(253, 249, 242, 0.1);
          margin: 0;
        }

        /* Check-in/out row */
        .hd-checkinout {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .hd-checkinout-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .hd-checkinout-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(253, 249, 242, 0.45);
          margin: 0;
        }

        .hd-checkinout-value {
          font-size: 15px;
          font-weight: 300;
          color: #fdf9f2;
          margin: 0;
        }

        .hd-checkinout-sep {
          width: 1px;
          height: 32px;
          background: rgba(253, 249, 242, 0.12);
          flex-shrink: 0;
        }

        @media (max-width: 899px) {
          .hd-topbar {
            padding: 18px 24px;
          }
          .hd-right {
            border-radius: 20px;
            padding: 22px;
          }
        }
      `}</style>

      {/* ── VIDEO BACKGROUND ── */}
      <div className="hd-video-wrap" aria-hidden="true">
        <video
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="hd-video-overlay" />
      </div>

      {/* ── CONTENT ── */}
      <div className="hd-content">
        {/* Top bar */}
        <div className="hd-topbar">
          <MountSection mounted={mounted} delay={0}>
            <div
              className={cormorant.className}
              style={{
                fontSize: 22,
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'rgba(253, 249, 242, 0.9)',
                letterSpacing: '0.02em',
              }}
            >
              Stayscape
            </div>
          </MountSection>

          <MountSection mounted={mounted} delay={60}>
            <button
              type="button"
              aria-label="Open notifications"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: '1px solid rgba(253, 249, 242, 0.14)',
                background: 'rgba(253, 249, 242, 0.07)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'rgba(253, 249, 242, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(253, 249, 242, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(253, 249, 242, 0.24)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(253, 249, 242, 0.07)';
                e.currentTarget.style.borderColor = 'rgba(253, 249, 242, 0.14)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </MountSection>
        </div>

        {/* Main grid */}
        <div className="hd-grid">
          {/* LEFT ZONE — editorial greeting + stats */}
          <div className="hd-left">
            {/* Greeting block */}
            <MountSection mounted={mounted} delay={100}>
              <div>
                <p className={`${dmSans.className} hd-greeting-eyebrow`}>
                  {greeting}
                </p>
                {loadState === 'loading' ? (
                  <Shimmer style={{ height: 96, width: '60%', borderRadius: 12 }} />
                ) : (
                  <h1 className={cormorant.className + ' hd-greeting-name'}>
                    {firstName}.
                  </h1>
                )}
                {propertyName ? (
                  <p className={`${dmSans.className} hd-greeting-property`}>
                    Welcome to <em style={{ fontStyle: 'italic' }}>{propertyName}</em>
                    {propertyCity ? ` — ${[propertyCity, propertyCountry].filter(Boolean).join(', ')}` : ''}.
                  </p>
                ) : (
                  <p className={`${dmSans.className} hd-greeting-property`}>
                    Your stay will appear here once you add a booking reference.
                  </p>
                )}
              </div>
            </MountSection>

            {/* Bottom block: stats + bookings + multi-stays */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Stats strip */}
              <MountSection mounted={mounted} delay={220}>
                <div className="hd-stats">
                  {[
                    { value: nightsLeft !== null ? String(nightsLeft) : '—', label: 'Nights' },
                    { value: guestCount !== null ? String(guestCount) : '—', label: 'Guests' },
                    { value: checkOutFormatted ?? '—', label: 'Checkout' },
                  ].map((col) => (
                    <div key={col.label} className="hd-stat">
                      <p className={cormorant.className + ' hd-stat-value'}>
                        {col.value}
                      </p>
                      <p className={`${dmSans.className} hd-stat-label`}>{col.label}</p>
                    </div>
                  ))}
                </div>
              </MountSection>

              {/* Bookings & Reservations */}
              <MountSection mounted={mounted} delay={300}>
                <div
                  className="hd-soft-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#fdf9f2',
                      }}
                    >
                      Bookings &amp; Reservations
                    </p>
                    {loadState === 'loading' ? (
                      <Shimmer style={{ height: 14, width: 120, marginTop: 4 }} />
                    ) : (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 12,
                          color: 'rgba(253, 249, 242, 0.7)',
                          fontWeight: 300,
                        }}
                      >
                        {allStays.length === 0
                          ? 'Nothing booked yet — let\'s change that.'
                          : `${allStays.length} ${allStays.length === 1 ? 'booking' : 'bookings'}`}
                      </p>
                    )}
                  </div>
                  <div style={{ color: 'rgba(253, 249, 242, 0.7)' }}>
                    <IconAirplane />
                  </div>
                </div>
              </MountSection>

              {/* Multiple stays row */}
              {hasOtherStays && (
                <MountSection mounted={mounted} delay={380}>
                  <div className="hd-other-stays-row">
                    {otherStays.map((s) => {
                      const name = s.property?.name ?? 'Stay';
                      const city = s.property?.city ?? '';
                      const country = s.property?.country ?? '';
                      const img = s.property?.image_url ?? HERO_FALLBACK;
                      return (
                        <div
                          key={s.id}
                          className="hd-other-stay"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            s.property?.slug
                              ? router.push(`/stay/${s.property.slug}/${s.id}`)
                              : router.push('/dashboard')
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              s.property?.slug
                                ? router.push(`/stay/${s.property.slug}/${s.id}`)
                                : router.push('/dashboard');
                            }
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              backgroundImage: `url(${img})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {name}
                            </p>
                            <p
                              style={{
                                margin: '2px 0 0',
                                fontSize: 11,
                                color: 'rgba(253, 249, 242, 0.65)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {[city, country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </MountSection>
              )}
            </div>
          </div>

          {/* RIGHT ZONE — dark rounded panel */}
          <MountSection mounted={mounted} delay={200}>
            <div className="hd-right">
              <div className="hd-right-header">
                <div>
                  <p className={`${dmSans.className} hd-right-title`}>
                    {nightsLeft !== null && nightsLeft > 0 ? 'Nights remaining' : 'Your next stay'}
                  </p>
                  {loadState === 'loading' ? (
                    <Shimmer style={{ height: 56, width: 100, marginTop: 6 }} />
                  ) : (
                    <>
                      <p className={cormorant.className + ' hd-countdown-num'}>
                        {nightsLeft !== null ? nightsLeft : '—'}
                      </p>
                      {checkOutFormatted ? (
                        <p className={`${dmSans.className} hd-countdown-sub`}>
                          Until checkout · {checkOutFormatted}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>

                {hasOtherStays && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="hd-arrow-btn"
                      aria-label="Previous stay"
                      style={{ transform: 'scaleX(-1)' }}
                      onClick={() => setSelectedStayIdx((i) => (i - 1 + allStays.length) % allStays.length)}
                    >
                      <IconArrow />
                    </button>
                    <button
                      type="button"
                      className="hd-arrow-btn"
                      aria-label="Next stay"
                      onClick={() => setSelectedStayIdx((i) => (i + 1) % allStays.length)}
                    >
                      <IconArrow />
                    </button>
                  </div>
                )}
              </div>

              {/* Property image card */}
              <div
                className="hd-property-card"
                role={stay?.property?.slug && stayId ? 'button' : undefined}
                tabIndex={stay?.property?.slug && stayId ? 0 : -1}
                onClick={() =>
                  stay?.property?.slug && stayId
                    ? router.push(`/stay/${stay.property.slug}/${stayId}`)
                    : undefined
                }
                onKeyDown={(e) => {
                  if (
                    (e.key === 'Enter' || e.key === ' ') &&
                    stay?.property?.slug &&
                    stayId
                  ) {
                    e.preventDefault();
                    router.push(`/stay/${stay.property.slug}/${stayId}`);
                  }
                }}
              >
                {loadState === 'loading' ? (
                  <Shimmer style={{ position: 'absolute', inset: 0, borderRadius: 22 }} />
                ) : (
                  <>
                    <img
                      src={propertyImage}
                      alt={propertyName || 'Property'}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="hd-property-overlay" />
                    {propertyName && (
                      <div className="hd-property-label">
                        {propertyCity && (
                          <p className={`${dmSans.className} hd-property-city`}>
                            {[propertyCity, propertyCountry].filter(Boolean).join(', ')}
                          </p>
                        )}
                        <p className={`${cormorant.className} hd-property-name`}>
                          {propertyName}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Divider */}
              {(checkIn || checkOut) && <div className="hd-divider" />}

              {/* Check-in / check-out row */}
              {(checkIn || checkOut) && (
                <div className="hd-checkinout">
                  {checkIn && (
                    <div className="hd-checkinout-item">
                      <p className={`${dmSans.className} hd-checkinout-label`}>Check-in</p>
                      <p className={`${cormorant.className} hd-checkinout-value`}>
                        {formatDayMonth(checkIn)}
                      </p>
                    </div>
                  )}
                  {checkIn && checkOut && <div className="hd-checkinout-sep" />}
                  {checkOut && (
                    <div className="hd-checkinout-item">
                      <p className={`${dmSans.className} hd-checkinout-label`}>Check-out</p>
                      <p className={`${cormorant.className} hd-checkinout-value`}>
                        {formatDayMonth(checkOut)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Add booking reference — secondary action */}
              <button
                type="button"
                onClick={() => setAddStayOpen(true)}
                className={dmSans.className}
                style={{
                  marginTop: 4,
                  width: '100%',
                  height: 44,
                  borderRadius: 14,
                  border: '1px solid rgba(253, 249, 242, 0.18)',
                  background: 'rgba(253, 249, 242, 0.06)',
                  color: 'rgba(253, 249, 242, 0.85)',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(253, 249, 242, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(253, 249, 242, 0.32)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(253, 249, 242, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(253, 249, 242, 0.18)';
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {stay ? 'Add another stay' : 'Add my booking'}
              </button>
            </div>
          </MountSection>
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
