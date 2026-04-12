'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import type { DashboardData } from '@/types/customer';

import PostLoginHero from '@/components/guest-lounge/PostLoginHero';
import HeroTopNav from '@/components/guest-lounge/HeroTopNav';
import ConciergePrompt from '@/components/guest-lounge/ConciergePrompt';
import StayContextMeta from '@/components/guest-lounge/StayContextMeta';
import ExpandedMenuOverlay from '@/components/guest-lounge/ExpandedMenuOverlay';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import AddStayDialog from '@/components/guest-lounge/AddStayDialog';

type LoadState = 'loading' | 'ready' | 'error';

/* ─── Fetch helper ─── */

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

/* ═══════════════════════════════════════════════════════════════
   Guest Arrival — the premium cinematic post-login experience.
   Full-screen hero, centered concierge prompt, overlay menu.
   ═══════════════════════════════════════════════════════════════ */

function GuestArrivalContent({
  userId,
  onLogout,
}: {
  userId: string;
  onLogout: () => void;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [menuOpen, setMenuOpen] = useState(false);
  const [addStayOpen, setAddStayOpen] = useState(false);

  /* Kick off initial fetch via a separate lazy initializer.
     All setters are declared above, so no circular reference. */
  useState(() => {
    fetchDashboardApi(userId)
      .then((json) => {
        setData(json);
        setLoadState('ready');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoadState('error');
      });
  });

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

  const firstName = data?.profile.full_name?.split(' ')[0] ?? 'Guest';
  const stay = data?.upcomingStay;
  const stayContext = stay?.property?.name
    ? `${stay.property.name}${stay.property.address ? ` · ${stay.property.address}` : ''}`
    : null;

  if (loadState === 'loading') {
    return <GuestArrivalSkeleton />;
  }

  return (
    <>
      <PostLoginHero>
        {/* Top navigation */}
        <HeroTopNav
          onMenuOpen={() => setMenuOpen(true)}
          onLogout={onLogout}
          stayContext={stayContext}
        />

        {/* Error state */}
        {loadState === 'error' && (
          <div className="h-full flex items-center justify-center px-6">
            <div className="text-center">
              <p className="text-[14px] text-white/50 mb-4">{errorMsg}</p>
              <button
                type="button"
                onClick={refetch}
                className="text-[13px] text-white/70 hover:text-white border border-white/20 px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Main content — centered concierge prompt */}
        {loadState === 'ready' && data && (
          <>
            <div className="h-full flex flex-col items-center justify-center pb-16">
              <ConciergePrompt firstName={firstName} />
            </div>

            {/* Stay awareness strip at bottom */}
            <StayContextMeta
              hotelName={stay?.property?.name}
              city={stay?.property?.address}
              checkIn={stay?.check_in}
              checkOut={stay?.check_out}
              status={stay?.status}
            />
          </>
        )}
      </PostLoginHero>

      {/* Overlay menu */}
      <ExpandedMenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddStay={() => setAddStayOpen(true)}
      />

      {/* Add stay dialog */}
      <AddStayDialog open={addStayOpen} onOpenChange={setAddStayOpen} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page — outer shell that handles auth gating
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  /* Auth loading */
  if (authLoading) {
    return <GuestArrivalSkeleton />;
  }

  /* Not authenticated — redirect */
  if (!user) {
    router.replace('/login');
    return null;
  }

  /* Authenticated — render cinematic arrival */
  return <GuestArrivalContent userId={user.id} onLogout={handleLogout} />;
}
