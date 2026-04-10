import { describe, it, expect } from 'vitest';
import { applyRateLimit } from '@/lib/rate-limit';
import type { NextRequest } from 'next/server';

describe('applyRateLimit', () => {
  it('returns { success: true, headers: {} } when Redis is not configured', async () => {
    // In the test environment UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    // are not set, so the limiter is null and all requests are allowed through.
    // The request object is never accessed when the limiter is null.
    const fakeRequest = {} as unknown as NextRequest;
    const result = await applyRateLimit(fakeRequest);
    expect(result.success).toBe(true);
    expect(result.headers).toEqual({});
  });

  it('also allows requests for the admin limiter type when Redis is not configured', async () => {
    const fakeRequest = {} as unknown as NextRequest;
    const result = await applyRateLimit(fakeRequest, 'admin');
    expect(result.success).toBe(true);
    expect(result.headers).toEqual({});
  });
});
