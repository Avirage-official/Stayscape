import { describe, it, expect } from 'vitest';
import { toDiscoveryEventCard, toDiscoveryEventDetail } from '@/lib/supabase/events-repository';
import type { InternalEvent, EventTag } from '@/types/database';

const makeMockEvent = (overrides: Partial<InternalEvent> = {}): InternalEvent => ({
  id: 'event-1',
  region_id: 'region-1',
  name: 'Jazz Night',
  slug: 'jazz-night',
  description: 'An evening of live jazz',
  editorial_summary: null,
  category: 'events',
  subcategory: null,
  venue_name: 'Blue Note',
  latitude: 1.28,
  longitude: 103.85,
  address: '5 Music Lane',
  city: 'Singapore',
  country_code: 'SG',
  image_url: 'https://images.example.com/jazz.jpg',
  image_urls: ['https://images.example.com/jazz.jpg'],
  ticket_url: 'https://tickets.example.com/jazz-night',
  price_min: 30,
  price_max: 80,
  currency: 'SGD',
  start_date: '2024-12-15',
  end_date: '2024-12-15',
  start_time: '20:00',
  end_time: '23:00',
  is_featured: true,
  is_active: true,
  external_source: 'ticketmaster',
  external_id: 'tm-123',
  last_synced_at: null,
  expires_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeMockTags = (): EventTag[] => [
  {
    id: 'et1',
    event_id: 'event-1',
    tag: 'live music',
    tag_type: 'general',
    source: 'manual',
    confidence: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'et2',
    event_id: 'event-1',
    tag: 'date night',
    tag_type: 'vibe',
    source: 'ai',
    confidence: 0.9,
    created_at: '2024-01-01T00:00:00Z',
  },
];

describe('toDiscoveryEventCard', () => {
  it('maps InternalEvent fields to DiscoveryEventCard shape', () => {
    const event = makeMockEvent();
    const card = toDiscoveryEventCard(event, []);
    expect(card.id).toBe('event-1');
    expect(card.name).toBe('Jazz Night');
    expect(card.category).toBe('events');
    expect(card.description).toBe('An evening of live jazz');
    expect(card.venue_name).toBe('Blue Note');
    expect(card.start_date).toBe('2024-12-15');
    expect(card.price_min).toBe(30);
    expect(card.price_max).toBe(80);
    expect(card.ticket_url).toBe('https://tickets.example.com/jazz-night');
    expect(card.is_featured).toBe(true);
  });

  it('returns empty tag arrays when no tags are provided', () => {
    const card = toDiscoveryEventCard(makeMockEvent(), []);
    expect(card.tags).toEqual([]);
    expect(card.vibes).toEqual([]);
  });

  it('correctly splits tags by tag_type', () => {
    const card = toDiscoveryEventCard(makeMockEvent(), makeMockTags());
    expect(card.tags).toEqual(['live music']);
    expect(card.vibes).toEqual(['date night']);
  });
});

describe('toDiscoveryEventDetail', () => {
  it('extends the card with address, end_time, and image_urls', () => {
    const event = makeMockEvent();
    const detail = toDiscoveryEventDetail(event, []);
    // Includes all card fields
    expect(detail.id).toBe('event-1');
    expect(detail.name).toBe('Jazz Night');
    // Plus detail-only fields
    expect(detail.address).toBe('5 Music Lane');
    expect(detail.end_time).toBe('23:00');
    expect(detail.image_urls).toEqual(['https://images.example.com/jazz.jpg']);
  });
});
