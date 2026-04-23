import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const eqSecond = vi.fn();
  const eqFirst = vi.fn(() => ({ eq: eqSecond }));
  const update = vi.fn(() => ({ eq: eqFirst }));
  const from = vi.fn(() => ({ update }));

  return {
    applyRateLimit: vi.fn(),
    getStayById: vi.fn(),
    upsertStayPreference: vi.fn(),
    curateStay: vi.fn(),
    waitUntil: vi.fn((promise: Promise<unknown>) => promise),
    getSupabaseAdmin: vi.fn(() => ({ from })),
    from,
    update,
    eqFirst,
    eqSecond,
  };
});

vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: mocks.applyRateLimit,
}));
vi.mock('@/lib/supabase/customer-repository', () => ({
  getStayById: mocks.getStayById,
}));
vi.mock('@/lib/supabase/preferences-repository', () => ({
  upsertStayPreference: mocks.upsertStayPreference,
}));
vi.mock('@/lib/services/ai/stay-curation', () => ({
  curateStay: mocks.curateStay,
}));
vi.mock('@vercel/functions', () => ({
  waitUntil: mocks.waitUntil,
}));
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { POST } from './route';

describe('POST /api/customer/stays/[stayId]/onboarding', () => {
  beforeEach(() => {
    mocks.applyRateLimit.mockReset();
    mocks.getStayById.mockReset();
    mocks.upsertStayPreference.mockReset();
    mocks.curateStay.mockReset();
    mocks.waitUntil.mockClear();
    mocks.from.mockClear();
    mocks.update.mockClear();
    mocks.eqFirst.mockClear();
    mocks.eqSecond.mockReset();

    mocks.applyRateLimit.mockResolvedValue({ success: true, headers: {} });
    mocks.getStayById.mockResolvedValue({
      id: 'stay-1',
      user_id: 'user-1',
      check_in: '2026-05-01',
      check_out: '2026-05-05',
      status: 'confirmed',
      room_type: null,
      guests: 2,
      booking_reference: 'BR-1',
      trip_type: null,
      stay_confirmed_by_guest: null,
      stay_confirmation_status: null,
      onboarding_completed: false,
      onboarding_completed_at: null,
      curation_status: null,
      curated_at: null,
      property: null,
      property_id: 'property-1',
    });
    mocks.eqSecond.mockResolvedValue({ error: null });
    mocks.upsertStayPreference.mockResolvedValue('pref-1');
    mocks.curateStay.mockResolvedValue({ stay_id: 'stay-1', curations_created: 2, types: ['recommended_places', 'regional_activities'] });
  });

  it('confirms stay and updates confirmation fields', async () => {
    const request = new Request('http://localhost/api/customer/stays/stay-1/onboarding?userId=user-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm_stay', confirmed: true }),
    });

    const response = await POST(request as never, { params: Promise.resolve({ stayId: 'stay-1' }) });
    expect(response.status).toBe(200);
    expect(mocks.from).toHaveBeenCalledWith('stays');
    expect(mocks.update).toHaveBeenCalledWith({
      stay_confirmed_by_guest: true,
      stay_confirmation_status: 'confirmed',
    });
  });

  it('upserts canonical onboarding preferences', async () => {
    const request = new Request('http://localhost/api/customer/stays/stay-1/onboarding?userId=user-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_preference',
        preference_type: 'food_preferences',
        preference_data: { values: ['Fine_Dining', 'cafes', 'invalid'] },
      }),
    });

    const response = await POST(request as never, { params: Promise.resolve({ stayId: 'stay-1' }) });
    expect(response.status).toBe(200);
    expect(mocks.upsertStayPreference).toHaveBeenCalledWith(
      'stay-1',
      'food_preferences',
      { values: ['fine_dining', 'cafes'] },
    );
  });

  it('marks curation status and completes onboarding curation', async () => {
    const request = new Request('http://localhost/api/customer/stays/stay-1/onboarding?userId=user-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete_onboarding' }),
    });

    const response = await POST(request as never, { params: Promise.resolve({ stayId: 'stay-1' }) });
    expect(response.status).toBe(200);
    expect(mocks.waitUntil).toHaveBeenCalledTimes(1);
    expect(mocks.curateStay).toHaveBeenCalledWith('stay-1');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_completed: true,
        curation_status: 'in_progress',
      }),
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        curation_status: 'completed',
      }),
    );
  });
});
