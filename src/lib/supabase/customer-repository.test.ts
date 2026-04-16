import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const usersMaybeSingleById = vi.fn();
  const usersMaybeSingleByEmail = vi.fn();
  const usersSingleById = vi.fn();
  const usersEq = vi.fn((column: string) => {
    if (column === 'id') {
      return { maybeSingle: usersMaybeSingleById, single: usersSingleById };
    }
    if (column === 'email') {
      return { maybeSingle: usersMaybeSingleByEmail };
    }
    return {};
  });
  const usersSelect = vi.fn(() => ({ eq: usersEq }));

  const staysOrder = vi.fn();
  const staysGte = vi.fn(() => ({ order: staysOrder }));
  const staysEq = vi.fn(() => ({ gte: staysGte }));
  const staysSelect = vi.fn(() => ({ eq: staysEq }));

  const from = vi.fn((table: string) => {
    if (table === 'users') {
      return { select: usersSelect };
    }
    if (table === 'stays') {
      return { select: staysSelect };
    }
    return {};
  });

  const getUserById = vi.fn();
  const getSupabaseAdmin = vi.fn(() => ({
    from,
    auth: { admin: { getUserById } },
  }));

  return {
    usersMaybeSingleById,
    usersMaybeSingleByEmail,
    usersSingleById,
    usersEq,
    usersSelect,
    staysOrder,
    staysGte,
    staysEq,
    staysSelect,
    from,
    getUserById,
    getSupabaseAdmin,
  };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { getCustomerProfile, getUpcomingStays } from './customer-repository';

describe('customer-repository auth/user id fallback', () => {
  beforeEach(() => {
    mocks.usersMaybeSingleById.mockReset();
    mocks.usersMaybeSingleByEmail.mockReset();
    mocks.usersSingleById.mockReset();
    mocks.usersEq.mockClear();
    mocks.usersSelect.mockClear();
    mocks.staysOrder.mockReset();
    mocks.staysGte.mockClear();
    mocks.staysEq.mockClear();
    mocks.staysSelect.mockClear();
    mocks.from.mockClear();
    mocks.getUserById.mockReset();
    mocks.getSupabaseAdmin.mockClear();
  });

  it('resolves profile by auth email when users.id does not match auth id', async () => {
    mocks.usersMaybeSingleById.mockResolvedValueOnce({ data: null });
    mocks.getUserById.mockResolvedValue({
      data: { user: { email: 'guest@example.com' } },
    });
    mocks.usersMaybeSingleByEmail.mockResolvedValue({
      data: { id: 'legacy-user-id' },
    });
    mocks.usersSingleById.mockResolvedValue({
      data: {
        id: 'legacy-user-id',
        email: 'guest@example.com',
        firstname: 'Demo',
        lastname: 'Guest',
        phone: null,
        createdat: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    const profile = await getCustomerProfile('auth-user-id');

    expect(profile?.id).toBe('legacy-user-id');
    expect(profile?.email).toBe('guest@example.com');
    expect(mocks.getUserById).toHaveBeenCalledWith('auth-user-id');
  });

  it('queries stays using resolved users.id when auth id does not directly exist', async () => {
    mocks.usersMaybeSingleById.mockResolvedValueOnce({ data: null });
    mocks.getUserById.mockResolvedValue({
      data: { user: { email: 'guest@example.com' } },
    });
    mocks.usersMaybeSingleByEmail.mockResolvedValue({
      data: { id: 'legacy-user-id' },
    });
    mocks.staysOrder.mockResolvedValue({
      data: [
        {
          id: 'stay-1',
          userid: 'legacy-user-id',
          propertyid: 'property-1',
          booking_reference: 'BR-123',
          checkindate: '2026-06-01',
          checkoutdate: '2026-06-05',
          status: 'confirmed',
          roomlabel: null,
          guestcount: 2,
          properties: {
            id: 'property-1',
            name: 'Hotel Demo',
            image_url: null,
            address: null,
            city: null,
            country: null,
            latitude: null,
            longitude: null,
            region_id: null,
            regions: null,
          },
        },
      ],
      error: null,
    });

    const stays = await getUpcomingStays('auth-user-id');

    expect(stays).toHaveLength(1);
    expect(stays[0]?.user_id).toBe('legacy-user-id');
    expect(mocks.staysEq).toHaveBeenCalledWith('userid', 'legacy-user-id');
  });
});
