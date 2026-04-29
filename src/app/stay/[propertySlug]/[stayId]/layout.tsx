'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { ItineraryProvider } from '@/components/ItineraryContext';
import { useRegion } from '@/lib/context/region-context';
import { getStaySelectedRegion } from '@/components/guest-lounge/stay-region';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import StayOnboardingFlow from '@/components/guest-lounge/StayOnboardingFlow';
import type { CustomerStay } from '@/types/customer';
import { StayContext } from './stay-context';

async function fetchStayApi(userId: string, stayId: string): Promise<CustomerStay> {
  const res = await fetch(
    `/api/customer/stays/${encodeURIComponent(stayId)}?userId=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) throw new Error('Failed to load stay');
  const json = await res.json() as { stay: CustomerStay };
  return json.stay;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAB_LABEL_STYLE = { fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif' } as const;

function getActiveTab(
  pathname: string,
  propertySlug: string,
  stayId: string,
): 'concierge' | 'discover' | 'itinerary' | null {
  if (pathname === `/stay/${propertySlug}/${stayId}`) return 'concierge';
  if (pathname.endsWith('/discover')) return 'discover';
  if (pathname.endsWith('/itinerary')) return 'itinerary';
  return null;
}

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

  // Fetch stay + update root region context so the map centers on this hotel's region
  useEffect(() => {
    if (!user) return;
    if (!UUID_REGEX.test(stayId)) return;
    fetchStayApi(user.id, stayId)
      .then((found) => {
        setStay(found);
        setLoadState('ready');
        // Push the stay's region into the root RegionContext so all
        // children (including the map) automatically center on this hotel.
        const stayRegion = getStaySelectedRegion(found);
        if (stayRegion) setRegion(stayRegion);
      })
      .catch(() => {
        router.replace('/dashboard');
      });
  }, [user, stayId, router, setRegion]);

  if (isLoading) return <GuestArrivalSkeleton />;

  if (!user) {
    return null;
  }

  if (!UUID_REGEX.test(stayId)) {
    return null;
  }

  if (loadState === 'loading') return <GuestArrivalSkeleton />;

  if (!stay) {
    return null;
  }

  const dbSlug = stay.property?.slug ?? null;
  if (dbSlug === null || dbSlug !== propertySlug) {
    return null;
  }

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
  const isConciergeActive = activeTab === 'concierge';
  const isDiscoverActive = activeTab === 'discover';
  const isItineraryActive = activeTab === 'itinerary';

  const tabBar = (
    <>
      <div style={{ height: 64 }} aria-hidden="true" />
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Concierge tab */}
        <Link
          href={`/stay/${propertySlug}/${stayId}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            textDecoration: 'none',
            position: 'relative',
            color: isConciergeActive ? 'var(--gold)' : 'var(--text-muted)',
          }}
        >
          {isConciergeActive && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '25%',
                right: '25%',
                height: 3,
                borderRadius: 2,
                background: 'var(--gold)',
              }}
            />
          )}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={isConciergeActive ? 2 : 1.5}
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={TAB_LABEL_STYLE}>Concierge</span>
        </Link>

        {/* Discover tab */}
        <Link
          href={`/stay/${propertySlug}/${stayId}/discover`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            textDecoration: 'none',
            position: 'relative',
            color: isDiscoverActive ? 'var(--gold)' : 'var(--text-muted)',
          }}
        >
          {isDiscoverActive && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '25%',
                right: '25%',
                height: 3,
                borderRadius: 2,
                background: 'var(--gold)',
              }}
            />
          )}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={isDiscoverActive ? 2 : 1.5}
            strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span style={TAB_LABEL_STYLE}>Discover</span>
        </Link>

        {/* Itinerary tab */}
        <Link
          href={`/stay/${propertySlug}/${stayId}/itinerary`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            textDecoration: 'none',
            position: 'relative',
            color: isItineraryActive ? 'var(--gold)' : 'var(--text-muted)',
          }}
        >
          {isItineraryActive && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '25%',
                right: '25%',
                height: 3,
                borderRadius: 2,
                background: 'var(--gold)',
              }}
            />
          )}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={isItineraryActive ? 2 : 1.5}
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={TAB_LABEL_STYLE}>Itinerary</span>
        </Link>
      </nav>
    </>
  );

  return (
    <StayContext.Provider value={{ stay, userId: user.id }}>
      <ItineraryProvider stayId={stay.id}>
        <Suspense fallback={<GuestArrivalSkeleton />}>
          {children}
        </Suspense>
        {tabBar}
      </ItineraryProvider>
    </StayContext.Provider>
  );
}
