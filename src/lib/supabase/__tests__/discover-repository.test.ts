import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    result: { data: [] as unknown[], error: null as unknown },
  };

  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    order: vi.fn(() => queryBuilder),
    then: (
      onFulfilled: (value: typeof state.result) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(state.result).then(onFulfilled, onRejected),
  };

  const from = vi.fn(() => queryBuilder);
  const getSupabaseBrowser = vi.fn<() => { from: typeof from } | null>(() => ({ from }));

  return { state, queryBuilder, from, getSupabaseBrowser };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowser: mocks.getSupabaseBrowser,
}));

import { fetchCategories } from '../discover-repository';

describe('fetchCategories', () => {
  beforeEach(() => {
    mocks.state.result = { data: [], error: null };
    mocks.queryBuilder.select.mockClear();
    mocks.queryBuilder.order.mockClear();
    mocks.from.mockClear();
    mocks.getSupabaseBrowser.mockClear();
    mocks.getSupabaseBrowser.mockReturnValue({ from: mocks.from });
  });

  it('returns mapped categories with id from slug and placesCategory from places_category', async () => {
    mocks.state.result = {
      data: [{
        id: 'db-row-id',
        propertyid: null,
        slug: 'top-places',
        name: 'Top Places',
        categorytype: 'discover',
        iconname: '⭐',
        imageurl: 'https://example.com/top.jpg',
        sortorder: 1,
        isactive: true,
        createdat: '2026-01-01T00:00:00Z',
        updatedat: '2026-01-01T00:00:00Z',
        subtitle: 'Must-see landmarks',
        places_category: 'topplaces',
      }],
      error: null,
    };

    const result = await fetchCategories();

    expect(result).toEqual([{
      id: 'top-places',
      label: 'Top Places',
      icon: '⭐',
      image: 'https://example.com/top.jpg',
      subtitle: 'Must-see landmarks',
      placesCategory: 'topplaces',
    }]);
  });

  it('returns null when Supabase browser client is unavailable', async () => {
    mocks.getSupabaseBrowser.mockReturnValueOnce(null);
    const result = await fetchCategories();
    expect(result).toBeNull();
  });

  it('returns null when query returns an empty result', async () => {
    mocks.state.result = { data: [], error: null };
    const result = await fetchCategories();
    expect(result).toBeNull();
  });
});
