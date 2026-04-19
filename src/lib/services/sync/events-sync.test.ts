import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  getAvailableProviders: vi.fn(),
  getEventProvider: vi.fn(),
  createSyncRun: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

vi.mock('@/lib/services/events', () => ({
  getAvailableProviders: mocks.getAvailableProviders,
  getEventProvider: mocks.getEventProvider,
}));

vi.mock('@/lib/supabase', () => ({
  upsertEvent: vi.fn(),
  deactivateExpiredEvents: vi.fn(),
  deactivateStaleEvents: vi.fn(),
  createSyncRun: mocks.createSyncRun,
  completeSyncRun: vi.fn(),
  failSyncRun: vi.fn(),
}));

vi.mock('@/lib/services/ai/enrichment', () => ({
  enrichNewEvents: vi.fn(),
}));

import { syncEvents } from './events-sync';

describe('syncEvents', () => {
  beforeEach(() => {
    mocks.getSupabaseAdmin.mockReset();
    mocks.getAvailableProviders.mockReset();
    mocks.getEventProvider.mockReset();
    mocks.createSyncRun.mockReset();

    mocks.getSupabaseAdmin.mockReturnValue({});
  });

  it('returns early when no providers are registered', async () => {
    mocks.getAvailableProviders.mockReturnValue([]);

    const result = await syncEvents({
      region_id: 'region-1',
      latitude: 1.3,
      longitude: 103.8,
    });

    expect(result).toEqual({
      sync_run_id: 'skipped_no_provider',
      records_fetched: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
      records_expired: 0,
    });
    expect(mocks.createSyncRun).not.toHaveBeenCalled();
    expect(mocks.getEventProvider).not.toHaveBeenCalled();
  });
});
