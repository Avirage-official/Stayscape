import { describe, it, expect } from 'vitest';
import { mapGeoapifyCategory, slugify } from '@/lib/services/geoapify';

describe('mapGeoapifyCategory', () => {
  it('maps exact match catering.restaurant to dining', () => {
    expect(mapGeoapifyCategory(['catering.restaurant'])).toBe('dining');
  });

  it('maps exact match catering.bar to nightlife', () => {
    expect(mapGeoapifyCategory(['catering.bar'])).toBe('nightlife');
  });

  it('maps exact match entertainment.museum to historical', () => {
    expect(mapGeoapifyCategory(['entertainment.museum'])).toBe('historical');
  });

  it('maps prefix match for unknown subtype under entertainment', () => {
    // 'entertainment' is an exact key → fun_places
    // 'entertainment.unknown' → prefix 'entertainment' matches → fun_places
    expect(mapGeoapifyCategory(['entertainment.unknown_subtype'])).toBe('fun_places');
  });

  it('maps prefix match for unknown subtype under natural', () => {
    // 'natural' is an exact key → nature
    expect(mapGeoapifyCategory(['natural.beach'])).toBe('nature');
  });

  it('returns local_spots for an entirely unknown category', () => {
    expect(mapGeoapifyCategory(['something.random'])).toBe('local_spots');
  });

  it('returns local_spots for an empty array', () => {
    expect(mapGeoapifyCategory([])).toBe('local_spots');
  });
});

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('handles multiple spaces and collapses them to a single hyphen', () => {
    expect(slugify('test  place  name')).toBe('test-place-name');
  });

  it('strips leading and trailing hyphens from whitespace', () => {
    expect(slugify('  Hello  ')).toBe('hello');
  });

  it('removes special characters', () => {
    expect(slugify('Café & Bar!')).toBe('caf-bar');
  });

  it('preserves numbers', () => {
    expect(slugify('Area 51')).toBe('area-51');
  });

  it('handles already-lowercase input without hyphens', () => {
    expect(slugify('mytestplace')).toBe('mytestplace');
  });
});
