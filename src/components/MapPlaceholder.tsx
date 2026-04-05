'use client';

import type mapboxgl from 'mapbox-gl';
import { useRef, useCallback, useEffect, useState } from 'react';
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
} from '@/lib/mapbox/config';
import { haversineMetres, formatDistanceDisplay } from '@/lib/mapbox/geocoding';
import MapSearch from '@/components/MapSearch';
import { useItinerary } from '@/components/ItineraryContext';
import type { SearchResult } from '@/types/mapbox';
import { useRegion } from '@/lib/context/region-context';
import type { MapPlace } from '@/types';

/* ─── Default center coordinates (Singapore Central) ─── */
const DEFAULT_CENTER = { lat: 1.2897, lng: 103.8501 };
const DEFAULT_ITINERARY_TIME = '10:00';
const DEFAULT_ITINERARY_DURATION_HOURS = 2;

/* ─── Map source / layer identifiers ─── */
const SOURCE_ID = 'stayscape-places';
const CLUSTER_LAYER = 'stayscape-clusters';
const CLUSTER_COUNT_LAYER = 'stayscape-cluster-count';
const UNCLUSTERED_LAYER = 'stayscape-unclustered';
const LABEL_LAYER = 'stayscape-labels';

/* ─── Category filter options ─── */
const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'dining', label: 'Dining' },
  { key: 'top_places', label: 'Top Places' },
  { key: 'nightlife', label: 'Nightlife' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'fun_places', label: 'Fun Places' },
  { key: 'nature', label: 'Nature' },
  { key: 'historical', label: 'Historical' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'events', label: 'Events' },
];

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#6B7280';
}

function buildGeoJSONData(places: MapPlace[]): { geojson: GeoJSON.FeatureCollection; idMap: Map<string, number> } {
  const idMap = new Map<string, number>();
  const features = places.map((p, index) => {
    idMap.set(p.id, index);
    return {
      type: 'Feature' as const,
      id: index,
      geometry: {
        type: 'Point' as const,
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
      },
    };
  });
  return { geojson: { type: 'FeatureCollection', features }, idMap };
}

function filterPlaces(places: MapPlace[], category: string): MapPlace[] {
  return category === 'all' ? places : places.filter((p) => p.category === category);
}

interface MapPlaceholderProps {
  onSelectPlace?: (place: MapPlace) => void;
  selectedPlaceId?: string | null;
}

