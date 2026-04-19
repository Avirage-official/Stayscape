'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';
import PostLoginHero from '@/components/guest-lounge/PostLoginHero';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';

type LoadState = 'loading' | 'ready' | 'error';

async function fetchDashboardApi(userId: string): Promise<DashboardData> {
  const res = await fetch(`/api/customer/dashboard?userId=${encodeURIComponent(userId)}`);
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
    fetchDashboardApi(userId)
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  }, [userId]);

  const refetch = useCallback(() => {
    setLoadState('loading');
    fetchDashboardApi(userId)
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  }, [userId]);

  const memberSince = (() => {
    if (!data?.profile.created_at) return '—';
    const date = new Date(data.profile.created_at);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  if (loadState === 'loading') return <GuestArrivalSkeleton />;

  return (
    <PostLoginHero>
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-10 lg:px-14 h-[64px]">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-[12px] font-medium tracking-[0.18em] uppercase">Back</span>
        </button>
      </header>

      <div className="h-full overflow-y-auto px-5 sm:px-8 pt-20 pb-10">
        <div className="max-w-3xl mx-auto">
          {loadState === 'error' && (
            <div className="rounded-3xl border border-white/10 bg-black/70 p-6 text-center">
              <p className="text-[14px] text-white/60 mb-4">{errorMsg}</p>
              <button
                type="button"
                onClick={refetch}
                className="text-[13px] text-white/80 border border-white/20 px-4 py-2 rounded-lg hover:text-white transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {loadState === 'ready' && data && (
            <div className="rounded-3xl border border-white/10 bg-black/70 backdrop-blur-xl p-6 sm:p-8 space-y-7">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#C9A84C]">Guest Profile</p>
                <h1 className="font-serif text-[30px] text-white/90 mt-2">Your details</h1>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#C9A84C]/90">Guest name</p>
                  <p className="text-[16px] text-white/90 mt-1">{data.profile.full_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#C9A84C]/90">Email</p>
                  <p className="text-[16px] text-white/90 mt-1">{data.profile.email}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#C9A84C]/90">Phone</p>
                  <p className="text-[16px] text-white/90 mt-1">{data.profile.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#C9A84C]/90">Member since</p>
                  <p className="text-[16px] text-white/90 mt-1">{memberSince}</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#C9A84C]/90 mb-3">Stays summary</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.1em]">Current</p>
                    <p className="font-serif text-[22px] text-white/90">{data.currentStays.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.1em]">Upcoming</p>
                    <p className="font-serif text-[22px] text-white/90">{data.upcomingStays.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.1em]">Past</p>
                    <p className="font-serif text-[22px] text-white/90">{data.pastStays.length}</p>
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-white/55 italic pt-1">
                Your details are managed by your hotel. Contact your property to update personal information.
              </p>
            </div>
          )}
        </div>
      </div>
    </PostLoginHero>
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
