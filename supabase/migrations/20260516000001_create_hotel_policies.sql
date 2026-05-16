-- Migration: create hotel_policies table
-- Purpose: Stores hotel-level policy settings edited by hotel admins.
-- Columns map 1-to-1 with /api/hotel-admin/policies route and
-- the /hotel-admin/policies admin UI page.
--
-- Column mapping reference:
--   checkin_time          -> Stay Info: check-in time  (TIME)
--   checkout_time         -> Stay Info: check-out time (TIME)
--   wifi_name             -> Stay Info: Wi-Fi name     (TEXT)
--   wifi_password         -> Stay Info: Wi-Fi password (TEXT)
--   cancellation_policy   -> Other Policies: cancellation (TEXT)
--   pet_policy            -> Other Policies: pets          (TEXT)
--   smoking_policy        -> Other Policies: smoking        (TEXT)
--   extra_policies (JSONB) -> stores:
--       .laundry_policy       -> Laundry Policy text
--       .late_checkout_policy -> Late Checkout policy text
--       .late_checkout_fee    -> Late Checkout fee description

CREATE TABLE IF NOT EXISTS hotel_policies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id          UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  checkin_time         TIME,
  checkout_time        TIME,
  wifi_name            TEXT,
  wifi_password        TEXT,
  cancellation_policy  TEXT,
  pet_policy           TEXT,
  smoking_policy       TEXT,
  extra_policies       JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_policies_property
  ON hotel_policies(property_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_hotel_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hotel_policies_updated_at ON hotel_policies;
CREATE TRIGGER trg_hotel_policies_updated_at
  BEFORE UPDATE ON hotel_policies
  FOR EACH ROW EXECUTE FUNCTION update_hotel_policies_updated_at();

-- Row Level Security
ALTER TABLE hotel_policies ENABLE ROW LEVEL SECURITY;

-- Hotel admins can read and write their own property's policies only
CREATE POLICY "hotel_admins_manage_own_policies"
ON hotel_policies
FOR ALL
USING (
  property_id IN (
    SELECT property_id
    FROM hotel_admins
    WHERE user_id = auth.uid()
      AND is_active = true
  )
)
WITH CHECK (
  property_id IN (
    SELECT property_id
    FROM hotel_admins
    WHERE user_id = auth.uid()
      AND is_active = true
  )
);

-- Service-role (used by the API routes via getSupabaseAdmin()) bypasses RLS
-- No extra policy needed -- service role bypasses RLS by default in Supabase.
