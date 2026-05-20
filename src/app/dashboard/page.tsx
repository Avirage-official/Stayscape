'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import HomeDashboard from '@/components/guest-lounge/HomeDashboard';
import ProfileOnboardingFlow from '@/components/profile/ProfileOnboardingFlow';

/**
 * Dashboard page — auth-gated shell that renders the redesigned
 * `HomeDashboard` for authenticated guests.
 *
 * On first load it checks GET /api/customer/profile to see whether
 * the user has completed their travel profile. If not, it renders
 * ProfileOnboardingFlow full-screen instead. Once the flow calls
 * onCompleted(), the dashboard appears without a page reload.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // null = not yet checked, true/false = checked result
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Once we have a user, check profile completion
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function checkProfile() {
      const supabase = getSupabaseBrowser();
      let token: string | null = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
      }

      if (!token) {
        // Can't check — default to showing dashboard rather than blocking
        if (!cancelled) setProfileCompleted(true);
        return;
      }

      try {
        const res = await fetch('/api/customer/profile', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('check failed');
        const data = (await res.json()) as { completed: boolean };
        if (!cancelled) setProfileCompleted(data.completed);
      } catch {
        // On error, don't block the dashboard
        if (!cancelled) setProfileCompleted(true);
      }
    }

    void checkProfile();
    return () => { cancelled = true; };
  }, [user]);

  // Still loading auth or haven't checked profile yet
  if (authLoading || !user || profileCompleted === null) {
    return <GuestArrivalSkeleton />;
  }

  // Profile not completed — show Aria's onboarding flow full-screen
  if (!profileCompleted) {
    return (
      <ProfileOnboardingFlow
        userId={user.id}
        onCompleted={() => setProfileCompleted(true)}
      />
    );
  }

  return <HomeDashboard />;
}
