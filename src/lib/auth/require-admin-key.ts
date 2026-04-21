import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getAdminSyncKey } from '@/lib/env';

/**
 * Returns a 401 response if the x-admin-key header is missing or wrong.
 * Returns null if the request is authorised.
 */
export function requireAdminKey(request: NextRequest): NextResponse | null {
  let expected: string;
  try {
    expected = getAdminSyncKey();
  } catch {
    // ADMIN_SYNC_KEY not configured — block all requests
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const provided = request.headers.get('x-admin-key');
  if (!provided) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  const match =
    expectedBuf.length === providedBuf.length &&
    timingSafeEqual(expectedBuf, providedBuf);
  if (!match) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
