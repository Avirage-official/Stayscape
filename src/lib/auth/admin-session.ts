import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function getSecret(): string {
  const s = process.env.ADMIN_SYNC_KEY;
  if (!s) throw new Error('ADMIN_SYNC_KEY not configured');
  return s;
}

/**
 * Creates a signed admin session token: `<16-byte-hex>.<sha256-hmac-hex>`
 * The token is safe to store in an httpOnly cookie.
 */
export function createAdminSession(): string {
  const token = randomBytes(16).toString('hex');
  const secret = getSecret();
  const sig = createHmac('sha256', secret).update(token).digest('hex');
  return `${token}.${sig}`;
}

/**
 * Verifies a session token previously created by createAdminSession.
 * Uses timing-safe comparison to prevent side-channel attacks.
 */
export function verifyAdminSession(value: string): boolean {
  try {
    const secret = process.env.ADMIN_SYNC_KEY;
    if (!secret) return false;
    const dotIdx = value.lastIndexOf('.');
    if (dotIdx === -1) return false;
    const token = value.slice(0, dotIdx);
    const sig = value.slice(dotIdx + 1);
    const expected = createHmac('sha256', secret).update(token).digest('hex');
    if (expected.length !== sig.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}
