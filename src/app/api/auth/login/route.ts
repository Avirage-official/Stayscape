import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

// Hardcoded staff demo credentials — replace with DB-backed auth in Phase 2
const STAFF_DEMO_CREDENTIALS = [
  {
    email: 'staff@stayscape-demo.com',
    password: 'Staff1234!',
    id: 'staff-demo-001',
  },
];

/**
 * POST /api/auth/login
 *
 * Lightweight login endpoint that authenticates against Supabase Auth
 * using the admin client, then returns the user id + email.
 *
 * This is intentionally thin — no cookies, no session tokens.
 * The frontend stores the user info in sessionStorage.
 * Replace with proper Supabase Auth (cookie-based) when ready.
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

    // Check staff demo credentials first (no Supabase Auth needed yet)
    const staffMatch = STAFF_DEMO_CREDENTIALS.find(
      (c) => c.email === email && c.password === password,
    );
    if (staffMatch) {
      return NextResponse.json({
        user: { id: staffMatch.id, email: staffMatch.email },
      });
    }

    // Fall through to Supabase Auth for guest accounts
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? 'Invalid credentials' },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
