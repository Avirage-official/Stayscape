'use client';

/**
 * Region Selection Page — /select-region
 *
 * A clean, premium landing page that lets guests pick their region
 * before entering the map experience. No authentication required.
 * Reads available regions from the Supabase `regions` table.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useRegion, type SelectedRegion } from '@/lib/context/region-context';
import { MARKER_COLOR_GOLD } from '@/lib/mapbox/config';
import type { Region } from '@/types/database';

/* -- Flag emoji helper--- */
function countryFlag(countryCode: string): string {
  const code = countryCode.toUpperCase().slice(0, 2);
  return code
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

/* -- Taglines per region slug--- */
const REGION_TAGLINES: Record<string, string> = {
  'singapore-central': 'Gardens, galleries, and golden cuisine in one iconic city',
  'kuala-lumpur': 'Twin towers, street art, and a melting pot of flavours',
  'bangkok': 'Temple trails, floating markets, and electric nightlife',
};

function getTagline(slug: string): string {
  return REGION_TAGLINES[slug] ?? 'Discover the best of this destination';
}

export default function SelectRegionPage() {
  const router = useRouter();
  const { setRegion } = useRegion();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  /* -- Fetch regions from Supabase */
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from('regions')
          .select('*')
          .eq('is_active', true)
          .order('name');
        setRegions((data as Region[]) ?? []);
      } catch {
        // ignore errors, keep empty list
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* -- Handle selection--- */
  const handleSelect = (region: Region) => {
    setSelecting(region.id);
    const selected: SelectedRegion = {
      id: region.id,
      name: region.name,
      slug: region.slug,
      latitude: region.latitude,
      longitude: region.longitude,
      radius_km: region.radius_km,
      country_code: region.country_code,
    };
    setRegion(selected);
    router.push('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#0a0e13' }}
    >
      {/* Logo / wordmark */}
      <div className="mb-12 text-center">
        <span
          className="text-[11px] font-semibold tracking-[0.35em] uppercase"
          style={{ color: MARKER_COLOR_GOLD }}
        >
          Stayscape
        </span>
        <h1
          className="mt-3 text-[28px] sm:text-[34px] font-light tracking-tight"
          style={{ color: '#E8E6E1', lineHeight: 1.2 }}
        >
          Where are you exploring?
        </h1>
        <p
          className="mt-3 text-[13px] max-w-xs mx-auto"
          style={{ color: 'rgba(232,230,225,0.45)', lineHeight: 1.6 }}
        >
          Select your destination to discover curated places, hidden gems, and
          local insider knowledge.
        </p>
      </div>

      {/* Region cards */}
      <div className="w-full max-w-sm space-y-3">
        {loading ? (
          /* Skeleton loaders */
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[14px] h-[88px] animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          ))
        ) : regions.length === 0 ? (
          <p
            className="text-center text-[13px]"
            style={{ color: 'rgba(232,230,225,0.4)' }}
          >
            No regions available yet.
          </p>
        ) : (
          regions.map((region) => {
            const isSelecting = selecting === region.id;
            return (
              <button
                key={region.id}
                type="button"
                disabled={!!selecting}
                onClick={() => handleSelect(region)}
                className="w-full text-left rounded-[14px] px-5 py-4 flex items-center gap-4 transition-all duration-200 cursor-pointer"
                style={{
                  background: isSelecting
                    ? `${MARKER_COLOR_GOLD}10`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelecting ? `${MARKER_COLOR_GOLD}45` : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isSelecting
                    ? `0 0 0 1px ${MARKER_COLOR_GOLD}20, 0 8px 32px rgba(0,0,0,0.5)`
                    : '0 2px 12px rgba(0,0,0,0.3)',
                }}
              >
                {/* Flag */}
                <span
                  className="text-[32px] flex-shrink-0"
                  aria-hidden="true"
                  style={{ lineHeight: 1 }}
                >
                  {countryFlag(region.country_code)}
                </span>

                {/* Text */}
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-[15px] font-medium"
                    style={{
                      color: isSelecting ? MARKER_COLOR_GOLD : '#E8E6E1',
                      transition: 'color 0.15s',
                    }}
                  >
                    {region.name}
                  </span>
                  <span
                    className="block text-[11.5px] mt-0.5 leading-relaxed"
                    style={{ color: 'rgba(232,230,225,0.42)' }}
                  >
                    {getTagline(region.slug)}
                  </span>
                </span>

                {/* Arrow or spinner */}
                <span
                  className="flex-shrink-0"
                  style={{ color: isSelecting ? MARKER_COLOR_GOLD : 'rgba(232,230,225,0.25)' }}
                >
                  {isSelecting ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="40"
                        strokeDashoffset="15"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Decorative footer note */}
      <p
        className="mt-12 text-[11px] tracking-wide"
        style={{ color: 'rgba(232,230,225,0.22)' }}
      >
        More destinations coming soon
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
