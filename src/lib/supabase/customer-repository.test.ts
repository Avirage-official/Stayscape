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

  // Stays chain: select → eq → (gt|gte|lt|lte) → (gte|order) → order
  const staysOrder = vi.fn();
  // For current stays: .lte('checkindate', today).gte('checkoutdate', today).order(...)
  const staysSecondFilter = vi.fn(() => ({ order: staysOrder }));
  // First date filter after eq — returns an object that supports either a second filter or order
  const staysFirstFilter = vi.fn(() => ({ gte: staysSecondFilter, order: staysOrder }));
  const staysEq = vi.fn(() => ({ gt: staysFirstFilter, gte: staysFirstFilter, lt: staysFirstFilter, lte: staysFirstFilter, order: staysOrder }));
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
    staysSecondFilter,
    staysFirstFilter,
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

import { getCustomerProfile, getUpcomingStays, getCurrentStays, getPastStays, getDashboardBundle } from './customer-repository';

describe('customer-repository auth/user id fallback', () => {
  beforeEach(() => {
    mocks.usersMaybeSingleById.mockReset();
    mocks.usersMaybeSingleByEmail.mockReset();
    mocks.usersSingleById.mockReset();
    mocks.usersEq.mockClear();
    mocks.usersSelect.mockClear();
    mocks.staysOrder.mockReset();
    mocks.staysFirstFilter.mockClear();
    mocks.staysSecondFilter.mockClear();
    mocks.staysEq.mockClear();
    mocks.staysSelect.mockClear();
    mocks.from.mockClear();
    mocks.getUserById.mockReset();
    mocks.getSupabaseAdmin.mockClear();

    // Re-wire mock return values (cleared mocks lose their implementation)
    mocks.staysSecondFilter.mockReturnValue({ order: mocks.staysOrder });
    mocks.staysFirstFilter.mockReturnValue({ gte: mocks.staysSecondFilter, order: mocks.staysOrder });
    mocks.staysEq.mockReturnValue({ gt: mocks.staysFirstFilter, gte: mocks.staysFirstFilter, lt: mocks.staysFirstFilter, lte: mocks.staysFirstFilter, order: mocks.staysOrder });
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

  it('queries upcoming stays using resolved users.id when auth id does not directly exist', async () => {
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

  it('queries current stays with correct date filters', async () => {
    mocks.usersMaybeSingleById.mockResolvedValueOnce({ data: { id: 'user-1' } });
    mocks.staysOrder.mockResolvedValue({
      data: [
        {
          id: 'stay-current',
          userid: 'user-1',
          propertyid: 'property-1',
          booking_reference: 'BR-CURRENT',
          checkindate: '2026-04-14',
          checkoutdate: '2026-04-18',
          status: 'confirmed',
          roomlabel: 'Deluxe Room',
          guestcount: 2,
          properties: {
            id: 'property-1',
            name: 'Hotel Current',
            image_url: null,
            address: '123 Main St',
            city: 'Test City',
            country: 'Test Country',
            latitude: 1.0,
            longitude: 2.0,
            region_id: null,
            regions: null,
          },
        },
      ],
      error: null,
    });

    const stays = await getCurrentStays('user-1');

    expect(stays).toHaveLength(1);
    expect(stays[0]?.id).toBe('stay-current');
    expect(stays[0]?.check_in).toBe('2026-04-14');
    expect(stays[0]?.check_out).toBe('2026-04-18');
    expect(mocks.staysEq).toHaveBeenCalledWith('userid', 'user-1');
  });

  it('queries past stays with correct date filters', async () => {
    mocks.usersMaybeSingleById.mockResolvedValueOnce({ data: { id: 'user-1' } });
    mocks.staysOrder.mockResolvedValue({
      data: [
        {
          id: 'stay-past',
          userid: 'user-1',
          propertyid: 'property-2',
          booking_reference: 'BR-PAST',
          checkindate: '2026-03-01',
          checkoutdate: '2026-03-05',
          status: 'confirmed',
          roomlabel: null,
          guestcount: 1,
          properties: {
            id: 'property-2',
            name: 'Hotel Past',
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

    const stays = await getPastStays('user-1');

    expect(stays).toHaveLength(1);
    expect(stays[0]?.id).toBe('stay-past');
    expect(stays[0]?.check_out).toBe('2026-03-05');
    expect(mocks.staysEq).toHaveBeenCalledWith('userid', 'user-1');
  });

  it('loads dashboard data in one bundled read path and partitions stays', async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0] as string;
    const upcomingDate = new Date(now);
    upcomingDate.setDate(upcomingDate.getDate() + 5);
    const upcomingCheckIn = upcomingDate.toISOString().split('T')[0] as string;
    const upcomingCheckoutDate = new Date(upcomingDate);
    upcomingCheckoutDate.setDate(upcomingCheckoutDate.getDate() + 3);
    const upcomingCheckOut = upcomingCheckoutDate.toISOString().split('T')[0] as string;
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 5);
    const pastCheckOut = pastDate.toISOString().split('T')[0] as string;
    const pastCheckInDate = new Date(pastDate);
    pastCheckInDate.setDate(pastCheckInDate.getDate() - 3);
    const pastCheckIn = pastCheckInDate.toISOString().split('T')[0] as string;

    mocks.usersMaybeSingleById.mockResolvedValueOnce({ data: { id: 'user-1' } });
    mocks.usersSingleById.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'guest@example.com',
        firstname: 'Demo',
        lastname: 'Guest',
        phone: null,
        createdat: '2026-01-01T00:00:00Z',
      },
      error: null,
    });
    mocks.staysOrder.mockResolvedValue({
      data: [
        {
          id: 'stay-current',
          userid: 'user-1',
          propertyid: 'property-1',
          booking_reference: 'BR-CURRENT',
          checkindate: today,
          checkoutdate: today,
          status: 'confirmed',
          roomlabel: null,
          guestcount: 2,
          properties: { id: 'property-1', name: 'Hotel A', region_id: null, regions: null },
        },
        {
          id: 'stay-upcoming',
          userid: 'user-1',
          propertyid: 'property-2',
          booking_reference: 'BR-UPCOMING',
          checkindate: upcomingCheckIn,
          checkoutdate: upcomingCheckOut,
          status: 'confirmed',
          roomlabel: null,
          guestcount: 1,
          properties: { id: 'property-2', name: 'Hotel B', region_id: null, regions: null },
        },
        {
          id: 'stay-past',
          userid: 'user-1',
          propertyid: 'property-3',
          booking_reference: 'BR-PAST',
          checkindate: pastCheckIn,
          checkoutdate: pastCheckOut,
          status: 'confirmed',
          roomlabel: null,
          guestcount: 1,
          properties: { id: 'property-3', name: 'Hotel C', region_id: null, regions: null },
        },
      ],
      error: null,
    });

    const dashboard = await getDashboardBundle('user-1');

    expect(dashboard?.profile.id).toBe('user-1');
    expect(dashboard?.currentStays.map((s) => s.id)).toEqual(['stay-current']);
    expect(dashboard?.upcomingStays.map((s) => s.id)).toEqual(['stay-upcoming']);
    expect(dashboard?.pastStays.map((s) => s.id)).toEqual(['stay-past']);
    expect(mocks.staysEq).toHaveBeenCalledWith('userid', 'user-1');
  });
});
