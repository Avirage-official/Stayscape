'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Place } from '@/types';
import { getMapboxToken, isMapboxAvailable, MAPBOX_DARK_STYLE, MAPBOX_DARK_STYLE_FALLBACK, MARKER_COLOR_GOLD, MARKER_COLOR_DEFAULT } from '@/lib/mapbox/config';

/* ─── Sample places with real lat/lng coordinates ─── */

const mapPlaces: (Place & { lat: number; lng: number; cx: number; cy: number })[] = [
  {
    id: '1',
    name: 'Nobu Restaurant',
    category: 'Restaurants',
    distance: '0.3 mi',
    rating: 4.8,
    description: 'World-renowned Japanese-Peruvian fusion',
    aiRundown:
      "Nobu is the crown jewel of NYC dining—Chef Nobu Matsuhisa's legendary fusion cuisine awaits. We recommend the black cod with miso and the signature yellowtail jalapeño. Reservations are highly sought after; our concierge has secured priority access for hotel guests.",
    gradient: 'from-amber-900 to-red-900',
    bookingUrl: 'https://www.noburestaurants.com/new-york',
    lat: 40.7614,
    lng: -73.9776,
    cx: 350,
    cy: 270,
  },
  {
    id: '2',
    name: 'The Rooftop Bar',
    category: 'Bars & Drinks',
    distance: '0.1 mi',
    rating: 4.6,
    description: 'Craft cocktails with panoramic city views',
    aiRundown:
      'Just steps from the hotel, The Rooftop Bar offers an unparalleled cocktail experience above the Manhattan skyline. The sommelier-curated champagne selection and the signature "Golden Hour" cocktail are not to be missed. Best enjoyed at sunset.',
    gradient: 'from-blue-900 to-purple-900',
    bookingUrl: 'https://example.com/rooftop-bar',
    lat: 40.7580,
    lng: -73.9712,
    cx: 520,
    cy: 340,
  },
  {
    id: '3',
    name: 'Central Park',
    category: 'Activities',
    distance: '0.5 mi',
    rating: 4.9,
    description: "New York's iconic urban oasis",
    aiRundown:
      "Central Park in December is particularly magical—the Wollman Rink ice skating is in full swing and the holiday atmosphere is serene. We suggest the path along the Mall for the most scenic morning walk. Our concierge can arrange a private carriage ride.",
    gradient: 'from-green-900 to-teal-900',
    bookingUrl: 'https://www.centralparknyc.org',
    lat: 40.7829,
    lng: -73.9654,
    cx: 450,
    cy: 180,
  },
  {
    id: '4',
    name: 'Fifth Avenue Shopping',
    category: 'Shopping',
    distance: '0.2 mi',
    rating: 4.7,
    description: 'Luxury flagship stores and boutiques',
    aiRundown:
      "Fifth Avenue is the pinnacle of luxury retail—from Bergdorf Goodman's impeccable personal shopping service to the flagship stores of the world's finest houses. The hotel's concierge team has personal relationships with the store managers for VIP access.",
    gradient: 'from-pink-900 to-rose-900',
    bookingUrl: 'https://example.com/fifth-avenue',
    lat: 40.7644,
    lng: -73.9732,
    cx: 280,
    cy: 410,
  },
  {
    id: '5',
    name: 'Le Bernardin',
    category: 'Restaurants',
    distance: '0.4 mi',
    rating: 4.9,
    description: 'Three Michelin star French seafood',
    aiRundown:
      "Chef Éric Ripert's three-Michelin-star temple of French seafood is widely considered the finest restaurant in New York. The tasting menu is a transcendent experience—langoustine, halibut, and tuna prepared with extraordinary precision. We have a longstanding relationship with the maitre d'.",
    gradient: 'from-slate-800 to-blue-950',
    bookingUrl: 'https://www.le-bernardin.com',
    lat: 40.7618,
    lng: -73.9815,
    cx: 650,
    cy: 200,
  },
  {
    id: '6',
    name: 'Bemelmans Bar',
    category: 'Bars & Drinks',
    distance: '0.3 mi',
    rating: 4.7,
    description: 'Classic New York cocktail institution',
    aiRundown:
      "Bemelmans Bar at The Carlyle is one of New York's most storied establishments—the Ludwig Bemelmans murals, live jazz piano, and the perfectly mixed Martinis create an atmosphere of effortless Old World glamour. Arrive early evening for the full experience.",
    gradient: 'from-yellow-900 to-orange-900',
    bookingUrl: 'https://www.rosewoodhotels.com/en/the-carlyle-new-york/dining/bemelmans-bar',
    lat: 40.7741,
    lng: -73.9632,
    cx: 560,
    cy: 480,
  },
];

