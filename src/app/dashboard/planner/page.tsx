'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import type { DbSavedPlaceEnriched } from '@/lib/supabase/saved-places-repository';
import type { DbItineraryListed } from '@/lib/supabase/itinerary-repository';

type Tab = 'saved' | 'itineraries';

async function getBearerToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function PlannerPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('saved');

  const [savedPlaces, setSavedPlaces] = useState<DbSavedPlaceEnriched[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [itineraries, setItineraries] = useState<DbItineraryListed[] | null>(null);
  const [itinLoading, setItinLoading] = useState(true);
  const [itinError, setItinError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/guests');
    }
  }, [authLoading, user, router]);

  const fetchSavedPlaces = useCallback(async () => {
    setSavedLoading(true);
    setSavedError(null);
    const token = await getBearerToken();
    if (!token) { setSavedLoading(false); return; }
    try {
      const res = await fetch('/api/customer/saved-places', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load saved places');
      const json = await res.json() as { saved_places: DbSavedPlaceEnriched[] };
      setSavedPlaces(json.saved_places);
    } catch {
      setSavedError('Could not load your saved places.');
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const fetchItineraries = useCallback(async () => {
    setItinLoading(true);
    setItinError(null);
    const token = await getBearerToken();
    if (!token) { setItinLoading(false); return; }
    try {
      const res = await fetch('/api/customer/itineraries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load itineraries');
      const json = await res.json() as { itineraries: DbItineraryListed[] };
      setItineraries(json.itineraries);
    } catch {
      setItinError('Could not load your itineraries.');
    } finally {
      setItinLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchSavedPlaces();
    void fetchItineraries();
  }, [user, fetchSavedPlaces, fetchItineraries]);

  if (authLoading || !user || (savedLoading && itinLoading)) {
    return <GuestArrivalSkeleton />;
  }

  return (
    <div
      className="overflow-y-auto"
      style={{ height: 'calc(100dvh - 68px)' }}
    >
      {/* Tab bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(10,8,6,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 16px',
          display: 'flex',
          gap: 0,
        }}
      >
        {(['saved', 'itineraries'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'saved' ? 'Saved places' : 'Itineraries';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                height: 48,
                background: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid rgba(200,150,90,0.9)'
                  : '2px solid transparent',
                color: isActive ? 'rgba(200,150,90,0.9)' : 'rgba(255,255,255,0.38)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'color 200ms ease, border-color 200ms ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="px-4 py-6">
        {activeTab === 'saved' && (
          <SavedTab
            savedPlaces={savedPlaces}
            isLoading={savedLoading}
            error={savedError}
            onRetry={() => void fetchSavedPlaces()}
          />
        )}
        {activeTab === 'itineraries' && (
          <ItinerariesTab
            itineraries={itineraries}
            isLoading={itinLoading}
            error={itinError}
            onRetry={() => void fetchItineraries()}
          />
        )}
      </div>
    </div>
  );
}

/* ── Saved places tab ──────────────────────────────────────────── */

interface SavedTabProps {
  savedPlaces: DbSavedPlaceEnriched[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function SavedTab({ savedPlaces, isLoading, error, onRetry }: SavedTabProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl"
            style={{
              aspectRatio: '3/4',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-white/40 text-sm" style={{ minHeight: 200 }}>
        <div className="text-center">
          <p className="mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="text-xs underline underline-offset-2 opacity-60 hover:opacity-100"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!savedPlaces || savedPlaces.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 280 }}>
        <div className="text-center px-8 max-w-sm">
          <div
            className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(200,150,90,0.12)', border: '1px solid rgba(200,150,90,0.2)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,150,90,0.8)"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="text-white/80 text-base font-light mb-2">No saved places yet</p>
          <p className="text-white/35 text-sm leading-relaxed">
            Explore the map and save places you want to visit later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {savedPlaces.map((item) => {
        const place = item.places;
        const imageUrl = place?.image_url;
        return (
          <div
            key={item.id}
            className="rounded-2xl overflow-hidden cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              aspectRatio: '3/4',
              position: 'relative',
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={place?.name ?? ''}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0 }} className="flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            )}
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
              }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
              <p className="text-white/90 text-xs font-medium leading-tight truncate">
                {place?.name ?? 'Unknown place'}
              </p>
              {place?.city && (
                <p className="text-white/45 text-xs mt-0.5 truncate">{place.city}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Itineraries tab ───────────────────────────────────────────── */

interface ItinerariesTabProps {
  itineraries: DbItineraryListed[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function ItinerariesTab({ itineraries, isLoading, error, onRetry }: ItinerariesTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl"
            style={{
              height: 72,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-white/40 text-sm" style={{ minHeight: 200 }}>
        <div className="text-center">
          <p className="mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="text-xs underline underline-offset-2 opacity-60 hover:opacity-100"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 280 }}>
        <div className="text-center px-8 max-w-sm">
          <div
            className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(200,150,90,0.12)', border: '1px solid rgba(200,150,90,0.2)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(200,150,90,0.8)"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="8" y1="14" x2="16" y2="14" />
              <line x1="8" y1="18" x2="13" y2="18" />
            </svg>
          </div>
          <p className="text-white/80 text-base font-light mb-2">No itineraries yet</p>
          <p className="text-white/35 text-sm leading-relaxed">
            Save places you want to visit and plan your trip day by day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {itineraries.map((itin) => {
        const isStayLinked = !!itin.stayid;
        const propertyName = itin.stays?.properties?.name;
        const checkin = itin.stays?.checkindate;
        const checkout = itin.stays?.checkoutdate;

        return (
          <div
            key={itin.id}
            className="rounded-2xl p-4 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm font-medium truncate">
                  {itin.title ?? (propertyName ? `${propertyName} stay` : 'Untitled itinerary')}
                </p>
                {isStayLinked && checkin && checkout && (
                  <p className="text-white/35 text-xs mt-0.5">
                    {new Date(checkin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(checkout).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <span
                className="shrink-0 text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: isStayLinked ? 'rgba(200,150,90,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isStayLinked ? 'rgba(200,150,90,0.9)' : 'rgba(255,255,255,0.35)',
                }}
              >
                {isStayLinked ? 'Stay' : 'Personal'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
