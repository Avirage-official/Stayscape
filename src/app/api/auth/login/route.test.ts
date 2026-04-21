import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const signInWithPassword = vi.fn();
  const getSupabaseAdmin = vi.fn(() => ({
    auth: { signInWithPassword },
  }));

  return {
    signInWithPassword,
    getSupabaseAdmin,
  };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { POST } from './route';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    mocks.signInWithPassword.mockReset();
    mocks.getSupabaseAdmin.mockClear();
  });

  it('returns staff demo user without calling Supabase Auth', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff@stayscape-demo.com',
        password: 'Staff1234!',
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect((body as { user: { id: string; email: string } }).user).toEqual({
      id: 'staff-demo-001',
      email: 'staff@stayscape-demo.com',
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it('falls through to Supabase Auth for non-staff credentials', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'guest@example.com' } },
      error: null,
    });

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'guest@example.com',
        password: 'Guest1234!',
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'guest@example.com',
      password: 'Guest1234!',
    });
    expect((body as { user: { id: string; email: string } }).user).toEqual({
      id: 'user-123',
      email: 'guest@example.com',
    });
  });
});
