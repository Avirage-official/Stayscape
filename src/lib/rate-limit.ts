/**
 * Rate limiting utility using Upstash Redis + @upstash/ratelimit.
 *
 * Gracefully falls back (allows all requests through) when Upstash env vars
 * are not configured, so the app works in development without Redis.
 *
 * Usage:
 *   const rateLimit = await applyRateLimit(request);
 *   if (!rateLimit.success) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
 *   }
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from '@/lib/env';

/* ── Lazily initialized limiters ── */

let _defaultLimiter: Ratelimit | null | undefined = undefined; // undefined = not yet init
let _adminLimiter: Ratelimit | null | undefined = undefined;

function getRedis(): Redis | null {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
}

/** 30 requests per 10 seconds per IP — for public API routes. */
function getDefaultLimiter(): Ratelimit | null {
  if (_defaultLimiter !== undefined) return _defaultLimiter;
  const redis = getRedis();
  if (!redis) {
    _defaultLimiter = null;
    return null;
  }
  _defaultLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '10 s'),
    analytics: false,
    prefix: 'rl:default',
  });
  return _defaultLimiter;
}

/** 5 requests per 60 seconds per IP — for admin routes. */
function getAdminLimiter(): Ratelimit | null {
  if (_adminLimiter !== undefined) return _adminLimiter;
  const redis = getRedis();
  if (!redis) {
    _adminLimiter = null;
    return null;
  }
  _adminLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: false,
    prefix: 'rl:admin',
  });
  return _adminLimiter;
}

/* ── IP extraction ── */

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'anonymous';
}

/* ── Public helper ── */

export interface RateLimitResult {
  success: boolean;
  headers: Record<string, string>;
}

/**
 * Apply rate limiting to the given request.
 *
 * @param request  - The incoming Next.js request.
 * @param limiterType - `'default'` (30 req / 10 s) or `'admin'` (5 req / 60 s).
 * @returns `{ success, headers }` — always succeeds when Redis is not configured.
 */
export async function applyRateLimit(
  request: NextRequest,
  limiterType: 'default' | 'admin' = 'default',
): Promise<RateLimitResult> {
  const limiter =
    limiterType === 'admin' ? getAdminLimiter() : getDefaultLimiter();

  // Graceful fallback: no Redis configured → allow all requests
  if (!limiter) {
    return { success: true, headers: {} };
  }

  const ip = getIp(request);

  try {
    const result = await limiter.limit(ip);
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.reset),
    };
    return { success: result.success, headers };
  } catch {
    // Redis unavailable — fail open so the app stays functional
    return { success: true, headers: {} };
  }
}