/* ─── Hotel center coordinates ─── */
const HOTEL_CENTER = { lat: 40.7649, lng: -73.9733 };

interface MapPlaceholderProps {
  onSelectPlace?: (place: Place) => void;
  selectedPlaceId?: string | null;
}

/** Apply selected/unselected styles to a marker's inner div */
function applyMarkerStyle(el: HTMLDivElement, isSelected: boolean) {
  el.style.width = isSelected ? '10px' : '8px';
  el.style.height = isSelected ? '10px' : '8px';
  el.style.background = isSelected ? MARKER_COLOR_GOLD : MARKER_COLOR_DEFAULT;
  el.style.border = isSelected ? `1px solid ${MARKER_COLOR_GOLD}` : 'none';
  el.style.boxShadow = isSelected ? '0 0 6px rgba(201,168,76,0.5)' : 'none';
}

export default function MapPlaceholder({ onSelectPlace, selectedPlaceId }: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const initializedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onSelectPlaceRef = useRef(onSelectPlace);
  useEffect(() => { onSelectPlaceRef.current = onSelectPlace; }, [onSelectPlace]);

  const initMap = useCallback((): boolean => {
    if (initializedRef.current || !mapContainerRef.current || !isMapboxAvailable()) return false;

    // Guard against zero-size container
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    initializedRef.current = true;

    const token = getMapboxToken();
    if (!token) {
      console.warn('[Stayscape Map] Mapbox token is empty at runtime');
      return false;
    }

    import('mapbox-gl').then((mapboxgl) => {
      if (!mapContainerRef.current) return;

      mapboxgl.default.accessToken = token;

      let usingFallbackStyle = false;
      let styleLoaded = false;

      const createMap = (styleUrl: string) => {
        const map = new mapboxgl.default.Map({
          container: mapContainerRef.current!,
          style: styleUrl,
          center: [HOTEL_CENTER.lng, HOTEL_CENTER.lat],
          zoom: 14,
          attributionControl: false,
        });

        // Add minimal navigation control
        map.addControl(new mapboxgl.default.NavigationControl({ showCompass: false }), 'bottom-right');

        mapInstanceRef.current = map;

        // Timeout-based fallback: if the style hasn't loaded within 8 s,
        // switch to the guaranteed-public dark-v11 style.
        const styleFallbackTimeout = setTimeout(() => {
          if (!styleLoaded && !usingFallbackStyle) {
            console.warn('[Stayscape Map] Style load timed out, falling back to mapbox/dark-v11');
            usingFallbackStyle = true;
            map.setStyle(MAPBOX_DARK_STYLE_FALLBACK);
          }
        }, 8_000);

        map.on('error', (e) => {
          const msg = e.error?.message ?? String(e.error ?? '');
          console.warn('[Stayscape Map] Map error:', msg);

          // Any error before the first style.load triggers the fallback
          if (!usingFallbackStyle && !styleLoaded) {
            console.warn('[Stayscape Map] Custom style failed, falling back to mapbox/dark-v11');
            usingFallbackStyle = true;
            clearTimeout(styleFallbackTimeout);
            map.setStyle(MAPBOX_DARK_STYLE_FALLBACK);
          }
        });

        map.on('style.load', () => {
          styleLoaded = true;
          clearTimeout(styleFallbackTimeout);

          // Ensure the map resizes to fit its container
          requestAnimationFrame(() => {
            map.resize();
          });

          // Clear any previous markers (e.g. after style fallback reload)
          markersRef.current.forEach((m) => m.remove());
          markersRef.current = [];
          markerElementsRef.current.clear();

          // Add hotel marker
          const hotelEl = document.createElement('div');
          hotelEl.className = 'stayscape-hotel-marker';
          hotelEl.innerHTML = `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;">
              <span style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(201,168,76,0.06);animation:gentlePulse 3s ease-in-out infinite;"></span>
              <span style="position:absolute;width:28px;height:28px;border-radius:50%;border:1px solid rgba(201,168,76,0.15);"></span>
              <span style="position:absolute;width:20px;height:20px;border-radius:50%;border:1px solid rgba(201,168,76,0.25);"></span>
              <div style="width:12px;height:12px;border-radius:50%;background:${MARKER_COLOR_GOLD};box-shadow:0 0 12px rgba(201,168,76,0.5),0 0 4px rgba(201,168,76,0.8);"></div>
            </div>
          `;
          new mapboxgl.default.Marker({ element: hotelEl })
            .setLngLat([HOTEL_CENTER.lng, HOTEL_CENTER.lat])
            .addTo(map);

          // Add place markers
          mapPlaces.forEach((place) => {
            const el = document.createElement('div');
            el.className = 'stayscape-place-marker';
            el.style.cursor = 'pointer';
            el.style.width = '12px';
            el.style.height = '12px';

            // Store inner div reference for later style updates
            const innerDiv = document.createElement('div');
            innerDiv.style.borderRadius = '50%';
            innerDiv.style.transition = 'all 0.2s ease';
            el.appendChild(innerDiv);
            markerElementsRef.current.set(place.id, innerDiv);

            // Apply initial selected state — read from the ref
            // which is kept in sync by the selectedPlaceId effect
            applyMarkerStyle(innerDiv, false);

            el.addEventListener('click', (e) => {
              e.stopPropagation();
              onSelectPlaceRef.current?.(place);
            });

            const marker = new mapboxgl.default.Marker({ element: el })
              .setLngLat([place.lng, place.lat])
              .addTo(map);

            markersRef.current.push(marker);
          });
        });

        return map;
      };

      createMap(MAPBOX_DARK_STYLE);
    }).catch((err) => {
      console.error('[Stayscape Map] Failed to load mapbox-gl:', err);
      initializedRef.current = false;
    });

    return true;
  }, []);

  /* ─── Update marker styles when selectedPlaceId changes ─── */
  useEffect(() => {
    markerElementsRef.current.forEach((innerDiv, placeId) => {
      applyMarkerStyle(innerDiv, selectedPlaceId === placeId);
    });
  }, [selectedPlaceId]);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    const markers = markersRef;
    const markerElements = markerElementsRef;
    const mapInstance = mapInstanceRef;
    const resizeObs = resizeObserverRef;
    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      markerElements.current.clear();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      if (resizeObs.current) {
        resizeObs.current.disconnect();
        resizeObs.current = null;
      }
      initializedRef.current = false;
    };
  }, []);

  /* ─── Ref callback for the container ─── */
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    (mapContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (node) {
      // Try immediately; if the container has zero size, use a
      // ResizeObserver to retry once it gets a non-zero layout.
      if (!initMap()) {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              initMap();
              observer.disconnect();
              resizeObserverRef.current = null;
              break;
            }
          }
        });
        observer.observe(node);
        resizeObserverRef.current = observer;
      }
    }
  }, [initMap]);

  /* ─── Fallback to SVG if Mapbox is not available ─── */
  if (!isMapboxAvailable()) {
    return <MapFallback onSelectPlace={onSelectPlace} selectedPlaceId={selectedPlaceId} />;
  }

  return (
    <div className="relative w-full h-full bg-[var(--map-bg)] overflow-hidden animate-fade-in">
      <div ref={setContainerRef} className="absolute inset-0" />

      {/* Selected place label */}
      {selectedPlaceId && (() => {
        const activePlace = mapPlaces.find((p) => p.id === selectedPlaceId);
        if (!activePlace) return null;
        return (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
            <div className="flex items-center space-x-2 bg-[var(--map-label-bg)] border border-[var(--gold)]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
              <span className="text-[11px] font-medium text-[var(--text-primary)] tracking-[0.03em]">{activePlace.name}</span>
              <span className="text-[9px] text-[var(--text-faint)]">·</span>
              <span className="text-[9px] text-[var(--text-muted)]">{activePlace.distance}</span>
            </div>
          </div>
        );
      })()}

      {/* Map attribution */}
      <div className="absolute bottom-4 left-4 text-[9px] text-[var(--text-dim)] tracking-wide z-10">
        © Stayscape · Mapbox
      </div>
    </div>
  );
}

