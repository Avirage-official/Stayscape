'use client';

import type mapboxgl from 'mapbox-gl';
import { useRef, useCallback, useEffect, useState } from 'react';
import { Place } from '@/types';
import {
  getMapboxToken,
  isMapboxAvailable,
  MAPBOX_DARK_STYLE,
  MAPBOX_DARK_STYLE_FALLBACK,
  MARKER_COLOR_GOLD,
  CATEGORY_COLORS,
  GEOLOCATION_ZOOM,
  GEOLOCATION_FLY_DURATION,
  GEOLOCATION_RECENTER_DURATION,
  GEOLOCATION_RECENTER_THRESHOLD,
} from '@/lib/mapbox/config';
import { getDistanceFromHotel } from '@/lib/mapbox/directions';
import MapSearch from '@/components/MapSearch';
import MapRoute from '@/components/MapRoute';
import type { SearchResult } from '@/types/mapbox';

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

/* ─── Category filter options ─── */
const CATEGORIES = ['All', 'Restaurants', 'Bars & Drinks', 'Activities', 'Shopping'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_ICONS: Record<string, string> = {
  All: '🗺️',
  Restaurants: '🍽️',
  'Bars & Drinks': '🍸',
  Activities: '🏃',
  Shopping: '🛍️',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#6B7280';
}

interface MarkerData {
  container: HTMLDivElement;
  inner: HTMLDivElement;
  ring: HTMLDivElement;
  category: string;
  color: string;
}

/** Apply selected/unselected styles to a marker */
function applyMarkerStyle(data: MarkerData, isSelected: boolean) {
  const { inner, ring, color } = data;
  if (isSelected) {
    inner.style.transform = 'scale(1.6)';
    inner.style.background = MARKER_COLOR_GOLD;
    inner.style.boxShadow = `0 0 12px ${MARKER_COLOR_GOLD}99, 0 0 4px ${MARKER_COLOR_GOLD}`;
    ring.style.border = `1.5px solid ${MARKER_COLOR_GOLD}70`;
    ring.style.transform = 'scale(1.5)';
    ring.classList.add('animate-marker-ring-pulse');
  } else {
    inner.style.transform = 'scale(1)';
    inner.style.background = color;
    inner.style.boxShadow = `0 0 4px ${color}80`;
    ring.style.border = `1px solid ${color}50`;
    ring.style.transform = 'scale(1)';
    ring.classList.remove('animate-marker-ring-pulse');
  }
}

interface MapPlaceholderProps {
  onSelectPlace?: (place: Place) => void;
  selectedPlaceId?: string | null;
}

export default function MapPlaceholder({ onSelectPlace, selectedPlaceId }: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerDataRef = useRef<Map<string, MarkerData>>(new Map());
  const initializedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const styleFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowResizeHandlerRef = useRef<(() => void) | null>(null);
  const onSelectPlaceRef = useRef(onSelectPlace);
  useEffect(() => { onSelectPlaceRef.current = onSelectPlace; }, [onSelectPlace]);

  /* Keep a ref in sync with selectedPlaceId for use inside DOM event handlers */
  const selectedPlaceIdRef = useRef(selectedPlaceId);
  useEffect(() => { selectedPlaceIdRef.current = selectedPlaceId; }, [selectedPlaceId]);

  /* ─── Geolocation refs & state ─── */
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const userMapMarkerRef = useRef<mapboxgl.Marker | null>(null);

  /* ─── Category filter ref — kept in sync for use inside Mapbox event handlers ─── */
  const selectedCategoryRef = useRef<Category>('All');

  /* ─── Search refs & state ─── */
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [searchedPlace, setSearchedPlace] = useState<SearchResult | null>(null);
  const [walkingTime, setWalkingTime] = useState<string | null>(null);

  /* ─── Stable getter for map instance — avoids ref access during render ─── */
  const getMap = useCallback(() => mapInstanceRef.current, []);

  /* ─── React state ─── */
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [showRecenter, setShowRecenter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

  /* ─── Visible place count (derived from current filter) ─── */
  const visibleCount =
    selectedCategory === 'All'
      ? mapPlaces.length
      : mapPlaces.filter((p) => p.category === selectedCategory).length;

  /* ─── initMap ─── */
  const initMap = useCallback((): boolean => {
    if (initializedRef.current || !mapContainerRef.current || !isMapboxAvailable()) return false;

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

        mapInstanceRef.current = map;

        /* Timeout-based fallback: switch to dark-v11 if custom style hasn't loaded in 8 s */
        const styleFallbackTimeout = setTimeout(() => {
          styleFallbackTimeoutRef.current = null;
          if (!styleLoaded && !usingFallbackStyle) {
            console.warn('[Stayscape Map] Style load timed out, falling back to mapbox/dark-v11');
            usingFallbackStyle = true;
            map.setStyle(MAPBOX_DARK_STYLE_FALLBACK);
          }
        }, 8_000);
        styleFallbackTimeoutRef.current = styleFallbackTimeout;

        map.on('error', (e) => {
          const msg = e.error?.message ?? String(e.error ?? '');
          console.warn('[Stayscape Map] Map error:', msg);
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

          requestAnimationFrame(() => { map.resize(); });

          /* Clear previous markers (e.g. after style fallback reload) */
          markersRef.current.forEach((m) => m.remove());
          markersRef.current = [];
          markerDataRef.current.clear();

          /* ── Hotel “You Are Here” marker with permanent label ── */
          const hotelEl = document.createElement('div');
          hotelEl.className = 'stayscape-hotel-marker';
          hotelEl.style.cssText = 'cursor:default;';
          hotelEl.innerHTML = [
            '<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;">',
            '  <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">',
            '    <span style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(201,168,76,0.07);animation:gentlePulse 3s ease-in-out infinite;"></span>',
            '    <span style="position:absolute;width:30px;height:30px;border-radius:50%;border:1px solid rgba(201,168,76,0.18);"></span>',
            '    <span style="position:absolute;width:20px;height:20px;border-radius:50%;border:1px solid rgba(201,168,76,0.28);"></span>',
            '    <div style="position:relative;width:13px;height:13px;border-radius:50%;background:#C9A84C;box-shadow:0 0 14px rgba(201,168,76,0.6),0 0 5px rgba(201,168,76,0.9);z-index:1;"></div>',
            '  </div>',
            '  <div style="background:rgba(12,15,19,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(201,168,76,0.2);border-radius:5px;padding:3px 9px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5);">',
            '    <span style="font-size:10px;font-family:system-ui,sans-serif;color:#E8E6E1;letter-spacing:0.04em;font-weight:500;">The Grand Palace Hotel</span>',
            '  </div>',
            '</div>',
          ].join('');
          new mapboxgl.default.Marker({ element: hotelEl, anchor: 'center' })
            .setLngLat([HOTEL_CENTER.lng, HOTEL_CENTER.lat])
            .addTo(map);

          /* ── Place markers — premium category-colored design ── */
          mapPlaces.forEach((place) => {
            const color = getCategoryColor(place.category);
            const container = document.createElement('div');
            container.className = 'stayscape-place-marker';
            container.style.cssText = 'cursor:pointer;width:28px;height:28px;display:flex;align-items:center;justify-content:center;position:relative;';

            const ring = document.createElement('div');
            ring.style.cssText = `position:absolute;width:20px;height:20px;border-radius:50%;border:1px solid ${color}50;transition:all 0.2s ease;`;

            const inner = document.createElement('div');
            inner.style.cssText = `width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 5px ${color}80;transition:all 0.2s ease;position:relative;z-index:1;`;

            container.appendChild(ring);
            container.appendChild(inner);

            const data: MarkerData = { container, inner, ring, category: place.category, color };
            markerDataRef.current.set(place.id, data);

            /* Apply initial visibility based on current category filter */
            const catNow = selectedCategoryRef.current;
            container.style.display = catNow === 'All' || catNow === place.category ? '' : 'none';

            /* Hover effects */
            container.addEventListener('mouseenter', () => {
              inner.style.transform = 'scale(1.7)';
              inner.style.boxShadow = `0 0 10px ${color}99, 0 0 20px ${color}50`;
              ring.style.transform = 'scale(1.4)';
              ring.style.borderColor = `${color}80`;
            });
            container.addEventListener('mouseleave', () => {
              if (selectedPlaceIdRef.current !== place.id) {
                inner.style.transform = 'scale(1)';
                inner.style.boxShadow = `0 0 5px ${color}80`;
                ring.style.transform = 'scale(1)';
                ring.style.borderColor = `${color}50`;
              }
            });

            container.addEventListener('click', (e) => {
              e.stopPropagation();
              onSelectPlaceRef.current?.(place);
            });

            const marker = new mapboxgl.default.Marker({ element: container, anchor: 'center' })
              .setLngLat([place.lng, place.lat])
              .addTo(map);

            markersRef.current.push(marker);
          });
        });

        /* Track user panning to show/hide the re-center button.
           Compare squared distance to avoid unnecessary sqrt on every moveend. */
        map.on('moveend', () => {
          if (!userLocationRef.current) return;
          const center = map.getCenter();
          const distSq =
            Math.pow(center.lat - userLocationRef.current.lat, 2) +
            Math.pow(center.lng - userLocationRef.current.lng, 2);
          setShowRecenter(distSq > GEOLOCATION_RECENTER_THRESHOLD * GEOLOCATION_RECENTER_THRESHOLD);
        });

        /* Keep canvas sized correctly on window resize */
        const handleWindowResize = () => map.resize();
        windowResizeHandlerRef.current = handleWindowResize;
        window.addEventListener('resize', handleWindowResize);
        map.on('remove', () => {
          window.removeEventListener('resize', handleWindowResize);
          windowResizeHandlerRef.current = null;
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
    markerDataRef.current.forEach((data, placeId) => {
      applyMarkerStyle(data, selectedPlaceId === placeId);
    });
  }, [selectedPlaceId]);

  /* ─── Filter markers when selectedCategory changes ─── */
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
    markerDataRef.current.forEach((data) => {
      const visible = selectedCategory === 'All' || data.category === selectedCategory;
      data.container.style.display = visible ? '' : 'none';
    });
  }, [selectedCategory]);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    const markers = markersRef;
    const markerData = markerDataRef;
    const mapInstance = mapInstanceRef;
    const resizeObs = resizeObserverRef;
    const fallbackTimeout = styleFallbackTimeoutRef;
    const windowResizeHandler = windowResizeHandlerRef;
    const userMarker = userMapMarkerRef;
    const searchMarker = searchMarkerRef;
    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      markerData.current.clear();
      userMarker.current?.remove();
      userMarker.current = null;
      searchMarker.current?.remove();
      searchMarker.current = null;
      if (fallbackTimeout.current) {
        clearTimeout(fallbackTimeout.current);
        fallbackTimeout.current = null;
      }
      if (windowResizeHandler.current) {
        window.removeEventListener('resize', windowResizeHandler.current);
        windowResizeHandler.current = null;
      }
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
      if (!initMap()) {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              if (initMap()) {
                observer.disconnect();
                resizeObserverRef.current = null;
              }
              break;
            }
          }
        });
        observer.observe(node);
        resizeObserverRef.current = observer;
      }
    }
  }, [initMap]);

  /* ─── Geolocation — request user location ─── */
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation || locationState === 'requesting') return;
    setLocationState('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userLocationRef.current = { lat: latitude, lng: longitude };
        setLocationState('granted');
        setShowRecenter(false);

        const map = mapInstanceRef.current;
        if (!map) return;

        userMapMarkerRef.current?.remove();

        import('mapbox-gl').then((mapboxgl) => {
          const el = document.createElement('div');
          el.style.cssText = 'position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;';
          el.innerHTML = [
            '<div style="position:absolute;width:22px;height:22px;border-radius:50%;background:rgba(59,130,246,0.18);" class="animate-user-halo-pulse"></div>',
            '<div style="width:11px;height:11px;border-radius:50%;background:#3B82F6;border:2px solid #fff;box-shadow:0 0 0 0 rgba(59,130,246,0.5);" class="animate-user-dot-pulse"></div>',
          ].join('');
          const marker = new mapboxgl.default.Marker({ element: el, anchor: 'center' })
            .setLngLat([longitude, latitude])
            .addTo(map);
          userMapMarkerRef.current = marker;

          map.flyTo({ center: [longitude, latitude], zoom: GEOLOCATION_ZOOM, duration: GEOLOCATION_FLY_DURATION });
        }).catch((err) => {
          console.warn('[Stayscape Map] Failed to place user location marker:', err);
        });
      },
      () => {
        /* Permission denied — fall back gracefully, no error shown to user */
        setLocationState('denied');
      },
      /* 12 s timeout covers slow GPS cold starts; 5 min cache reduces battery drain on re-requests */
      { timeout: 12_000, maximumAge: 300_000 },
    );
  }, [locationState]);

  /* ─── Re-center map on user location ─── */
  const recenterOnUser = useCallback(() => {
    if (!userLocationRef.current || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: [userLocationRef.current.lng, userLocationRef.current.lat],
      zoom: GEOLOCATION_ZOOM,
      duration: GEOLOCATION_RECENTER_DURATION,
    });
    setShowRecenter(false);
  }, []);

  /* ─── Search — select a geocoded place ─── */
  const handleSearchSelect = useCallback((result: SearchResult) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    searchMarkerRef.current?.remove();

    import('mapbox-gl').then((mapboxgl) => {
      const el = document.createElement('div');
      el.style.cssText = 'cursor:default;width:28px;height:28px;display:flex;align-items:center;justify-content:center;position:relative;';
      el.innerHTML = [
        `<div style="position:absolute;width:22px;height:22px;border-radius:50%;border:1.5px solid ${MARKER_COLOR_GOLD}55;"></div>`,
        `<div style="width:9px;height:9px;border-radius:50%;background:${MARKER_COLOR_GOLD};box-shadow:0 0 8px ${MARKER_COLOR_GOLD}90;"></div>`,
      ].join('');

      const marker = new mapboxgl.default.Marker({ element: el, anchor: 'center' })
        .setLngLat([result.lng, result.lat])
        .addTo(map);
      searchMarkerRef.current = marker;

      map.flyTo({ center: [result.lng, result.lat], zoom: 15, duration: 1500 });
    }).catch((err) => {
      console.warn('[Stayscape Map] Failed to place search result marker:', err);
    });

    setSearchedPlace(result);
  }, []);

  /* ─── Search — clear ─── */
  const handleSearchClear = useCallback(() => {
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
    setSearchedPlace(null);
  }, []);

  /* ─── Walking time — fetch when a sample place is selected ─── */
  useEffect(() => {
    if (!selectedPlaceId) {
      setWalkingTime(null);
      return;
    }
    const place = mapPlaces.find((p) => p.id === selectedPlaceId);
    if (!place) {
      setWalkingTime(null);
      return;
    }
    let cancelled = false;
    getDistanceFromHotel({ lat: place.lat, lng: place.lng }).then((t) => {
      if (!cancelled) setWalkingTime(t);
    });
    return () => { cancelled = true; };
  }, [selectedPlaceId]);

  /* ─── Fallback to SVG if Mapbox is not available ─── */
  if (!isMapboxAvailable()) {
    return <MapFallback onSelectPlace={onSelectPlace} selectedPlaceId={selectedPlaceId} />;
  }

  const activePlace = mapPlaces.find((p) => p.id === selectedPlaceId);

  return (
    <div className="relative w-full h-full flex-1 bg-[var(--map-bg)] overflow-hidden animate-fade-in rounded-[10px] ring-1 ring-[var(--gold)]/10 shadow-[inset_0_0_0_1px_rgba(201,168,76,0.08)]">
      {/* Mapbox canvas container */}
      <div ref={setContainerRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Vignette overlays */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(10,14,19,0.35) 100%)' }}
      />
      <div className="absolute inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[var(--map-bg)]/30 via-transparent to-[var(--map-bg)]/20" />

      {/* ── Map search overlay (floating, centered) ── */}
      <MapSearch onSelect={handleSearchSelect} onClear={handleSearchClear} />

      {/* ── Map header / status bar (left-aligned, beneath search) ── */}
      <div className="absolute top-12 left-3 right-3 z-10 flex items-start gap-2 flex-wrap">
        <div
          className="flex items-center gap-2 rounded-[7px] px-3 py-1.5 glass-dark"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
        >
          <span className="text-[10px] text-[var(--text-muted)] tracking-wide">Near The Grand Palace Hotel</span>
          <span className="text-[var(--text-dim)] text-[9px]">·</span>
          <span className="text-[10px] font-medium" style={{ color: MARKER_COLOR_GOLD }}>
            {visibleCount} place{visibleCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            const catColor = cat === 'All' ? MARKER_COLOR_GOLD : getCategoryColor(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full px-2.5 py-1 text-[9px] tracking-wide font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? `${catColor}22` : 'rgba(10,14,19,0.72)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isActive ? `1px solid ${catColor}55` : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? catColor : 'var(--text-muted)',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
                }}
              >
                {CATEGORY_ICONS[cat]} {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Custom floating toolbar — bottom-right ── */}
      <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-9 h-9 rounded-[7px] flex items-center justify-center text-base font-light transition-all duration-200 cursor-pointer select-none"
          style={{
            background: 'rgba(10,14,19,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: 'var(--text-secondary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.4)';
            (e.currentTarget as HTMLButtonElement).style.color = MARKER_COLOR_GOLD;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
        >
          +
        </button>

        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-9 h-9 rounded-[7px] flex items-center justify-center text-base font-light transition-all duration-200 cursor-pointer select-none"
          style={{
            background: 'rgba(10,14,19,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: 'var(--text-secondary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.4)';
            (e.currentTarget as HTMLButtonElement).style.color = MARKER_COLOR_GOLD;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
        >
          −
        </button>

        <div className="h-px mx-1" style={{ background: 'rgba(201,168,76,0.12)' }} />

        {/* Locate Me button */}
        <button
          type="button"
          aria-label={locationState === 'requesting' ? 'Locating…' : 'Show my location'}
          title="Show my location"
          onClick={requestGeolocation}
          className="w-9 h-9 rounded-[7px] flex items-center justify-center transition-all duration-200 cursor-pointer"
          style={{
            background: locationState === 'granted' ? 'rgba(59,130,246,0.18)' : 'rgba(10,14,19,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: locationState === 'granted' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(201,168,76,0.12)',
            color: locationState === 'granted' ? '#3B82F6' : 'var(--text-secondary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            opacity: locationState === 'requesting' ? 0.65 : 1,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="7" strokeOpacity="0.35" />
          </svg>
        </button>
      </div>

      {/* ── Re-center on me button ── */}
      {showRecenter && locationState === 'granted' && (
        <button
          type="button"
          onClick={recenterOnUser}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-200 animate-fade-in cursor-pointer"
          style={{
            background: 'rgba(10,14,19,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(59,130,246,0.4)',
            color: '#3B82F6',
            boxShadow: '0 3px 12px rgba(0,0,0,0.5)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          Re-center on me
        </button>
      )}

      {/* ── Selected place info card ── */}
      {activePlace && (
        <div
          key={activePlace.id}
          className="absolute bottom-20 left-4 z-10 animate-card-entrance"
          style={{ maxWidth: 'min(280px, calc(100% - 80px))' }}
        >
          <div
            className="rounded-[9px] p-3.5 glass-dark"
            style={{
              border: `1px solid ${getCategoryColor(activePlace.category)}35`,
              boxShadow: `0 6px 24px rgba(0,0,0,0.55), 0 0 0 1px ${getCategoryColor(activePlace.category)}15`,
            }}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-base leading-none mt-0.5">{CATEGORY_ICONS[activePlace.category]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
                  {activePlace.name}
                </p>
                <p className="text-[9.5px] text-[var(--text-muted)] mt-0.5 truncate">
                  {activePlace.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill={i < Math.round(activePlace.rating ?? 0) ? MARKER_COLOR_GOLD : 'none'}
                    stroke={MARKER_COLOR_GOLD}
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
                <span className="text-[9.5px] font-medium ml-0.5" style={{ color: MARKER_COLOR_GOLD }}>
                  {activePlace.rating?.toFixed(1)}
                </span>
              </div>

              <span className="text-[var(--text-dim)] text-[9px]">·</span>

              <div className="flex items-center gap-1">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-[9.5px] text-[var(--text-muted)]">{activePlace.distance}</span>
              </div>

              {walkingTime && (
                <>
                  <span className="text-[var(--text-dim)] text-[9px]">·</span>
                  <span
                    className="text-[9.5px] font-medium"
                    style={{ color: MARKER_COLOR_GOLD }}
                  >
                    {walkingTime}
                  </span>
                </>
              )}
            </div>

            {/* Route toggle */}
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <MapRoute
                key={activePlace.id}
                getMap={getMap}
                destination={{ lat: activePlace.lat, lng: activePlace.lng }}
                onRouteLoad={setWalkingTime}
              />
            </div>
          </div>
          {/* Arrow pointer */}
          <div
            className="absolute bottom-[-5px] left-5 w-2.5 h-2.5 rotate-45"
            style={{
              background: 'rgba(10,14,19,0.78)',
              border: `1px solid ${getCategoryColor(activePlace.category)}35`,
              borderTop: 'none',
              borderLeft: 'none',
            }}
          />
        </div>
      )}

      {/* ── Searched place info card (geocoding result) ── */}
      {searchedPlace && !activePlace && (
        <div
          className="absolute bottom-20 left-4 z-10 animate-card-entrance"
          style={{ maxWidth: 'min(280px, calc(100% - 80px))' }}
        >
          <div
            className="rounded-[9px] p-3.5 glass-dark"
            style={{
              border: `1px solid ${MARKER_COLOR_GOLD}30`,
              boxShadow: `0 6px 24px rgba(0,0,0,0.55), 0 0 0 1px ${MARKER_COLOR_GOLD}10`,
            }}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-base leading-none mt-0.5">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
                  {searchedPlace.name}
                </p>
                {searchedPlace.subtitle && (
                  <p className="text-[9.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    {searchedPlace.subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[9.5px] font-medium"
                style={{ color: MARKER_COLOR_GOLD }}
              >
                {searchedPlace.distanceDisplay} from hotel
              </span>
            </div>
            {/* Route toggle for searched place */}
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <MapRoute
                key={searchedPlace.id}
                getMap={getMap}
                destination={{ lat: searchedPlace.lat, lng: searchedPlace.lng }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Map attribution ── */}
      <div className="absolute bottom-2 left-3 text-[8px] tracking-wide z-10" style={{ color: 'rgba(107,114,128,0.5)' }}>
        © Stayscape · Mapbox
      </div>
    </div>
  );
}

/* ─── SVG fallback when Mapbox token is not configured ─── */
function MapFallback({ onSelectPlace, selectedPlaceId }: MapPlaceholderProps) {
  return (
    <div className="relative w-full h-full bg-[var(--map-bg)] overflow-hidden animate-fade-in rounded-[10px] ring-1 ring-[var(--gold)]/10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(25, 35, 50, 0.15) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(25, 35, 50, 0.15) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '52px 52px',
        }}
      />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
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
        <line x1="200" y1="0" x2="200" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#141E2C" strokeWidth="8" />
        <line x1="600" y1="0" x2="600" y2="600" stroke="#121A25" strokeWidth="5" />
        <line x1="100" y1="0" x2="100" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="500" y1="0" x2="500" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="700" y1="0" x2="700" y2="600" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="150" x2="800" y2="150" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#141E2C" strokeWidth="8" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#121A25" strokeWidth="5" />
        <line x1="0" y1="75" x2="800" y2="75" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="225" x2="800" y2="225" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="375" x2="800" y2="375" stroke="#101822" strokeWidth="2.5" />
        <line x1="0" y1="525" x2="800" y2="525" stroke="#101822" strokeWidth="2.5" />
        <text x="400" y="296" textAnchor="middle" fill="#182535" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="0.18em">5TH AVENUE</text>
        <text x="197" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 197, 260)">MADISON AVE</text>
        <text x="597" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 597, 260)">PARK AVE</text>
        <text x="750" y="296" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 57TH ST</text>
        <text x="50" y="148" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">W 59TH ST</text>
        <text x="750" y="448" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 55TH ST</text>

        {mapPlaces.map((place) => {
          const isSelected = selectedPlaceId === place.id;
          const color = getCategoryColor(place.category);
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
              <circle cx={place.cx} cy={place.cy} r="14" fill="transparent" />
              {isSelected && (
                <>
                  <circle cx={place.cx} cy={place.cy} r="12" fill={color} opacity="0.08" className="animate-gentle-pulse" />
                  <circle cx={place.cx} cy={place.cy} r="7" fill="none" stroke={color} strokeWidth="0.75" opacity="0.4" />
                </>
              )}
              <circle
                cx={place.cx}
                cy={place.cy}
                r={isSelected ? '4' : '3'}
                fill={isSelected ? MARKER_COLOR_GOLD : color}
                stroke={isSelected ? MARKER_COLOR_GOLD : 'none'}
                strokeWidth="1"
                style={isSelected ? { filter: `drop-shadow(0 0 6px ${MARKER_COLOR_GOLD}99)` } : undefined}
              />
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 bg-gradient-to-r from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-30 pointer-events-none" />

      {selectedPlaceId && (() => {
        const place = mapPlaces.find((p) => p.id === selectedPlaceId);
        if (!place) return null;
        return (
          <div
            className="absolute whitespace-nowrap pointer-events-none animate-card-entrance"
            style={{
              left: `${(place.cx / 800) * 100}%`,
              top: `${(place.cy / 600) * 100}%`,
              transform: 'translate(-50%, 16px)',
            }}
          >
            <div className="flex items-center space-x-2 bg-[var(--map-label-bg)] border border-[var(--gold)]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
              <span className="text-[11px] font-medium text-[var(--text-primary)] tracking-[0.03em]">{place.name}</span>
              <span className="text-[9px] text-[var(--text-faint)]">·</span>
              <span className="text-[9px] text-[var(--text-muted)]">{place.distance}</span>
            </div>
          </div>
        );
      })()}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-12 w-12 rounded-full bg-[var(--gold)]/6 animate-gentle-pulse" />
          <span className="absolute inline-flex h-7 w-7 rounded-full border border-[var(--gold)]/15" />
          <span className="absolute inline-flex h-5 w-5 rounded-full border border-[var(--gold)]/25" />
          <div className="relative w-3 h-3 rounded-full bg-[var(--gold)] shadow-[0_0_12px_rgba(201,168,76,0.5),0_0_4px_rgba(201,168,76,0.8)]" />
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-9 whitespace-nowrap">
        <div className="flex items-center space-x-2 bg-[var(--map-label-bg)] border border-[var(--gold)]/15 rounded-[6px] px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          <span className="text-[11px] font-medium text-[var(--text-primary)] tracking-[0.03em]">The Grand Palace Hotel</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-4 flex flex-col gap-1.5">
        <button
          type="button"
          className="w-9 h-9 rounded-[7px] flex items-center justify-center text-base transition-all duration-200 cursor-pointer select-none"
          style={{
            background: 'rgba(10,14,19,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: 'var(--text-secondary)',
          }}
        >+</button>
        <button
          type="button"
          className="w-9 h-9 rounded-[7px] flex items-center justify-center text-base transition-all duration-200 cursor-pointer select-none"
          style={{
            background: 'rgba(10,14,19,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: 'var(--text-secondary)',
          }}
        >−</button>
      </div>

      <div className="absolute bottom-2 left-3 text-[8px] tracking-wide" style={{ color: 'rgba(107,114,128,0.5)' }}>
        © Stayscape Maps · <span style={{ opacity: 0.5 }}>preview</span>
      </div>
    </div>
  );
}
