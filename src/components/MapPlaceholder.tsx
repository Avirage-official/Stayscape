'use client';

import type mapboxgl from 'mapbox-gl';
import { useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import {
  getMapboxToken,
  isMapboxAvailable,
  MAPBOX_DARK_STYLE,
  MAPBOX_DARK_STYLE_FALLBACK,
  MARKER_COLOR_GOLD,
  GEOLOCATION_ZOOM,
  GEOLOCATION_FLY_DURATION,
  GEOLOCATION_RECENTER_DURATION,
} from '@/lib/mapbox/config';
import MapSearch from '@/components/MapSearch';
import { useItinerary } from '@/components/ItineraryContext';
import type { SearchResult } from '@/types/mapbox';
import { useRegion } from '@/lib/context/region-context';
import type { MapPlace } from '@/types';
import type { StayCuration } from '@/types/pms';
import {
  DEFAULT_CENTER,
  DEFAULT_ITINERARY_TIME,
  DEFAULT_ITINERARY_DURATION_HOURS,
  SOURCE_ID,
  CLUSTER_LAYER,
  CLUSTER_COUNT_LAYER,
  UNCLUSTERED_LAYER,
  LABEL_LAYER,
  MARKER_COLOR_GREEN,
  MARKER_COLOR_PINK,
  SELECTED_DOT_COLOR,
  ANIMATION_GREEN,
  VIEWPORT_FETCH_LIMIT,
  BUILDINGS_3D_COLOR,
  BUILDINGS_3D_OPACITY,
  BUILDINGS_3D_MINZOOM,
  ITINERARY_CORNER_OFFSET,
} from './map/map-constants';
import { buildGeoJSONData, filterPlaces, getMapBounds } from './map/map-utils';
import MapCategoryFilter from './map/MapCategoryFilter';
import MapLocationButton from './map/MapLocationButton';
import MapPlaceCard from './map/MapPlaceCard';
import MapEventCard from './map/MapEventCard';
import MapSearchCard from './map/MapSearchCard';
import MapFallback from './map/MapFallback';


interface MapPlaceholderProps {
  onSelectPlace?: (place: MapPlace) => void;
  selectedPlaceId?: string | null;
  stayId?: string | null;
}

export interface MapPlaceholderHandle {
  flyTo: (lng: number, lat: number, placeName: string) => void;
}

const MapPlaceholder = forwardRef<MapPlaceholderHandle, MapPlaceholderProps>(
function MapPlaceholder({ onSelectPlace, selectedPlaceId, stayId }: MapPlaceholderProps, ref) {
  const { region } = useRegion();
  const { addItem } = useItinerary();
  /* Keep region in a ref so initMap (stable callback) can read the latest value */
  const regionRef = useRef(region);
  useEffect(() => {
    if (!region) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({
      center: [region.longitude, region.latitude],
      zoom: 13,
      duration: 1200,
    });
  }, [region]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const hotelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const placesRef = useRef<MapPlace[]>([]); /* cached Supabase places */
  const eventsRef = useRef<MapPlace[]>([]); /* cached events (fetched once per region) */
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

  /* ─── Curated places: place_id → { reason, name } map, and DOM markers ─── */
  const curatedPlaceInfoRef = useRef<Map<string, { reason: string; name: string; description: string }>>(new Map());
  const curatedMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const reconcileCuratedMarkersRef = useRef<(() => void) | null>(null);

  /* ─── Geolocation refs & state ─── */
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const userMapMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const requestGeolocationRef = useRef<() => void>(() => {});

  /* ─── Viewport fetch debounce ─── */
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ─── Filter panel open/close state ─── */
  const [filterOpen, setFilterOpen] = useState(false);
  const filterOpenRef = useRef(false);
  useEffect(() => { filterOpenRef.current = filterOpen; }, [filterOpen]);

  /* ─── Fetch recommended_places curations when stayId changes ─── */
  useEffect(() => {
    if (!stayId) {
      curatedPlaceInfoRef.current.clear();
      curatedMarkersRef.current.forEach((m) => m.remove());
      curatedMarkersRef.current = [];
      return;
    }
    fetch(`/api/curations?stay_id=${encodeURIComponent(stayId)}&type=recommended_places`)
      .then((res) => res.json())
      .then((body: { data?: StayCuration[]; error?: string }) => {
        if (body.error || !body.data?.length) return;
        const curation = body.data[0];
        if (!curation) return;
        curatedPlaceInfoRef.current.clear();
        curation.content.items.forEach((item) => {
          if (item.place_id) {
            curatedPlaceInfoRef.current.set(item.place_id, {
              name: item.name,
              reason: item.reason ?? '',
              description: item.description,
            });
          }
        });
        /* Try to reconcile if the map is already initialised */
        reconcileCuratedMarkersRef.current?.();
      })
      .catch(() => { /* silently ignore curation fetch errors */ });
  }, [stayId]);

  /* ─── 3D filter toggle animation ─── */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (filterOpen) {
      /* Tilt + rotate into 3D view */
      map.flyTo({ pitch: 60, bearing: 20, duration: 800 });
      /* Add 3D buildings from composite source */
      try {
        if (!map.getLayer('stayscape-3d-buildings')) {
          map.addLayer({
            id: 'stayscape-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', ['get', 'extrude'], 'true'],
            type: 'fill-extrusion',
            minzoom: BUILDINGS_3D_MINZOOM,
            paint: {
              'fill-extrusion-color': BUILDINGS_3D_COLOR,
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': BUILDINGS_3D_OPACITY,
            },
          });
        }
      } catch { /* composite source unavailable on fallback style */ }
    } else {
      /* Remove 3D buildings and settle back to flat view */
      try {
        if (map.getLayer('stayscape-3d-buildings')) {
          map.removeLayer('stayscape-3d-buildings');
        }
      } catch { /* ignore */ }
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    }
  }, [filterOpen]);

  /* ─── Stable getter for map instance — avoids ref access during render ─── */
  const _getMap = useCallback(() => mapInstanceRef.current, []);

  /* ─── Sonar ping: expanding ring at a map coordinate ─── */
  const showSonarPing = useCallback((lng: number, lat: number, color: string = ANIMATION_GREEN) => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;
    const projected = map.project([lng, lat]);
    const ping = document.createElement('div');
    ping.style.cssText = [
      'position:absolute',
      `left:${projected.x}px`,
      `top:${projected.y}px`,
      'width:0',
      'height:0',
      'border-radius:50%',
      `border:2px solid ${color}`,
      'animation:sonarPing 0.8s ease-out forwards',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'z-index:50',
    ].join(';');
    container.appendChild(ping);
    setTimeout(() => ping.remove(), 900);
  }, []);

  /* ─── Itinerary fly: dot animates from place to bottom-right corner ─── */
  const showItineraryFlyAnimation = useCallback((lng: number, lat: number) => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;
    const projected = map.project([lng, lat]);
    const rect = container.getBoundingClientRect();
    const targetX = rect.width - ITINERARY_CORNER_OFFSET;
    const targetY = rect.height - ITINERARY_CORNER_OFFSET;
    const dot = document.createElement('div');
    dot.style.cssText = [
      'position:absolute',
      `left:${projected.x}px`,
      `top:${projected.y}px`,
      'width:9px',
      'height:9px',
      'border-radius:50%',
      `background:${ANIMATION_GREEN}`,
      'transform:translate(-50%,-50%) scale(1)',
      'transition:left 0.6s cubic-bezier(0.4,0,0.2,1),top 0.6s cubic-bezier(0.4,0,0.2,1),opacity 0.6s ease,transform 0.6s ease',
      'pointer-events:none',
      'z-index:50',
      'opacity:1',
    ].join(';');
    container.appendChild(dot);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dot.style.left = `${targetX}px`;
        dot.style.top = `${targetY}px`;
        dot.style.opacity = '0';
        dot.style.transform = 'translate(-50%,-50%) scale(0.3)';
      });
    });
    setTimeout(() => dot.remove(), 700);
  }, []);

  /* ─── React state ─── */
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  /* ─── Active place: looked up from cached places ref ─── */
  const [activePlace, setActivePlace] = useState<MapPlace | null>(null);

  /* ─── Active event: set when user clicks an event dot ─── */
  const [activeEvent, setActiveEvent] = useState<MapPlace | null>(null);
  const setActiveEventRef = useRef<(e: MapPlace | null) => void>(setActiveEvent);
  useEffect(() => { setActiveEventRef.current = setActiveEvent; }, [setActiveEvent]);

  /* Sync activePlace when selectedPlaceId changes */
  useEffect(() => {
    if (selectedPlaceId) {
      const found = placesRef.current.find((p) => p.id === selectedPlaceId) ?? null;
      setActivePlace(found);
      setActiveEvent(null); /* clear event card when place is selected externally */
    } else {
      setActivePlace(null);
    }
  }, [selectedPlaceId]);

  /* ─── Spotlight: fly to selected place, dim others, restore on dismiss ─── */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (activePlace) {
      /* Fly camera to the selected place */
      map.flyTo({
        center: [activePlace.longitude, activePlace.latitude],
        zoom: 16,
        pitch: 45,
        bearing: -15,
        duration: 1200,
      });
      /* Dim all other dots */
      if (sourceAddedRef.current) {
        try {
          map.setPaintProperty(UNCLUSTERED_LAYER, 'circle-opacity', [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1.0,
            0.3,
          ]);
        } catch { /* layer may not exist yet */ }
      }
    } else {
      /* Restore full opacity and settle camera */
      if (sourceAddedRef.current) {
        try {
          map.setPaintProperty(UNCLUSTERED_LAYER, 'circle-opacity', 1.0);
        } catch { /* ignore */ }
      }
      if (!filterOpenRef.current) {
        map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      }
    }
  }, [activePlace]);

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
    const allItems = [...placesRef.current, ...eventsRef.current];
    const { geojson, idMap } = buildGeoJSONData(filterPlaces(allItems, activeCategory));
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

        /* ── Add GeoJSON source + all layers + one-time event listeners ── */
        const addSourceAndLayers = (m: mapboxgl.Map, geojson: GeoJSON.FeatureCollection) => {
          m.addSource(SOURCE_ID, {
            type: 'geojson',
            data: geojson,
            cluster: true,
            clusterMaxZoom: 13,
            clusterRadius: 50,
          });

          /* ── Cluster circles ── */
          m.addLayer({
            id: CLUSTER_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': 'rgba(10,14,19,0.75)',
              'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 50, 26],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': 'rgba(255,255,255,0.2)',
              'circle-blur': 0,
            },
          });

          /* ── Cluster count labels ── */
          m.addLayer({
            id: CLUSTER_COUNT_LAYER,
            type: 'symbol',
            source: SOURCE_ID,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-size': 12,
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#FFFFFF',
              'text-opacity': 1,
            },
          });

          /* ── Individual place dots — bright green, bold, visible; pink for events ── */
          m.addLayer({
            id: UNCLUSTERED_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false], SELECTED_DOT_COLOR,
                ['boolean', ['get', 'isEvent'], false], MARKER_COLOR_PINK,
                MARKER_COLOR_GREEN,
              ],
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                10, 6, 13, 8, 16, 10,
              ],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false], 'rgba(255,255,255,0.9)',
                'rgba(255,255,255,0.5)',
              ],
              'circle-blur': [
                'case',
                ['boolean', ['feature-state', 'selected'], false], 0.15,
                0,
              ],
              'circle-opacity': 1.0,
            },
          });

          /* ── Place name labels at high zoom ── */
          m.addLayer({
            id: LABEL_LAYER,
            type: 'symbol',
            source: SOURCE_ID,
            filter: ['!', ['has', 'point_count']],
            minzoom: 16,
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 9,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-max-width': 8,
              'text-allow-overlap': false,
              'text-optional': true,
            },
            paint: {
              'text-color': 'rgba(232,230,225,0.65)',
              'text-halo-color': 'rgba(10,14,19,0.9)',
              'text-halo-width': 0.8,
            },
          });

          sourceAddedRef.current = true;

          /* ── Cluster click: zoom in ── */
          m.on('click', CLUSTER_LAYER, (e) => {
            const feature = e.features?.[0];
            if (!feature) return;
            const clusterId = feature.properties?.cluster_id as number;
            const geometry = feature.geometry as GeoJSON.Point;
            const src = m.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
            src.getClusterExpansionZoom(clusterId, (err: Error | null | undefined, zoom: number | null | undefined) => {
              if (err || zoom == null) return;
              m.easeTo({ center: [geometry.coordinates[0], geometry.coordinates[1]], zoom });
            });
          });

          /* ── Individual place/event click: show info card ── */
          m.on('click', UNCLUSTERED_LAYER, (e) => {
            const feature = e.features?.[0];
            if (!feature) return;
            e.originalEvent.stopPropagation();
            const itemId = feature.properties?.id as string;
            const isEventDot = feature.properties?.isEvent as boolean;
            if (isEventDot) {
              const event = eventsRef.current.find((ev) => ev.id === itemId);
              if (event) setActiveEventRef.current(event);
            } else {
              const place = placesRef.current.find((p) => p.id === itemId);
              if (place) {
                onSelectPlaceRef.current?.(place);
                setActiveEventRef.current(null); /* clear event card when place is clicked */
              }
            }
          });

          /* ── Hover: pointer cursor + glow ── */
          m.on('mousemove', UNCLUSTERED_LAYER, (e) => {
            const feature = e.features?.[0];
            const fid = feature?.id as number | undefined;
            if (hoveredIdRef.current !== null && hoveredIdRef.current !== fid) {
              try { m.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { hovered: false }); } catch { /* ignore */ }
            }
            if (fid !== undefined && fid !== hoveredIdRef.current) {
              try { m.setFeatureState({ source: SOURCE_ID, id: fid }, { hovered: true }); } catch { /* ignore */ }
              hoveredIdRef.current = fid;
            }
            m.getCanvas().style.cursor = 'pointer';
          });
          m.on('mouseleave', UNCLUSTERED_LAYER, () => {
            if (hoveredIdRef.current !== null) {
              try { m.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { hovered: false }); } catch { /* ignore */ }
              hoveredIdRef.current = null;
            }
            m.getCanvas().style.cursor = '';
          });

          /* ── Cluster hover: pointer cursor ── */
          m.on('mouseenter', CLUSTER_LAYER, () => { m.getCanvas().style.cursor = 'pointer'; });
          m.on('mouseleave', CLUSTER_LAYER, () => { m.getCanvas().style.cursor = ''; });
        };

        /* ── Update map source data; add layers on first call ── */
        const updateMapSource = (m: mapboxgl.Map, places: MapPlace[]) => {
          /* Merge places and events into a single list for clustering */
          const allItems = [...places, ...eventsRef.current];
          const filtered = filterPlaces(allItems, activeCategoryRef.current);
          const { geojson, idMap } = buildGeoJSONData(filtered);
          uuidToFeatureIdRef.current = idMap;

          const source = m.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
          if (source) {
            source.setData(geojson);
            /* Feature states reset on setData — clear tracking refs */
            prevSelectedIdRef.current = null;
            hoveredIdRef.current = null;
          } else {
            /* First time — add source and all layers with event listeners */
            addSourceAndLayers(m, geojson);

            /* Restore selected state after initial load */
            if (selectedPlaceIdRef.current) {
              const numericId = uuidToFeatureIdRef.current.get(selectedPlaceIdRef.current);
              if (numericId !== undefined) {
                try {
                  m.setFeatureState({ source: SOURCE_ID, id: numericId }, { selected: true });
                  prevSelectedIdRef.current = numericId;
                } catch { /* ignore */ }
              }
            }
          }

          /* Reconcile curated markers after source update */
          reconcileCuratedMarkers(m);
        };

        /* ── Curated place gold-star markers ── */
        const reconcileCuratedMarkers = (m: mapboxgl.Map) => {
          /* Remove old curated markers */
          curatedMarkersRef.current.forEach((marker) => marker.remove());
          curatedMarkersRef.current = [];

          if (curatedPlaceInfoRef.current.size === 0) return;

          curatedPlaceInfoRef.current.forEach((info, placeId) => {
            const place = placesRef.current.find((p) => p.id === placeId);
            if (!place) return;

            /* Gold star marker element */
            const el = document.createElement('div');
            el.style.cssText = 'cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;';
            el.innerHTML = [
              '<div style="',
              'position:relative;',
              'width:30px;height:30px;',
              'border-radius:50%;',
              'background:rgba(201,168,76,0.15);',
              'border:1.5px solid rgba(201,168,76,0.7);',
              'display:flex;align-items:center;justify-content:center;',
              'box-shadow:0 0 14px rgba(201,168,76,0.45),0 0 5px rgba(201,168,76,0.6);',
              'animation:gentlePulse 3s ease-in-out infinite;',
              '">',
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="#C9A84C" style="filter:drop-shadow(0 0 3px rgba(201,168,76,0.7))">',
              '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
              '</svg>',
              '</div>',
            ].join('');

            el.addEventListener('click', () => {
              /* Show the place in the standard info card, with reason as editorial summary */
              onSelectPlaceRef.current?.({
                ...place,
                editorial_summary: info.reason || place.editorial_summary,
              });
            });

            const marker = new mapboxgl.default.Marker({ element: el, anchor: 'center' })
              .setLngLat([place.longitude, place.latitude])
              .addTo(m);
            curatedMarkersRef.current.push(marker);
          });
        };

        /* Store reconcile fn in ref so the stayId effect can trigger it */
        reconcileCuratedMarkersRef.current = () => reconcileCuratedMarkers(map);

        /* ── Viewport-based fetch: debounced, merges into cache ── */
        const fetchPlacesForViewport = (m: mapboxgl.Map) => {
          if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);

          fetchDebounceRef.current = setTimeout(() => {
            fetchDebounceRef.current = null;
            const activeRegionId = regionRef.current?.id;
            if (!activeRegionId) return;

            const bounds = getMapBounds(m);
            if (!bounds) return;
            const params = new URLSearchParams({
              region_id: activeRegionId,
              north: String(bounds.north),
              south: String(bounds.south),
              east: String(bounds.east),
              west: String(bounds.west),
              limit: String(VIEWPORT_FETCH_LIMIT),
            });

            fetch(`/api/places?${params}`)
              .then((res) => res.json())
              .then((body: { data?: MapPlace[]; error?: string }) => {
                if (body.error) {
                  console.warn('[Stayscape Map] Places API error:', body.error);
                  return;
                }
                const incoming: MapPlace[] = body.data ?? [];

                /* Merge with existing cached places (accumulate, don't replace) */
                const existingMap = new Map(placesRef.current.map((p) => [p.id, p]));
                incoming.forEach((p) => existingMap.set(p.id, p));
                placesRef.current = Array.from(existingMap.values());

                updateMapSource(m, placesRef.current);
              })
              .catch((err) => {
                console.warn('[Stayscape Map] Failed to fetch places:', err);
              });
          }, 300);
        };

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
            '  <div style="background:#141418;border:1px solid rgba(201,168,76,0.2);border-radius:5px;padding:3px 9px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5);">',
                `    <span style="font-size:10px;font-family:system-ui,sans-serif;color:#E8E6E1;letter-spacing:0.04em;font-weight:500;">${regionLabel}</span>`,
            '  </div>',
            '</div>',
          ].join('');
          hotelMarkerRef.current = new mapboxgl.default.Marker({ element: hotelEl, anchor: 'center' })
            .setLngLat([center.lng, center.lat])
            .addTo(map);

          /* ── Initial viewport fetch ── */
          fetchPlacesForViewport(map);

          /* ── Fetch events once for this region (not on every moveend) ── */
          const fetchEventsForRegion = () => {
            const activeRegionId = regionRef.current?.id;
            if (!activeRegionId) return;
            fetch(`/api/discovery/events?region_id=${encodeURIComponent(activeRegionId)}&limit=100`)
              .then((res) => res.json())
              .then((body: { data?: Array<{ id: string; name: string; category: string; description: string; editorial_summary: string | null; venue_name: string | null; latitude: number | null; longitude: number | null; image_url: string | null; start_date: string; end_date: string | null; start_time: string | null; price_min: number | null; price_max: number | null; currency: string | null; ticket_url: string | null }>; error?: string }) => {
                if (body.error) {
                  console.warn('[Stayscape Map] Events API error:', body.error);
                  return;
                }
                eventsRef.current = (body.data ?? [])
                  .filter((ev) => ev.latitude != null && ev.longitude != null)
                  .map((ev) => ({
                    id: ev.id,
                    name: ev.name,
                    category: 'events',
                    description: ev.description ?? null,
                    editorial_summary: ev.editorial_summary ?? null,
                    latitude: ev.latitude as number,
                    longitude: ev.longitude as number,
                    address: null,
                    rating: null,
                    booking_url: ev.ticket_url ?? null,
                    website: ev.ticket_url ?? null,
                    image_url: ev.image_url ?? null,
                    isEvent: true,
                    ticket_url: ev.ticket_url ?? null,
                    price_min: ev.price_min ?? null,
                    price_max: ev.price_max ?? null,
                    currency: ev.currency ?? null,
                    venue_name: ev.venue_name ?? null,
                    start_date: ev.start_date,
                    end_date: ev.end_date ?? null,
                    start_time: ev.start_time ?? null,
                  }));
                /* Re-render source with events merged in */
                updateMapSource(map, placesRef.current);
              })
              .catch((err) => {
                console.warn('[Stayscape Map] Failed to fetch events:', err);
              });
          };
          fetchEventsForRegion();

          /* ── Re-fetch on pan / zoom ── */
          map.on('moveend', () => {
            fetchPlacesForViewport(map);
          });
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
    const fetchDebounce = fetchDebounceRef;
    const curatedMarkers = curatedMarkersRef;
    return () => {
      hotelMarker.current?.remove();
      hotelMarker.current = null;
      userMarker.current?.remove();
      userMarker.current = null;
      searchMarker.current?.remove();
      searchMarker.current = null;
      curatedMarkers.current.forEach((m) => m.remove());
      curatedMarkers.current = [];
      if (itinAddedTimer.current) {
        clearTimeout(itinAddedTimer.current);
        itinAddedTimer.current = null;
      }
      if (fallbackTimeout.current) {
        clearTimeout(fallbackTimeout.current);
        fallbackTimeout.current = null;
      }
      if (fetchDebounce.current) {
        clearTimeout(fetchDebounce.current);
        fetchDebounce.current = null;
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

      /* Swoop over the city: fly with pitch, then settle flat + show ripple */
      map.flyTo({ center: [result.lng, result.lat], zoom: 16, pitch: 45, duration: 1500 });
      map.once('moveend', () => {
        map.easeTo({ pitch: 0, duration: 600 });
        showSonarPing(result.lng, result.lat, MARKER_COLOR_GOLD);
      });
    }).catch((err) => {
      console.warn('[Stayscape Map] Failed to place search result marker:', err);
    });

    setSearchedPlace(result);
  }, [showSonarPing]);

  /* ─── Search — clear ─── */
  const handleSearchClear = useCallback(() => {
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
    setSearchedPlace(null);
  }, []);

  /* ─── Imperative handle: expose flyTo to parent via ref ─── */
  useImperativeHandle(ref, () => ({
    flyTo(lng: number, lat: number, placeName: string) {
      handleSearchSelect({
        id: `external-${lng}-${lat}`,
        name: placeName,
        fullAddress: placeName,
        subtitle: '',
        lat,
        lng,
        distanceMetres: 0,
        distanceDisplay: '',
        source: 'mapbox',
      });
    },
  }), [handleSearchSelect]);


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

      {/* ── Category filter — left-side collapsible toggle ── */}
      <MapCategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
      />

      {/* ── Map search overlay (floating, centered) ── */}
      <MapSearch onSelect={handleSearchSelect} onClear={handleSearchClear} />

      {/* ── Selected place info card (hidden when event card is active) ── */}
      {activePlace && !activeEvent && (
        <MapPlaceCard
          place={activePlace}
          region={region}
          itinAdded={itinAdded}
          onAddToItinerary={() => {
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
            showSonarPing(activePlace.longitude, activePlace.latitude);
            showItineraryFlyAnimation(activePlace.longitude, activePlace.latitude);
          }}
        />
      )}

      {/* ── Selected event info card ── */}
      {activeEvent && (
        <MapEventCard
          event={activeEvent}
          itinAdded={itinAdded}
          onAddToItinerary={() => {
            addItem({
              placeId: activeEvent.id,
              name: activeEvent.name,
              category: activeEvent.category,
              image: activeEvent.image_url ?? '',
              date: new Date(),
              time: DEFAULT_ITINERARY_TIME,
              durationHours: DEFAULT_ITINERARY_DURATION_HOURS,
            });
            setItinAdded(activeEvent.id);
            if (itinAddedTimerRef.current) clearTimeout(itinAddedTimerRef.current);
            itinAddedTimerRef.current = setTimeout(() => setItinAdded(null), 2500);
            showSonarPing(activeEvent.longitude, activeEvent.latitude, MARKER_COLOR_PINK);
            showItineraryFlyAnimation(activeEvent.longitude, activeEvent.latitude);
          }}
          onClose={() => setActiveEvent(null)}
        />
      )}

      {/* ── Searched place info card (geocoding result) ── */}
      {searchedPlace && !activePlace && !activeEvent && (
        <MapSearchCard searchedPlace={searchedPlace} />
      )}

      {/* ── My Location button (Google Maps style, bottom-right) ── */}
      <MapLocationButton locationState={locationState} onRequestLocation={requestGeolocation} />

      {/* ── Map attribution ── */}
      <div className="absolute bottom-2 left-3 text-[8px] tracking-wide z-10" style={{ color: 'rgba(107,114,128,0.5)' }}>
        © Stayscape · Mapbox
      </div>
    </div>
  );
});

MapPlaceholder.displayName = 'MapPlaceholder';

export default MapPlaceholder;
