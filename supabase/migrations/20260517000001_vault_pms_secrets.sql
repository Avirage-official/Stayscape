-- Migration: Supabase Vault wrapper functions for PMS credentials
--
-- Purpose: PMS API keys (Mews ClientToken + AccessToken JSON blobs) must be
-- encrypted at rest. This migration wires up two thin SECURITY DEFINER
-- functions around Supabase Vault so Next.js server code can store and
-- retrieve secrets via supabase.rpc() without direct access to the vault
-- schema from client code.
--
-- Pre-requisite: Supabase Vault extension must be enabled in the Supabase
-- dashboard (Database → Extensions → supabase_vault) BEFORE running this.
-- The migration itself does NOT enable the extension because enabling
-- extensions requires superuser and should be done via the dashboard.
--
-- Usage from Next.js (server-side only, service role key):
--   Store:   supabase.rpc('create_pms_vault_secret', { p_secret, p_name })
--            → returns UUID; prefix with 'vault:' and save to pms_config.api_key_encrypted
--
--   Retrieve: supabase.rpc('read_pms_vault_secret', { p_id })
--            → returns the original plaintext JSON string
--
-- Backwards compat: pms_config rows that were created before this migration
-- still have raw JSON in api_key_encrypted. The Next.js router detects
-- 'vault:'-prefixed values and routes to Vault; raw values pass through.

-- Store a PMS credential in Vault and return the secret UUID.
-- The caller should prefix the returned UUID with 'vault:' before saving
-- to pms_config.api_key_encrypted.
CREATE OR REPLACE FUNCTION create_pms_vault_secret(
  p_secret TEXT,
  p_name   TEXT
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT vault.create_secret(p_secret, p_name);
$$;

-- Retrieve a PMS credential from Vault by UUID.
-- Returns NULL if the secret does not exist (caller should treat as error).
CREATE OR REPLACE FUNCTION read_pms_vault_secret(p_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE id = p_id;
$$;

-- Only the service role should call these functions.
REVOKE EXECUTE ON FUNCTION create_pms_vault_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION read_pms_vault_secret(UUID)          FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_pms_vault_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION read_pms_vault_secret(UUID)          TO service_role;
