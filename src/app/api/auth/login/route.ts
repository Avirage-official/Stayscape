import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

// Hardcoded staff demo credentials — replace with DB-backed auth in Phase 2
const STAFF_DEMO_CREDENTIALS = [
  {
    email: 'staff@stayscape-demo.com',
    password: 'Staff1234!',
    id: 'staff-demo-001',
  },
];

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * POST /api/auth/login
 *
 * Staff-only login endpoint. Validates against hardcoded demo credentials
 * and returns the user id + email.
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

    // Only staff demo credentials are accepted here.
    const staffMatch = STAFF_DEMO_CREDENTIALS.find(
      (c) => safeEquals(c.email, email) && safeEquals(c.password, password),
    );
    if (staffMatch) {
      return NextResponse.json({
        user: { id: staffMatch.id, email: staffMatch.email },
      });
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
