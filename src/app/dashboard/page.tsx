'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/context/auth-context';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import HomeDashboard from '@/components/guest-lounge/HomeDashboard';

/**
 * Dashboard page — auth-gated shell that renders the redesigned
 * `HomeDashboard` for authenticated guests.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <GuestArrivalSkeleton />;
  }

  return <HomeDashboard />;
}
