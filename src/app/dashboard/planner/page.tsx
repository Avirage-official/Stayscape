'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [itinLoading, setItinLoading] = useState(false);
  const [itinError, setItinError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/guests');
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
      if (!res.ok) throw new Error();
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
      if (!res.ok) throw new Error();
      const json = await res.json() as { itineraries: DbItineraryListed[] };
      setItineraries(json.itineraries);
    } catch {
      setItinError('Could not load your itineraries.');
    } finally {
      setItinLoading(false);
    }
  }, []);

  // Fetch saved on mount; fetch itineraries only when that tab is first opened
  useEffect(() => {
    if (!user) return;
    void fetchSavedPlaces();
  }, [user, fetchSavedPlaces]);

  const itinFetchedRef = useRef(false);
  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'itineraries' && !itinFetchedRef.current && user) {
      itinFetchedRef.current = true;
      void fetchItineraries();
    }
  };

  if (authLoading || !user || savedLoading) {
    return <GuestArrivalSkeleton />;
  }

  return (
    <div style={{ height: 'calc(100dvh - 64px)', display: 'flex', flexDirection: 'column', background: '#0A0806', overflow: 'hidden' }}
      className="md:h-dvh md:ml-[52px]"
    >
      {/* Tab bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(10,8,6,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {(['saved', 'itineraries'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabSwitch(tab)}
              style={{
                flex: 1,
                height: 48,
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #C8965A' : '2px solid transparent',
                color: isActive ? '#C8965A' : 'rgba(255,255,255,0.38)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'color 200ms ease, border-color 200ms ease',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {tab === 'saved' ? 'Saved' : 'Itineraries'}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'saved' && (
          <SavedTab
            savedPlaces={savedPlaces}
            isLoading={savedLoading}
            error={savedError}
            onRetry={() => void fetchSavedPlaces()}
            onUnsave={async (placeId) => {
              const token = await getBearerToken();
              if (!token) return;
              await fetch(`/api/customer/saved-places/${placeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              setSavedPlaces(prev => prev?.filter(p => p.place_id !== placeId) ?? null);
            }}
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

/* ─────────────────────────────────────────────────────────────
   SAVED TAB
───────────────────────────────────────────────────────────── */

interface SavedTabProps {
  savedPlaces: DbSavedPlaceEnriched[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onUnsave: (placeId: string) => Promise<void>;
}

function SavedTab({ savedPlaces, isLoading, error, onRetry, onUnsave }: SavedTabProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [unsaving, setUnsaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const places = savedPlaces ?? [];
  const active = places[activeIndex] ?? null;
  const activePlace = active?.places ?? null;

  // Init Mapbox when we have places
  useEffect(() => {
    if (!places.length || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    const validPlaces = places.filter(p => p.places?.latitude && p.places?.longitude);
    if (!validPlaces.length) return;

    // Dynamically load mapbox-gl
    import('mapbox-gl').then((mapboxgl) => {
      const mb = mapboxgl.default;
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

      const bounds = new mb.LngLatBounds();
      validPlaces.forEach(p => {
        bounds.extend([p.places!.longitude, p.places!.latitude]);
      });

      const map = new mb.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        bounds,
        fitBoundsOptions: { padding: 48, maxZoom: 14 },
        attributionControl: false,
        logoPosition: 'bottom-right',
      });

      map.on('load', () => {
        setMapLoaded(true);
        // Add markers
        validPlaces.forEach((p, i) => {
          const el = document.createElement('div');
          el.dataset.index = String(i);
          el.style.cssText = `
            width: 28px; height: 28px;
            background: ${i === 0 ? '#C8965A' : 'rgba(255,255,255,0.15)'};
            border: 2px solid ${i === 0 ? '#C8965A' : 'rgba(255,255,255,0.35)'};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: ${i === 0 ? '#0A0806' : 'rgba(255,255,255,0.7)'};
            font-size: 11px; font-weight: 700;
            cursor: pointer;
            transition: transform 200ms ease;
            font-family: 'DM Sans', sans-serif;
          `;
          el.textContent = String(i + 1);
          el.addEventListener('click', () => setActiveIndex(i));

          const marker = new mb.Marker({ element: el })
            .setLngLat([p.places!.longitude, p.places!.latitude])
            .addTo(map);
          markersRef.current.push(marker);
        });
      });

      mapInstanceRef.current = map;
    }).catch(console.error);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places.length]);

  // Update markers when activeIndex changes
  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const el = marker.getElement() as HTMLDivElement;
      const isActive = i === activeIndex;
      el.style.background = isActive ? '#C8965A' : 'rgba(255,255,255,0.15)';
      el.style.borderColor = isActive ? '#C8965A' : 'rgba(255,255,255,0.35)';
      el.style.color = isActive ? '#0A0806' : 'rgba(255,255,255,0.7)';
      el.style.transform = isActive ? 'scale(1.25)' : 'scale(1)';
      el.style.zIndex = isActive ? '10' : '1';
    });
    // Fly to active marker
    if (mapInstanceRef.current && places[activeIndex]?.places?.latitude) {
      const p = places[activeIndex].places!;
      mapInstanceRef.current.flyTo({
        center: [p.longitude, p.latitude],
        zoom: 13,
        duration: 800,
        essential: true,
      });
    }
  }, [activeIndex, places]);

  async function handleUnsave() {
    if (!active || unsaving) return;
    setUnsaving(true);
    await onUnsave(active.place_id);
    setActiveIndex(prev => Math.max(0, prev - 1));
    setUnsaving(false);
  }

  // ── Empty state
  if (!isLoading && places.length === 0 && !error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: 300 }}>
          <div style={{
            width: 56, height: 56,
            margin: '0 auto 20px',
            borderRadius: 16,
            background: 'rgba(200,150,90,0.1)',
            border: '1px solid rgba(200,150,90,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(200,150,90,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: 400, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>No saved places yet</p>
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>Explore and bookmark places you want to visit.</p>
        </div>
      </div>
    );
  }

  // ── Error state
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
          <button onClick={onRetry} style={{ fontSize: 12, color: '#C8965A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', flexShrink: 0, height: '42%', minHeight: 220, overflow: 'hidden', background: '#1a1614' }}>
        {/* Hero image */}
        {activePlace?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={activePlace.image_url}
            src={activePlace.image_url}
            alt={activePlace.name ?? ''}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'opacity 400ms ease',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1614, #2a2018)' }} />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.45) 50%, rgba(10,8,6,0.15) 100%)',
        }} />

        {/* Top row: index badge + unsave */}
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {activeIndex + 1} / {places.length}
          </span>
          <button
            onClick={handleUnsave}
            disabled={unsaving}
            aria-label="Remove from saved"
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: unsaving ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
              cursor: unsaving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              transition: 'background 180ms ease, color 180ms ease',
            }}
            onMouseEnter={e => { if (!unsaving) e.currentTarget.style.background = 'rgba(193,58,58,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Bottom: place info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
          {activePlace?.category && (
            <p style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#C8965A',
              marginBottom: 4,
              fontFamily: "'DM Sans', sans-serif",
            }}>{activePlace.category}</p>
          )}
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
            fontWeight: 500,
            color: '#FAF8F5',
            lineHeight: 1.1,
            margin: '0 0 6px',
          }}>{activePlace?.name ?? 'Unnamed place'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activePlace?.city && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif" }}>
                {activePlace.city}
              </span>
            )}
            {activePlace?.rating && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'inline-block' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#C8965A', fontFamily: "'DM Sans', sans-serif" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#C8965A" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {activePlace.rating.toFixed(1)}
                </span>
              </>
            )}
            {activePlace?.price_level && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif" }}>
                  {'$'.repeat(activePlace.price_level)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div style={{ flexShrink: 0, height: '28%', minHeight: 140, position: 'relative', background: '#111' }}>
        <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
        {!mapLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#111',
          }}>
            <div style={{
              width: 20, height: 20,
              border: '2px solid rgba(200,150,90,0.25)',
              borderTopColor: '#C8965A',
              borderRadius: '50%',
              animation: 'spin 700ms linear infinite',
            }} />
          </div>
        )}
      </div>

      {/* ── CARD STRIP ── */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: 'hidden',
        overflowX: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {places.map((item, i) => {
          const p = item.places;
          const isActive = i === activeIndex;
          return (
            <button
              key={item.id}
              onClick={() => setActiveIndex(i)}
              style={{
                flexShrink: 0,
                width: 100,
                height: 72,
                borderRadius: 10,
                overflow: 'hidden',
                position: 'relative',
                border: isActive ? '2px solid #C8965A' : '2px solid transparent',
                cursor: 'pointer',
                background: '#1a1614',
                transition: 'border-color 200ms ease, transform 200ms ease',
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                scrollSnapAlign: 'start',
                padding: 0,
              }}
            >
              {p?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={p.name ?? ''}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: '#2a2018' }} />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
              }} />
              <p style={{
                position: 'absolute', bottom: 5, left: 6, right: 6,
                fontSize: 9, fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.03em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: "'DM Sans', sans-serif",
                margin: 0,
              }}>{p?.name ?? '—'}</p>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        div[style*='overflow-x: auto']::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ITINERARIES TAB  (placeholder — full design coming next)
───────────────────────────────────────────────────────────── */

interface ItinerariesTabProps {
  itineraries: DbItineraryListed[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function ItinerariesTab({ itineraries, isLoading, error, onRetry }: ItinerariesTabProps) {
  if (isLoading) {
    return (
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
          <button onClick={onRetry} style={{ fontSize: 12, color: '#C8965A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>Try again</button>
        </div>
      </div>
    );
  }

  if (!itineraries || itineraries.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: 300 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 20px', borderRadius: 16,
            background: 'rgba(200,150,90,0.1)', border: '1px solid rgba(200,150,90,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(200,150,90,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>No itineraries yet</p>
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>Plan your first trip and it will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {itineraries.map((itin) => {
        const isStayLinked = !!itin.stayid;
        const propertyName = itin.stays?.properties?.name;
        const checkin = itin.stays?.checkindate;
        const checkout = itin.stays?.checkoutdate;
        return (
          <div key={itin.id} style={{
            borderRadius: 14, padding: '14px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            transition: 'background 180ms ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                  {itin.title ?? (propertyName ? `${propertyName} stay` : 'Untitled itinerary')}
                </p>
                {isStayLinked && checkin && checkout && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    {new Date(checkin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(checkout).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <span style={{
                flexShrink: 0, fontSize: 10, padding: '3px 8px', borderRadius: 999, fontWeight: 600, letterSpacing: '0.08em',
                background: isStayLinked ? 'rgba(200,150,90,0.15)' : 'rgba(255,255,255,0.06)',
                color: isStayLinked ? '#C8965A' : 'rgba(255,255,255,0.35)',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {isStayLinked ? 'STAY' : 'PERSONAL'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
