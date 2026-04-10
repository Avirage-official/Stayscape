import type mapboxgl from 'mapbox-gl';
import { CATEGORY_COLORS } from '@/lib/mapbox/config';
import type { MapPlace } from '@/types';

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#6B7280';
}

export function buildGeoJSONData(places: MapPlace[]): { geojson: GeoJSON.FeatureCollection; idMap: Map<string, number> } {
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
        isEvent: p.isEvent ?? false,
      },
    };
  });
  return { geojson: { type: 'FeatureCollection', features }, idMap };
}

export function filterPlaces(places: MapPlace[], category: string): MapPlace[] {
  return category === 'all' ? places : places.filter((p) => p.category === category);
}

export function getMapBounds(map: mapboxgl.Map): { north: number; south: number; east: number; west: number } | null {
  const bounds = map.getBounds();
  if (!bounds) return null;
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}
