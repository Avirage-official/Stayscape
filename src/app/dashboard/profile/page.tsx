'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import WarmBottomTabBar from '@/components/guest-lounge/WarmBottomTabBar';

type LoadState = 'loading' | 'ready' | 'error';

async function fetchDashboardApi(): Promise<DashboardData> {
  const res = await fetch('/api/customer/dashboard', {
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'Failed to load profile');
  }
  return res.json() as Promise<DashboardData>;
}

function ProfileContent({ userId }: { userId: string }) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    fetchDashboardApi()
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  }, []);

  const refetch = useCallback(() => {
    setLoadState('loading');
    fetchDashboardApi()
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  }, []);

  const memberSince = (() => {
    if (!data?.profile.created_at) return '—';
    const date = new Date(data.profile.created_at);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  if (loadState === 'loading') return <GuestArrivalSkeleton />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 sm:px-8 h-[60px]"
        style={{
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-[12px] font-medium tracking-[0.18em] uppercase">Back</span>
        </button>
        <span className="font-serif text-[18px]" style={{ color: 'var(--gold)' }}>
          Stayscape
        </span>
        <span style={{ width: 24 }} aria-hidden="true" />
      </header>

      <div className="px-5 sm:px-8 pt-6 pb-10">
        <div className="max-w-3xl mx-auto">
          {loadState === 'error' && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: 'var(--card-bg)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={refetch}
                className="text-[13px] px-4 py-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  color: 'var(--gold)',
                  border: '1px solid var(--border)',
                }}
              >
                Try again
              </button>
            </div>
          )}

          {loadState === 'ready' && data && (
            <div
              className="rounded-2xl p-6 sm:p-8 space-y-7"
              style={{
                background: 'var(--card-bg)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.16em] font-medium"
                  style={{ color: 'var(--gold)' }}
                >
                  Guest Profile
                </p>
                <h1
                  className="font-serif text-[28px] mt-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Your details
                </h1>
              </div>

              <div className="space-y-4">
                <ProfileField label="Guest name" value={data.profile.full_name ?? '—'} />
                <ProfileField label="Email" value={data.profile.email} />
                <ProfileField label="Phone" value={data.profile.phone ?? '—'} />
                <ProfileField label="Member since" value={memberSince} />
              </div>

              <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                <p
                  className="text-[11px] uppercase tracking-[0.14em] font-medium mb-3"
                  style={{ color: 'var(--gold)' }}
                >
                  Stays summary
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <SummaryStat label="Current" value={data.currentStays.length} />
                  <SummaryStat label="Upcoming" value={data.upcomingStays.length} />
                  <SummaryStat label="Past" value={data.pastStays.length} />
                </div>
              </div>

              <p
                className="text-[12px] italic pt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Your details are managed by your hotel. Contact your property to update personal information.
              </p>
            </div>
          )}
        </div>
      </div>

      <WarmBottomTabBar />
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[11px] uppercase tracking-[0.14em] font-medium"
        style={{ color: 'var(--gold)' }}
      >
        {label}
      </p>
      <p className="text-[16px] mt-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
      }}
    >
      <p
        className="text-[11px] uppercase tracking-[0.1em]"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p
        className="font-serif text-[22px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) return <GuestArrivalSkeleton />;

  if (!user) {
    router.replace('/login');
    return null;
  }

  return <ProfileContent userId={user.id} />;
}
