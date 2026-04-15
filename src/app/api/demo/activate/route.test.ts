import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const eq = vi.fn();
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  const getSupabaseAdmin = vi.fn(() => ({ from }));
  return { eq, update, from, getSupabaseAdmin };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { ensureStayLinkedToAuthUser } from './route';

describe('ensureStayLinkedToAuthUser', () => {
  beforeEach(() => {
    mocks.eq.mockReset();
    mocks.update.mockReset();
    mocks.from.mockReset();
    mocks.getSupabaseAdmin.mockReset();

    mocks.eq.mockResolvedValue({ error: null });
    mocks.update.mockImplementation(() => ({ eq: mocks.eq }));
    mocks.from.mockImplementation(() => ({ update: mocks.update }));
    mocks.getSupabaseAdmin.mockImplementation(() => ({ from: mocks.from }));
  });

  it('skips reconciliation when webhook user already matches auth user', async () => {
    await ensureStayLinkedToAuthUser({
      stayId: 'stay-1',
      processedUserId: 'user-1',
      authUserId: 'user-1',
    });

    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('re-links stay ownership to the authenticated user when ids differ', async () => {
    await ensureStayLinkedToAuthUser({
      stayId: 'stay-1',
      processedUserId: 'webhook-user',
      authUserId: 'auth-user',
    });

    expect(mocks.from).toHaveBeenCalledWith('stays');
    expect(mocks.update).toHaveBeenCalledWith({ userid: 'auth-user' });
    expect(mocks.eq).toHaveBeenCalledWith('id', 'stay-1');
  });

  it('throws when stay ownership reconciliation update fails', async () => {
    mocks.eq.mockResolvedValueOnce({ error: { message: 'update failed' } });

    await expect(
      ensureStayLinkedToAuthUser({
        stayId: 'stay-1',
        processedUserId: 'webhook-user',
        authUserId: 'auth-user',
      }),
    ).rejects.toThrow('Failed to re-link stay to authenticated user: update failed');
  });
});
