/**
 * Super admin credentials are set via environment variables.
 * Add these to Vercel → Project → Settings → Environment Variables:
 *   SUPER_ADMIN_EMAIL    — your admin email
 *   SUPER_ADMIN_PASSWORD — a strong password
 * Without these set, the /admin login will always fail.
 */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

function getSuperAdminCredentials(): {
  email: string;
  password: string;
  id: string;
} | null {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password, id: 'super-admin-001' };
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * POST /api/auth/login
 *
 * Staff-only login endpoint. Validates against super admin credentials
 * sourced from environment variables and returns the user id + email.
 *
 * Guest accounts authenticate directly in the browser via the Supabase
 * client SDK (supabase.auth.signInWithPassword) so that auth.uid() is
 * available for RLS policies without routing through this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const credentials = getSuperAdminCredentials();
    const staffMatch =
      credentials &&
      safeEquals(credentials.email, email ?? '') &&
      safeEquals(credentials.password, password ?? '')
        ? credentials
        : null;
    if (staffMatch) {
      const res = NextResponse.json({
        user: { id: staffMatch.id, email: staffMatch.email },
      });

      res.cookies.set('sa_session', staffMatch.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });

      return res;
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