export default function MapPlaceholder({ onSelectPlace, selectedPlaceId }: MapPlaceholderProps) {
  const { region } = useRegion();
  const { addItem } = useItinerary();
  /* Keep region in a ref so initMap (stable callback) can read the latest value */
  const regionRef = useRef(region);
  useEffect(() => { regionRef.current = region; }, [region]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const hotelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const placesRef = useRef<MapPlace[]>([]); /* cached Supabase places */
  const initializedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const styleFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowResizeHandlerRef = useRef<(() => void) | null>(null);
  const onSelectPlaceRef = useRef(onSelectPlace);
  useEffect(() => { onSelectPlaceRef.current = onSelectPlace; }, [onSelectPlace]);

  /* Keep a ref in sync with selectedPlaceId for use inside DOM event handlers */
  const selectedPlaceIdRef = useRef(selectedPlaceId);
  useEffect(() => { selectedPlaceIdRef.current = selectedPlaceId; }, [selectedPlaceId]);

  /* Track GeoJSON source state and hover/selected feature IDs */
  const sourceAddedRef = useRef(false);
  const hoveredIdRef = useRef<number | null>(null);
  const prevSelectedIdRef = useRef<number | null>(null);
  const uuidToFeatureIdRef = useRef<Map<string, number>>(new Map());

  /* ─── Geolocation refs & state ─── */
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const userMapMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const requestGeolocationRef = useRef<() => void>(() => {});

  /* ─── Search refs & state ─── */
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [searchedPlace, setSearchedPlace] = useState<SearchResult | null>(null);

  /* ─── Itinerary add confirmation state ─── */
  const [itinAdded, setItinAdded] = useState<string | null>(null);
  const itinAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Category filter state ─── */
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const activeCategoryRef = useRef('all');
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

  /* ─── Stable getter for map instance — avoids ref access during render ─── */
  const getMap = useCallback(() => mapInstanceRef.current, []);

  /* ─── React state ─── */
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  /* ─── Active place: looked up from cached places ref ─── */
  const [activePlace, setActivePlace] = useState<MapPlace | null>(null);

  /* Sync activePlace when selectedPlaceId changes */
  useEffect(() => {
    if (selectedPlaceId) {
      const found = placesRef.current.find((p) => p.id === selectedPlaceId) ?? null;
      setActivePlace(found);
    } else {
      setActivePlace(null);
    }
  }, [selectedPlaceId]);

  /* ─── Update selected marker via Mapbox feature state ─── */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !sourceAddedRef.current) return;
    if (prevSelectedIdRef.current !== null) {
      try { map.setFeatureState({ source: SOURCE_ID, id: prevSelectedIdRef.current }, { selected: false }); } catch { /* source may have reset */ }
    }
    if (selectedPlaceId) {
      const numericId = uuidToFeatureIdRef.current.get(selectedPlaceId);
      if (numericId !== undefined) {
        try { map.setFeatureState({ source: SOURCE_ID, id: numericId }, { selected: true }); } catch { /* source may have reset */ }
        prevSelectedIdRef.current = numericId;
      } else {
        prevSelectedIdRef.current = null;
      }
    } else {
      prevSelectedIdRef.current = null;
    }
  }, [selectedPlaceId]);

  /* ─── Update source data when category filter changes ─── */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !sourceAddedRef.current) return;
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    const { geojson, idMap } = buildGeoJSONData(filterPlaces(placesRef.current, activeCategory));
    uuidToFeatureIdRef.current = idMap;
    source.setData(geojson);
    /* Feature states reset on setData — clear tracking refs */
    prevSelectedIdRef.current = null;
    hoveredIdRef.current = null;
  }, [activeCategory]);

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
        const center = regionRef.current
          ? { lat: regionRef.current.latitude, lng: regionRef.current.longitude }
          : DEFAULT_CENTER;
        const map = new mapboxgl.default.Map({
          container: mapContainerRef.current!,
          style: styleUrl,
          center: [center.lng, center.lat],
          zoom: 13,
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

          /* Reset source tracking on style reload */
          sourceAddedRef.current = false;
          hoveredIdRef.current = null;
          prevSelectedIdRef.current = null;

          requestAnimationFrame(() => { map.resize(); });

          /* Remove previous hotel marker before adding a new one */
          hotelMarkerRef.current?.remove();
          hotelMarkerRef.current = null;

          /* ── Hotel "You Are Here" marker with permanent label ── */
          const regionLabel = regionRef.current?.name ?? 'Your Location';
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
                `    <span style="font-size:10px;font-family:system-ui,sans-serif;color:#E8E6E1;letter-spacing:0.04em;font-weight:500;">${regionLabel}</span>`,
            '  </div>',
            '</div>',
          ].join('');
          hotelMarkerRef.current = new mapboxgl.default.Marker({ element: hotelEl, anchor: 'center' })
            .setLngLat([center.lng, center.lat])
            .addTo(map);

          /* ── Fetch places from Supabase and render via GeoJSON layers ── */
          const activeRegionId = regionRef.current?.id;
          if (activeRegionId) {
            fetch(`/api/places?region_id=${encodeURIComponent(activeRegionId)}&limit=300`)
              .then((res) => res.json())
              .then((body: { data?: MapPlace[]; error?: string }) => {
                if (body.error) {
                  console.warn('[Stayscape Map] Places API error:', body.error);
                  return;
                }
                const places: MapPlace[] = body.data ?? [];
                placesRef.current = places;

                /* Apply active category filter */
                const filtered = filterPlaces(places, activeCategoryRef.current);

                /* ── GeoJSON source with built-in clustering ── */
                const { geojson: placesGeojson, idMap } = buildGeoJSONData(filtered);
                uuidToFeatureIdRef.current = idMap;
                map.addSource(SOURCE_ID, {
                  type: 'geojson',
                  data: placesGeojson,
                  cluster: true,
                  clusterMaxZoom: 13,
                  clusterRadius: 50,
                });

                /* ── Cluster circles ── */
                map.addLayer({
                  id: CLUSTER_LAYER,
                  type: 'circle',
                  source: SOURCE_ID,
                  filter: ['has', 'point_count'],
                  paint: {
                    'circle-color': 'rgba(201,168,76,0.10)',
                    'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 24],
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'rgba(201,168,76,0.32)',
                    'circle-blur': 0.15,
                  },
                });

                /* ── Cluster count labels ── */
                map.addLayer({
                  id: CLUSTER_COUNT_LAYER,
                  type: 'symbol',
                  source: SOURCE_ID,
                  filter: ['has', 'point_count'],
                  layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-size': 11,
                    'text-allow-overlap': true,
                  },
                  paint: {
                    'text-color': '#C9A84C',
                    'text-opacity': 0.88,
                  },
                });

                /* ── Individual place dots ── */
                map.addLayer({
                  id: UNCLUSTERED_LAYER,
                  type: 'circle',
                  source: SOURCE_ID,
                  filter: ['!', ['has', 'point_count']],
                  paint: {
                    'circle-color': [
                      'case',
                      ['boolean', ['feature-state', 'selected'], false], MARKER_COLOR_GOLD,
                      '#4ADE80',
                    ],
                    'circle-radius': [
                      'interpolate', ['linear'], ['zoom'],
                      10, ['case', ['boolean', ['feature-state', 'selected'], false], 7, ['boolean', ['feature-state', 'hovered'], false], 7, 5],
                      15, ['case', ['boolean', ['feature-state', 'selected'], false], 10, ['boolean', ['feature-state', 'hovered'], false], 10, 8],
                    ],
                    'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2, 1],
                    'circle-stroke-color': [
                      'case',
                      ['boolean', ['feature-state', 'selected'], false], `${MARKER_COLOR_GOLD}80`,
                      'rgba(255,255,255,0.25)',
                    ],
                    'circle-blur': [
                      'case',
                      ['boolean', ['feature-state', 'selected'], false], 0.2,
                      ['boolean', ['feature-state', 'hovered'], false], 0.15,
                      0.05,
                    ],
                    'circle-opacity': 0.92,
                  },
                });

                /* ── Place name labels at high zoom ── */
                map.addLayer({
                  id: LABEL_LAYER,
                  type: 'symbol',
                  source: SOURCE_ID,
                  filter: ['!', ['has', 'point_count']],
                  minzoom: 15,
                  layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 10,
                    'text-offset': [0, 1.2],
                    'text-anchor': 'top',
                    'text-max-width': 8,
                    'text-allow-overlap': false,
                    'text-optional': true,
                  },
                  paint: {
                    'text-color': 'rgba(232,230,225,0.62)',
                    'text-halo-color': 'rgba(10,14,19,0.9)',
                    'text-halo-width': 1,
                  },
                });

                sourceAddedRef.current = true;

                /* Restore selected state if needed */
                if (selectedPlaceIdRef.current) {
                  const numericId = uuidToFeatureIdRef.current.get(selectedPlaceIdRef.current);
                  if (numericId !== undefined) {
                    try {
                      map.setFeatureState({ source: SOURCE_ID, id: numericId }, { selected: true });
                      prevSelectedIdRef.current = numericId;
                    } catch { /* ignore */ }
                  }
                }

                /* ── Cluster click: zoom in ── */
                map.on('click', CLUSTER_LAYER, (e) => {
                  const feature = e.features?.[0];
                  if (!feature) return;
                  const clusterId = feature.properties?.cluster_id as number;
                  const geometry = feature.geometry as GeoJSON.Point;
                  const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
                  src.getClusterExpansionZoom(clusterId, (err: Error | null | undefined, zoom: number | null | undefined) => {
                    if (err || zoom == null) return;
                    map.easeTo({ center: [geometry.coordinates[0], geometry.coordinates[1]], zoom });
                  });
                });

                /* ── Individual place click: show info card ── */
                map.on('click', UNCLUSTERED_LAYER, (e) => {
                  const feature = e.features?.[0];
                  if (!feature) return;
                  e.originalEvent.stopPropagation();
                  const placeId = feature.properties?.id as string;
                  const place = placesRef.current.find((p) => p.id === placeId);
                  if (place) onSelectPlaceRef.current?.(place);
                });

                /* ── Hover: pointer cursor + glow ── */
                map.on('mousemove', UNCLUSTERED_LAYER, (e) => {
                  const feature = e.features?.[0];
                  const fid = feature?.id as number | undefined;
                  if (hoveredIdRef.current !== null && hoveredIdRef.current !== fid) {
                    try { map.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { hovered: false }); } catch { /* ignore */ }
                  }
                  if (fid !== undefined && fid !== hoveredIdRef.current) {
                    try { map.setFeatureState({ source: SOURCE_ID, id: fid }, { hovered: true }); } catch { /* ignore */ }
                    hoveredIdRef.current = fid;
                  }
                  map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', UNCLUSTERED_LAYER, () => {
                  if (hoveredIdRef.current !== null) {
                    try { map.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { hovered: false }); } catch { /* ignore */ }
                    hoveredIdRef.current = null;
                  }
                  map.getCanvas().style.cursor = '';
                });

                /* ── Cluster hover: pointer cursor ── */
                map.on('mouseenter', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
                map.on('mouseleave', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ''; });
              })
              .catch((err) => {
                console.warn('[Stayscape Map] Failed to fetch places:', err);
              });
          }
        });

        /* Keep canvas sized correctly on window resize */
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

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    const mapInstance = mapInstanceRef;
    const resizeObs = resizeObserverRef;
    const fallbackTimeout = styleFallbackTimeoutRef;
    const windowResizeHandler = windowResizeHandlerRef;
    const hotelMarker = hotelMarkerRef;
    const userMarker = userMapMarkerRef;
    const searchMarker = searchMarkerRef;
    const itinAddedTimer = itinAddedTimerRef;
    return () => {
      hotelMarker.current?.remove();
      hotelMarker.current = null;
      userMarker.current?.remove();
      userMarker.current = null;
      searchMarker.current?.remove();
      searchMarker.current = null;
      if (itinAddedTimer.current) {
        clearTimeout(itinAddedTimer.current);
        itinAddedTimer.current = null;
      }
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
      sourceAddedRef.current = false;
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
    if (!navigator.geolocation) return;

    /* If location is already known, just re-center the map */
    if (locationState === 'granted' && userLocationRef.current) {
      const map = mapInstanceRef.current;
      if (map) {
        const { lat, lng } = userLocationRef.current;
        map.flyTo({ center: [lng, lat], zoom: GEOLOCATION_ZOOM, duration: GEOLOCATION_RECENTER_DURATION });
      }
      return;
    }

    if (locationState === 'requesting' || locationState === 'denied') return;
    setLocationState('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userLocationRef.current = { lat: latitude, lng: longitude };
        setLocationState('granted');

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

  /* ─── Keep requestGeolocationRef in sync for use inside map callbacks ─── */
  useEffect(() => { requestGeolocationRef.current = requestGeolocation; }, [requestGeolocation]);

  /* ─── Search — select a geocoded place ─── */
  const handleSearchSelect = useCallback((result: SearchResult) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    searchMarkerRef.current?.remove();

    import('mapbox-gl').then((mapboxgl) => {
      const isSupabase = result.source === 'supabase';
      const el = document.createElement('div');
      el.style.cssText = `cursor:${isSupabase ? 'pointer' : 'default'};width:28px;height:28px;display:flex;align-items:center;justify-content:center;position:relative;`;
      el.innerHTML = [
        `<div style="position:absolute;width:22px;height:22px;border-radius:50%;border:1.5px solid ${MARKER_COLOR_GOLD}55;"></div>`,
        `<div style="width:9px;height:9px;border-radius:50%;background:${MARKER_COLOR_GOLD};box-shadow:0 0 8px ${MARKER_COLOR_GOLD}90;"></div>`,
      ].join('');

      if (isSupabase) {
        el.addEventListener('click', () => {
          const placeId = result.id.replace(/^supabase-/, '');
          const place = placesRef.current.find((p) => p.id === placeId);
          if (place) onSelectPlaceRef.current?.(place);
        });
      }

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


  /* ─── Fallback to SVG if Mapbox is not available ─── */
  if (!isMapboxAvailable()) {
    return <MapFallback onSelectPlace={onSelectPlace} selectedPlaceId={selectedPlaceId} />;
  }


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

      {/* ── Category filter pill bar ── */}
      <div
        className="absolute top-3 left-3 right-3 z-10"
        style={{ maxWidth: 'calc(100% - 24px)' }}
      >
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORY_FILTERS.map(({ key, label }) => {
            const isActive = activeCategory === key;
            const dotColor = key === 'all' ? MARKER_COLOR_GOLD : getCategoryColor(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 20,
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  fontFamily: 'system-ui, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: isActive ? 'rgba(201,168,76,0.13)' : 'rgba(10,14,19,0.68)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: isActive ? '1px solid rgba(201,168,76,0.38)' : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? '#C9A84C' : 'rgba(232,230,225,0.6)',
                  boxShadow: isActive ? '0 0 8px rgba(201,168,76,0.12)' : '0 1px 4px rgba(0,0,0,0.35)',
                }}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isActive ? dotColor : `${dotColor}80`,
                  flexShrink: 0,
                  display: 'inline-block',
                  boxShadow: isActive ? `0 0 5px ${dotColor}70` : 'none',
                  transition: 'all 0.18s ease',
                }} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Map search overlay (floating, centered) ── */}
      <MapSearch onSelect={handleSearchSelect} onClear={handleSearchClear} />

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
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: getCategoryColor(activePlace.category),
                flexShrink: 0,
                marginTop: 3,
                boxShadow: `0 0 6px ${getCategoryColor(activePlace.category)}70`,
              }} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">
                  {activePlace.name}
                </p>
                <p className="text-[9.5px] text-[var(--text-muted)] mt-0.5 truncate">
                  {activePlace.editorial_summary ?? activePlace.description ?? activePlace.address ?? ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {activePlace.rating != null && (
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
                    {activePlace.rating.toFixed(1)}
                  </span>
                </div>
              )}

              {region && activePlace.rating != null && (
                <span className="text-[var(--text-dim)] text-[9px]">·</span>
              )}

              {region && (
                <div className="flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-[9.5px] text-[var(--text-muted)]">
                    {formatDistanceDisplay(haversineMetres(region.latitude, region.longitude, activePlace.latitude, activePlace.longitude))}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-2.5 pt-2 flex items-center gap-1.5 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Book button */}
              {(activePlace.booking_url || activePlace.website) ? (
                <a
                  href={(activePlace.booking_url || activePlace.website) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all"
                  style={{
                    color: MARKER_COLOR_GOLD,
                    background: `${MARKER_COLOR_GOLD}18`,
                    border: `1px solid ${MARKER_COLOR_GOLD}40`,
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5 3V2M11 3V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                  Book
                </a>
              ) : null}

              {/* Add to Itinerary button */}
              <button
                type="button"
                onClick={() => {
                  if (itinAdded === activePlace.id) return;
                  addItem({
                    placeId: activePlace.id,
                    name: activePlace.name,
                    category: activePlace.category,
                    image: activePlace.image_url ?? '',
                    date: new Date(),
                    time: DEFAULT_ITINERARY_TIME,
                    durationHours: DEFAULT_ITINERARY_DURATION_HOURS,
                  });
                  setItinAdded(activePlace.id);
                  if (itinAddedTimerRef.current) clearTimeout(itinAddedTimerRef.current);
                  itinAddedTimerRef.current = setTimeout(() => setItinAdded(null), 2500);
                }}
                className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all cursor-pointer"
                style={{
                  color: itinAdded === activePlace.id ? '#4ADE80' : 'var(--text-muted)',
                  background: itinAdded === activePlace.id ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${itinAdded === activePlace.id ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {itinAdded === activePlace.id ? (
                  <>✓ Added</>
                ) : (
                  <>
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Itinerary
                  </>
                )}
              </button>

              {/* Get Directions button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activePlace.latitude},${activePlace.longitude}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all"
                style={{
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 1L15 8L8 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Directions
              </a>
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
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: MARKER_COLOR_GOLD,
                flexShrink: 0,
                marginTop: 3,
                boxShadow: `0 0 5px ${MARKER_COLOR_GOLD}60`,
              }} />
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
                {searchedPlace.distanceDisplay} from here
              </span>
            </div>
            {/* Get Directions for searched place */}
            <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${searchedPlace.lat},${searchedPlace.lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-medium rounded-full px-2.5 py-1 inline-flex items-center gap-1 transition-all"
                style={{
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 1L15 8L8 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Directions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── My Location button (Google Maps style, bottom-right) ── */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          type="button"
          onClick={requestGeolocation}
          disabled={locationState === 'requesting' || locationState === 'denied'}
          aria-label={
            locationState === 'granted'
              ? 'Re-center on my location'
              : locationState === 'requesting'
              ? 'Getting your location…'
              : locationState === 'denied'
              ? 'Location access denied'
              : 'Show my location'
          }
          title={
            locationState === 'denied'
              ? 'Location access was denied. Please enable it in browser settings.'
              : undefined
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: locationState === 'denied' ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            background:
              locationState === 'granted'
                ? 'rgba(59,130,246,0.15)'
                : 'rgba(10,14,19,0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border:
              locationState === 'granted'
                ? '1px solid rgba(59,130,246,0.4)'
                : locationState === 'denied'
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
            color:
              locationState === 'granted'
                ? '#3B82F6'
                : locationState === 'denied'
                ? 'rgba(255,255,255,0.2)'
                : 'rgba(232,230,225,0.6)',
            opacity: locationState === 'requesting' ? 0.65 : 1,
          }}
        >
          {locationState === 'requesting' ? (
            /* Loading spinner */
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ animation: 'locSpin 0.9s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" stroke="rgba(232,230,225,0.2)" strokeWidth="2" fill="none" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          ) : locationState === 'denied' ? (
            /* Denied — crossed-out location icon */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          ) : (
            /* Crosshair / target icon */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="2" x2="12" y2="7" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="2" y1="12" x2="7" y2="12" />
              <line x1="17" y1="12" x2="22" y2="12" />
            </svg>
          )}
        </button>
        <style>{`@keyframes locSpin { to { transform: rotate(360deg); } }`}</style>
      </div>

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
        <text x="452" y="192" textAnchor="middle" fill="#172E1F" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">CITY PARK</text>
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
        <text x="400" y="296" textAnchor="middle" fill="#182535" fontSize="8" fontFamily="system-ui, sans-serif" letterSpacing="0.18em">MAIN AVENUE</text>
        <text x="197" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 197, 260)">PARK BLVD</text>
        <text x="597" y="260" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em" transform="rotate(-90, 597, 260)">PARK AVE</text>
        <text x="750" y="296" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 57TH ST</text>
        <text x="50" y="148" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">W 59TH ST</text>
        <text x="750" y="448" textAnchor="middle" fill="#182535" fontSize="7" fontFamily="system-ui, sans-serif" letterSpacing="0.12em">E 55TH ST</text>

      </svg>

      <div className="absolute inset-0 bg-gradient-to-r from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--map-bg)] via-transparent to-[var(--map-bg)] opacity-30 pointer-events-none" />



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
          <span className="text-[11px] font-medium text-[var(--text-primary)] tracking-[0.03em]">Your Location</span>
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
