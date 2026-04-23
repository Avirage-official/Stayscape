import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const usersMaybeSingle = vi.fn();
  const usersEq = vi.fn(() => ({ maybeSingle: usersMaybeSingle }));
  const usersSelect = vi.fn(() => ({ eq: usersEq }));
  const usersInsert = vi.fn();
  const from = vi.fn((table: string) => {
    if (table === 'users') {
      return { select: usersSelect, insert: usersInsert };
    }
    return {};
  });

  const getUserById = vi.fn();
  const getSupabaseAdmin = vi.fn(() => ({
    from,
    auth: { admin: { getUserById } },
  }));

  const applyRateLimit = vi.fn();
  const getCustomerProfile = vi.fn();
  const getDemoBookingPayload = vi.fn();
  const processWebhookBooking = vi.fn();

  return {
    usersMaybeSingle,
    usersEq,
    usersSelect,
    usersInsert,
    from,
    getUserById,
    getSupabaseAdmin,
    applyRateLimit,
    getCustomerProfile,
    getDemoBookingPayload,
    processWebhookBooking,
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

import { POST } from './route';

describe('POST /api/demo/activate', () => {
  beforeEach(() => {
    mocks.usersMaybeSingle.mockReset();
    mocks.usersEq.mockReset();
    mocks.usersSelect.mockReset();
    mocks.usersInsert.mockReset();
    mocks.from.mockClear();
    mocks.getUserById.mockReset();
    mocks.getSupabaseAdmin.mockClear();
    mocks.applyRateLimit.mockReset();
    mocks.getCustomerProfile.mockReset();
    mocks.getDemoBookingPayload.mockReset();
    mocks.processWebhookBooking.mockReset();

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
    mocks.processWebhookBooking.mockResolvedValue({
      user_id: 'auth-user',
      property_id: 'property-1',
      stay_id: 'stay-1',
      booking_reference: 'BR-123',
      region_id: null,
      curation_triggered: false,
    });
    mocks.usersInsert.mockResolvedValue({ error: null });
    mocks.usersMaybeSingle.mockResolvedValue({ data: null });
    mocks.getUserById.mockResolvedValue({
      data: {
        user: {
          email: 'demo@example.com',
          user_metadata: { first_name: 'Demo', last_name: 'User' },
        },
      },
    });
  });

  it('passes auth user id through to processWebhookBooking', async () => {
    const request = new Request('http://localhost/api/demo/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: 'demo-1', user_id: 'auth-user' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(mocks.processWebhookBooking).toHaveBeenCalledWith(
      expect.objectContaining({ booking_reference: 'BR-123' }),
      'auth-user',
    );
  });

  it('creates aligned users row for brand-new auth user before processing booking', async () => {
    mocks.getCustomerProfile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'auth-user',
        email: 'demo@example.com',
        full_name: 'Demo User',
      });

    const request = new Request('http://localhost/api/demo/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: 'demo-1', user_id: 'auth-user' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(mocks.from).toHaveBeenCalledWith('users');
    expect(mocks.usersInsert).toHaveBeenCalledWith({
      id: 'auth-user',
      email: 'demo@example.com',
      firstname: 'Demo',
      lastname: 'User',
      phone: null,
    });
    expect(mocks.processWebhookBooking).toHaveBeenCalledWith(
      expect.objectContaining({ booking_reference: 'BR-123' }),
      'auth-user',
    );
  });

  it('does not create a new users row when matching email already exists', async () => {
    mocks.getCustomerProfile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'legacy-user',
        email: 'demo@example.com',
        full_name: 'Demo User',
      });
    mocks.usersMaybeSingle.mockResolvedValue({ data: { id: 'legacy-user' } });

    const request = new Request('http://localhost/api/demo/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: 'demo-1', user_id: 'auth-user' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(mocks.usersInsert).not.toHaveBeenCalled();
  });

  it('returns existing stay info for duplicate demo activations', async () => {
    mocks.processWebhookBooking.mockResolvedValue({
      user_id: 'auth-user',
      property_id: 'property-1',
      stay_id: 'stay-existing',
      booking_reference: 'BR-123',
      region_id: 'region-1',
      curation_triggered: false,
      stay_existed: true,
      duplicate_reason: 'booking_reference',
    });

    const request = new Request('http://localhost/api/demo/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: 'demo-1', user_id: 'auth-user' }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect((body as { data?: { redirect_stay_id?: string } }).data?.redirect_stay_id).toBe('stay-existing');
    expect((body as { data?: { curation_triggered?: boolean } }).data?.curation_triggered).toBe(false);
  });
});
