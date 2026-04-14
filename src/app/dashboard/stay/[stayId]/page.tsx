'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData, CustomerStay } from '@/types/customer';

import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import StayDetailView from '@/components/guest-lounge/StayDetailView';

type LoadState = 'loading' | 'ready' | 'error';

async function fetchDashboardApi(userId: string): Promise<DashboardData> {
  const res = await fetch(
    `/api/customer/dashboard?userId=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? 'Failed to load dashboard',
    );
  }
  return res.json() as Promise<DashboardData>;
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

  /* Fetch once on mount using useState lazy initializer — avoids
     react-hooks/set-state-in-effect lint errors (matches codebase pattern). */
  useState(() => {
    fetchDashboardApi(userId)
      .then((data) => {
        /* Merge both upcomingStays array and singular upcomingStay */
        const allStays: CustomerStay[] = [
          ...(data.upcomingStays ?? []),
          ...(data.upcomingStay ? [data.upcomingStay] : []),
        ];
        const found = allStays.find((s) => s.id === stayId);
        if (!found) {
          setLoadState('error');
          return;
        }
        setStay(found);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  });

  if (loadState === 'loading') {
    return <GuestArrivalSkeleton />;
  }

  if (loadState === 'error' || !stay) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center px-6">
          <p className="text-white/40 mb-4 text-[14px]">Stay not found.</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-[var(--gold)] hover:underline text-[13px] cursor-pointer"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
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

  return <StayDetailContent userId={user.id} stayId={stayId} />;
}
