'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import ExploreSwiper from '@/components/explore/ExploreSwiper';
import type { ExploreSection } from '@/components/explore/ExploreCard';

interface ExploreResponse {
  firstName: string | null;
  sections: ExploreSection[];
}

async function getBearerToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function ExplorePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<ExploreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalising, setIsPersonalising] = useState(false);

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const fetchExplore = useCallback(async () => {
    const token = await getBearerToken();
    if (!token) return;
    try {
      const res = await fetch('/api/explore', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load explore data');
      const json = (await res.json()) as ExploreResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchExplore();
  }, [user, fetchExplore]);

  // "Personalise for me" — refetches the same endpoint;
  // Phase 2 will add ?personalised=true with vibe-mapping logic
  async function handlePersonalise() {
    setIsPersonalising(true);
    await fetchExplore();
    setIsPersonalising(false);
  }

  if (authLoading || !user || isLoading) {
    return <GuestArrivalSkeleton />;
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center text-white/40 text-sm"
        style={{ height: 'calc(100dvh - 68px)' }}
      >
        <div className="text-center">
          <p className="mb-3">{error}</p>
          <button
            onClick={() => { setError(null); setIsLoading(true); void fetchExplore(); }}
            className="text-white/60 border border-white/20 px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.sections.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/40 text-sm"
        style={{ height: 'calc(100dvh - 68px)' }}
      >
        Nothing to explore yet. Check back soon.
      </div>
    );
  }

  return (
    <ExploreSwiper
      sections={data.sections}
      firstName={data.firstName}
      onPersonalise={handlePersonalise}
      isPersonalising={isPersonalising}
    />
  );
}
