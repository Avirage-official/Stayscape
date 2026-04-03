/**
 * Supabase client factories.
 *
 * • `supabaseBrowser`  – lightweight anon-key client for read-only
 *   frontend queries (runs in the browser).
 * • `supabaseAdmin`    – service-role client for backend mutations,
 *   sync jobs, and admin routes (never imported from client components).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  getSupabaseServiceRoleKey,
} from '@/lib/env';

/* ── Browser (anon) client ─────────────────────────────────── */

let _browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client using the public anon key.
 * Safe for use in client components and read-only server components.
 * Returns `null` when credentials are not configured yet.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  if (!_browserClient) {
    _browserClient = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return _browserClient;
}

/* ── Admin (service-role) client ───────────────────────────── */

let _adminClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client using the service-role key.
 * Must only be called from server-side code (API routes, server
 * actions, sync workers). Throws if credentials are missing.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  _adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _adminClient;
}
