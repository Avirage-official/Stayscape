import { describe, it, expect } from 'vitest';
import { CATEGORY_FILTERS } from '@/components/map/map-constants';

describe('CATEGORY_FILTERS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CATEGORY_FILTERS)).toBe(true);
    expect(CATEGORY_FILTERS.length).toBeGreaterThan(0);
  });

  it('each entry has a "key" and a "label" property', () => {
    for (const filter of CATEGORY_FILTERS) {
      expect(filter).toHaveProperty('key');
      expect(filter).toHaveProperty('label');
      expect(typeof filter.key).toBe('string');
      expect(typeof filter.label).toBe('string');
    }
  });

  it('contains an "all" category as the first entry', () => {
    const allFilter = CATEGORY_FILTERS.find((f) => f.key === 'all');
    expect(allFilter).toBeDefined();
    expect(CATEGORY_FILTERS[0].key).toBe('all');
  });

  it('includes expected content categories', () => {
    const keys = CATEGORY_FILTERS.map((f) => f.key);
    expect(keys).toContain('dining');
    expect(keys).toContain('nightlife');
    expect(keys).toContain('nature');
  });
});
