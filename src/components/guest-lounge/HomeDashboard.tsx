'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import { useAuth } from '@/lib/context/auth-context';
import {
  fetchItineraryItems,
  type DbItineraryItem,
} from '@/lib/supabase/itinerary-repository';
import type { DashboardData } from '@/types/customer';
import type { DiscoveryPlaceCard } from '@/types/database';

import WarmBottomTabBar from './WarmBottomTabBar';

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
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * The repository's `DbItineraryItem` doesn't expose `name` / `category`
 * directly — the dashboard spec treats them as optional display fields
 * that may be populated by upstream joins. We keep them optional here so
 * the component degrades gracefully when they're absent.
 */
type ItineraryItemDisplay = DbItineraryItem & {
  name?: string | null;
  category?: string | null;
};

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

function formatDayNumber(dateStr: string): string {
  return String(parseLocalDate(dateStr).getDate());
}

function formatMonthShort(dateStr: string): string {
  return parseLocalDate(dateStr)
    .toLocaleDateString('en-GB', { month: 'short' })
    .toUpperCase();
}

function isSameLocalDay(dateStr: string, today: Date): boolean {
  const d = parseLocalDate(dateStr);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function weekdayShort(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
}

function getGreeting(): 'GOOD MORNING' | 'GOOD AFTERNOON' | 'GOOD EVENING' {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

/* ─── Inline SVG icons ─── */

function IconSearch() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconAirplane() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-muted)"
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
      stroke="var(--text-muted)"
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

function CategoryIcon({ category }: { category?: string | null }) {
  const c = (category ?? '').toLowerCase();
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'var(--text-muted)',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (c === 'dining' || c === 'food') {
    return (
      <svg {...common}>
        <path d="M7 2v20" />
        <path d="M5 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" />
        <path d="M17 2c-1.5 0-3 1.5-3 4v5h3v11" />
      </svg>
    );
  }
  if (c === 'nature' || c === 'park') {
    return (
      <svg {...common}>
        <path d="M12 22V12" />
        <path d="M12 12c0-5 3-9 8-9 0 5-3 9-8 9z" />
        <path d="M12 14c0-3-2-6-6-6 0 3 2 6 6 6z" />
      </svg>
    );
  }
  if (c === 'culture' || c === 'museum') {
    return (
      <svg {...common}>
        <path d="M3 21h18" />
        <path d="M5 21V10l7-5 7 5v11" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }
  if (c === 'shopping') {
    return (
      <svg {...common}>
        <path d="M5 7h14l-1.5 13a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

/* ─── Shimmer block ─── */

function Shimmer({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        animation: 'hd-shimmer 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/* ─── Section wrapper that animates on mount ─── */

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
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Component ─── */

export default function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [places, setPlaces] = useState<DiscoveryPlaceCard[]>([]);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItemDisplay[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer to next frame so the initial paint happens with `mounted=false`,
    // letting the entrance transition actually animate. Wrapping in rAF also
    // avoids the `react-hooks/set-state-in-effect` lint rule which forbids
    // synchronous state updates inside an effect body.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Dashboard fetch
  useEffect(() => {
    let cancelled = false;
    fetch('/api/customer/dashboard', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load dashboard');
        return (await res.json()) as DashboardData;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setLoadState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived stay info
  const stay = data?.currentStays?.[0] ?? data?.upcomingStays?.[0] ?? null;
  const firstName = data?.profile?.full_name?.split(' ')?.[0] ?? 'Guest';
  const propertyName = stay?.property?.name ?? '';
  const propertyCity = stay?.property?.city ?? '';
  const propertyCountry = stay?.property?.country ?? '';
  const propertyImage = stay?.property?.image_url ?? HERO_FALLBACK;
  const regionId = stay?.property?.region_id ?? null;
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

  // Places fetch
  useEffect(() => {
    if (!regionId) return;
    let cancelled = false;
    fetch(`/api/discovery/places?region_id=${regionId}&limit=6`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        setPlaces((body?.data as DiscoveryPlaceCard[]) ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  // Itinerary fetch
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchItineraryItems(user.id, stayId ?? undefined)
      .then((items) => {
        if (cancelled) return;
        setItineraryItems((items as ItineraryItemDisplay[] | null) ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, stayId]);

  const upcomingItems = useMemo(
    () =>
      itineraryItems
        .filter((i) => parseLocalDate(i.scheduleddate) >= today)
        .slice(0, 3),
    [itineraryItems, today],
  );

  /* ─── Render ─── */

  return (
    <div
      className={dmSans.className}
      style={{ background: 'var(--background)', minHeight: '100vh' }}
    >
      {/* Shimmer keyframes — scoped via a unique animation name */}
      <style>{`@keyframes hd-shimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}`}</style>

      {/* SECTION 1 — HEADER */}
      <MountSection mounted={mounted} delay={0}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            height: 52,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            className={cormorant.className}
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: 'var(--gold)',
              lineHeight: 1,
            }}
          >
            Stayscape
          </span>

          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push('/app?tab=discover')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push('/app?tab=discover');
              }
            }}
            style={{
              flex: 1,
              margin: '0 12px',
              height: 34,
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 17,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 12px',
              cursor: 'pointer',
            }}
          >
            <IconSearch />
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: 'var(--text-faint)',
              }}
            >
              Search places, hotels...
            </span>
          </div>

          {/* Right: reserved for future avatar */}
          <div style={{ width: 0 }} aria-hidden="true" />
        </div>
      </MountSection>

      {/* SECTION 2 — HERO */}
      <MountSection mounted={mounted} delay={60}>
        {loadState === 'loading' ? (
          <Shimmer style={{ width: '100%', height: 'min(52vw, 240px)' }} />
        ) : (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'min(52vw, 240px)',
              backgroundImage: `url(${propertyImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(250,248,245,0.1) 0%, rgba(250,248,245,0.0) 25%, rgba(250,248,245,0.7) 75%, var(--background) 100%)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'absolute', top: 16, left: 20 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                }}
              >
                {greeting}
              </p>
              <p
                className={cormorant.className}
                style={{
                  margin: '4px 0 0',
                  fontSize: 20,
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: 'var(--text-primary)',
                }}
              >
                {firstName}
              </p>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 14,
                left: 20,
                right: 20,
              }}
            >
              {propertyName && (
                <p
                  className={cormorant.className}
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 400,
                    lineHeight: 1.1,
                    color: 'var(--text-primary)',
                  }}
                >
                  {propertyName}
                </p>
              )}
              {(propertyCity || propertyCountry) && (
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 10,
                    fontWeight: 400,
                    letterSpacing: '0.18em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {[propertyCity, propertyCountry].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </MountSection>

      {/* SECTION 3 — STAY STATS */}
      <MountSection mounted={mounted} delay={120}>
        {loadState === 'loading' ? (
          <div
            style={{
              display: 'flex',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 0',
                  gap: 6,
                  borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <Shimmer style={{ width: 40, height: 10 }} />
                <Shimmer style={{ width: 24, height: 6 }} />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {[
              { value: nightsLeft ?? '—', label: 'NIGHTS' },
              { value: guestCount ?? '—', label: 'GUESTS' },
              { value: checkOutFormatted ?? '—', label: 'CHECKOUT' },
            ].map((col, i) => (
              <div
                key={col.label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 0',
                  borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <p
                  className={cormorant.className}
                  style={{
                    margin: 0,
                    fontSize: 32,
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'var(--text-primary)',
                  }}
                >
                  {col.value}
                </p>
                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {col.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </MountSection>

      {/* SECTION 4 — BOOKINGS & RESERVATIONS */}
      <MountSection mounted={mounted} delay={180}>
        <div
          style={{
            margin: '20px 20px 0',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 16,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Bookings &amp; Reservations
            </p>
            <IconAirplane />
          </div>

          {loadState === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom:
                      i === 2 ? 'none' : '1px solid var(--border-subtle)',
                    gap: 12,
                  }}
                >
                  <Shimmer style={{ width: 44, height: 32 }} />
                  <Shimmer style={{ flex: 1, height: 14 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Stay row */}
              {checkIn && (
                <TimelineRow
                  dateStr={checkIn}
                  today={today}
                  title={`Stay at ${propertyName || 'your hotel'}`}
                  subtitle={`${formatDayMonth(checkIn)} – ${formatDayMonth(checkOut)}`}
                  onClick={() => router.push('/app')}
                  isLast={upcomingItems.length === 0}
                />
              )}

              {/* Itinerary rows */}
              {upcomingItems.map((item, idx) => (
                <TimelineRow
                  key={item.id}
                  dateStr={item.scheduleddate}
                  today={today}
                  title={item.name ?? item.category ?? 'Activity'}
                  subtitle={item.starttime ?? item.scheduleddate}
                  onClick={() => router.push('/app?tab=itinerary')}
                  isLast={idx === upcomingItems.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </MountSection>

      {/* SECTION 5 — PLACES TO EXPLORE */}
      <MountSection mounted={mounted} delay={240} style={{ marginTop: 20 }}>
        <div
          style={{
            padding: '0 20px 12px',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <p
            className={cormorant.className}
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--text-primary)',
            }}
          >
            Places to Explore
          </p>
          <span
            role="button"
            tabIndex={0}
            onClick={() => router.push('/app?tab=discover')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push('/app?tab=discover');
              }
            }}
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            See all →
          </span>
        </div>

        {loadState === 'loading' || places.length === 0 ? (
          <PlacesSkeleton loading={loadState === 'loading'} />
        ) : (
          <PlacesGrid
            places={places}
            onSelect={() => router.push('/app?tab=discover')}
          />
        )}
      </MountSection>

      {/* SECTION 6 — ACTIVITIES NEAR YOU */}
      <MountSection mounted={mounted} delay={300}>
        <div
          style={{
            margin: '20px 20px 0',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 16,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <p
            style={{
              margin: '0 0 14px',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            Activities Near You
          </p>

          {loadState === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '11px 0',
                    borderBottom:
                      i === 3 ? 'none' : '1px solid var(--border-subtle)',
                    gap: 10,
                  }}
                >
                  <Shimmer
                    style={{ width: 32, height: 32, borderRadius: 8 }}
                  />
                  <Shimmer style={{ flex: 1, height: 12 }} />
                </div>
              ))}
            </div>
          ) : (
            <ActivitiesList places={places.slice(0, 5)} />
          )}
        </div>
      </MountSection>

      {/* Bottom tab bar — unchanged */}
      <WarmBottomTabBar />
    </div>
  );
}

/* ─── Sub-components ─── */

function TimelineRow({
  dateStr,
  today,
  title,
  subtitle,
  onClick,
  isLast,
}: {
  dateStr: string;
  today: Date;
  title: string;
  subtitle: string;
  onClick: () => void;
  isLast: boolean;
}) {
  const dayLabel = isSameLocalDay(dateStr, today) ? 'Today' : weekdayShort(dateStr);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 44,
          flexShrink: 0,
          textAlign: 'center',
        }}
      >
        <p
          className={cormorant.className}
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1,
            color: 'var(--text-primary)',
          }}
        >
          {formatDayNumber(dateStr)}
        </p>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          {formatMonthShort(dateStr)}
        </p>
      </div>

      <div
        style={{
          width: 1,
          height: 32,
          background: 'var(--border)',
          margin: '0 12px',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          width: 52,
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 400,
          color: 'var(--text-muted)',
        }}
      >
        {dayLabel}
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 11,
            fontWeight: 400,
            color: 'var(--text-muted)',
          }}
        >
          {subtitle}
        </p>
      </div>

      <div style={{ flexShrink: 0, marginLeft: 8 }}>
        <IconArrow />
      </div>
    </div>
  );
}

function PlaceCard({
  place,
  height,
  nameSize,
  onClick,
}: {
  place: DiscoveryPlaceCard;
  height: number;
  nameSize: number;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        flex: 1,
        height,
        backgroundImage: place.image_url ? `url(${place.image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'var(--surface-raised)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
        }}
      />
      {place.rating != null && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            fontSize: 11,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          ★ {place.rating.toFixed(1)}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 28,
        }}
      >
        {place.category && (
          <p
            style={{
              margin: '0 0 3px',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
            }}
          >
            {place.category}
          </p>
        )}
        <p
          style={{
            margin: 0,
            fontSize: nameSize,
            fontWeight: 500,
            color: 'rgba(255,255,255,1)',
            lineHeight: 1.2,
          }}
        >
          {place.name}
        </p>
      </div>
    </div>
  );
}

function PlacesGrid({
  places,
  onSelect,
}: {
  places: DiscoveryPlaceCard[];
  onSelect: () => void;
}) {
  // Group: index 0 (full), index 1+2 (row), index 3 (full), index 4+ (full)
  const elements: ReactNode[] = [];

  if (places[0]) {
    elements.push(
      <PlaceCard
        key={places[0].id}
        place={places[0]}
        height={220}
        nameSize={14}
        onClick={onSelect}
      />,
    );
  }

  if (places[1] || places[2]) {
    elements.push(
      <div key="row-1-2" style={{ display: 'flex', gap: 4 }}>
        {places[1] && (
          <PlaceCard
            place={places[1]}
            height={150}
            nameSize={12}
            onClick={onSelect}
          />
        )}
        {places[2] && (
          <PlaceCard
            place={places[2]}
            height={150}
            nameSize={12}
            onClick={onSelect}
          />
        )}
      </div>,
    );
  }

  if (places[3]) {
    elements.push(
      <PlaceCard
        key={places[3].id}
        place={places[3]}
        height={200}
        nameSize={14}
        onClick={onSelect}
      />,
    );
  }

  for (let i = 4; i < places.length; i++) {
    elements.push(
      <PlaceCard
        key={places[i].id}
        place={places[i]}
        height={180}
        nameSize={14}
        onClick={onSelect}
      />,
    );
  }

  return (
    <div
      style={{
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {elements}
    </div>
  );
}

function PlacesSkeleton({ loading }: { loading: boolean }) {
  // Always render a placeholder structure so layout doesn't shift when
  // places arrive empty (e.g. no region). When `loading` is false we still
  // render dimmer blocks so the rhythm of the page is preserved.
  const opacity = loading ? 1 : 0.4;
  return (
    <div
      style={{
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        opacity,
      }}
    >
      <Shimmer style={{ width: '100%', height: 220 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        <Shimmer style={{ flex: 1, height: 150 }} />
        <Shimmer style={{ flex: 1, height: 150 }} />
      </div>
      <Shimmer style={{ width: '100%', height: 200 }} />
    </div>
  );
}

function ActivitiesList({ places }: { places: DiscoveryPlaceCard[] }) {
  if (places.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 400,
          color: 'var(--text-muted)',
        }}
      >
        No nearby activities yet.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {places.map((place, idx) => {
        const isLast = idx === places.length - 1;
        return (
          <div
            key={place.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '11px 0',
              borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: 8,
                background: 'var(--surface-raised)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CategoryIcon category={place.category} />
            </div>

            <div style={{ flex: 1, marginLeft: 10 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                }}
              >
                {place.name}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 11,
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                }}
              >
                {place.distance ? place.distance : place.category}
              </p>
            </div>

            {place.rating != null && (
              <div
                style={{
                  flexShrink: 0,
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                }}
              >
                ★ {place.rating.toFixed(1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
