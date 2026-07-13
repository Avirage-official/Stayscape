/**
 * PMS Adapter Router
 *
 * Picks the right adapter based on a hotel's pms_config.provider value.
 * The rest of Stayscape calls getAdapterForProperty(propertyId) and
 * doesn't know or care which PMS is behind it.
 *
 * Adding a new PMS in the future:
 *   1. Write src/lib/pms/adapters/{provider}.ts implementing PmsAdapter
 *   2. Add a case to the switch below
 *   3. Add the provider name to SUPPORTED_PROVIDERS
 *   4. Done — the rest of the codebase requires no changes.
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { PmsAdapter, PmsAdapterConfig } from './types';
import { MewsAdapter } from './adapters/mews';

/* ──────────────────────────────────────────────────────────────────
   SUPPORTED PROVIDERS
   ──────────────────────────────────────────────────────────────────
   Keep this in sync with the pms_config.provider enum in Supabase.
   ────────────────────────────────────────────────────────────────── */

export const SUPPORTED_PROVIDERS = [
  'manual', // No real PMS — admin enters stays manually
  'mews',
  // Future: 'cloudbeds', 'apaleo', 'opera', 'little_hotelier'
] as const;

export type PmsProvider = (typeof SUPPORTED_PROVIDERS)[number];

/* ──────────────────────────────────────────────────────────────────
   PMS CONFIG (from Supabase pms_config table)
   ────────────────────────────────────────────────────────────────── */

interface PmsConfigRow {
  property_id: string;
  provider: string;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  webhook_secret: string | null;
  is_active: boolean;
}

/* ──────────────────────────────────────────────────────────────────
   PUBLIC API
   ────────────────────────────────────────────────────────────────── */

/**
 * Get the configured adapter for a given property.
 * Throws if the property has no PMS config, has an unsupported provider,
 * or is missing required credentials.
 *
 * Returns null for properties using the 'manual' provider — caller
 * should handle the manual case explicitly (no PMS sync to do).
 */
export async function getAdapterForProperty(
  propertyId: string,
): Promise<PmsAdapter | null> {
  const config = await loadPmsConfig(propertyId);

  if (!config.is_active) {
    throw new PmsRouterError(
      `PMS integration for property ${propertyId} is inactive`,
    );
  }

  return buildAdapter(config);
}

/**
 * Direct adapter construction without DB lookup.
 * Used by tests, the drift canary, and one-off scripts.
 */
export function buildAdapter(config: PmsConfigRow): PmsAdapter | null {
  if (!isSupportedProvider(config.provider)) {
    throw new PmsRouterError(
      `Unsupported PMS provider: ${config.provider}. ` +
        `Supported: ${SUPPORTED_PROVIDERS.join(', ')}`,
    );
  }

  switch (config.provider as PmsProvider) {
    case 'manual':
      /* No adapter needed — Stayscape is the source of truth. */
      return null;

    case 'mews': {
      assertCredentials(config, 'mews');
      const adapterConfig: PmsAdapterConfig = {
        propertyId: config.property_id,
        apiEndpoint: config.api_endpoint!,
        apiKey: decryptApiKey(config.api_key_encrypted!),
        webhookSecret: config.webhook_secret ?? undefined,
      };
      return new MewsAdapter(adapterConfig);
    }

    default: {
      /* Exhaustiveness check — TS will error if a provider is added
         to SUPPORTED_PROVIDERS but not handled in the switch. */
      const _exhaustive: never = config.provider as never;
      throw new PmsRouterError(`Unhandled provider: ${_exhaustive}`);
    }
  }
}

/**
 * Returns the human-readable name of the provider configured for a property.
 * Useful for admin dashboards: "Connected to: Mews".
 */
export async function getProviderNameForProperty(
  propertyId: string,
): Promise<string> {
  const config = await loadPmsConfig(propertyId);
  switch (config.provider as PmsProvider) {
    case 'manual':
      return 'Manual entry';
    case 'mews':
      return 'Mews';
    default:
      return config.provider;
  }
}

/* ──────────────────────────────────────────────────────────────────
   ERRORS
   ────────────────────────────────────────────────────────────────── */

export class PmsRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PmsRouterError';
  }
}

/* ──────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
   ────────────────────────────────────────────────────────────────── */

async function loadPmsConfig(propertyId: string): Promise<PmsConfigRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pms_config')
    .select('property_id, provider, api_endpoint, api_key_encrypted, webhook_secret, is_active')
    .eq('property_id', propertyId)
    .maybeSingle();
  if (error) {
    throw new PmsRouterError(
      `Failed to load PMS config for ${propertyId}: ${error.message}`,
    );
  }
  if (!data) {
    throw new PmsRouterError(
      `No PMS config found for property ${propertyId}. ` +
        `Hotel must configure their PMS before sync can run.`,
    );
  }
  return data as PmsConfigRow;
}

function isSupportedProvider(provider: string): provider is PmsProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(provider);
}

function assertCredentials(
  config: PmsConfigRow,
  providerName: string,
): asserts config is PmsConfigRow & {
  api_endpoint: string;
  api_key_encrypted: string;
} {
  if (!config.api_endpoint) {
    throw new PmsRouterError(
      `${providerName} requires an api_endpoint but none is configured for property ${config.property_id}`,
    );
  }
  if (!config.api_key_encrypted) {
    throw new PmsRouterError(
      `${providerName} requires api_key_encrypted but none is configured for property ${config.property_id}`,
    );
  }
}

/**
 * Decrypt the stored API key.
 *
 * v1: pass-through (key is stored as-is in api_key_encrypted column).
 * v2 (Phase 2): use Supabase Vault or a server-side AES key to decrypt
 * before returning. The contract here doesn't change — only the body.
 *
 * Exported so the drift canary can reuse this without duplicating the
 * decryption logic. Any caller that needs raw credentials must go through
 * here — do NOT inline the decryption anywhere else.
 */
export function decryptApiKey(encrypted: string): string {
  // TODO Phase 2: replace with real decryption via Supabase Vault.
  return encrypted;
}
