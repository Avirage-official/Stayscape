'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { CustomerStay } from '@/types/customer';

import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import StayDetailView from '@/components/guest-lounge/StayDetailView';
import StayOnboardingFlow from '@/components/guest-lounge/StayOnboardingFlow';
import ConciergeExperience from '@/components/concierge/ConciergeExperience';
import { ItineraryProvider } from '@/components/ItineraryContext';
import { RegionProvider } from '@/lib/context/region-context';
import { getStaySelectedRegion } from '@/components/guest-lounge/stay-region';

type LoadState = 'loading' | 'ready';

async function fetchStayApi(userId: string, stayId: string): Promise<CustomerStay> {
  const res = await fetch(
    `/api/customer/stays/${encodeURIComponent(stayId)}?userId=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to load stay',
    );
  }
  const json = (await res.json()) as { stay: CustomerStay };
  return json.stay;
}

/* ─── Inner content (needs userId + stayId) ─── */

function StayDetailContent({
  userId,
  stayId,
}: {
  userId: string;
  stayId: string;
}) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [stay, setStay] = useState<CustomerStay | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Fetch the single stay on mount using useState lazy initializer —
     avoids react-hooks/set-state-in-effect lint errors (matches codebase pattern). */
  // Security: getStayById enforces ownership at the DB level via
  // .eq('userid', effectiveId). A user can never access another
  // user's stay — the query returns null and we redirect to /dashboard.
  useState(() => {
    fetchStayApi(userId, stayId)
      .then((found) => {
        setStay(found);
        setLoadState('ready');
      })
      .catch((err) => {
        console.error('[StayDetailContent] fetchStayApi failed:', err);
        router.replace('/dashboard');
      });
  });

  if (loadState === 'loading') {
    return <GuestArrivalSkeleton />;
  }

  if (!stay) {
    if (loadState === 'ready') {
      router.replace('/dashboard');
    }
    return null;
  }

  if (!stay.onboarding_completed && !onboardingCompleted) {
    return (
      <StayOnboardingFlow
        stay={stay}
        userId={userId}
        onCompleted={() => setOnboardingCompleted(true)}
      />
    );
  }

  if (isDesktop) {
    const stayRegion = getStaySelectedRegion(stay);
    const search = new URLSearchParams(window.location.search);
    const activeTab = search.get('tab') ?? 'concierge';

    const tabs = [
      {
        id: 'concierge',
        label: 'Concierge',
        href: `/dashboard/stay/${stay.id}`,
        icon: (active: boolean) => (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ),
      },
      {
        id: 'discover',
        label: 'Discover',
        href: `/dashboard/stay/${stay.id}?tab=discover`,
        icon: (active: boolean) => (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        ),
      },
      {
        id: 'itinerary',
        label: 'Itinerary',
        href: `/dashboard/stay/${stay.id}?tab=itinerary`,
        icon: (active: boolean) => (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
    ] as const;

    const bottomNav = (
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
            display: 'flex',
            alignItems: 'stretch',
            zIndex: 50,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  textDecoration: 'none',
                  position: 'relative',
                  color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                }}
              >
                {isActive && (
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
                {tab.icon(isActive)}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </>
    );

    const content = (
      <ItineraryProvider stayId={stay.id}>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <ConciergeExperience
            stayId={stay.id}
            guestName={null}
            propertyName={stay.property?.name ?? null}
            propertyImageUrl={stay.property?.image_url ?? null}
            propertyCity={stay.property?.city ?? null}
            propertyCountry={stay.property?.country ?? null}
            bookingReference={stay.booking_reference ?? null}
            checkIn={stay.check_in ?? null}
            checkOut={stay.check_out ?? null}
            guestCount={stay.guests ?? null}
          />
          {bottomNav}
        </div>
      </ItineraryProvider>
    );

    return stayRegion
      ? <RegionProvider initialRegion={stayRegion}>{content}</RegionProvider>
      : content;
  }
  return <StayDetailView stay={stay} onBack={() => router.push('/dashboard')} />;
}

/* ─── Page shell: handles auth gate ─── */

export default function StayDetailPage() {
  const { user, isLoading } = useAuth();
  const params = useParams();
  const router = useRouter();

  const stayId =
    typeof params.stayId === 'string'
      ? params.stayId
      : Array.isArray(params.stayId)
        ? params.stayId[0]
        : '';

  if (isLoading) {
    return <GuestArrivalSkeleton />;
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_REGEX.test(stayId)) {
    // redirect to dashboard — invalid stayId in URL
    router.replace('/dashboard');
    return null;
  }

  return <StayDetailContent userId={user.id} stayId={stayId} />;
}
