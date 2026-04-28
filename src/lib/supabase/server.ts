/**
 * Server-side Supabase client factory.
 *
 * Creates a Supabase client wired to the current request's cookies so that
 * server-only code (Route Handlers, Server Components) can read the
 * authenticated user's session without an Authorization header.
 *
 * Usage in a Route Handler:
 *   const supabase = await createSupabaseRouteHandlerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from '@/lib/env';

/**
 * Returns a Supabase client that reads/writes auth cookies via
 * `next/headers`. Call from Route Handlers and Server Components only.
 */
export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // In Server Components cookies are read-only; ignore write errors.
          }
        },
      },
    },
  );
}
