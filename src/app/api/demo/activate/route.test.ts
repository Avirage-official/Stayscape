import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const eq = vi.fn();
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  const getSupabaseAdmin = vi.fn(() => ({ from }));
  const applyRateLimit = vi.fn();
  const getCustomerProfile = vi.fn();
  const getDemoBookingPayload = vi.fn();
  const processWebhookBooking = vi.fn();
  const curateStay = vi.fn();
  return {
    eq,
    update,
    from,
    getSupabaseAdmin,
    applyRateLimit,
    getCustomerProfile,
    getDemoBookingPayload,
    processWebhookBooking,
    curateStay,
  };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));
vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: mocks.applyRateLimit,
}));
vi.mock('@/lib/supabase/customer-repository', () => ({
  getCustomerProfile: mocks.getCustomerProfile,
}));
vi.mock('@/lib/data/demo-bookings', () => ({
  getDemoBookingPayload: mocks.getDemoBookingPayload,
}));
vi.mock('@/lib/supabase/pms-repository', () => ({
  processWebhookBooking: mocks.processWebhookBooking,
}));
vi.mock('@/lib/services/ai/stay-curation', () => ({
  curateStay: mocks.curateStay,
}));

import { POST } from './route';

describe('POST /api/demo/activate', () => {
  beforeEach(() => {
    mocks.eq.mockReset();
    mocks.update.mockReset();
    mocks.from.mockReset();
    mocks.getSupabaseAdmin.mockReset();
    mocks.applyRateLimit.mockReset();
    mocks.getCustomerProfile.mockReset();
    mocks.getDemoBookingPayload.mockReset();
    mocks.processWebhookBooking.mockReset();
    mocks.curateStay.mockReset();

    mocks.eq.mockResolvedValue({ error: null });
    mocks.update.mockImplementation(() => ({ eq: mocks.eq }));
    mocks.from.mockImplementation(() => ({ update: mocks.update }));
    mocks.getSupabaseAdmin.mockImplementation(() => ({ from: mocks.from }));
    mocks.applyRateLimit.mockResolvedValue({ success: true, headers: {} });
    mocks.getCustomerProfile.mockResolvedValue({
      id: 'auth-user',
      email: 'demo@example.com',
      full_name: 'Demo User',
    });
    mocks.getDemoBookingPayload.mockReturnValue({
      booking_reference: 'BR-123',
      check_in: '2026-06-01',
      check_out: '2026-06-05',
      guest: {
        email: 'demo@example.com',
        first_name: 'Demo',
        last_name: 'User',
      },
      property: {
        pms_property_id: 'p-1',
        name: 'Hotel Demo',
      },
    });
    mocks.curateStay.mockResolvedValue({ curations_created: 1 });
  });

  it('re-links stay ownership when webhook user id differs from auth user id', async () => {
    mocks.processWebhookBooking.mockResolvedValue({
      user_id: 'webhook-user',
      property_id: 'property-1',
      stay_id: 'stay-1',
      booking_reference: 'BR-123',
      region_id: null,
      curation_triggered: false,
    });

    const request = new Request('http://localhost/api/demo/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: 'demo-1', user_id: 'auth-user' }),
    });

    const response = await POST(request as never);
    const json = (await response.json()) as {
      data: { user_id: string; stay_id: string };
    };

    expect(response.status).toBe(201);
    expect(mocks.from).toHaveBeenCalledWith('stays');
    expect(mocks.update).toHaveBeenCalledWith({ userid: 'auth-user' });
    expect(mocks.eq).toHaveBeenCalledWith('id', 'stay-1');
    expect(json.data.user_id).toBe('auth-user');
  });

  it('does not perform stay ownership update when user ids already match', async () => {
    mocks.processWebhookBooking.mockResolvedValue({
      user_id: 'auth-user',
      property_id: 'property-1',
      stay_id: 'stay-1',
      booking_reference: 'BR-123',
      region_id: null,
      curation_triggered: false,
    });

    const request = new Request('http://localhost/api/demo/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: 'demo-1', user_id: 'auth-user' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('returns 500 when stay ownership reconciliation update fails', async () => {
    mocks.processWebhookBooking.mockResolvedValue({
      user_id: 'webhook-user',
      property_id: 'property-1',
      stay_id: 'stay-1',
      booking_reference: 'BR-123',
      region_id: null,
      curation_triggered: false,
    });
    mocks.eq.mockResolvedValueOnce({ error: { message: 'update failed' } });

    const request = new Request('http://localhost/api/demo/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: 'demo-1', user_id: 'auth-user' }),
    });

    const response = await POST(request as never);
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed to re-link stay to authenticated user: update failed');
  });
});
