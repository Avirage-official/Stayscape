import { describe, it, expect } from 'vitest';
import { getCategoryColor, filterPlaces, buildGeoJSONData } from '@/components/map/map-utils';
import type { MapPlace } from '@/types';

const makePlaces = (): MapPlace[] => [
  {
    id: 'p1',
    name: 'The Grill',
    category: 'dining',
    description: null,
    editorial_summary: null,
    latitude: 1.28,
    longitude: 103.85,
    address: null,
    rating: 4.5,
    booking_url: null,
    website: null,
    image_url: null,
  },
  {
    id: 'p2',
    name: 'Night Owl',
    category: 'nightlife',
    description: null,
    editorial_summary: null,
    latitude: 1.30,
    longitude: 103.86,
    address: null,
    rating: 4.2,
    booking_url: null,
    website: null,
    image_url: null,
  },
  {
    id: 'p3',
    name: 'Jazz Bar',
    category: 'nightlife',
    description: null,
    editorial_summary: null,
    latitude: 1.31,
    longitude: 103.87,
    address: null,
    rating: 4.0,
    booking_url: null,
    website: null,
    image_url: null,
  },
];

describe('getCategoryColor', () => {
  it('returns the correct color for a known category', () => {
    expect(getCategoryColor('dining')).toBe('#F59E0B');
    expect(getCategoryColor('nightlife')).toBe('#8B5CF6');
    expect(getCategoryColor('nature')).toBe('#10B981');
  });

  it('returns the default gray color for an unknown category', () => {
    expect(getCategoryColor('unknown_category')).toBe('#6B7280');
  });
});

describe('filterPlaces', () => {
  it('returns all places when category is "all"', () => {
    const places = makePlaces();
    expect(filterPlaces(places, 'all')).toHaveLength(3);
  });

  it('filters to only the matching category', () => {
    const places = makePlaces();
    const result = filterPlaces(places, 'nightlife');
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.category === 'nightlife')).toBe(true);
  });

  it('returns an empty array when no places match', () => {
    const places = makePlaces();
    expect(filterPlaces(places, 'wellness')).toHaveLength(0);
  });

  it('handles an empty input array', () => {
    expect(filterPlaces([], 'all')).toHaveLength(0);
  });
});

describe('buildGeoJSONData', () => {
  it('builds a valid FeatureCollection from an array of places', () => {
    const places = makePlaces();
    const { geojson } = buildGeoJSONData(places);
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(3);
  });

  it('maps place IDs correctly into the idMap', () => {
    const places = makePlaces();
    const { idMap } = buildGeoJSONData(places);
    expect(idMap.get('p1')).toBe(0);
    expect(idMap.get('p2')).toBe(1);
    expect(idMap.get('p3')).toBe(2);
  });

  it('sets coordinates in [longitude, latitude] order', () => {
    const places = makePlaces();
    const { geojson } = buildGeoJSONData(places);
    const first = geojson.features[0];
    expect(first.geometry.type).toBe('Point');
    if (first.geometry.type === 'Point') {
      expect(first.geometry.coordinates).toEqual([103.85, 1.28]);
    }
  });

  it('returns an empty FeatureCollection for an empty input', () => {
    const { geojson, idMap } = buildGeoJSONData([]);
    expect(geojson.features).toHaveLength(0);
    expect(idMap.size).toBe(0);
  });
});
