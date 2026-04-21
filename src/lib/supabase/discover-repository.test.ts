import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    eqCalls: [] as Array<[string, unknown]>,
    rangeArgs: null as [number, number] | null,
    result: { data: [] as unknown[], error: null as unknown },
  };

  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn((column: string, value: unknown) => {
      state.eqCalls.push([column, value]);
      return queryBuilder;
    }),
    order: vi.fn(() => queryBuilder),
    range: vi.fn((from: number, to: number) => {
      state.rangeArgs = [from, to];
      return queryBuilder;
    }),
    then: (
      onFulfilled: (value: typeof state.result) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(state.result).then(onFulfilled, onRejected),
  };

  const from = vi.fn(() => queryBuilder);
  const getSupabaseBrowser = vi.fn<() => { from: typeof from } | null>(() => ({ from }));
  const gradientForCategory = vi.fn((category: string) => `gradient-${category}`);

  return {
    state,
    queryBuilder,
    from,
    getSupabaseBrowser,
    gradientForCategory,
  };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowser: mocks.getSupabaseBrowser,
}));

vi.mock('@/lib/supabase/places-repository', () => ({
  gradientForCategory: mocks.gradientForCategory,
}));

import { fetchPlacesAsDiscoverItems } from './discover-repository';

describe('fetchPlacesAsDiscoverItems', () => {
  beforeEach(() => {
    mocks.state.eqCalls = [];
    mocks.state.rangeArgs = null;
    mocks.state.result = { data: [], error: null };
    mocks.queryBuilder.select.mockClear();
    mocks.queryBuilder.eq.mockClear();
    mocks.queryBuilder.order.mockClear();
    mocks.queryBuilder.range.mockClear();
    mocks.from.mockClear();
    mocks.getSupabaseBrowser.mockClear();
    mocks.getSupabaseBrowser.mockReturnValue({ from: mocks.from });
    mocks.gradientForCategory.mockClear();
  });

  it('filters by region and category, and clamps limit to 21 for pagination probe', async () => {
    mocks.state.result = {
      data: [
        {
          id: 'p1',
          name: 'Place 1',
          category: 'dining',
          description: 'desc',
          rating: 4.5,
          image_url: null,
          booking_url: null,
        },
      ],
      error: null,
    };

    const result = await fetchPlacesAsDiscoverItems('region-1', 99, 0, 'dining');

    expect(mocks.from).toHaveBeenCalledWith('places');
    expect(mocks.state.rangeArgs).toEqual([0, 20]);
    expect(mocks.state.eqCalls).toEqual(
      expect.arrayContaining([
        ['is_active', true],
        ['region_id', 'region-1'],
        ['category', 'dining'],
      ]),
    );
    expect(result?.[0].gradient).toBe('gradient-dining');
  });

  it('returns null when Supabase browser client is unavailable', async () => {
    mocks.getSupabaseBrowser.mockReturnValueOnce(null);
    const result = await fetchPlacesAsDiscoverItems('region-1', 10, 0, 'dining');
    expect(result).toBeNull();
  });
});
