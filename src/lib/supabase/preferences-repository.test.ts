import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const order = vi.fn();
  const eqSecond = vi.fn(() => ({ order }));
  const eqFirst = vi.fn(() => ({ eq: eqSecond }));
  const select = vi.fn(() => ({ eq: eqFirst }));

  const updateEq = vi.fn();
  const update = vi.fn(() => ({ eq: updateEq }));

  const deleteIn = vi.fn();
  const deleteEq = vi.fn();
  const deleteFn = vi.fn(() => ({ in: deleteIn, eq: deleteEq }));

  const insertSingle = vi.fn();
  const insertSelect = vi.fn(() => ({ single: insertSingle }));
  const insert = vi.fn(() => ({ select: insertSelect }));

  const from = vi.fn(() => ({
    select,
    update,
    delete: deleteFn,
    insert,
  }));

  const getSupabaseAdmin = vi.fn(() => ({ from }));

  return {
    order,
    eqSecond,
    eqFirst,
    select,
    updateEq,
    update,
    deleteIn,
    deleteEq,
    deleteFn,
    insertSingle,
    insertSelect,
    insert,
    from,
    getSupabaseAdmin,
  };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { upsertStayPreference } from './preferences-repository';

describe('upsertStayPreference', () => {
  beforeEach(() => {
    mocks.order.mockReset();
    mocks.eqSecond.mockClear();
    mocks.eqFirst.mockClear();
    mocks.select.mockClear();
    mocks.updateEq.mockReset();
    mocks.update.mockClear();
    mocks.deleteIn.mockReset();
    mocks.deleteEq.mockReset();
    mocks.deleteFn.mockClear();
    mocks.insertSingle.mockReset();
    mocks.insertSelect.mockClear();
    mocks.insert.mockClear();
    mocks.from.mockClear();
    mocks.getSupabaseAdmin.mockClear();

    mocks.order.mockResolvedValue({ data: [{ id: 'pref-new' }] });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.deleteIn.mockResolvedValue({ error: null });
    mocks.deleteEq.mockResolvedValue({ error: null });
    mocks.insertSingle.mockResolvedValue({ data: { id: 'pref-fresh' }, error: null });
  });

  it('throws when duplicate purge delete fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mocks.order.mockResolvedValue({ data: [{ id: 'pref-new' }, { id: 'pref-dup' }] });
    mocks.deleteIn.mockResolvedValueOnce({ error: { message: 'purge failed' } });

    await expect(
      upsertStayPreference('stay-1', 'interests', { values: ['food'] }),
    ).rejects.toThrow('Failed to purge duplicate preferences: purge failed');

    expect(errorSpy).toHaveBeenCalledWith(
      '[preferences] Failed to purge duplicate rows',
      expect.objectContaining({
        stayId: 'stay-1',
        preferenceType: 'interests',
        error: 'purge failed',
      }),
    );

    errorSpy.mockRestore();
  });

  it('inserts before deleting old row in update fallback and keeps new row when old delete fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mocks.order.mockResolvedValue({ data: [{ id: 'pref-old' }, { id: 'pref-dup' }] });
    mocks.updateEq.mockResolvedValue({ error: { message: 'update failed' } });
    mocks.insertSingle.mockResolvedValue({ data: { id: 'pref-fresh' }, error: null });
    mocks.deleteEq.mockResolvedValue({ error: { message: 'delete old failed' } });
    mocks.deleteIn.mockResolvedValue({ error: null });

    const id = await upsertStayPreference('stay-1', 'interests', { values: ['food'] });

    expect(id).toBe('pref-fresh');
    expect(
      mocks.insertSingle.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.deleteEq.mock.invocationCallOrder[0]);
    expect(errorSpy).toHaveBeenCalledWith(
      '[preferences] Failed to delete old preference row after re-insert',
      expect.objectContaining({
        stayId: 'stay-1',
        preferenceType: 'interests',
        error: 'delete old failed',
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[preferences] update failed, falling back to insert+delete',
      expect.objectContaining({ stayId: 'stay-1', preferenceType: 'interests' }),
    );

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
