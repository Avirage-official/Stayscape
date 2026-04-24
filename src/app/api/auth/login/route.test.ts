import { describe, expect, it } from 'vitest';

import { POST } from './route';

describe('POST /api/auth/login', () => {
  it('returns staff demo user for valid staff credentials', async () => {
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
