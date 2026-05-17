import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from '@/lib/env';

/**
 * Refreshes the Supabase auth session on every server request so that
 * access tokens stored in cookies stay valid.
 *
 * The matcher deliberately excludes:
 *   - Next.js internals (_next/*)
 *   - Static files (images, fonts, favicons, …)
 *   - Public API routes that don't need session refresh
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

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

  // Refresh the session and capture the user — this is a no-op when the
  // token is still valid but also gives us the authenticated user for guards.
  const { data: { user } } = await supabase.auth.getUser();

  // Block unauthenticated access to /admin routes
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && pathname !== '/api/admin/login') {
    // Check for the sa_session cookie. Format: <32-hex>.<64-hex> (token.hmac-sha256).
    // Full cryptographic verification happens in each admin API route; this gate
    // exists only to redirect unauthenticated browsers to the login page quickly.
    const saSession = request.cookies.get('sa_session');
    const sessionValid = /^[0-9a-f]{32}\.[0-9a-f]{64}$/.test(saSession?.value ?? '');
    if (!sessionValid) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

 // Block unauthenticated access to hotel-admin routes (requires Supabase JWT)
  // EXCEPT the public onboarding page — it's reached via an invite token
  // and must work for users who don't yet have an account.
  if (pathname.startsWith('/hotel-admin') && !pathname.startsWith('/hotel-admin/onboard')) {
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
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$).*)',
  ],
};
