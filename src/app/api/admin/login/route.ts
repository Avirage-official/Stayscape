import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { applyRateLimit } from '@/lib/rate-limit';
import { createAdminSession } from '@/lib/auth/admin-session';

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const { password } = (await request.json()) as { password?: string };

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
  }

  if (!password) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const expectedBuf = Buffer.from(adminPassword);
  const providedBuf = Buffer.from(password);
  const match =
    expectedBuf.length === providedBuf.length &&
    timingSafeEqual(expectedBuf, providedBuf);

  if (!match) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const sessionToken = createAdminSession();
  const response = NextResponse.json({ ok: true });

  response.cookies.set('sa_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return response;
}
