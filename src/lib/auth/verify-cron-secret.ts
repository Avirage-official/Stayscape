import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Verifies that the request is from Vercel's cron runner using the CRON_SECRET.
 * Vercel sends the secret in the Authorization header as: "Bearer <token>"
 *
 * Returns a 401 response if verification fails, or null if authorized.
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // CRON_SECRET not configured — block all requests
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provided = authHeader.slice(7); // Remove "Bearer " prefix
  const expectedBuf = Buffer.from(cronSecret);
  const providedBuf = Buffer.from(provided);

  const match =
    expectedBuf.length === providedBuf.length &&
    timingSafeEqual(expectedBuf, providedBuf);

  if (!match) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
