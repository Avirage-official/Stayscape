'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300', '400', '600'], style: ['normal', 'italic'], display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap',
});

const GOLD = '#C8965A';
const EXPLORE_REGION_KEY = 'stayscape_explore_region';

interface Message { role: 'user' | 'assistant'; text: string; }
interface Place {
  id: string; name: string; category: string;
  latitude: number; longitude: number;
  rating: number | null; image_url: string | null;
}
interface PickerRegion {
  id: string; name: string; country_code: string | null;
}
type Duration = '2-3' | '4-5' | '7' | '14';
type Vibe = 'relaxed' | 'adventure' | 'food_culture' | 'mixed';
type Companions = 'solo' | 'couple' | 'family' | 'friends';

interface BuilderState {
  active: boolean;
  step: 1 | 2 | 3 | 4;
  generating: boolean;
  regionId?: string;
  regionName?: string;
  duration?: Duration;
  vibe?: Vibe;
  companions?: Companions;
}

interface ItineraryDataItem {
  place_id: string; name: string; category: string; image: string | null;
  start_time: string; duration_hours: number; notes: string;
}
interface ItineraryDataDay {
  day: number; date: string; items: ItineraryDataItem[];
}
interface ItineraryData {
  itineraryId: string; title: string; startdate: string; enddate: string;
  days: ItineraryDataDay[];
}

const DURATION_OPTIONS: Array<{ label: string; value: Duration }> = [
  { label: '2-3 days', value: '2-3' },
  { label: '4-5 days', value: '4-5' },
  { label: '1 week', value: '7' },
  { label: '2 weeks', value: '14' },
];
const VIBE_OPTIONS: Array<{ label: string; value: Vibe }> = [
  { label: 'Relaxed & slow', value: 'relaxed' },
  { label: 'Adventure packed', value: 'adventure' },
  { label: 'Food & culture', value: 'food_culture' },
  { label: 'Mix of everything', value: 'mixed' },
];
const COMPANIONS_OPTIONS: Array<{ label: string; value: Companions }> = [
  { label: 'Solo', value: 'solo' },
  { label: 'Couple', value: 'couple' },
  { label: 'Family', value: 'family' },
  { label: 'Friends', value: 'friends' },
];

