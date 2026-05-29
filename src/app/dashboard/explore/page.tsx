'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import ExploreSwiper from '@/components/explore/ExploreSwiper';
import type { ExploreSection } from '@/components/explore/ExploreCard';

export interface RegionOption {
  id: string;
  name: string;
  slug: string;
  country_code: string | null;
  /** Populated on section items by the API — may be absent on dropdown-only region objects */
  image_url?: string | null;
  is_active?: boolean;
}

interface ExploreResponse {
  firstName: string | null;
  activeRegionId: string | null;
  regions: RegionOption[];
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalising, setIsPersonalising] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/guests');
    }
  }, [authLoading, user, router]);

  const fetchExplore = useCallback(
    async (regionId?: string | null) => {
      const token = await getBearerToken();
      if (!token) { setIsLoading(false); return; }
      try {
        const url = regionId
          ? `/api/explore?region_id=${regionId}`
          : '/api/explore';
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load explore data');
        const json = (await res.json()) as ExploreResponse;
        setData(json);
        // Sync selected region with what the API resolved
        if (!regionId) setSelectedRegionId(json.activeRegionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!user) return;
    void fetchExplore();
  }, [user, fetchExplore]);

  async function handleRegionChange(regionId: string) {
    setSelectedRegionId(regionId);
    const region = data?.regions.find(r => r.id === regionId);
    if (region?.is_active === false) return;
    setIsRefreshing(true);
    await fetchExplore(regionId);
    setIsRefreshing(false);
  }

  async function handlePersonalise() {
    setIsPersonalising(true);
    await fetchExplore(selectedRegionId);
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
            onClick={() => {
              setError(null);
              setIsLoading(true);
              void fetchExplore(selectedRegionId);
            }}
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
    <div style={{ height: 'calc(100dvh - 72px)', overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <ExploreSwiper
          sections={data.sections}
          regions={data.regions}
          selectedRegionId={selectedRegionId}
          firstName={data.firstName}
          onPersonalise={handlePersonalise}
          isPersonalising={isPersonalising}
          isRefreshing={isRefreshing}
          onRegionChange={handleRegionChange}
        />
      </Suspense>
    </div>
  );
}
