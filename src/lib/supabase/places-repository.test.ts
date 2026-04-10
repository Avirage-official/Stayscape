import { describe, it, expect } from 'vitest';
import {
  gradientForCategory,
  toDiscoveryCard,
  toDiscoveryDetail,
} from '@/lib/supabase/places-repository';
import type { InternalPlace, PlaceTag } from '@/types/database';

const makeMockPlace = (overrides: Partial<InternalPlace> = {}): InternalPlace => ({
  id: 'place-1',
  region_id: 'region-1',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  category: 'dining',
  subcategory: null,
  description: 'A great restaurant',
  editorial_summary: 'Highly recommended',
  latitude: 1.28,
  longitude: 103.85,
  address: '1 Test Street',
  address_line2: null,
  city: 'Singapore',
  country_code: 'SG',
  phone: '+65 1234 5678',
  website: 'https://example.com',
  booking_url: 'https://book.example.com',
  image_url: 'https://images.example.com/photo.jpg',
  image_urls: [],
  rating: 4.5,
  rating_count: 120,
  price_level: 2,
  opening_hours: null,
  is_featured: false,
  is_active: true,
  external_source: 'geoapify',
  external_id: 'geo-1',
  last_synced_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeMockTags = (): PlaceTag[] => [
  {
    id: 't1',
    place_id: 'place-1',
    tag: 'cozy',
    tag_type: 'general',
    source: 'manual',
    confidence: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't2',
    place_id: 'place-1',
    tag: 'date night',
    tag_type: 'vibe',
    source: 'ai',
    confidence: 0.9,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't3',
    place_id: 'place-1',
    tag: 'romantic dinner',
    tag_type: 'best_for',
    source: 'ai',
    confidence: 0.85,
    created_at: '2024-01-01T00:00:00Z',
  },
];

describe('gradientForCategory', () => {
  it('returns the correct gradient for a known category', () => {
    expect(gradientForCategory('dining')).toBe('from-amber-900/80 via-amber-950/60 to-black/80');
    expect(gradientForCategory('nightlife')).toBe('from-purple-900/80 via-purple-950/60 to-black/80');
    expect(gradientForCategory('nature')).toBe('from-emerald-900/80 via-emerald-950/60 to-black/80');
  });

  it('returns the default gray gradient for an unknown category', () => {
    expect(gradientForCategory('unknown')).toBe('from-gray-900/80 via-gray-950/60 to-black/80');
  });
});

describe('toDiscoveryCard', () => {
  it('maps InternalPlace fields to DiscoveryPlaceCard shape', () => {
    const place = makeMockPlace();
    const card = toDiscoveryCard(place, []);
    expect(card.id).toBe('place-1');
    expect(card.name).toBe('Test Restaurant');
    expect(card.category).toBe('dining');
    expect(card.description).toBe('A great restaurant');
    expect(card.rating).toBe(4.5);
    expect(card.distance).toBeNull();
    expect(card.image_url).toBe('https://images.example.com/photo.jpg');
    expect(card.booking_url).toBe('https://book.example.com');
    expect(card.is_featured).toBe(false);
  });

  it('assigns the correct gradient based on category', () => {
    const card = toDiscoveryCard(makeMockPlace({ category: 'nightlife' }), []);
    expect(card.gradient).toBe('from-purple-900/80 via-purple-950/60 to-black/80');
  });

  it('returns empty tag arrays when no tags are provided', () => {
    const card = toDiscoveryCard(makeMockPlace(), []);
    expect(card.tags).toEqual([]);
    expect(card.vibes).toEqual([]);
    expect(card.best_for).toEqual([]);
  });

  it('correctly splits tags by tag_type', () => {
    const card = toDiscoveryCard(makeMockPlace(), makeMockTags());
    expect(card.tags).toEqual(['cozy']);
    expect(card.vibes).toEqual(['date night']);
    expect(card.best_for).toEqual(['romantic dinner']);
  });
});

describe('toDiscoveryDetail', () => {
  it('extends the card with address and coordinate fields', () => {
    const place = makeMockPlace();
    const detail = toDiscoveryDetail(place, []);
    // Includes all card fields
    expect(detail.id).toBe('place-1');
    expect(detail.name).toBe('Test Restaurant');
    // Plus detail-only fields
    expect(detail.address).toBe('1 Test Street');
    expect(detail.latitude).toBe(1.28);
    expect(detail.longitude).toBe(103.85);
    expect(detail.phone).toBe('+65 1234 5678');
    expect(detail.website).toBe('https://example.com');
    expect(detail.image_urls).toEqual([]);
    expect(detail.things_to_do).toEqual([]);
  });
});
