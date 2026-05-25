'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';
import type { DbSavedPlaceEnriched } from '@/lib/supabase/saved-places-repository';
import type { DbItineraryListed, DbItineraryItemEnriched } from '@/lib/supabase/itinerary-repository';

type Tab = 'saved' | 'itineraries';

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

/* ── GOLD palette ── */
const GOLD = '#C8965A';
const GOLD_DIM = 'rgba(200,150,90,0.18)';
const BG = '#0A0806';
const SURFACE = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#FAF8F5';
const TEXT_MUTED = 'rgba(250,248,245,0.45)';
const TEXT_FAINT = 'rgba(250,248,245,0.22)';

/* ════════════════════════════════════════════════════════════════
   ROOT PAGE
═══════════════════════════════════════════════════════════════ */

export default function PlannerPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('saved');

  // Saved
  const [savedPlaces, setSavedPlaces] = useState<DbSavedPlaceEnriched[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);

  // Itineraries list
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
    <div
      style={{ height: 'calc(100dvh - 64px)', display: 'flex', flexDirection: 'column', background: BG, overflow: 'hidden' }}
      className="md:h-dvh md:ml-[52px]"
    >
      {/* Tab bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: `1px solid ${BORDER}`,
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
                borderBottom: isActive ? `2px solid ${GOLD}` : '2px solid transparent',
                color: isActive ? GOLD : TEXT_MUTED,
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
            onDelete={(id) => setItineraries(prev => prev?.filter(i => i.id !== id) ?? null)}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SAVED TAB
═══════════════════════════════════════════════════════════════ */

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

  useEffect(() => {
    if (!places.length || !mapRef.current) return;
    if (mapInstanceRef.current) return;
    const validPlaces = places.filter(p => p.places?.latitude && p.places?.longitude);
    if (!validPlaces.length) return;

    import('mapbox-gl').then((mapboxgl) => {
      const mb = mapboxgl.default;
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
      const bounds = new mb.LngLatBounds();
      validPlaces.forEach(p => bounds.extend([p.places!.longitude, p.places!.latitude]));

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
        validPlaces.forEach((p, i) => {
          const el = document.createElement('div');
          el.dataset.index = String(i);
          el.style.cssText = `width:28px;height:28px;background:${i===0?GOLD:'rgba(255,255,255,0.15)'};border:2px solid ${i===0?GOLD:'rgba(255,255,255,0.35)'};border-radius:50%;display:flex;align-items:center;justify-content:center;color:${i===0?BG:'rgba(255,255,255,0.7)'};font-size:11px;font-weight:700;cursor:pointer;transition:transform 200ms ease;font-family:'DM Sans',sans-serif;`;
          el.textContent = String(i + 1);
          el.addEventListener('click', () => setActiveIndex(i));
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
  }, [places.length]);

  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const el = marker.getElement() as HTMLDivElement;
      const isActive = i === activeIndex;
      el.style.background = isActive ? GOLD : 'rgba(255,255,255,0.15)';
      el.style.borderColor = isActive ? GOLD : 'rgba(255,255,255,0.35)';
      el.style.color = isActive ? BG : 'rgba(255,255,255,0.7)';
      el.style.transform = isActive ? 'scale(1.25)' : 'scale(1)';
      el.style.zIndex = isActive ? '10' : '1';
    });
    if (mapInstanceRef.current && places[activeIndex]?.places?.latitude) {
      const p = places[activeIndex].places!;
      mapInstanceRef.current.flyTo({ center: [p.longitude, p.latitude], zoom: 13, duration: 800, essential: true });
    }
  }, [activeIndex, places]);

  async function handleUnsave() {
    if (!active || unsaving) return;
    setUnsaving(true);
    await onUnsave(active.place_id);
    setActiveIndex(prev => Math.max(0, prev - 1));
    setUnsaving(false);
  }

  if (!isLoading && places.length === 0 && !error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: 300 }}>
          <div style={{ width:56,height:56,margin:'0 auto 20px',borderRadius:16,background:GOLD_DIM,border:`1px solid rgba(200,150,90,0.2)`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
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
      <div style={{ position:'relative',flexShrink:0,height:'42%',minHeight:220,overflow:'hidden',background:'#1a1614' }}>
        {activePlace?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={activePlace.image_url} src={activePlace.image_url} alt={activePlace.name??''}
            style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transition:'opacity 400ms ease' }} />
        ) : (
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,#1a1614,#2a2018)' }} />
        )}
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,8,6,0.92) 0%,rgba(10,8,6,0.45) 50%,rgba(10,8,6,0.15) 100%)' }} />
        <div style={{ position:'absolute',top:16,left:16,right:16,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:11,fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',fontFamily:"'DM Sans',sans-serif" }}>{activeIndex+1} / {places.length}</span>
          <button onClick={handleUnsave} disabled={unsaving} aria-label="Remove from saved"
            style={{ width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.18)',color:unsaving?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.7)',cursor:unsaving?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',transition:'background 180ms ease,color 180ms ease' }}
            onMouseEnter={e=>{ if(!unsaving) e.currentTarget.style.background='rgba(193,58,58,0.5)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(0,0,0,0.4)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'0 16px 16px' }}>
          {activePlace?.category && <p style={{ fontSize:10,fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:GOLD,marginBottom:4,fontFamily:"'DM Sans',sans-serif" }}>{activePlace.category}</p>}
          <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",fontStyle:'italic',fontSize:'clamp(1.6rem,5vw,2.4rem)',fontWeight:500,color:TEXT,lineHeight:1.1,margin:'0 0 6px' }}>{activePlace?.name??'Unnamed place'}</h2>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {activePlace?.city && <span style={{ fontSize:12,color:'rgba(255,255,255,0.55)',fontFamily:"'DM Sans',sans-serif" }}>{activePlace.city}</span>}
            {activePlace?.rating && (<><span style={{ width:3,height:3,borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'inline-block' }}/><span style={{ display:'flex',alignItems:'center',gap:3,fontSize:12,color:GOLD,fontFamily:"'DM Sans',sans-serif" }}><svg width="11" height="11" viewBox="0 0 24 24" fill={GOLD} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{activePlace.rating.toFixed(1)}</span></> )}
          </div>
        </div>
      </div>
      {/* Map */}
      <div style={{ flexShrink:0,height:'28%',minHeight:140,position:'relative',background:'#111' }}>
        <div ref={mapRef} style={{ position:'absolute',inset:0 }} />
        {!mapLoaded && (
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#111' }}>
            <div style={{ width:20,height:20,border:`2px solid rgba(200,150,90,0.25)`,borderTopColor:GOLD,borderRadius:'50%',animation:'spin 700ms linear infinite' }} />
          </div>
        )}
      </div>
      {/* Card strip */}
      <div style={{ flex:1,minHeight:0,overflowY:'hidden',overflowX:'auto',display:'flex',alignItems:'center',gap:10,padding:'0 16px',scrollSnapType:'x mandatory',WebkitOverflowScrolling:'touch',scrollbarWidth:'none' }}>
        {places.map((item, i) => {
          const p = item.places;
          const isActive = i === activeIndex;
          return (
            <button key={item.id} onClick={() => setActiveIndex(i)}
              style={{ flexShrink:0,width:100,height:72,borderRadius:10,overflow:'hidden',position:'relative',border:isActive?`2px solid ${GOLD}`:'2px solid transparent',cursor:'pointer',background:'#1a1614',transition:'border-color 200ms ease,transform 200ms ease',transform:isActive?'scale(1.04)':'scale(1)',scrollSnapAlign:'start',padding:0 }}
            >
              {p?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name??''} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover' }} />
              ) : (<div style={{ position:'absolute',inset:0,background:'#2a2018' }} />)}
              <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)' }} />
              <p style={{ position:'absolute',bottom:5,left:6,right:6,fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.85)',letterSpacing:'0.03em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif",margin:0 }}>{p?.name??'—'}</p>
            </button>
          );
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}div[style*='overflow-x: auto']::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ITINERARIES TAB
═══════════════════════════════════════════════════════════════ */

interface ItinerariesTabProps {
  itineraries: DbItineraryListed[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onDelete: (id: string) => void;
}

function ItinerariesTab({ itineraries, isLoading, error, onRetry, onDelete }: ItinerariesTabProps) {
  const [selected, setSelected] = useState<DbItineraryListed | null>(null);

  if (selected) {
    return (
      <ItineraryDetail
        itin={selected}
        onBack={() => setSelected(null)}
        onDelete={(id) => { onDelete(id); setSelected(null); }}
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding:'24px 16px',display:'flex',flexDirection:'column',gap:10 }}>
        {Array.from({ length: 3 }).map((_,i) => (
          <div key={i} style={{ height:80,borderRadius:14,background:SURFACE,border:`1px solid ${BORDER}`,animation:'pulse 1.6s ease-in-out infinite' }} />
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
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

  if (!itineraries || itineraries.length === 0) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%' }}>
        <div style={{ textAlign:'center',padding:'0 32px',maxWidth:300 }}>
          <div style={{ width:56,height:56,margin:'0 auto 20px',borderRadius:16,background:GOLD_DIM,border:`1px solid rgba(200,150,90,0.2)`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p style={{ color:'rgba(255,255,255,0.75)',fontSize:15,marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}>No itineraries yet</p>
          <p style={{ color:TEXT_FAINT,fontSize:13,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>Plan your first trip and it will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'16px',overflow:'auto',height:'100%',display:'flex',flexDirection:'column',gap:10 }}>
      {itineraries.map((itin) => {
        const isStayLinked = !!itin.stayid;
        const propertyName = itin.stays?.properties?.name;
        const checkin = itin.stays?.checkindate;
        const checkout = itin.stays?.checkoutdate;
        const title = itin.title ?? (propertyName ? `${propertyName}` : 'Untitled itinerary');
        return (
          <button
            key={itin.id}
            onClick={() => setSelected(itin)}
            style={{ width:'100%',textAlign:'left',borderRadius:14,padding:'14px 16px',background:SURFACE,border:`1px solid ${BORDER}`,cursor:'pointer',transition:'background 180ms ease',display:'block' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=SURFACE; }}
          >
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ color:'rgba(255,255,255,0.85)',fontSize:14,fontWeight:500,margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif" }}>{title}</p>
                {checkin && checkout && (
                  <p style={{ color:TEXT_MUTED,fontSize:12,margin:0,fontFamily:"'DM Sans',sans-serif" }}>
                    {formatDate(checkin)} – {formatDate(checkout)}
                  </p>
                )}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                <span style={{ fontSize:10,padding:'3px 8px',borderRadius:999,fontWeight:600,letterSpacing:'0.08em',background:isStayLinked?GOLD_DIM:'rgba(255,255,255,0.06)',color:isStayLinked?GOLD:TEXT_MUTED,fontFamily:"'DM Sans',sans-serif" }}>
                  {isStayLinked?'STAY':'PERSONAL'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ITINERARY DETAIL — timeline + map
═══════════════════════════════════════════════════════════════ */

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

  // Group items by day
  const days = items
    ? Array.from(new Set(items.map(i => i.scheduleddate))).sort()
    : [];
  const [activeDay, setActiveDay] = useState<string | null>(null);

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Fetch items
  useEffect(() => {
    async function load() {
      const token = await getBearerToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/customer/itineraries/${itin.id}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const json = await res.json() as { items: DbItineraryItemEnriched[] };
        setItems(json.items);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [itin.id]);

  // Set initial active day once items arrive
  useEffect(() => {
    if (days.length && !activeDay) setActiveDay(days[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length]);

  // Items visible on active day
  const visibleItems = items?.filter(i => !activeDay || i.scheduleddate === activeDay) ?? [];

  // Init map once we have items
  useEffect(() => {
    if (!items || !items.length || !mapRef.current || mapInstanceRef.current) return;
    const geoItems = items.filter(i => i.places?.latitude && i.places?.longitude);
    if (!geoItems.length) return;

    import('mapbox-gl').then((mapboxgl) => {
      const mb = mapboxgl.default;
      mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

      const bounds = new mb.LngLatBounds();
      geoItems.forEach(i => bounds.extend([i.places!.longitude, i.places!.latitude]));

      const map = new mb.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        bounds,
        fitBoundsOptions: { padding: 40, maxZoom: 14 },
        attributionControl: false,
        logoPosition: 'bottom-right',
      });

      map.on('load', () => {
        setMapReady(true);

        // Route line (connect all items in order)
        const coords = geoItems.map(i => [i.places!.longitude, i.places!.latitude] as [number, number]);
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': GOLD, 'line-width': 2, 'line-dasharray': [2, 3], 'line-opacity': 0.6 },
        });

        // Markers
        geoItems.forEach((item, idx) => {
          const el = document.createElement('div');
          el.style.cssText = `width:26px;height:26px;background:rgba(200,150,90,0.15);border:1.5px solid ${GOLD};border-radius:50%;display:flex;align-items:center;justify-content:center;color:${GOLD};font-size:10px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:default;`;
          el.textContent = String(idx + 1);
          new mb.Marker({ element: el })
            .setLngLat([item.places!.longitude, item.places!.latitude])
            .addTo(map);
          markersRef.current.push({ el, lngLat: [item.places!.longitude, item.places!.latitude] });
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
  }, [items?.length]);

  // Fly map when day changes
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
    if (itin.stayid) return; // safety — stay-linked never shown delete
    setDeleting(true);
    const token = await getBearerToken();
    if (!token) { setDeleting(false); return; }
    await fetch(`/api/customer/itineraries/${itin.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    onDelete(itin.id);
  }

  const propertyName = itin.stays?.properties?.name;
  const checkin = itin.stays?.checkindate;
  const checkout = itin.stays?.checkoutdate;
  const title = itin.title ?? propertyName ?? 'Untitled itinerary';
  const isStayLinked = !!itin.stayid;

  return (
    <div style={{ height:'100%',display:'flex',flexDirection:'column',overflow:'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink:0,padding:'12px 16px',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',gap:12 }}>
        <button onClick={onBack} aria-label="Back"
          style={{ width:34,height:34,borderRadius:10,background:SURFACE,border:`1px solid ${BORDER}`,color:TEXT_MUTED,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'color 180ms ease,border-color 180ms ease' }}
          onMouseEnter={e=>{ e.currentTarget.style.color=TEXT; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.color=TEXT_MUTED; e.currentTarget.style.borderColor=BORDER; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div style={{ flex:1,minWidth:0 }}>
          <h3 style={{ margin:0,fontSize:14,fontWeight:600,color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif" }}>{title}</h3>
          {checkin && checkout && (
            <p style={{ margin:0,fontSize:11,color:TEXT_MUTED,fontFamily:"'DM Sans',sans-serif" }}>
              {formatDate(checkin)} – {formatDate(checkout)}
            </p>
          )}
        </div>
        <span style={{ fontSize:10,padding:'3px 8px',borderRadius:999,fontWeight:600,letterSpacing:'0.08em',background:isStayLinked?GOLD_DIM:SURFACE,color:isStayLinked?GOLD:TEXT_MUTED,fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>
          {isStayLinked?'STAY':'PERSONAL'}
        </span>
        {!isStayLinked && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete itinerary"
            style={{ width:34,height:34,borderRadius:10,background:'transparent',border:`1px solid ${BORDER}`,color:TEXT_MUTED,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'color 180ms ease,border-color 180ms ease,background 180ms ease' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(193,58,58,0.12)'; e.currentTarget.style.color='rgba(220,80,80,0.9)'; e.currentTarget.style.borderColor='rgba(220,80,80,0.3)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=TEXT_MUTED; e.currentTarget.style.borderColor=BORDER; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Map */}
      <div style={{ flexShrink:0,height:'35%',minHeight:160,position:'relative',background:'#0e0c0a' }}>
        <div ref={mapRef} style={{ position:'absolute',inset:0 }} />
        {!mapReady && (
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#0e0c0a' }}>
            <div style={{ width:20,height:20,border:`2px solid rgba(200,150,90,0.25)`,borderTopColor:GOLD,borderRadius:'50%',animation:'spin 700ms linear infinite' }} />
          </div>
        )}
      </div>

      {/* Day pills */}
      {days.length > 1 && (
        <div style={{ flexShrink:0,display:'flex',gap:8,padding:'10px 16px',overflowX:'auto',scrollbarWidth:'none',borderBottom:`1px solid ${BORDER}` }}>
          {days.map((day, idx) => {
            const isActive = day === activeDay;
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                style={{ flexShrink:0,padding:'5px 12px',borderRadius:999,fontSize:11,fontWeight:600,letterSpacing:'0.06em',border:`1px solid ${isActive?GOLD:BORDER}`,background:isActive?GOLD_DIM:'transparent',color:isActive?GOLD:TEXT_MUTED,cursor:'pointer',transition:'all 180ms ease',fontFamily:"'DM Sans',sans-serif" }}
              >
                Day {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div style={{ flex:1,minHeight:0,overflowY:'auto',padding:'16px 16px 24px',scrollbarWidth:'thin',scrollbarColor:`${BORDER} transparent` }}>
        {loading && (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {Array.from({ length: 4 }).map((_,i) => (
              <div key={i} style={{ display:'flex',gap:12,alignItems:'flex-start' }}>
                <div style={{ flexShrink:0,width:26,height:26,borderRadius:'50%',background:SURFACE,animation:'pulse 1.6s ease-in-out infinite' }} />
                <div style={{ flex:1,height:64,borderRadius:12,background:SURFACE,animation:'pulse 1.6s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && visibleItems.length === 0 && (
          <div style={{ textAlign:'center',paddingTop:40 }}>
            <p style={{ color:TEXT_FAINT,fontSize:13,fontFamily:"'DM Sans',sans-serif" }}>No stops planned for this day yet.</p>
          </div>
        )}

        {!loading && visibleItems.length > 0 && (
          <div style={{ position:'relative' }}>
            {/* Vertical line */}
            <div style={{ position:'absolute',left:12,top:13,bottom:13,width:1,background:`linear-gradient(to bottom, ${GOLD}44, ${GOLD}22, transparent)` }} />

            <div style={{ display:'flex',flexDirection:'column',gap:0 }}>
              {visibleItems.map((item, idx) => {
                const place = item.places;
                const name = item.titleoverride ?? item.name ?? place?.name ?? 'Unnamed stop';
                const category = item.category ?? place?.category;
                const image = item.image ?? place?.image_url;
                const time = formatTime(item.starttime);
                const isLast = idx === visibleItems.length - 1;

                return (
                  <div key={item.id} style={{ display:'flex',gap:12,alignItems:'flex-start',paddingBottom:isLast?0:20,position:'relative' }}>
                    {/* Node */}
                    <div style={{ flexShrink:0,width:26,height:26,borderRadius:'50%',background:BG,border:`1.5px solid ${GOLD}`,display:'flex',alignItems:'center',justifyContent:'center',color:GOLD,fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",zIndex:1,marginTop:2 }}>
                      {idx + 1}
                    </div>

                    {/* Card */}
                    <div style={{ flex:1,borderRadius:12,background:SURFACE,border:`1px solid ${BORDER}`,overflow:'hidden',display:'flex',gap:0 }}>
                      {/* Thumbnail */}
                      {image && (
                        <div style={{ flexShrink:0,width:68,position:'relative',background:'#1a1614' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image} alt={name} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover' }} />
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex:1,minWidth:0,padding:'10px 12px' }}>
                        {time && (
                          <p style={{ margin:'0 0 2px',fontSize:10,color:GOLD,fontWeight:600,letterSpacing:'0.08em',fontFamily:"'DM Sans',sans-serif" }}>{time}</p>
                        )}
                        <p style={{ margin:'0 0 2px',fontSize:13,fontWeight:500,color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif" }}>{name}</p>
                        {category && (
                          <p style={{ margin:0,fontSize:11,color:TEXT_MUTED,fontFamily:"'DM Sans',sans-serif" }}>{category}</p>
                        )}
                        {item.notes && (
                          <p style={{ margin:'6px 0 0',fontSize:11,color:TEXT_FAINT,lineHeight:1.5,fontFamily:"'DM Sans',sans-serif",display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{item.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm sheet */}
      {showDeleteConfirm && (
        <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-end',zIndex:100 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div onClick={e => e.stopPropagation()}
            style={{ width:'100%',background:'#181412',borderRadius:'18px 18px 0 0',padding:'24px 20px 32px',border:`1px solid ${BORDER}` }}
          >
            <h4 style={{ margin:'0 0 8px',fontSize:15,fontWeight:600,color:TEXT,fontFamily:"'DM Sans',sans-serif" }}>Delete itinerary?</h4>
            <p style={{ margin:'0 0 20px',fontSize:13,color:TEXT_MUTED,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>This will permanently remove this itinerary and all its stops.</p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ flex:1,height:44,borderRadius:10,background:SURFACE,border:`1px solid ${BORDER}`,color:TEXT_MUTED,fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}
              >Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex:1,height:44,borderRadius:10,background:'rgba(193,58,58,0.15)',border:'1px solid rgba(193,58,58,0.3)',color:deleting?'rgba(255,255,255,0.3)':'rgba(220,80,80,0.9)',fontSize:14,fontWeight:600,cursor:deleting?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif" }}
              >{deleting?'Deleting…':'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </div>
  );
}
