import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    applyRateLimit: vi.fn(),
    processWebhookBooking: vi.fn(),
    createRegionForProperty: vi.fn(),
    seedPlacesForRegion: vi.fn(),
  };
});

vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: mocks.applyRateLimit,
}));

vi.mock('@/lib/supabase/pms-repository', () => ({
  processWebhookBooking: mocks.processWebhookBooking,
}));

vi.mock('@/lib/services/ai/region-creation', () => ({
  createRegionForProperty: mocks.createRegionForProperty,
  seedPlacesForRegion: mocks.seedPlacesForRegion,
}));

import { POST } from './route';

describe('POST /api/pms/webhook', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    mocks.applyRateLimit.mockReset();
    mocks.processWebhookBooking.mockReset();
    mocks.createRegionForProperty.mockReset();
    mocks.seedPlacesForRegion.mockReset();

    mocks.applyRateLimit.mockResolvedValue({ success: true, headers: {} });
    mocks.processWebhookBooking.mockResolvedValue({
      guest_email: 'guest@example.com',
      property_id: 'property-1',
      stay_id: 'stay-1',
      booking_reference: 'BOOK-1',
      region_id: 'region-1',
    });
  });

  it('returns pre-registered booking data', async () => {
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
    const body = await response.json() as { data: Record<string, unknown> };

    expect(response.status).toBe(201);
    expect(body.data.booking_reference).toBe('BOOK-1');
    expect(body.data.guest_email).toBe('guest@example.com');
    expect(body.data.stay_id).toBe('stay-1');
    expect(body.data.message).toBe('Booking pre-registered successfully');
    expect(mocks.createRegionForProperty).not.toHaveBeenCalled();
  });
});
