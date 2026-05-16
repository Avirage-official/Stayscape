'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { ItineraryProvider } from '@/components/ItineraryContext';
import { useRegion } from '@/lib/context/region-context';
import { getStaySelectedRegion } from '@/components/guest-lounge/stay-region';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import StayOnboardingFlow from '@/components/guest-lounge/StayOnboardingFlow';
import type { CustomerStay } from '@/types/customer';
import { StayContext } from './stay-context';

async function fetchStayApi(stayId: string): Promise<CustomerStay> {
  const supabase = getSupabaseBrowser();
  const token = supabase
    ? (await supabase.auth.getSession()).data.session?.access_token
    : null;
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`/api/customer/stays/${encodeURIComponent(stayId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load stay');
  const json = (await res.json()) as { stay: CustomerStay };
  return json.stay;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StayTab = 'concierge' | 'home' | 'discover' | 'itinerary' | 'requests';

function getActiveTab(
  pathname: string,
  propertySlug: string,
  stayId: string,
): StayTab | null {
  if (pathname === `/stay/${propertySlug}/${stayId}`) return 'concierge';
  if (pathname.endsWith('/home')) return 'home';
  if (pathname.endsWith('/discover')) return 'discover';
  if (pathname.endsWith('/itinerary')) return 'itinerary';
  if (pathname.endsWith('/requests')) return 'requests';
  return null;
}

/* ─── Inline icons ─── */

function iconProps(active: boolean) {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: active ? 2 : 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

function IconAria(active: boolean) {
  return (
    <svg {...iconProps(active)}>
      <path d="M21 12a8 8 0 01-12.6 6.5L3 20l1.5-5.4A8 8 0 1121 12z" />
    </svg>
  );
}
function IconHome(active: boolean) {
  return (
    <svg {...iconProps(active)}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconDiscover(active: boolean) {
  return (
    <svg {...iconProps(active)}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}
function IconItinerary(active: boolean) {
  return (
    <svg {...iconProps(active)}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconRequests(active: boolean) {
  return (
    <svg {...iconProps(active)}>
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/* ─── Nav item type ─── */

interface NavItem {
  id: StayTab;
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}

/* ─── Desktop side nav ─── */

function SideNav({
  items,
  activeTab,
}: {
  items: NavItem[];
  activeTab: StayTab | null;
}) {
  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '24px 14px',
        height: '100%',
      }}
      aria-label="Stay navigation"
    >
      {items.map((item) => {
        const active = item.id === activeTab;
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 12px',
              borderRadius: 12,
              textDecoration: 'none',
              color: active ? 'var(--gold)' : 'var(--text-muted)',
              background: active ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
              fontWeight: active ? 600 : 500,
              fontSize: 13,
              transition: 'background 0.15s ease, color 0.15s ease',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? 'rgba(201, 168, 76, 0.12)' : 'transparent',
                flexShrink: 0,
              }}
            >
              {item.icon(active)}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── Mobile bottom tab bar ─── */

function BottomNav({
  items,
  activeTab,
}: {
  items: NavItem[];
  activeTab: StayTab | null;
}) {
  return (
    <nav
      aria-label="Stay navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: 64,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map((item) => {
        const active = item.id === activeTab;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              textDecoration: 'none',
              color: active ? 'var(--gold)' : 'var(--text-muted)',
              minWidth: 44,
              minHeight: 44,
              transition: 'color 0.15s ease',
            }}
          >
            {item.icon(active)}
            <span
              style={{
                fontSize: 10,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── Layout ─── */

export default function StayLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { setRegion } = useRegion();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const propertySlug =
    typeof params.propertySlug === 'string'
      ? params.propertySlug
      : Array.isArray(params.propertySlug)
        ? params.propertySlug[0]
        : '';

  const stayId =
    typeof params.stayId === 'string'
      ? params.stayId
      : Array.isArray(params.stayId)
        ? params.stayId[0]
        : '';

  const [stay, setStay] = useState<CustomerStay | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Invalid UUID redirect
  useEffect(() => {
    if (user && !UUID_REGEX.test(stayId)) {
      router.replace('/dashboard');
    }
  }, [user, stayId, router]);

  // Slug-mismatch redirect (after stay loads)
  useEffect(() => {
    if (loadState === 'ready' && stay) {
      const dbSlug = stay.property?.slug ?? null;
      if (dbSlug === null || dbSlug !== propertySlug) {
        router.replace('/dashboard');
      }
    }
  }, [loadState, stay, propertySlug, router]);

  // Fetch stay + push region context
  useEffect(() => {
    if (!user) return;
    if (!UUID_REGEX.test(stayId)) return;
    fetchStayApi(stayId)
      .then((found) => {
        setStay(found);
        setLoadState('ready');
        const stayRegion = getStaySelectedRegion(found);
        if (stayRegion) setRegion(stayRegion);
      })
      .catch(() => {
        router.replace('/dashboard');
      });
  }, [user, stayId, router, setRegion]);

  if (isLoading) return <GuestArrivalSkeleton />;
  if (!user) return null;
  if (!UUID_REGEX.test(stayId)) return null;
  if (loadState === 'loading') return <GuestArrivalSkeleton />;
  if (!stay) return null;

  const dbSlug = stay.property?.slug ?? null;
  if (dbSlug === null || dbSlug !== propertySlug) return null;

  if (!stay.onboarding_completed && !onboardingCompleted) {
    return (
      <StayOnboardingFlow
        stay={stay}
        userId={user.id}
        onCompleted={() => setOnboardingCompleted(true)}
      />
    );
  }

  const activeTab = getActiveTab(pathname, propertySlug, stayId);
  const homeHref = `/stay/${propertySlug}/${stayId}/home`;
  const isOnHomePage = activeTab === 'home';

  const navItems: NavItem[] = [
    {
      id: 'concierge',
      label: 'Aria',
      href: `/stay/${propertySlug}/${stayId}`,
      icon: IconAria,
    },
    {
      id: 'home',
      label: 'Hotel Services',
      href: homeHref,
      icon: IconHome,
    },
    {
      id: 'discover',
      label: 'Discover',
      href: `/stay/${propertySlug}/${stayId}/discover`,
      icon: IconDiscover,
    },
    {
      id: 'itinerary',
      label: 'Itinerary',
      href: `/stay/${propertySlug}/${stayId}/itinerary`,
      icon: IconItinerary,
    },
    {
      id: 'requests',
      label: 'Requests',
      href: `/stay/${propertySlug}/${stayId}/requests`,
      icon: IconRequests,
    },
  ];

  return (
    <StayContext.Provider value={{ stay, userId: user.id }}>
      <ItineraryProvider stayId={stay.id}>
        <style>{`
          .stay-shell { min-height: 100vh; background: var(--background); }
          .stay-side-nav-desktop { display: none; }
          .stay-mobile-topbar { display: flex; }
          .stay-bottom-nav { display: flex; }
          /* account for bottom nav height */
          .stay-content { padding-bottom: 64px; }

          @media (min-width: 900px) {
            .stay-shell {
              display: grid;
              grid-template-columns: 240px minmax(0, 1fr);
            }
            .stay-side-nav-desktop {
              display: block;
              position: sticky;
              top: 0;
              height: 100vh;
              border-right: 1px solid var(--border);
              background: var(--surface);
            }
            .stay-mobile-topbar { display: none; }
            .stay-bottom-nav { display: none; }
            .stay-content { padding-bottom: 0; }
          }
        `}</style>

        <div className="stay-shell">
          {/* Desktop side nav */}
          <aside className="stay-side-nav-desktop">
            <div
              style={{
                padding: '24px 18px 12px',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 20,
                color: 'var(--gold)',
                letterSpacing: '0.01em',
              }}
            >
              Stayscape
            </div>
            <SideNav items={navItems} activeTab={activeTab} />
          </aside>

          {/* Mobile top bar */}
          <div
            className="stay-mobile-topbar"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 60,
              height: 52,
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              padding: '0 16px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Back button — visible on all subpages except Hotel Services itself */}
            {!isOnHomePage ? (
              <Link
                href={homeHref}
                aria-label="Back to Hotel Services"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                }}
              >
                <IconChevronLeft />
              </Link>
            ) : (
              <span style={{ width: 40 }} />
            )}

            <span
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 18,
                color: 'var(--gold)',
              }}
            >
              Stayscape
            </span>
            <span style={{ width: 40 }} />
          </div>

          {/* Mobile bottom tab bar */}
          <div className="stay-bottom-nav">
            <BottomNav items={navItems} activeTab={activeTab} />
          </div>

          {/* Main content */}
          <div className="stay-content">
            <Suspense fallback={<GuestArrivalSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </ItineraryProvider>
    </StayContext.Provider>
  );
}
