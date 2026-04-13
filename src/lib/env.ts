/**
 * Environment variable helpers.
 * Server-only secrets are validated at call-time so the app still boots
 * without them (useful during early development / CI).
 */

/* ── Public (safe for client bundles) ── */

export const NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const NEXT_PUBLIC_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

/* ── Server-only (never imported from client components) ── */

export function getServerEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }
  return value;
}

/** Supabase service-role key (full access — backend only). */
export function getSupabaseServiceRoleKey(): string {
  return getServerEnv('SUPABASE_SERVICE_ROLE_KEY');
}

/** Geoapify API key (backend only). */
export function getGeoapifyApiKey(): string {
  return getServerEnv('GEOAPIFY_API_KEY');
}

/** Ticketmaster API key (backend only). */
export function getTicketmasterApiKey(): string {
  return getServerEnv('TICKETMASTER_API_KEY');
}

/** OpenAI API key for AI enrichment (backend only). */
export function getOpenAIApiKey(): string {
  return getServerEnv('OPENAI_API_KEY');
}

/** Anthropic API key for Claude AI enrichment (backend only). */
export function getAnthropicApiKey(): string {
  return getServerEnv('ANTHROPIC_API_KEY');
}

/** PMS webhook API key for validating incoming bookings (backend only). */
export function getPmsWebhookApiKey(): string {
  return getServerEnv('PMS_WEBHOOK_API_KEY');
}

/** Upstash Redis REST URL for rate limiting (optional — returns '' if not set). */
export const UPSTASH_REDIS_REST_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? '';

/** Upstash Redis REST token for rate limiting (optional — returns '' if not set). */
export const UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