/* ─── SVG fallback when Mapbox token is not configured ─── */
function MapFallback({ onSelectPlace, selectedPlaceId }: MapPlaceholderProps) {
  return (
    <div className="relative w-full h-full bg-[var(--map-bg)] overflow-hidden animate-fade-in">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(25, 35, 50, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(25, 35, 50, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
        }}
      />

      {/* SVG street map */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {/* Neighborhood blocks */}
        <rect x="105" y="80" width="90" height="65" rx="4" fill="#0D1318" />
        <rect x="210" y="80" width="80" height="65" rx="4" fill="#0C1217" />
        <rect x="310" y="80" width="80" height="65" rx="4" fill="#0D1318" />
        <rect x="410" y="80" width="80" height="65" rx="4" fill="#0C1217" />
        <rect x="510" y="80" width="80" height="65" rx="4" fill="#0D1318" />
        <rect x="610" y="80" width="80" height="65" rx="4" fill="#0C1217" />
        <rect x="710" y="80" width="80" height="65" rx="4" fill="#0D1318" />

        <rect x="105" y="160" width="90" height="55" rx="4" fill="#0C1217" />
        <rect x="210" y="160" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="310" y="160" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="510" y="160" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="610" y="160" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="710" y="160" width="80" height="55" rx="4" fill="#0D1318" />

        {/* Park area */}
        <rect x="410" y="155" width="85" height="65" rx="6" fill="#0C1610" stroke="#13241A" strokeWidth="0.5" />
        <text x="452" y="192" textAnchor="middle" fill="#172E1F" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">CENTRAL PARK</text>

        <rect x="105" y="235" width="90" height="55" rx="4" fill="#0D1318" />
        <rect x="210" y="235" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="310" y="235" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="410" y="235" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="510" y="235" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="610" y="235" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="710" y="235" width="80" height="55" rx="4" fill="#0D1318" />

        <rect x="105" y="310" width="90" height="55" rx="4" fill="#0C1217" />
        <rect x="210" y="310" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="310" y="310" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="410" y="310" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="510" y="310" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="610" y="310" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="710" y="310" width="80" height="55" rx="4" fill="#0C1217" />

        <rect x="105" y="385" width="90" height="55" rx="4" fill="#0D1318" />
        <rect x="210" y="385" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="310" y="385" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="410" y="385" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="510" y="385" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="610" y="385" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="710" y="385" width="80" height="55" rx="4" fill="#0D1318" />

        <rect x="105" y="460" width="90" height="55" rx="4" fill="#0C1217" />
        <rect x="210" y="460" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="310" y="460" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="410" y="460" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="510" y="460" width="80" height="55" rx="4" fill="#0C1217" />
        <rect x="610" y="460" width="80" height="55" rx="4" fill="#0D1318" />
        <rect x="710" y="460" width="80" height="55" rx="4" fill="#0C1217" />

        {/* Main avenues */}
        <line x1="200" y1="0" x2="200" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#141E2C" strokeWidth="8" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="100" y1="0" x2="100" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="500" y1="0" x2="500" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="700" y1="0" x2="700" y2="600" stroke="#101822" strokeWidth="2.5" />

        {/* Cross streets */}
        <line x1="0" y1="150" x2="800" y2="150" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#141E2C" strokeWidth="8" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="75" x2="800" y2="75" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="225" x2="800" y2="225" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="375" x2="800" y2="375" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="525" x2="800" y2="525" stroke="#101822" strokeWidth="2.5" />

        {/* Street labels */}
        <text x="400" y="296" textAnchor="middle" fill="#182535" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="0.18em">5TH AVENUE</text>
        <text x="197" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 197, 260)">MADISON AVE</text>
        <text x="597" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 597, 260)">PARK AVE</text>
        <text x="750" y="296" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 57TH ST</text>
        <text x="50" y="148" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">W 59TH ST</text>
        <text x="750" y="448" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 55TH ST</text>

        {/* Clickable place markers */}
        {mapPlaces.map((place) => {
          const isSelected = selectedPlaceId === place.id;
          return (
            <g
              key={place.id}
              onClick={() => onSelectPlace?.(place)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlace?.(place);
                }
              }}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Select ${place.name}`}
            >
              {/* Hover/hit area */}
              <circle cx={place.cx} cy={place.cy} r="14" fill="transparent" />
              {/* Outer glow for selected */}
              {isSelected && (
                <>
                  <circle cx={place.cx} cy={place.cy} r="12" fill="#C9A84C" opacity="0.06" className="animate-gentle-pulse" />
                  <circle cx={place.cx} cy={place.cy} r="7" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.25" />
                </>
              )}
              {/* Marker dot */}
              <circle
                cx={place.cx}
                cy={place.cy}
                r={isSelected ? '4' : '3'}
                fill={isSelected ? '#C9A84C' : '#1A2535'}
                stroke={isSelected ? '#C9A84C' : 'none'}
                strokeWidth="1"
                style={isSelected ? { filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.5))' } : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* Edge gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-30 pointer-events-none" />

      {/* Selected place label */}
      {selectedPlaceId && (() => {
        const activePlace = mapPlaces.find((p) => p.id === selectedPlaceId);
        if (!activePlace) return null;
        return (
          <div
            className="absolute whitespace-nowrap pointer-events-none"
            style={{
              left: `${(activePlace.cx / 800) * 100}%`,
              top: `${(activePlace.cy / 600) * 100}%`,
              transform: 'translate(-50%, 16px)',
            }}
          >
            <div className="flex items-center space-x-2 bg-[var(--map-label-bg)] border border-[var(--gold)]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
              <span className="text-[11px] font-medium text-[var(--text-primary)] tracking-[0.03em]">{activePlace.name}</span>
              <span className="text-[9px] text-[var(--text-faint)]">·</span>
              <span className="text-[9px] text-[var(--text-muted)]">{activePlace.distance}</span>
            </div>
          </div>
        );
      })()}

      {/* Hotel marker — always visible when no place selected */}
      {!selectedPlaceId && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-12 w-12 rounded-full bg-[var(--gold)]/6 animate-gentle-pulse" />
              <span className="absolute inline-flex h-7 w-7 rounded-full border border-[var(--gold)]/15" />
              <span className="absolute inline-flex h-5 w-5 rounded-full border border-[var(--gold)]/25" />
              <div className="relative w-3 h-3 rounded-full bg-[var(--gold)] shadow-[0_0_12px_rgba(201,168,76,0.5),0_0_4px_rgba(201,168,76,0.8)]" />
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-8 whitespace-nowrap">
            <div className="flex items-center space-x-2 bg-[var(--map-label-bg)] border border-[var(--gold)]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
              <span className="text-[11px] font-medium text-[var(--text-primary)] tracking-[0.03em]">The Grand Palace Hotel</span>
              <span className="text-[9px] text-[var(--text-faint)]">·</span>
              <span className="text-[9px] text-[var(--text-muted)]">0.2 mi</span>
            </div>
          </div>
        </>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-1">
        <button className="w-8 h-8 bg-[var(--map-zoom-bg)] border border-[var(--map-zoom-border)] rounded-[5px] text-[var(--text-secondary)] hover:border-[var(--gold)]/30 hover:text-[var(--gold)] transition-all duration-200 flex items-center justify-center text-sm shadow-soft">+</button>
        <button className="w-8 h-8 bg-[var(--map-zoom-bg)] border border-[var(--map-zoom-border)] rounded-[5px] text-[var(--text-secondary)] hover:border-[var(--gold)]/30 hover:text-[var(--gold)] transition-all duration-200 flex items-center justify-center text-sm shadow-soft">−</button>
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-4 left-4 text-[9px] text-[var(--text-dim)] tracking-wide">
        © Stayscape Maps
      </div>
    </div>
  );
}
