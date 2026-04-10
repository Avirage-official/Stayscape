import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

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
