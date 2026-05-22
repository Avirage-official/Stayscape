import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from '@/lib/env';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Super-admin guard ────────────────────────────────────────────────────
  // Protect every /admin/* route except the login page itself and the
  // public login API endpoint.
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    pathname !== '/api/admin/login'
  ) {
    const saSession = request.cookies.get('sa_session');
    const sessionValid = /^[0-9a-f]{32}\.[0-9a-f]{64}$/.test(saSession?.value ?? '');
    if (!sessionValid) {
      // Redirect to /admin/login (not /login which is hotel-admin)
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Hotel-admin guard ────────────────────────────────────────────────────
  // Protect /hotel-admin/* except the onboarding page (reached via invite).
  if (
    pathname.startsWith('/hotel-admin') &&
    !pathname.startsWith('/hotel-admin/onboard')
  ) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$).*)',
  ],
};
