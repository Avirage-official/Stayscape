import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { POST } from './route';

describe('POST /api/auth/login', () => {
  const originalEmail = process.env.SUPER_ADMIN_EMAIL;
  const originalPassword = process.env.SUPER_ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.SUPER_ADMIN_EMAIL = 'staff@stayscape-demo.com';
    process.env.SUPER_ADMIN_PASSWORD = 'Staff1234!';
  });

  afterEach(() => {
    if (originalEmail === undefined) delete process.env.SUPER_ADMIN_EMAIL;
    else process.env.SUPER_ADMIN_EMAIL = originalEmail;
    if (originalPassword === undefined) delete process.env.SUPER_ADMIN_PASSWORD;
    else process.env.SUPER_ADMIN_PASSWORD = originalPassword;
  });

  it('returns super admin user for valid super admin credentials', async () => {
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
      id: 'super-admin-001',
      email: 'staff@stayscape-demo.com',
    });
  });

  it('returns 401 for non-staff credentials (guests authenticate via browser SDK)', async () => {
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

    expect(response.status).toBe(401);
    expect((body as { error: string }).error).toBe('Invalid credentials');
  });

  it('returns 400 when email or password is missing', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@stayscape-demo.com' }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect((body as { error: string }).error).toBe(
      'Email and password are required',
    );
  });
});