function formatDateNice(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const SUGGESTIONS = [
  'What are the best restaurants nearby?',
  'Plan me 3 days of sightseeing',
  'Hidden gems only locals know',
  'Best coffee spots in the area',
];

async function getBearerToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function AriaPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [showItinerary, setShowItinerary] = useState(false);
  const [itineraryText, setItineraryText] = useState('');
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [builderState, setBuilderState] = useState<BuilderState | null>(null);
  const [pickerRegions, setPickerRegions] = useState<PickerRegion[]>([]);
  const [pickerRegionInput, setPickerRegionInput] = useState('');
  const [pickerRegionWarning, setPickerRegionWarning] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const popupRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Stable callback ref so marker click handlers can reach React state
  const onPinClickRef = useRef<(place: Place) => void>(() => {});

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) router.replace('/guests');
  }, [isLoading, user, router]);

  // Keep pin-click callback up to date with current React state setters
  useEffect(() => {
    onPinClickRef.current = (place: Place) => {
      setInput(`Tell me about ${place.name}`);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
  }, []);

  // Expose global so popup button HTML can reach React setInput
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__ariaAskPlace = (name: string) => {
      setInput(`Tell me about ${name}`);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__ariaAskPlace;
    };
  }, []);

  // Load region + credits
  useEffect(() => {
    if (!user) return;
    const rid = typeof window !== 'undefined' ? localStorage.getItem(EXPLORE_REGION_KEY) : null;
    setRegionId(rid);

    async function checkCredits() {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data } = await supabase
        .from('users')
        .select('aria_credits')
        .eq('id', user!.id)
        .single<{ aria_credits: number }>();
      if (data) {
        setCredits(data.aria_credits);
        setLocked(data.aria_credits === 0);
      }
    }
    void checkCredits();
  }, [user]);

  // Load active regions for the itinerary picker
  useEffect(() => {
    if (!user) return;
    async function loadRegions() {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data } = await supabase
        .from('regions')
        .select('id, name, country_code')
        .eq('is_active', true)
        .order('name');
      if (data) setPickerRegions(data as PickerRegion[]);
    }
    void loadRegions();
  }, [user]);

  // Load places for map
  useEffect(() => {
    if (!regionId) return;
    async function loadPlaces() {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data } = await supabase
        .from('places')
        .select('id, name, category, latitude, longitude, rating, image_url')
        .eq('region_id', regionId!)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .limit(50);
      if (data) setPlaces(data as Place[]);
    }
    void loadPlaces();
  }, [regionId]);

  // Build Mapbox map
  useEffect(() => {
    if (!mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    import('mapbox-gl').then((mapboxgl) => {
      if (!mapRef.current) return;
      const mb = mapboxgl.default;
      mb.accessToken = token;

      const validPlaces = places.filter(p => p.latitude && p.longitude);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = {
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        attributionControl: false,
        logoPosition: 'bottom-right',
      };

      if (validPlaces.length > 0) {
        const bounds = new mb.LngLatBounds();
        validPlaces.forEach(p => bounds.extend([p.longitude, p.latitude]));
        opts.bounds = bounds;
        opts.fitBoundsOptions = { padding: 40, maxZoom: 13 };
      } else {
        opts.center = [103.8198, 1.3521];
        opts.zoom = 3;
      }

      map = new mb.Map(opts);
      mapInstanceRef.current = map;

      map.on('load', () => {
        setMapLoaded(true);
        validPlaces.forEach(p => {
          const el = document.createElement('div');
          el.dataset.placeId = p.id;
          el.style.cssText = `
            width: 10px; height: 10px;
            background: rgba(200,150,90,0.45);
            border: 1.5px solid rgba(200,150,90,0.7);
            border-radius: 50%;
            cursor: pointer;
            transition: all 220ms ease;
          `;

          el.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close existing popup
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (popupRef.current) (popupRef.current as any).remove();

            const stars = p.rating ? '★'.repeat(Math.round(p.rating)) : '';
            const ratingLabel = p.rating ? `${p.rating.toFixed(1)} ${stars}` : '';

            const popupHtml = `
              <div style="
                background:#16100A;border:1px solid rgba(200,150,90,0.22);
                border-radius:14px;padding:0;overflow:hidden;
                min-width:200px;max-width:240px;
                box-shadow:0 8px 32px rgba(0,0,0,0.55);
              ">
                ${p.image_url ? `<div style="width:100%;height:110px;background:url('${p.image_url}') center/cover no-repeat;"></div>` : `<div style="width:100%;height:60px;background:rgba(200,150,90,0.08);display:flex;align-items:center;justify-content:center;font-size:22px;">✦</div>`}
                <div style="padding:12px 14px 14px;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#FAF8F5;font-family:'DM Sans',sans-serif;line-height:1.3;">${p.name}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:rgba(253,249,242,0.45);font-family:'DM Sans',sans-serif;">${p.category}${ratingLabel ? ` · ${ratingLabel}` : ''}</p>
                  <button
                    onclick="window.__ariaAskPlace && window.__ariaAskPlace('${p.name.replace(/'/g, "\\'")}')"
                    style="
                      margin-top:10px;width:100%;padding:8px 0;
                      background:rgba(200,150,90,0.15);
                      border:1px solid rgba(200,150,90,0.28);
                      border-radius:8px;color:#C8965A;
                      font-size:12px;font-weight:600;
                      cursor:pointer;font-family:'DM Sans',sans-serif;
                      letter-spacing:0.04em;
                    "
                  >Ask Aria about this →</button>
                </div>
              </div>`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const popup = new mb.Popup({
              closeButton: false,
              closeOnClick: true,
              offset: 14,
              className: 'aria-map-popup',
              maxWidth: 'none',
            })
              .setLngLat([p.longitude, p.latitude])
              .setHTML(popupHtml)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .addTo(map as any);

            popupRef.current = popup;
            onPinClickRef.current(p);
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const marker = new mb.Marker({ element: el }).setLngLat([p.longitude, p.latitude]).addTo(map as any);
          markersRef.current.push(marker);
        });
      });
    }).catch(console.error);

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
        setMapLoaded(false);
      }
    };
  }, [places]);

  // Update marker highlights
  useEffect(() => {
    markersRef.current.forEach(marker => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = marker as any;
      const el = m.getElement() as HTMLDivElement;
      const placeId = el.dataset.placeId;
      const isHighlighted = placeId ? highlightedIds.has(placeId) : false;
      const wasHighlighted = el.dataset.highlighted === '1';
      el.style.width = isHighlighted ? '18px' : '10px';
      el.style.height = isHighlighted ? '18px' : '10px';
      el.style.background = isHighlighted ? GOLD : 'rgba(200,150,90,0.45)';
      el.style.borderColor = isHighlighted ? GOLD : 'rgba(200,150,90,0.7)';
      el.style.zIndex = isHighlighted ? '10' : '1';
      if (isHighlighted && !wasHighlighted) {
        el.style.animation = 'none';
        // Force reflow so removing 'none' restarts the animation
        void el.offsetWidth;
        el.style.animation = 'map-pin-pop 480ms cubic-bezier(0.34,1.56,0.64,1) both';
      } else if (!isHighlighted) {
        el.style.animation = 'none';
      }
      el.dataset.highlighted = isHighlighted ? '1' : '0';
    });
  }, [highlightedIds]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || sending || locked) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    const isItineraryMode = /\b(create|build|make|plan me|plan a|plan my|generate)\b.*\b(itinerary|trip|days?)\b|\b\d+[\s-]day\s+(trip|itinerary|plan)\b/i.test(userMessage);

    if (isItineraryMode) {
      // Kick off the structured 4-question picker flow instead of free chat.
      setMessages(prev => [...prev, { role: 'assistant', text: "Let's plan your trip! A few quick questions:" }]);
      setPickerRegionInput('');
      setPickerRegionWarning('');
      setBuilderState({ active: true, step: 1, generating: false });
      return;
    }

    setSending(true);

    try {
      const token = await getBearerToken();
      if (!token) return;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: userMessage,
          stayId: null,
          regionId,
          mode: 'discovery',
          history: messages,
        }),
      });

      const json = await res.json() as { reply?: string; error?: string };

      if (res.status === 403) {
        setLocked(true);
        setCredits(0);
        return;
      }

      if (json.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: json.reply! }]);

        // Match place names → highlight on map
        const lower = json.reply.toLowerCase();
        const matched = new Set<string>();
        places.forEach(p => {
          if (lower.includes(p.name.toLowerCase())) matched.add(p.id);
        });
        if (matched.size > 0) setHighlightedIds(matched);

        if (credits !== null && credits > 0) {
          setCredits(c => (c !== null ? Math.max(0, c - 1) : null));
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setSending(false);
    }
  }, [input, sending, locked, messages, regionId, places, credits]);

  /* ── Itinerary builder picker flow ── */

  const runItineraryGeneration = useCallback(async (final: BuilderState) => {
    setBuilderState(prev => prev ? { ...prev, generating: true } : prev);
    try {
      const token = await getBearerToken();
      if (!token) {
        setBuilderState(null);
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't put that together. Want to try again?" }]);
        return;
      }

      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          regionId: final.regionId,
          duration: final.duration,
          vibe: final.vibe,
          companions: final.companions,
        }),
      });

      if (res.status === 403) {
        setBuilderState(null);
        setLocked(true);
        setCredits(0);
        return;
      }

      if (!res.ok) {
        setBuilderState(null);
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't put that together. Want to try again?" }]);
        return;
      }

      const data = await res.json() as ItineraryData;

      const days = data.days.length;
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Done! I've planned your ${days}-day trip to ${final.regionName ?? 'your destination'}.`,
      }]);
      setItineraryData(data);
      setShowItinerary(true);
      setBuilderState(null);

      if (credits !== null && credits > 0) {
        setCredits(c => (c !== null ? Math.max(0, c - 1) : null));
      }
    } catch {
      setBuilderState(null);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't put that together. Want to try again?" }]);
    }
  }, [credits]);

  const pickerSelectRegion = useCallback((region: PickerRegion) => {
    setPickerRegionWarning('');
    setBuilderState(prev => prev ? { ...prev, step: 2, regionId: region.id, regionName: region.name } : prev);
  }, []);

  const pickerSubmitRegionText = useCallback(() => {
    const typed = pickerRegionInput.trim();
    if (!typed) return;
    const match = pickerRegions.find(r => r.name.toLowerCase() === typed.toLowerCase());
    if (!match) {
      setPickerRegionWarning("We don't have that destination yet — pick from the list above");
      return;
    }
    pickerSelectRegion(match);
  }, [pickerRegionInput, pickerRegions, pickerSelectRegion]);

  const pickerSelectDuration = useCallback((value: Duration) => {
    setBuilderState(prev => prev ? { ...prev, step: 3, duration: value } : prev);
  }, []);

  const pickerSelectVibe = useCallback((value: Vibe) => {
    setBuilderState(prev => prev ? { ...prev, step: 4, vibe: value } : prev);
  }, []);

  const pickerSelectCompanions = useCallback((value: Companions) => {
    setBuilderState(prev => {
      if (!prev) return prev;
      const final = { ...prev, companions: value };
      void runItineraryGeneration(final);
      return final;
    });
  }, [runItineraryGeneration]);

  const cancelBuilder = useCallback(() => {
    setBuilderState(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }, [sendMessage]);

  if (isLoading) return <GuestArrivalSkeleton />;
  if (!user) return null;

  return (
    <div className={dmSans.className} style={{ minHeight: '100dvh', background: 'var(--background, #0A0806)', position: 'relative' }}>

      <style>{`
        .aria-shell {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }
        .aria-map {
          height: 280px;
          position: relative;
          order: 2;
        }
        .aria-chat-panel {
          order: 1;
          display: flex;
          flex-direction: column;
          height: calc(100dvh - 280px - 64px);
          min-height: 400px;
        }
        .aria-itinerary-panel {
          order: 3;
          display: none;
        }
        .aria-itinerary-panel.visible {
          display: block;
          animation: aria-panel-up 420ms cubic-bezier(0.34,1.18,0.64,1) both;
        }
        @keyframes aria-panel-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 900px) {
          .aria-shell {
            flex-direction: row;
            height: 100dvh;
            overflow: hidden;
          }
          .aria-chat-panel {
            order: 1;
            width: 420px;
            flex-shrink: 0;
            height: 100dvh;
            border-right: 1px solid rgba(253,249,242,0.08);
          }
          .aria-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-width: 0;
          }
          .aria-map {
            flex: 1;
            height: auto;
            order: unset;
          }
          .aria-itinerary-panel {
            order: unset;
            height: 300px;
            flex-shrink: 0;
            border-top: 1px solid rgba(253,249,242,0.08);
          }
          .aria-itinerary-panel.visible {
            display: flex;
            flex-direction: column;
            animation: aria-panel-up 420ms cubic-bezier(0.34,1.18,0.64,1) both;
          }
        }
      `}</style>

      {/* ── Locked overlay ── */}
      {locked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,8,6,0.92)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 32, textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(200,150,90,0.10)',
            border: '1px solid rgba(200,150,90,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 8,
          }}>
            ✦
          </div>
          <p className={cormorant.className} style={{
            margin: 0, fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: '#FAF8F5',
          }}>
            Unlock Aria
          </p>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(253,249,242,0.50)', maxWidth: 280, lineHeight: 1.6 }}>
            You&apos;ve used your free messages. Unlock Aria to get unlimited access to your personal AI travel concierge.
          </p>
          <button
            onClick={() => router.push('/dashboard/profile')}
            style={{
              marginTop: 8, padding: '14px 32px',
              background: GOLD, border: 'none', borderRadius: 999,
              color: '#0A0806', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            Unlock for $9.99
          </button>
        </div>
      )}

      <div className="aria-shell">
        {/* ── Left: Chat panel ── */}
        <div className="aria-chat-panel" style={{ background: 'rgba(10,8,6,0.98)' }}>

          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(253,249,242,0.08)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(200,150,90,0.12)',
                border: '1px solid rgba(200,150,90,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: GOLD, fontSize: 15,
              }}>✦</div>
              <div>
                <p className={cormorant.className} style={{
                  margin: 0, fontSize: 18, fontWeight: 400, color: '#FAF8F5', lineHeight: 1,
                }}>Aria</p>
                <p style={{
                  margin: '2px 0 0', fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'rgba(253,249,242,0.38)',
                }}>Personal travel concierge</p>
              </div>
              {credits !== null && credits !== -1 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 10, fontWeight: 600,
                  color: credits <= 1 ? 'rgba(220,80,60,0.8)' : 'rgba(253,249,242,0.35)',
                  letterSpacing: '0.08em',
                }}>
                  {credits} {credits === 1 ? 'message' : 'messages'} left
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px 20px 0',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {messages.length === 0 && (
              <div style={{ paddingTop: 24 }}>
                <p className={cormorant.className} style={{
                  fontSize: 22, fontStyle: 'italic', fontWeight: 300,
                  color: 'rgba(253,249,242,0.45)', margin: '0 0 20px',
                }}>
                  Where to next?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {SUGGESTIONS.map((s, si) => (
                    <button key={s} onClick={() => void sendMessage(s)} style={{
                      background: 'rgba(253,249,242,0.04)',
                      animation: `aria-suggest-in 380ms cubic-bezier(0.22,1,0.36,1) ${80 + si * 60}ms both`,
                      border: '1px solid rgba(253,249,242,0.09)',
                      borderRadius: 12, padding: '10px 14px',
                      color: 'rgba(253,249,242,0.60)', fontSize: 13, fontWeight: 400,
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background 150ms ease, border-color 150ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(200,150,90,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(200,150,90,0.20)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(253,249,242,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(253,249,242,0.09)';
                    }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'aria-msg-in 320ms cubic-bezier(0.34,1.3,0.64,1) both',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    background: 'rgba(200,150,90,0.12)',
                    border: '1px solid rgba(200,150,90,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: GOLD, fontSize: 11, marginRight: 10, marginTop: 2,
                  }}>✦</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user'
                    ? 'rgba(200,150,90,0.12)'
                    : 'rgba(253,249,242,0.05)',
                  border: msg.role === 'user'
                    ? '1px solid rgba(200,150,90,0.22)'
                    : '1px solid rgba(253,249,242,0.08)',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '10px 14px',
                  fontSize: 14, lineHeight: 1.6,
                  color: msg.role === 'user' ? 'rgba(253,249,242,0.88)' : '#FAF8F5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {sending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: 'rgba(200,150,90,0.12)',
                  border: '1px solid rgba(200,150,90,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: GOLD, fontSize: 11,
                }}>✦</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'rgba(200,150,90,0.5)',
                      animation: `aria-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Itinerary builder picker */}
          {builderState?.active && (
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(253,249,242,0.08)',
              flexShrink: 0,
              maxHeight: '50vh',
              overflowY: 'auto',
            }}>
              {builderState.generating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 7,
                    background: 'rgba(200,150,90,0.12)',
                    border: '1px solid rgba(200,150,90,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: GOLD, fontSize: 11,
                  }}>✦</div>
                  <p className={cormorant.className} style={{
                    margin: 0, fontSize: 15, fontStyle: 'italic', color: 'rgba(253,249,242,0.6)',
                  }}>Curating your trip…</p>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'rgba(200,150,90,0.5)',
                        animation: `aria-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p style={{
                      margin: 0, fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: 'rgba(253,249,242,0.4)',
                    }}>
                      Step {builderState.step} of 4
                    </p>
                    <button onClick={cancelBuilder} style={{
                      background: 'none', border: 'none', padding: 2, cursor: 'pointer',
                      color: 'rgba(253,249,242,0.3)', fontSize: 11,
                    }}>Cancel</button>
                  </div>

                  {builderState.step === 1 && (
                    <div>
                      <p className={cormorant.className} style={{
                        margin: '0 0 12px', fontSize: 18, fontStyle: 'italic', color: '#FAF8F5',
                      }}>Where to?</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {pickerRegions.map(r => (
                          <button key={r.id} onClick={() => pickerSelectRegion(r)} style={{
                            background: 'rgba(253,249,242,0.04)',
                            border: '1px solid rgba(253,249,242,0.09)',
                            borderRadius: 999, padding: '8px 14px',
                            color: 'rgba(253,249,242,0.75)', fontSize: 13,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(200,150,90,0.10)';
                            e.currentTarget.style.borderColor = 'rgba(200,150,90,0.25)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(253,249,242,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(253,249,242,0.09)';
                          }}
                          >{r.name}{r.country_code ? `, ${r.country_code}` : ''}</button>
                        ))}
                      </div>
                      <input
                        value={pickerRegionInput}
                        onChange={e => { setPickerRegionInput(e.target.value); setPickerRegionWarning(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); pickerSubmitRegionText(); } }}
                        placeholder="Or type a destination…"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(253,249,242,0.05)',
                          border: '1px solid rgba(253,249,242,0.12)',
                          borderRadius: 10, padding: '10px 12px',
                          color: '#FAF8F5', fontSize: 13, outline: 'none',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      />
                      {pickerRegionWarning && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(220,80,60,0.85)' }}>
                          {pickerRegionWarning}
                        </p>
                      )}
                    </div>
                  )}

                  {builderState.step === 2 && (
                    <div>
                      <p className={cormorant.className} style={{
                        margin: '0 0 12px', fontSize: 18, fontStyle: 'italic', color: '#FAF8F5',
                      }}>How long?</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {DURATION_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => pickerSelectDuration(opt.value)} style={{
                            background: 'rgba(253,249,242,0.04)',
                            border: '1px solid rgba(253,249,242,0.09)',
                            borderRadius: 999, padding: '8px 14px',
                            color: 'rgba(253,249,242,0.75)', fontSize: 13,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(200,150,90,0.10)';
                            e.currentTarget.style.borderColor = 'rgba(200,150,90,0.25)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(253,249,242,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(253,249,242,0.09)';
                          }}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {builderState.step === 3 && (
                    <div>
                      <p className={cormorant.className} style={{
                        margin: '0 0 12px', fontSize: 18, fontStyle: 'italic', color: '#FAF8F5',
                      }}>What&apos;s the vibe?</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {VIBE_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => pickerSelectVibe(opt.value)} style={{
                            background: 'rgba(253,249,242,0.04)',
                            border: '1px solid rgba(253,249,242,0.09)',
                            borderRadius: 999, padding: '8px 14px',
                            color: 'rgba(253,249,242,0.75)', fontSize: 13,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(200,150,90,0.10)';
                            e.currentTarget.style.borderColor = 'rgba(200,150,90,0.25)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(253,249,242,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(253,249,242,0.09)';
                          }}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {builderState.step === 4 && (
                    <div>
                      <p className={cormorant.className} style={{
                        margin: '0 0 12px', fontSize: 18, fontStyle: 'italic', color: '#FAF8F5',
                      }}>Travelling with?</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {COMPANIONS_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => pickerSelectCompanions(opt.value)} style={{
                            background: 'rgba(253,249,242,0.04)',
                            border: '1px solid rgba(253,249,242,0.09)',
                            borderRadius: 999, padding: '8px 14px',
                            color: 'rgba(253,249,242,0.75)', fontSize: 13,
                            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(200,150,90,0.10)';
                            e.currentTarget.style.borderColor = 'rgba(200,150,90,0.25)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(253,249,242,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(253,249,242,0.09)';
                          }}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(253,249,242,0.08)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-end',
              background: 'rgba(253,249,242,0.05)',
              border: '1px solid rgba(253,249,242,0.12)',
              borderRadius: 16, padding: '12px 14px',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Aria anything…"
                disabled={sending || locked}
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#FAF8F5', fontSize: 14, lineHeight: 1.5,
                  resize: 'none', fontFamily: 'DM Sans, sans-serif',
                  maxHeight: 120, overflowY: 'auto',
                }}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || sending || locked}
                style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: input.trim() && !sending && !locked ? GOLD : 'rgba(253,249,242,0.08)',
                  border: 'none', cursor: input.trim() && !sending && !locked ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 200ms ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={input.trim() && !sending && !locked ? '#0A0806' : 'rgba(253,249,242,0.28)'}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
            <p style={{
              margin: '8px 0 0', fontSize: 10, color: 'rgba(253,249,242,0.22)',
              textAlign: 'center', letterSpacing: '0.04em',
            }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* ── Right side (desktop only wrapper) ── */}
        <div className="aria-right" style={{ display: 'contents' }}>

          {/* Map */}
          <div className="aria-map" style={{ position: 'relative', background: '#0d0d0d' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            {!mapLoaded && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,8,6,0.6)',
              }}>
                <p style={{ fontSize: 12, color: 'rgba(253,249,242,0.35)', letterSpacing: '0.08em' }}>
                  {regionId ? 'Loading map…' : 'Select a region in Explore to see it on the map'}
                </p>
              </div>
            )}
            {regionId && places.length > 0 && (
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                background: 'rgba(10,8,6,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(253,249,242,0.10)',
                borderRadius: 10, padding: '6px 12px',
                fontSize: 11, color: 'rgba(253,249,242,0.45)',
              }}>
                {places.length} places · {highlightedIds.size > 0 ? `${highlightedIds.size} mentioned by Aria` : 'Ask Aria to highlight spots'}
              </div>
            )}
          </div>

          {/* Itinerary panel */}
          <div className={`aria-itinerary-panel${showItinerary ? ' visible' : ''}`}
            style={{ background: 'rgba(10,8,6,0.98)', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(253,249,242,0.08)',
              flexShrink: 0,
            }}>
              <p style={{
                margin: 0, fontSize: 10, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(253,249,242,0.45)',
              }}>
                Itinerary from Aria
              </p>
              <button onClick={() => setShowItinerary(false)} style={{
                background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                color: 'rgba(253,249,242,0.35)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {itineraryData ? (
                <div>
                  <p className={cormorant.className} style={{
                    margin: '0 0 4px', fontSize: 20, fontStyle: 'italic', fontWeight: 400, color: '#FAF8F5',
                  }}>{itineraryData.title}</p>
                  <p style={{ margin: '0 0 18px', fontSize: 12, color: 'rgba(253,249,242,0.4)' }}>
                    {formatDateNice(itineraryData.startdate)} — {formatDateNice(itineraryData.enddate)}
                  </p>

                  {itineraryData.days.map(day => (
                    <div key={day.day} style={{ marginBottom: 20 }}>
                      <p style={{
                        margin: '0 0 10px', fontSize: 11, fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: GOLD,
                      }}>
                        Day {day.day} — {formatDateNice(day.date)}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {day.items.map((item, idx) => (
                          <div key={idx} style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            background: 'rgba(253,249,242,0.05)',
                            border: '1px solid rgba(253,249,242,0.08)',
                            borderRadius: 16, padding: '10px 12px',
                          }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                              background: item.image ? `url(${item.image}) center/cover` : 'rgba(200,150,90,0.12)',
                              border: '1px solid rgba(253,249,242,0.08)',
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#FAF8F5' }}>{item.name}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(253,249,242,0.4)' }}>
                                {item.category} · {item.start_time} · {item.duration_hours}h
                              </p>
                              {item.notes && (
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(253,249,242,0.6)', lineHeight: 1.5 }}>
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button onClick={() => router.push('/dashboard/planner')} style={{
                    width: '100%', marginTop: 8,
                    background: 'rgba(200,150,90,0.12)',
                    border: '1px solid rgba(200,150,90,0.25)',
                    borderRadius: 12, padding: '12px 16px',
                    color: GOLD, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>
                    Open in Planner →
                  </button>
                </div>
              ) : (
                <pre style={{
                  margin: 0, fontSize: 13, lineHeight: 1.7,
                  color: 'rgba(253,249,242,0.75)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {itineraryText}
                </pre>
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes aria-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes aria-msg-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes aria-suggest-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes map-pin-pop {
          0%   { transform: scale(0.4); opacity: 0.3; }
          55%  { transform: scale(1.45); opacity: 1; }
          80%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        /* Strip Mapbox popup chrome — we supply our own styled HTML */
        .aria-map-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .aria-map-popup .mapboxgl-popup-tip {
          border-top-color: rgba(200,150,90,0.22) !important;
        }
      `}</style>
    </div>
  );
}
