import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const limit = vi.fn();
  const gte = vi.fn(() => ({ limit }));
  const eqLast = vi.fn(() => ({ gte }));
  const eqFirst = vi.fn(() => ({ eq: eqLast }));
  const select = vi.fn(() => ({ eq: eqFirst }));
  const from = vi.fn(() => ({ select }));

  return {
    applyRateLimit: vi.fn(),
    processWebhookBooking: vi.fn(),
    curateStay: vi.fn(),
    getSupabaseAdmin: vi.fn(() => ({ from })),
    from,
    select,
    eqFirst,
    eqLast,
    gte,
    limit,
  };
});

vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: mocks.applyRateLimit,
}));

vi.mock('@/lib/supabase/pms-repository', () => ({
  processWebhookBooking: mocks.processWebhookBooking,
}));

vi.mock('@/lib/services/ai/stay-curation', () => ({
  curateStay: mocks.curateStay,
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { POST } from './route';

describe('POST /api/pms/webhook', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    mocks.applyRateLimit.mockReset();
    mocks.processWebhookBooking.mockReset();
    mocks.curateStay.mockReset();
    mocks.from.mockClear();
    mocks.select.mockClear();
    mocks.eqFirst.mockClear();
    mocks.eqLast.mockClear();
    mocks.gte.mockClear();
    mocks.limit.mockReset();

    mocks.applyRateLimit.mockResolvedValue({ success: true, headers: {} });
    mocks.processWebhookBooking.mockResolvedValue({
      user_id: 'user-1',
      property_id: 'property-1',
      stay_id: 'stay-1',
      booking_reference: 'BOOK-1',
      region_id: 'region-1',
    });
    mocks.limit.mockResolvedValue({ data: [{ id: 'place-1' }], error: null });
  });

  it('skips curation when region data is fresh', async () => {
    vi.stubEnv('PMS_WEBHOOK_API_KEY', 'test-key');

    const request = new Request('http://localhost/api/pms/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pms-api-key': 'test-key',
      },
      body: JSON.stringify({
        booking_reference: 'BOOK-1',
        check_in: '2026-05-01',
        check_out: '2026-05-05',
        guest: { email: 'guest@example.com' },
        property: { pms_property_id: 'pms-1' },
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mocks.curateStay).not.toHaveBeenCalled();
    expect((body as { data: { curation_triggered: boolean; curation_skipped_reason?: string } }).data.curation_triggered).toBe(false);
    expect((body as { data: { curation_skipped_reason?: string } }).data.curation_skipped_reason).toBe('region_data_fresh');
  });
});
