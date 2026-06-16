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
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) router.replace('/guests');
  }, [isLoading, user, router]);

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
      el.style.width = isHighlighted ? '18px' : '10px';
      el.style.height = isHighlighted ? '18px' : '10px';
      el.style.background = isHighlighted ? GOLD : 'rgba(200,150,90,0.45)';
      el.style.borderColor = isHighlighted ? GOLD : 'rgba(200,150,90,0.7)';
      el.style.zIndex = isHighlighted ? '10' : '1';
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
    setSending(true);

    const isItineraryMode = /\b(plan|itinerary|days? in|trip to|schedule|day.by.day|days? of)\b/i.test(userMessage);

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
          mode: isItineraryMode ? 'itinerary' : 'discovery',
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

        if (isItineraryMode) {
          setItineraryText(json.reply);
          setShowItinerary(true);
        }

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
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => void sendMessage(s)} style={{
                      background: 'rgba(253,249,242,0.04)',
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
              <pre style={{
                margin: 0, fontSize: 13, lineHeight: 1.7,
                color: 'rgba(253,249,242,0.75)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {itineraryText}
              </pre>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes aria-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
