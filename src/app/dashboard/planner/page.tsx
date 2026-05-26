'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import ItineraryPickerSheet from '@/components/explore/ItineraryPickerSheet';
import type { DbSavedPlaceEnriched } from '@/lib/supabase/saved-places-repository';
import type { DbItineraryListed, DbItineraryItemEnriched } from '@/lib/supabase/itinerary-repository';

type Tab = 'saved' | 'itineraries';
type MobileTab = 'saved' | 'saved-map' | 'itineraries' | 'itin-map';

async function getBearerToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

const GOLD = '#C8965A';
const GOLD_DIM = 'rgba(200,150,90,0.18)';
const BG = '#0A0806';
const RIGHT_BG = '#1C1610';
const SURFACE = 'rgba(255,255,255,0.04)';
const SURFACE_2 = 'rgba(255,255,255,0.07)';
const BORDER = 'rgba(255,255,255,0.08)';
const BORDER_2 = 'rgba(255,255,255,0.14)';
const TEXT = '#FAF8F5';
const TEXT_MUTED = 'rgba(250,248,245,0.45)';
const TEXT_FAINT = 'rgba(250,248,245,0.22)';

/* ══ ROOT PAGE ══ */

export default function PlannerPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Desktop
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  // Mobile
  const [mobileTab, setMobileTab] = useState<MobileTab>('saved');
  const [savedActiveIndex, setSavedActiveIndex] = useState(0);
  const [selectedItinForMap, setSelectedItinForMap] = useState<DbItineraryListed | null>(null);

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
    setSavedLoading(true); setSavedError(null);
    const token = await getBearerToken();
    if (!token) { setSavedLoading(false); return; }
    try {
      const res = await fetch('/api/customer/saved-places', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const json = await res.json() as { saved_places: DbSavedPlaceEnriched[] };
      setSavedPlaces(json.saved_places);
    } catch { setSavedError('Could not load your saved places.'); }
    finally { setSavedLoading(false); }
  }, []);

  const fetchItineraries = useCallback(async () => {
    setItinLoading(true); setItinError(null);
    const token = await getBearerToken();
    if (!token) { setItinLoading(false); return; }
    try {
      const res = await fetch('/api/customer/itineraries', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const json = await res.json() as { itineraries: DbItineraryListed[] };
      setItineraries(json.itineraries);
    } catch { setItinError('Could not load your itineraries.'); }
    finally { setItinLoading(false); }
  }, []);

  useEffect(() => { if (user) void fetchSavedPlaces(); }, [user, fetchSavedPlaces]);

  const itinFetchedRef = useRef(false);

  function handleDesktopTabSwitch(tab: Tab) {
    setActiveTab(tab);
    if (tab === 'itineraries' && !itinFetchedRef.current && user) {
      itinFetchedRef.current = true;
      void fetchItineraries();
    }
  }

  function handleMobileTabSwitch(tab: MobileTab) {
    setMobileTab(tab);
    if ((tab === 'itineraries' || tab === 'itin-map') && !itinFetchedRef.current && user) {
      itinFetchedRef.current = true;
      void fetchItineraries();
    }
  }

  if (authLoading || !user || savedLoading) return <GuestArrivalSkeleton />;

  const unsaveFn = async (placeId: string) => {
    const token = await getBearerToken(); if (!token) return;
    await fetch(`/api/customer/saved-places/${placeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSavedPlaces(prev => prev?.filter(p => p.place_id !== placeId) ?? null);
  };

  const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'saved', label: 'Saved', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
    { id: 'saved-map', label: 'Map', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg> },
    { id: 'itineraries', label: 'Trips', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { id: 'itin-map', label: 'Trip Map', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];

  return (
    <div
      style={{ height: 'calc(100dvh - 64px)', display: 'flex', flexDirection: 'column', background: BG, overflow: 'hidden' }}
      className="md:h-dvh md:ml-[52px]"
    >
      {/* ── Tab Bar ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 52,
        borderBottom: `1px solid ${BORDER}`,
        background: 'rgba(10,8,6,0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: GOLD,
        }}>Planner</span>

        <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3, border: `1px solid ${BORDER}` }}>
          {(['saved', 'itineraries'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                style={{
                  height: 30,
                  padding: '0 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                  color: isActive ? TEXT : TEXT_MUTED,
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background 200ms ease, color 200ms ease',
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap',
                  position: 'relative',
                }}
              >
                {tab === 'saved' ? 'Saved' : 'Itineraries'}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 14,
                    height: 1.5,
                    background: GOLD,
                    borderRadius: 999,
                    display: 'block',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        <span style={{
          fontSize: 11,
          color: TEXT_FAINT,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.06em',
          minWidth: 40,
          textAlign: 'right',
        }}>
          {activeTab === 'saved' ? `${(savedPlaces ?? []).length} place${(savedPlaces ?? []).length !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'saved' && (
          <SavedTab
            savedPlaces={savedPlaces}
            isLoading={savedLoading}
            error={savedError}
            onRetry={() => void fetchSavedPlaces()}
            onUnsave={async (placeId) => {
              const token = await getBearerToken(); if (!token) return;
              await fetch(`/api/customer/saved-places/${placeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
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
            onDelete={(id) => setItineraries(prev => prev?.filter(i => i.id !== id) ?? null)}
          />
        )}
      </div>
    </div>
  );
}

/* ══ SAVED TAB ══ */

interface SavedTabProps {
  savedPlaces: DbSavedPlaceEnriched[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onUnsave: (placeId: string) => Promise<void>;
}

function SavedTab({ savedPlaces, isLoading, error, onRetry, onUnsave }: SavedTabProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [heroAnimating, setHeroAnimating] = useState(false);
  const [prevIndex, setPrevIndex] = useState(0);
  const [unsaving, setUnsaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pickerPlace, setPickerPlace] = useState<{ id: string; name: string; category?: string | null; image_url?: string | null } | null>(null);
  const [expandPlace, setExpandPlace] = useState<DbSavedPlaceEnriched | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const places = savedPlaces ?? [];
  const active = places[activeIndex] ?? null;
  const activePlace = active?.places ?? null;

  function flyToIndex(i: number) {
    if (!mapInstanceRef.current || !places[i]?.places?.latitude) return;
    const p = places[i].places!;
    mapInstanceRef.current.flyTo({ center: [p.longitude, p.latitude], zoom: 13, duration: 800, essential: true });
  }

  function selectIndex(i: number) {
    if (i === activeIndex) {
      flyToIndex(i);
      return;
    }
    setPrevIndex(activeIndex);
    setHeroAnimating(true);
    setActiveIndex(i);
    const strip = filmstripRef.current;
    if (strip) {
      const card = strip.children[i] as HTMLElement | undefined;
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(() => setHeroAnimating(false), 420);
  }

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
      setMapLoaded(false);
    }
    if (!places.length || !mapRef.current) return;
    const valid = places.filter(p => p.places?.latitude && p.places?.longitude);
    if (!valid.length) return;

    import('mapbox-gl').then((mapboxgl) => {
      if (!mapRef.current) return;
      const mb = mapboxgl.default;
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
      const bounds = new mb.LngLatBounds();
      valid.forEach(p => bounds.extend([p.places!.longitude, p.places!.latitude]));
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
        const coords = valid.map(p => [p.places!.longitude, p.places!.latitude] as [number, number]);
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': GOLD, 'line-width': 1.5, 'line-dasharray': [2, 3], 'line-opacity': 0.55 },
        });
        valid.forEach((p, i) => {
          const isAct = i === 0;
          const el = document.createElement('div');
          el.style.cssText = `
            width: 28px; height: 28px;
            background: ${isAct ? GOLD : 'rgba(28,22,16,0.85)'};
            border: 1.5px solid ${isAct ? GOLD : 'rgba(200,150,90,0.45)'};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: ${isAct ? '#0A0806' : 'rgba(200,150,90,0.9)'};
            font-size: 11px; font-weight: 700;
            cursor: pointer;
            transition: transform 220ms ease, background 220ms ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            font-family: 'DM Sans', sans-serif;
          `;
          el.textContent = String(i + 1);
          el.addEventListener('click', () => selectIndex(i));
          const marker = new mb.Marker({ element: el }).setLngLat([p.places!.longitude, p.places!.latitude]).addTo(map);
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
  }, [savedPlaces]);

  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const el = marker.getElement() as HTMLDivElement;
      const a = i === activeIndex;
      el.style.background = a ? GOLD : 'rgba(28,22,16,0.85)';
      el.style.borderColor = a ? GOLD : 'rgba(200,150,90,0.45)';
      el.style.color = a ? '#0A0806' : 'rgba(200,150,90,0.9)';
      el.style.transform = a ? 'scale(1.3)' : 'scale(1)';
      el.style.zIndex = a ? '10' : '1';
    });
    flyToIndex(activeIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    if (places.length > 0 && activeIndex >= places.length) {
      setActiveIndex(places.length - 1);
    }
  }, [places.length, activeIndex]);

  async function handleUnsave() {
    if (!active || unsaving) return;
    setUnsaving(true);
    await onUnsave(active.place_id);
    setUnsaving(false);
  }

  if (!isLoading && places.length === 0 && !error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: 300 }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: 16, background: GOLD_DIM, border: `1px solid rgba(200,150,90,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>No saved places yet</p>
          <p style={{ color: TEXT_FAINT, fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>Explore and bookmark places you want to visit.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>{error}</p>
          <button onClick={onRetry} style={{ fontSize: 12, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textDecoration: 'underline' }}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ══ SPLIT PANEL ══ */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

        {/* ── LEFT: Hero image panel ── */}
        <div style={{ position: 'relative', width: '48%', flexShrink: 0, overflow: 'hidden', background: '#14100d' }}>
          {heroAnimating && places[prevIndex]?.places?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={places[prevIndex].places!.image_url!} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 380ms ease' }}
            />
          )}
          {activePlace?.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={activePlace.image_url} src={activePlace.image_url} alt={activePlace.name ?? ''}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: heroAnimating ? 0 : 1, transition: 'opacity 380ms ease' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1a1614,#2a2018)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,4,3,0.94) 0%, rgba(5,4,3,0.35) 50%, rgba(5,4,3,0.06) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(28,22,16,0.85) 100%)' }} />

          <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setExpandPlace(active)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans',sans-serif" }}>View Gallery</span>
          </div>

          <div style={{ position: 'absolute', top: 18, right: 18 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.1em' }}>
              {activeIndex + 1} / {places.length}
            </span>
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 22px 28px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', fontFamily: "'DM Sans',sans-serif" }}>Welcome to</p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 800,
              fontSize: 'clamp(1.8rem, 5.5vw, 3rem)',
              color: '#FFFFFF',
              lineHeight: 0.95,
              margin: '0 0 14px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              opacity: heroAnimating ? 0 : 1,
              transform: heroAnimating ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 320ms ease, transform 320ms ease',
            }}>
              {activePlace?.name ?? 'Unnamed place'}
            </h2>
            {activePlace?.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < Math.round(activePlace.rating ?? 0) ? GOLD : 'rgba(200,150,90,0.2)'} stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans',sans-serif" }}>Location</p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {activePlace?.city ?? activePlace?.category ?? '—'}
                </p>
              </div>
              {activePlace?.category && (
                <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 14 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans',sans-serif" }}>Category</p>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {activePlace.category}
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginLeft: 14 }}>
                <button onClick={() => flyToIndex(activeIndex)} aria-label="Locate on map"
                  style={{ width: 34, height: 34, borderRadius: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 180ms ease, color 180ms ease, background 180ms ease' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; e.currentTarget.style.background = GOLD_DIM; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeOpacity="0.3" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (!active?.places) return;
                    setPickerPlace({ id: active.place_id, name: active.places.name ?? 'Unnamed place', category: active.places.category ?? null, image_url: active.places.image_url ?? null });
                  }}
                  aria-label="Add to itinerary"
                  style={{ height: 34, padding: '0 14px', borderRadius: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5, transition: 'border-color 180ms ease, color 180ms ease, background 180ms ease', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; e.currentTarget.style.background = GOLD_DIM; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  Add
                </button>
                <button onClick={handleUnsave} disabled={unsaving} aria-label="Remove from saved"
                  style={{ width: 34, height: 34, borderRadius: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: unsaving ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)', cursor: unsaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 180ms ease, color 180ms ease' }}
                  onMouseEnter={e => { if (!unsaving) { e.currentTarget.style.borderColor = 'rgba(200,60,60,0.6)'; e.currentTarget.style.color = 'rgba(200,80,80,0.9)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Map + filmstrip ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: RIGHT_BG }}>

          {/* Map */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', background: RIGHT_BG }}>
            <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, background: `linear-gradient(to bottom, ${RIGHT_BG} 0%, transparent 100%)`, pointerEvents: 'none', zIndex: 2 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to top, ${RIGHT_BG} 0%, transparent 100%)`, pointerEvents: 'none', zIndex: 2 }} />
            {!mapLoaded && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: RIGHT_BG }}>
                <div style={{ width: 20, height: 20, border: `2px solid rgba(200,150,90,0.25)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 700ms linear infinite' }} />
              </div>
            )}
          </div>

          {/* ── Filmstrip ── */}
          {/* label */}
          <div style={{ flexShrink: 0, padding: '10px 16px 6px', background: RIGHT_BG }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,150,90,0.4)', fontFamily: "'DM Sans',sans-serif" }}>Saved Places</p>
          </div>

          {/* scroll track — taller to match reference */}
          <div
            ref={filmstripRef}
            style={{
              flexShrink: 0,
              height: 172,
              overflowY: 'hidden',
              overflowX: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '0 16px 16px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              background: RIGHT_BG,
            }}
          >
            {places.map((item, i) => {
              const p = item.places;
              const isActive = i === activeIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => selectIndex(i)}
                  style={{
                    flexShrink: 0,
                    width: 148,
                    height: 150,
                    borderRadius: 10,
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    scrollSnapAlign: 'start',
                    /* active: gold ring + outer glow matching the reference */
                    border: isActive ? `2px solid ${GOLD}` : '2px solid rgba(200,150,90,0.12)',
                    boxShadow: isActive
                      ? `0 0 0 3px rgba(200,150,90,0.18), 0 6px 24px rgba(200,150,90,0.22)`
                      : '0 2px 10px rgba(0,0,0,0.35)',
                    background: '#241c14',
                    transition: 'border-color 240ms ease, box-shadow 240ms ease',
                  }}
                >
                  {/* background image */}
                  {p?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name ?? ''}
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 320ms ease',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#241c14,#3a2a1a)' }} />
                  )}

                  {/* gradient scrim — stronger at bottom for text legibility */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)' }} />

                  {/* top-left: numbered badge */}
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    width: 24, height: 24, borderRadius: '50%',
                    background: isActive ? GOLD : 'rgba(10,8,6,0.72)',
                    border: `1.5px solid ${isActive ? GOLD : 'rgba(200,150,90,0.4)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    color: isActive ? '#0A0806' : 'rgba(200,150,90,0.95)',
                    fontFamily: "'DM Sans',sans-serif",
                    transition: 'background 240ms ease, color 240ms ease',
                    zIndex: 2,
                  }}>
                    {i + 1}
                  </div>

                  {/* bottom text block — place name + category pill */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 10px' }}>
                    {p?.category && (
                      <p style={{
                        margin: '0 0 3px',
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: isActive ? GOLD : 'rgba(200,150,90,0.7)',
                        fontFamily: "'DM Sans',sans-serif",
                        transition: 'color 240ms ease',
                      }}>
                        {p.category}
                      </p>
                    )}
                    <p style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.95)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: "'DM Sans',sans-serif",
                      lineHeight: 1.2,
                    }}>
                      {p?.name ?? '—'}
                    </p>
                    {p?.city && (
                      <p style={{
                        margin: '2px 0 0',
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.45)',
                        fontFamily: "'DM Sans',sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.city}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {pickerPlace && (
        <ItineraryPickerSheet place={pickerPlace} getBearerToken={getBearerToken} onClose={() => setPickerPlace(null)} onAdded={() => setPickerPlace(null)} />
      )}

      {expandPlace && (
        <SavedPlaceSheet
          item={expandPlace}
          onClose={() => setExpandPlace(null)}
          onUnsave={async () => { await onUnsave(expandPlace.place_id); setExpandPlace(null); }}
          onAddToItinerary={() => {
            const p = expandPlace.places;
            if (!p) return;
            setExpandPlace(null);
            setPickerPlace({ id: expandPlace.place_id, name: p.name, category: p.category ?? null, image_url: p.image_url ?? null });
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

/* ══ SAVED TAB — MOBILE ══ */

function SavedMobileTab({
  savedPlaces, isLoading, error, onRetry, onUnsave, activeIndex, setActiveIndex, onLocate,
}: {
  savedPlaces: DbSavedPlaceEnriched[] | null;
  isLoading: boolean; error: string | null;
  onRetry: () => void;
  onUnsave: (placeId: string) => Promise<void>;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onLocate: () => void;
}) {
  const [pickerPlace, setPickerPlace] = useState<{ id: string; name: string; category?: string | null; image_url?: string | null } | null>(null);
  const [expandPlace, setExpandPlace] = useState<DbSavedPlaceEnriched | null>(null);
  const [unsaving, setUnsaving] = useState(false);

  const places = savedPlaces ?? [];
  const active = places[activeIndex] ?? null;
  const activePlace = active?.places ?? null;

  useEffect(() => {
    if (places.length > 0 && activeIndex >= places.length) setActiveIndex(places.length - 1);
  }, [places.length, activeIndex, setActiveIndex]);

  async function handleUnsave() {
    if (!active || unsaving) return;
    setUnsaving(true);
    await onUnsave(active.place_id);
    setUnsaving(false);
  }

  if (!isLoading && places.length === 0 && !error) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%' }}>
        <div style={{ textAlign:'center',padding:'0 32px',maxWidth:300 }}>
          <div style={{ width:56,height:56,margin:'0 auto 20px',borderRadius:16,background:GOLD_DIM,border:`1px solid rgba(200,150,90,0.2)`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          </div>
          <p style={{ color:'rgba(255,255,255,0.75)',fontSize:15,marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}>No saved places yet</p>
          <p style={{ color:TEXT_FAINT,fontSize:13,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>Explore and bookmark places you want to visit.</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%' }}>
        <div style={{ textAlign:'center' }}>
          <p style={{ color:TEXT_MUTED,fontSize:13,marginBottom:12,fontFamily:"'DM Sans',sans-serif" }}>{error}</p>
          <button onClick={onRetry} style={{ fontSize:12,color:GOLD,background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textDecoration:'underline' }}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:'100%',display:'flex',flexDirection:'column',overflow:'hidden' }}>
      {/* Hero */}
      <div style={{ position:'relative',flexShrink:0,height:'45vw',minHeight:160,maxHeight:260,overflow:'hidden',background:'#1a1614' }}>
        {activePlace?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={activePlace.image_url} src={activePlace.image_url} alt={activePlace.name??''} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transition:'opacity 400ms ease' }} />
        ) : (<div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,#1a1614,#2a2018)' }} />)}
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,8,6,0.92) 0%,rgba(10,8,6,0.4) 55%,rgba(10,8,6,0.1) 100%)' }} />

        {/* Counter + actions */}
        <div style={{ position:'absolute',top:14,left:14,right:14,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:11,fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',fontFamily:"'DM Sans',sans-serif" }}>{activeIndex+1} / {places.length}</span>
          <div style={{ display:'flex',gap:7 }}>
            <button onClick={() => { if (!active?.places) return; setPickerPlace({ id:active.place_id,name:active.places.name??'Unnamed place',category:active.places.category??null,image_url:active.places.image_url??null }); }} aria-label="Add to itinerary"
              style={{ width:30,height:30,borderRadius:'50%',background:'rgba(0,0,0,0.4)',border:`1px solid ${GOLD}55`,color:GOLD,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button onClick={onLocate} aria-label="View on map"
              style={{ width:30,height:30,borderRadius:'50%',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.75)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
            </button>
            <button onClick={handleUnsave} disabled={unsaving} aria-label="Remove"
              style={{ width:30,height:30,borderRadius:'50%',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.18)',color:unsaving?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.7)',cursor:unsaving?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Place info */}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'0 14px 14px' }}>
          {activePlace?.category && <p style={{ fontSize:9,fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:GOLD,marginBottom:3,fontFamily:"'DM Sans',sans-serif" }}>{activePlace.category}</p>}
          <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",fontStyle:'italic',fontSize:'clamp(1.4rem,4.5vw,2rem)',fontWeight:500,color:TEXT,lineHeight:1.1,margin:'0 0 5px' }}>{activePlace?.name??'Unnamed place'}</h2>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            {activePlace?.city && <span style={{ fontSize:11,color:'rgba(255,255,255,0.55)',fontFamily:"'DM Sans',sans-serif" }}>{activePlace.city}</span>}
            {activePlace?.rating && (<><span style={{ width:3,height:3,borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'inline-block' }}/><span style={{ display:'flex',alignItems:'center',gap:3,fontSize:11,color:GOLD,fontFamily:"'DM Sans',sans-serif" }}><svg width="10" height="10" viewBox="0 0 24 24" fill={GOLD} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{activePlace.rating.toFixed(1)}</span></>)}
          </div>
        </div>
      </div>

      {/* Portrait card list */}
      <div style={{ flex:1,minHeight:0,overflowY:'auto',scrollbarWidth:'none' }}>
        {places.map((item, i) => {
          const p = item.places;
          const isActive = i === activeIndex;
          return (
            <button key={item.id} onClick={() => setActiveIndex(i)}
              style={{ width:'100%',height:110,display:'flex',alignItems:'stretch',background:isActive?'rgba(200,150,90,0.06)':'transparent',border:'none',borderBottom:`1px solid ${BORDER}`,borderLeft:isActive?`3px solid ${GOLD}`:'3px solid transparent',cursor:'pointer',padding:0,transition:'background 180ms ease,border-color 180ms ease',textAlign:'left' }}
            >
              {/* Image */}
              <div style={{ flexShrink:0,width:90,position:'relative',background:'#1a1614',overflow:'hidden' }}>
                {p?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name??''} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover' }} />
                ) : (<div style={{ position:'absolute',inset:0,background:'#2a2018' }} />)}
              </div>
              {/* Text */}
              <div style={{ flex:1,minWidth:0,padding:'14px 14px 14px 12px',display:'flex',flexDirection:'column',justifyContent:'center',gap:3 }}>
                {p?.category && <p style={{ margin:0,fontSize:9,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:isActive?GOLD:TEXT_MUTED,fontFamily:"'DM Sans',sans-serif" }}>{p.category}</p>}
                <p style={{ margin:0,fontSize:13,fontWeight:500,color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif" }}>{p?.name??'—'}</p>
                {p?.city && <p style={{ margin:0,fontSize:11,color:TEXT_MUTED,fontFamily:"'DM Sans',sans-serif" }}>{p.city}</p>}
                {p?.rating != null && (
                  <span style={{ display:'flex',alignItems:'center',gap:3,fontSize:11,color:GOLD,fontFamily:"'DM Sans',sans-serif" }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill={GOLD} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {p.rating.toFixed(1)}
                  </span>
                )}
              </div>
              {/* Expand icon */}
              <button
                onClick={e => { e.stopPropagation(); setExpandPlace(item); }}
                aria-label="View details"
                style={{ flexShrink:0,width:40,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'none',color:TEXT_FAINT,cursor:'pointer' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
            </button>
          );
        })}
      </div>

      {pickerPlace && (
        <ItineraryPickerSheet place={pickerPlace} getBearerToken={getBearerToken}
          onClose={() => setPickerPlace(null)} onAdded={() => setPickerPlace(null)} />
      )}
      {expandPlace && (
        <SavedPlaceSheet item={expandPlace} onClose={() => setExpandPlace(null)}
          onUnsave={async () => { await onUnsave(expandPlace.place_id); setExpandPlace(null); }}
          onAddToItinerary={() => {
            const p = expandPlace.places; if (!p) return;
            setExpandPlace(null);
            setPickerPlace({ id:expandPlace.place_id,name:p.name,category:p.category??null,image_url:p.image_url??null });
          }}
        />
      )}
      <style>{`div[style*='overflow-y: auto']::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

/* ══ SAVED MAP TAB — MOBILE ══ */

function SavedMapMobileTab({
  savedPlaces, activeIndex, onMarkerTap,
}: {
  savedPlaces: DbSavedPlaceEnriched[] | null;
  activeIndex: number;
  onMarkerTap: (i: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const places = (savedPlaces ?? []).filter(p => p.places?.latitude && p.places?.longitude);

  useEffect(() => {
    if (!mapRef.current || !places.length) { setMapLoaded(true); return; }
    import('mapbox-gl').then((mapboxgl) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const mb = mapboxgl.default;
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
      const bounds = new mb.LngLatBounds();
      places.forEach(p => bounds.extend([p.places!.longitude, p.places!.latitude]));
      const map = new mb.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        bounds, fitBoundsOptions: { padding: 48, maxZoom: 14 },
        attributionControl: false, logoPosition: 'bottom-right',
      });
      map.on('load', () => {
        setMapLoaded(true);
        places.forEach((p, i) => {
          const el = document.createElement('div');
          const isA = i === activeIndex;
          el.style.cssText = `width:28px;height:28px;background:${isA?GOLD:'rgba(255,255,255,0.15)'};border:2px solid ${isA?GOLD:'rgba(255,255,255,0.35)'};border-radius:50%;display:flex;align-items:center;justify-content:center;color:${isA?BG:'rgba(255,255,255,0.7)'};font-size:11px;font-weight:700;cursor:pointer;transition:transform 200ms ease;font-family:'DM Sans',sans-serif;`;
          el.textContent = String(i + 1);
          el.addEventListener('click', () => onMarkerTap(i));
          const marker = new mb.Marker({ element: el }).setLngLat([p.places!.longitude, p.places!.latitude]).addTo(map);
          markersRef.current.push(marker);
        });
      });
      mapInstanceRef.current = map;
    }).catch(console.error);
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; markersRef.current = []; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPlaces]);

  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const el = marker.getElement() as HTMLDivElement;
      const a = i === activeIndex;
      el.style.background = a ? GOLD : 'rgba(255,255,255,0.15)';
      el.style.borderColor = a ? GOLD : 'rgba(255,255,255,0.35)';
      el.style.color = a ? BG : 'rgba(255,255,255,0.7)';
      el.style.transform = a ? 'scale(1.25)' : 'scale(1)';
      el.style.zIndex = a ? '10' : '1';
    });
    if (mapInstanceRef.current && places[activeIndex]?.places?.latitude) {
      const p = places[activeIndex].places!;
      mapInstanceRef.current.flyTo({ center: [p.longitude, p.latitude], zoom: 13, duration: 800, essential: true });
    }
  }, [activeIndex, places]);

  if (!places.length) {
    return (
      <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <p style={{ color:TEXT_FAINT,fontSize:13,fontFamily:"'DM Sans',sans-serif" }}>No places with location data.</p>
      </div>
    );
  }
  return (
    <div style={{ height:'100%',position:'relative',background:'#111' }}>
      <div ref={mapRef} style={{ position:'absolute',inset:0 }} />
      {!mapLoaded && (
        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#111' }}>
          <div style={{ width:20,height:20,border:`2px solid rgba(200,150,90,0.25)`,borderTopColor:GOLD,borderRadius:'50%',animation:'spin 700ms linear infinite' }} />
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══ ITIN MAP TAB — MOBILE ══ */

function ItinMapMobileTab({ itinerary, onGoToItineraries }: { itinerary: DbItineraryListed | null; onGoToItineraries: () => void }) {
  if (!itinerary) {
    return (
      <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <div style={{ textAlign:'center',padding:'0 32px',maxWidth:280 }}>
          <div style={{ width:52,height:52,margin:'0 auto 18px',borderRadius:14,background:GOLD_DIM,border:`1px solid rgba(200,150,90,0.2)`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p style={{ color:'rgba(255,255,255,0.75)',fontSize:14,margin:'0 0 6px',fontFamily:"'DM Sans',sans-serif" }}>No itinerary selected</p>
          <p style={{ color:TEXT_FAINT,fontSize:12,lineHeight:1.6,margin:'0 0 18px',fontFamily:"'DM Sans',sans-serif" }}>Pick a trip from your itineraries to see its stops on the map.</p>
          <button onClick={onGoToItineraries}
            style={{ padding:'10px 20px',borderRadius:10,background:GOLD_DIM,border:`1px solid rgba(200,150,90,0.3)`,color:GOLD,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
            Browse Itineraries
          </button>
        </div>
      </div>
    );
  }
  return <ItinMapOnly itin={itinerary} />;
}

function ItinMapOnly({ itin }: { itin: DbItineraryListed }) {
  const [items, setItems] = useState<DbItineraryItemEnriched[] | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getBearerToken(); if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/customer/itineraries/${itin.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const json = await res.json() as { itinerary: DbItineraryListed; items: DbItineraryItemEnriched[] };
        setItems(json.items);
      } catch { setItems([]); }
      finally { setLoading(false); }
    }
    void load();
  }, [itin.id]);

  useEffect(() => {
    if (loading) return;
    if (!items?.length || !mapRef.current || mapInstanceRef.current) { setMapReady(true); return; }
    const geo = items.filter(i => i.places?.latitude && i.places?.longitude);
    if (!geo.length) { setMapReady(true); return; }
    import('mapbox-gl').then((mapboxgl) => {
      if (!mapRef.current) return;
      const mb = mapboxgl.default;
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
      const bounds = new mb.LngLatBounds();
      geo.forEach(i => bounds.extend([i.places!.longitude, i.places!.latitude]));
      const map = new mb.Map({ container: mapRef.current!, style: 'mapbox://styles/mapbox/dark-v11', bounds, fitBoundsOptions: { padding: 48, maxZoom: 14 }, attributionControl: false, logoPosition: 'bottom-right' });
      map.on('load', () => {
        setMapReady(true);
        const coords = geo.map(i => [i.places!.longitude, i.places!.latitude] as [number, number]);
        map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } } });
        map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': GOLD, 'line-width': 2, 'line-dasharray': [2, 3], 'line-opacity': 0.6 } });
        geo.forEach((item, idx) => {
          const el = document.createElement('div');
          el.style.cssText = `width:26px;height:26px;background:rgba(200,150,90,0.15);border:1.5px solid ${GOLD};border-radius:50%;display:flex;align-items:center;justify-content:center;color:${GOLD};font-size:10px;font-weight:700;font-family:'DM Sans',sans-serif;`;
          el.textContent = String(idx + 1);
          new mb.Marker({ element: el }).setLngLat([item.places!.longitude, item.places!.latitude]).addTo(map);
        });
      });
      mapInstanceRef.current = map;
    }).catch(console.error);
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items?.length]);

  const checkin = itin.stays?.checkindate ?? itin.startdate;
  const checkout = itin.stays?.checkoutdate ?? itin.enddate;
  const title = itin.title ?? itin.stays?.properties?.name ?? 'Itinerary';

  return (
    <div style={{ height:'100%',position:'relative',background:'#0e0c0a' }}>
      <div ref={mapRef} style={{ position:'absolute',inset:0 }} />
      {!mapReady && (
        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#0e0c0a' }}>
          <div style={{ width:20,height:20,border:`2px solid rgba(200,150,90,0.25)`,borderTopColor:GOLD,borderRadius:'50%',animation:'spin 700ms linear infinite' }} />
        </div>
      )}
      {mapReady && (
        <div style={{ position:'absolute',top:16,left:16,right:16,pointerEvents:'none' }}>
          <div style={{ display:'inline-flex',flexDirection:'column',background:'rgba(10,8,6,0.75)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',borderRadius:12,padding:'10px 14px',border:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:13,fontWeight:600,color:TEXT,fontFamily:"'DM Sans',sans-serif" }}>{title}</span>
            {checkin && checkout && <span style={{ fontSize:11,color:TEXT_MUTED,fontFamily:"'DM Sans',sans-serif",marginTop:2 }}>{formatDate(checkin)} – {formatDate(checkout)}</span>}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══ ITINERARIES TAB ══ */

interface ItinerariesTabProps {
  itineraries: DbItineraryListed[] | null;
  isLoading: boolean; error: string | null;
  onRetry: () => void;
  onDelete: (id: string) => void;
  onItinerarySelect?: (itin: DbItineraryListed) => void;
}

function ItinerariesTab({ itineraries, isLoading, error, onRetry, onDelete, onItinerarySelect }: ItinerariesTabProps) {
  const [selected, setSelected] = useState<DbItineraryListed | null>(null);

  function selectItinerary(itin: DbItineraryListed) {
    setSelected(itin);
    onItinerarySelect?.(itin);
  }

  if (selected) {
    return <ItineraryDetail itin={selected} onBack={() => setSelected(null)} onDelete={(id) => { onDelete(id); setSelected(null); }} />;
  }
  if (isLoading) {
    return (
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (<div key={i} style={{ height: 80, borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}`, animation: 'pulse 1.6s ease-in-out infinite' }} />))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    );
  }
  if (error) {
    return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div style={{ textAlign: 'center' }}><p style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>{error}</p><button onClick={onRetry} style={{ fontSize: 12, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textDecoration: 'underline' }}>Try again</button></div></div>);
  }
  if (!itineraries || itineraries.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: 300 }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: 16, background: GOLD_DIM, border: `1px solid rgba(200,150,90,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>No itineraries yet</p>
          <p style={{ color: TEXT_FAINT, fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>Plan your first trip and it will appear here.</p>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: '16px', overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {itineraries.map((itin) => {
        const isStayLinked = !!itin.stayid;
        const propertyName = itin.stays?.properties?.name;
        const checkin = itin.stays?.checkindate ?? itin.startdate;
        const checkout = itin.stays?.checkoutdate ?? itin.enddate;
        const title = itin.title ?? (propertyName ?? 'Untitled itinerary');
        return (
          <button key={itin.id} onClick={() => setSelected(itin)}
            style={{ width: '100%', textAlign: 'left', borderRadius: 14, padding: '14px 16px', background: SURFACE, border: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 180ms ease', display: 'block' }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE_2; }}
            onMouseLeave={e => { e.currentTarget.style.background = SURFACE; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>{title}</p>
                {checkin && checkout && (<p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{formatDate(checkin)} – {formatDate(checkout)}</p>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, fontWeight: 600, letterSpacing: '0.08em', background: isStayLinked ? GOLD_DIM : SURFACE, color: isStayLinked ? GOLD : TEXT_MUTED, fontFamily: "'DM Sans',sans-serif" }}>{isStayLinked ? 'STAY' : 'PERSONAL'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ══ EDIT ITEM SHEET ══ */

interface EditItemSheetProps {
  item: DbItineraryItemEnriched;
  itineraryId: string;
  onClose: () => void;
  onSaved: (updated: Partial<DbItineraryItemEnriched>) => void;
}

function EditItemSheet({ item, itineraryId, onClose, onSaved }: EditItemSheetProps) {
  const [date, setDate] = useState(item.scheduleddate ?? '');
  const [time, setTime] = useState(item.starttime?.slice(0, 5) ?? '09:00');
  const [duration, setDuration] = useState(String(item.durationhours ?? 1));
  const [notes, setNotes] = useState(item.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = item.titleoverride ?? item.name ?? item.places?.name ?? 'Unnamed stop';
  const category = item.category ?? item.places?.category;

  async function handleSave() {
    if (!date) { setError('Date is required'); return; }
    setSaving(true); setError(null);
    const token = await getBearerToken();
    if (!token) { setSaving(false); setError('Session expired'); return; }
    try {
      const body: Record<string, string | number> = {
        scheduleddate: date,
        starttime: time,
        durationhours: parseFloat(duration) || 1,
        notes: notes.trim(),
      };
      const res = await fetch(`/api/customer/itineraries/${itineraryId}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? 'Failed to save');
      }
      onSaved({ scheduleddate: date, starttime: time, durationhours: parseFloat(duration) || 1, notes: notes.trim() || null });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER_2}`,
    color: TEXT, fontSize: 14, padding: '0 12px', fontFamily: "'DM Sans',sans-serif",
    outline: 'none', transition: 'border-color 180ms ease', colorScheme: 'dark',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#181412', borderRadius: '18px 18px 0 0', padding: '0 20px 32px', border: `1px solid ${BORDER}`, maxHeight: '90%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          {category && <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 3px', fontFamily: "'DM Sans',sans-serif" }}>{category}</p>}
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: TEXT, fontFamily: "'DM Sans',sans-serif" }}>{name}</h4>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: TEXT_MUTED, marginBottom: 6, fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} onFocus={e => { e.target.style.borderColor = GOLD; }} onBlur={e => { e.target.style.borderColor = BORDER_2; }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: TEXT_MUTED, marginBottom: 6, fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase' }}>Start Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} onFocus={e => { e.target.style.borderColor = GOLD; }} onBlur={e => { e.target.style.borderColor = BORDER_2; }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: TEXT_MUTED, marginBottom: 6, fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase' }}>Duration (hrs)</label>
            <input type="number" min="0.5" max="24" step="0.5" value={duration} onChange={e => setDuration(e.target.value)} style={inputStyle} onFocus={e => { e.target.style.borderColor = GOLD; }} onBlur={e => { e.target.style.borderColor = BORDER_2; }} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: TEXT_MUTED, marginBottom: 6, fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase' }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Reservation number, what to order, who to ask for…" style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.5, minHeight: 72 }} onFocus={e => { e.target.style.borderColor = GOLD; }} onBlur={e => { e.target.style.borderColor = BORDER_2; }} />
        </div>
        {error && <p style={{ color: 'rgba(220,80,80,0.9)', fontSize: 12, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 46, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, height: 46, borderRadius: 10, background: saving ? GOLD_DIM : GOLD, border: 'none', color: saving ? GOLD : BG, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'background 180ms ease,color 180ms ease' }}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}

/* ══ ITINERARY DETAIL ══ */

interface ItineraryDetailProps {
  itin: DbItineraryListed;
  onBack: () => void;
  onDelete: (id: string) => void;
}

function ItineraryDetail({ itin, onBack, onDelete }: ItineraryDetailProps) {
  const [items, setItems] = useState<DbItineraryItemEnriched[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState<DbItineraryItemEnriched | null>(null);

  const days = items ? Array.from(new Set(items.map(i => i.scheduleddate))).sort() : [];
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getBearerToken(); if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/customer/itineraries/${itin.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const json = await res.json() as { itinerary: DbItineraryListed; items: DbItineraryItemEnriched[] };
        setItems(json.items);
      } catch { setItems([]); }
      finally { setLoading(false); }
    }
    void load();
  }, [itin.id]);

  useEffect(() => {
    if (days.length && !activeDay) setActiveDay(days[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length]);

  const visibleItems = items?.filter(i => !activeDay || i.scheduleddate === activeDay) ?? [];

  useEffect(() => {
    if (loading) return;
    if (!items?.length || !mapRef.current || mapInstanceRef.current) { setMapReady(true); return; }
    const geo = items.filter(i => i.places?.latitude && i.places?.longitude);
    if (!geo.length) { setMapReady(true); return; }
    import('mapbox-gl').then((mapboxgl) => {
      const mb = mapboxgl.default;
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
      const bounds = new mb.LngLatBounds();
      geo.forEach(i => bounds.extend([i.places!.longitude, i.places!.latitude]));
      const map = new mb.Map({ container: mapRef.current!, style: 'mapbox://styles/mapbox/dark-v11', bounds, fitBoundsOptions: { padding: 40, maxZoom: 14 }, attributionControl: false, logoPosition: 'bottom-right' });
      map.on('load', () => {
        setMapReady(true);
        const coords = geo.map(i => [i.places!.longitude, i.places!.latitude] as [number, number]);
        map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } } });
        map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': GOLD, 'line-width': 2, 'line-dasharray': [2, 3], 'line-opacity': 0.6 } });
        geo.forEach((itm, idx) => {
          const el = document.createElement('div');
          el.style.cssText = `width:26px;height:26px;background:rgba(200,150,90,0.15);border:1.5px solid ${GOLD};border-radius:50%;display:flex;align-items:center;justify-content:center;color:${GOLD};font-size:10px;font-weight:700;font-family:'DM Sans',sans-serif;`;
          el.textContent = String(idx + 1);
          new mb.Marker({ element: el }).setLngLat([itm.places!.longitude, itm.places!.latitude]).addTo(map);
        });
      });
      mapInstanceRef.current = map;
    }).catch(console.error);
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items?.length]);

  useEffect(() => {
    if (!mapInstanceRef.current || !activeDay || !items) return;
    const dayItems = items.filter(i => i.scheduleddate === activeDay && i.places?.latitude);
    if (!dayItems.length) return;
    if (dayItems.length === 1) {
      mapInstanceRef.current.flyTo({ center: [dayItems[0].places!.longitude, dayItems[0].places!.latitude], zoom: 13, duration: 700 });
    } else {
      import('mapbox-gl').then((mapboxgl) => {
        const mb = mapboxgl.default;
        const bounds = new mb.LngLatBounds();
        dayItems.forEach(i => bounds.extend([i.places!.longitude, i.places!.latitude]));
        mapInstanceRef.current.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 700 });
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay]);

  async function handleDelete() {
    if (itin.stayid) return;
    setDeleting(true);
    const token = await getBearerToken(); if (!token) { setDeleting(false); return; }
    await fetch(`/api/customer/itineraries/${itin.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    onDelete(itin.id);
  }

  const propertyName = itin.stays?.properties?.name;
  const checkin = itin.stays?.checkindate ?? itin.startdate;
  const checkout = itin.stays?.checkoutdate ?? itin.enddate;
  const title = itin.title ?? propertyName ?? 'Untitled itinerary';
  const isStayLinked = !!itin.stayid;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} aria-label="Back"
          style={{ width: 34, height: 34, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'color 180ms ease,border-color 180ms ease' }}
          onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = TEXT_MUTED; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>{title}</h3>
          {checkin && checkout && (<p style={{ margin: 0, fontSize: 11, color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif" }}>{formatDate(checkin)} – {formatDate(checkout)}</p>)}
        </div>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, fontWeight: 600, letterSpacing: '0.08em', background: isStayLinked ? GOLD_DIM : SURFACE, color: isStayLinked ? GOLD : TEXT_MUTED, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>{isStayLinked ? 'STAY' : 'PERSONAL'}</span>
        {!isStayLinked && (
          <button onClick={() => setShowDeleteConfirm(true)} aria-label="Delete itinerary"
            style={{ width: 34, height: 34, borderRadius: 10, background: 'transparent', border: `1px solid ${BORDER}`, color: TEXT_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'color 180ms ease,border-color 180ms ease,background 180ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,58,58,0.12)'; e.currentTarget.style.color = 'rgba(220,80,80,0.9)'; e.currentTarget.style.borderColor = 'rgba(220,80,80,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_MUTED; e.currentTarget.style.borderColor = BORDER; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
          </button>
        )}
      </div>

      <div style={{ flexShrink: 0, height: '32%', minHeight: 150, position: 'relative', background: '#0e0c0a' }}>
        <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
        {!mapReady && (<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0c0a' }}><div style={{ width: 20, height: 20, border: `2px solid rgba(200,150,90,0.25)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 700ms linear infinite' }} /></div>)}
      </div>

      {days.length > 1 && (
        <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: `1px solid ${BORDER}` }}>
          {days.map((day, idx) => {
            const isActive = day === activeDay;
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', border: `1px solid ${isActive ? GOLD : BORDER}`, background: isActive ? GOLD_DIM : 'transparent', color: isActive ? GOLD : TEXT_MUTED, cursor: 'pointer', transition: 'all 180ms ease', fontFamily: "'DM Sans',sans-serif" }}
              >Day {idx + 1}</button>
            );
          })}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 24px', scrollbarWidth: 'thin', scrollbarColor: `${BORDER} transparent` }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: SURFACE, animation: 'pulse 1.6s ease-in-out infinite' }} />
                <div style={{ flex: 1, height: 64, borderRadius: 12, background: SURFACE, animation: 'pulse 1.6s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        )}
        {!loading && visibleItems.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ color: TEXT_FAINT, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No stops planned for this day yet.</p>
          </div>
        )}
        {!loading && visibleItems.length > 0 && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 13, bottom: 13, width: 1, background: `linear-gradient(to bottom,${GOLD}44,${GOLD}22,transparent)` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {visibleItems.map((itm, idx) => {
                const place = itm.places;
                const name = itm.titleoverride ?? itm.name ?? place?.name ?? 'Unnamed stop';
                const category = itm.category ?? place?.category;
                const image = itm.image ?? place?.image_url;
                const time = formatTime(itm.starttime);
                const dur = itm.durationhours ? `${itm.durationhours}h` : null;
                const isLast = idx === visibleItems.length - 1;
                return (
                  <div key={itm.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: isLast ? 0 : 20, position: 'relative' }}>
                    <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: BG, border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", zIndex: 1, marginTop: 2 }}>{idx + 1}</div>
                    <button onClick={() => setEditingItem(itm)}
                      style={{ flex: 1, borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', gap: 0, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 180ms ease,border-color 180ms ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = SURFACE_2; e.currentTarget.style.borderColor = BORDER_2; }}
                      onMouseLeave={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = BORDER; }}
                    >
                      {image && (
                        <div style={{ flexShrink: 0, width: 68, position: 'relative', background: '#1a1614' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image} alt={name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          {time && <span style={{ fontSize: 10, color: GOLD, fontWeight: 600, letterSpacing: '0.08em', fontFamily: "'DM Sans',sans-serif" }}>{time}</span>}
                          {dur && <span style={{ fontSize: 10, color: TEXT_FAINT, fontFamily: "'DM Sans',sans-serif" }}>{dur}</span>}
                          <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </span>
                        </div>
                        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>{name}</p>
                        {category && <p style={{ margin: 0, fontSize: 11, color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif" }}>{category}</p>}
                        {itm.notes && <p style={{ margin: '5px 0 0', fontSize: 11, color: TEXT_FAINT, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{itm.notes}</p>}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {editingItem && (
        <EditItemSheet
          item={editingItem}
          itineraryId={itin.id}
          onClose={() => setEditingItem(null)}
          onSaved={(updated) => {
            setItems(prev => prev?.map(i => i.id === editingItem.id ? { ...i, ...updated } : i) ?? null);
            setEditingItem(null);
          }}
        />
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={() => setShowDeleteConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#181412', borderRadius: '18px 18px 0 0', padding: '24px 20px 32px', border: `1px solid ${BORDER}` }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: TEXT, fontFamily: "'DM Sans',sans-serif" }}>Delete itinerary?</h4>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>This will permanently remove this itinerary and all its stops.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, height: 44, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: 44, borderRadius: 10, background: 'rgba(193,58,58,0.15)', border: '1px solid rgba(193,58,58,0.3)', color: deleting ? 'rgba(255,255,255,0.3)' : 'rgba(220,80,80,0.9)', fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </div>
  );
}

/* ══ SAVED PLACE DETAIL SHEET ══ */

interface SavedPlaceSheetProps {
  item: DbSavedPlaceEnriched;
  onClose: () => void;
  onUnsave: () => Promise<void>;
  onAddToItinerary: () => void;
}

function SavedPlaceSheet({ item, onClose, onUnsave, onAddToItinerary }: SavedPlaceSheetProps) {
  const [visible, setVisible] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const p = item.places;

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() { setVisible(false); setTimeout(onClose, 260); }

  async function handleUnsave() {
    setUnsaving(true);
    await onUnsave();
    setUnsaving(false);
  }

  function priceDots(level: number | null | undefined) {
    if (!level) return null;
    return '$'.repeat(Math.min(level, 4));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={close}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', opacity: visible ? 1 : 0, transition: 'opacity 260ms ease' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', background: '#181412', borderRadius: '20px 20px 0 0', border: `1px solid ${BORDER}`, borderBottom: 'none', maxHeight: '85dvh', overflowY: 'auto', transform: visible ? 'translateY(0)' : 'translateY(100%)', transition: visible ? 'transform 300ms cubic-bezier(0.16,1,0.3,1)' : 'transform 240ms ease-in', willChange: 'transform' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.12)' }} />
        </div>
        {p?.image_url && (
          <div style={{ position: 'relative', height: 180, margin: '12px 16px 0', borderRadius: 14, overflow: 'hidden', background: '#1a1614' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.name ?? ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,8,6,0.8) 0%,transparent 60%)' }} />
            {p.category && (
              <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, background: 'rgba(10,8,6,0.65)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: 20, fontFamily: "'DM Sans',sans-serif" }}>{p.category}</span>
            )}
          </div>
        )}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: TEXT, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.2 }}>{p?.name ?? 'Unnamed place'}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {p?.city && <span style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif" }}>{p.city}</span>}
                {p?.rating != null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: GOLD, fontFamily: "'DM Sans',sans-serif" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={GOLD} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    {p.rating.toFixed(1)}
                  </span>
                )}
                {p?.price_level != null && <span style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif" }}>{priceDots(p.price_level)}</span>}
              </div>
            </div>
          </div>
          {p?.editorial_summary && (
            <p style={{ fontSize: 13, color: 'rgba(250,248,245,0.55)', lineHeight: 1.6, margin: '0 0 12px', fontFamily: "'DM Sans',sans-serif" }}>{p.editorial_summary}</p>
          )}
          {p?.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 16 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              <span style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>{p.address}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 32 }}>
            <button onClick={onAddToItinerary}
              style={{ flex: 2, height: 46, borderRadius: 12, background: GOLD, border: 'none', color: '#0A0806', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity 160ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add to Itinerary
            </button>
            <button onClick={handleUnsave} disabled={unsaving}
              style={{ flex: 1, height: 46, borderRadius: 12, background: 'rgba(193,58,58,0.12)', border: '1px solid rgba(193,58,58,0.25)', color: unsaving ? 'rgba(255,255,255,0.3)' : 'rgba(220,80,80,0.85)', fontSize: 13, fontWeight: 600, cursor: unsaving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'background 160ms ease' }}
              onMouseEnter={e => { if (!unsaving) e.currentTarget.style.background = 'rgba(193,58,58,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(193,58,58,0.12)'; }}
            >
              {unsaving ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
