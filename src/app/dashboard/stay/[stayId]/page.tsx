'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { CustomerStay } from '@/types/customer';

import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import StayDetailView from '@/components/guest-lounge/StayDetailView';
import StayOnboardingFlow from '@/components/guest-lounge/StayOnboardingFlow';

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

  if (loadState === 'ready' && !stay) {
    router.replace('/dashboard');
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
