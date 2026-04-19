import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const getSupabaseAdmin = vi.fn();
  return { getSupabaseAdmin };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { GET } from './route';

describe('GET /api/admin/dashboard', () => {
  beforeEach(() => {
    mocks.getSupabaseAdmin.mockReset();
  });

  it('returns counts and recent records for admin overview', async () => {
    let placesSelectCount = 0;
    let staysSelectCount = 0;

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'properties') {
          return {
            select: vi.fn(() => Promise.resolve({ count: 4 })),
          };
        }

        if (table === 'regions') {
          return {
            select: vi.fn(() => Promise.resolve({ count: 3 })),
          };
        }

        if (table === 'places') {
          placesSelectCount += 1;

          if (placesSelectCount === 1) {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ count: 20 })),
              })),
            };
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  neq: vi.fn(() => Promise.resolve({ count: 8 })),
                })),
              })),
            })),
          };
        }

        if (table === 'stays') {
          staysSelectCount += 1;

          if (staysSelectCount === 1) {
            return {
              select: vi.fn(() => Promise.resolve({ count: 11 })),
            };
          }

          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: 'stay-1',
                      booking_reference: 'BK-1',
                      checkindate: '2026-05-01',
                      checkoutdate: '2026-05-03',
                      status: 'confirmed',
                      users: { firstname: 'Ada', lastname: 'Lovelace', email: 'ada@example.com' },
                      properties: { name: 'Stayscape Hotel' },
                    },
                  ],
                })),
              })),
            })),
          };
        }

        if (table === 'sync_runs') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: 'run-1',
                      status: 'completed',
                      started_at: '2026-04-18T00:00:00Z',
                      completed_at: '2026-04-18T00:01:00Z',
                      records_fetched: 100,
                      records_created: 30,
                      records_updated: 15,
                      records_deactivated: 2,
                      error_message: null,
                      regions: { name: 'Rome' },
                    },
                  ],
                })),
              })),
            })),
          };
        }

        return {
          select: vi.fn(() => Promise.resolve({ data: [], count: 0 })),
        };
      }),
    };

    mocks.getSupabaseAdmin.mockReturnValue(supabase);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        counts: {
          properties: 4,
          regions: 3,
          places: 20,
          enriched_places: 8,
          stays: 11,
        },
        recent_sync_runs: [
          expect.objectContaining({
            id: 'run-1',
            status: 'completed',
          }),
        ],
        recent_stays: [
          expect.objectContaining({
            id: 'stay-1',
            booking_reference: 'BK-1',
          }),
        ],
      },
    });
  });

  it('returns 500 when dashboard query fails', async () => {
    mocks.getSupabaseAdmin.mockImplementation(() => {
      throw new Error('Missing Supabase credentials');
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Missing Supabase credentials' });
  });
});
