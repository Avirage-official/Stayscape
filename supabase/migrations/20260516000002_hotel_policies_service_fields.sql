-- Migration: hotel_policies service toggles + boundaries
-- File: supabase/migrations/20260516000002_hotel_policies_service_fields.sql

ALTER TABLE hotel_policies

  -- ── Concierge ──────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS concierge_enabled            BOOLEAN   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS concierge_hours_start        TIME,
  ADD COLUMN IF NOT EXISTS concierge_hours_end          TIME,

  -- ── Housekeeping ───────────────────────────────────────
  ADD COLUMN IF NOT EXISTS housekeeping_enabled         BOOLEAN   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS housekeeping_start           TIME,
  ADD COLUMN IF NOT EXISTS housekeeping_end             TIME,
  ADD COLUMN IF NOT EXISTS turndown_enabled             BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS turndown_start               TIME,
  ADD COLUMN IF NOT EXISTS turndown_end                 TIME,

  -- ── Room Service ───────────────────────────────────────
  ADD COLUMN IF NOT EXISTS room_service_enabled         BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS room_service_start           TIME,
  ADD COLUMN IF NOT EXISTS room_service_end             TIME,
  ADD COLUMN IF NOT EXISTS room_service_last_order      TIME,

  -- ── Laundry ────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS laundry_enabled              BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS laundry_pickup_start         TIME,
  ADD COLUMN IF NOT EXISTS laundry_pickup_cutoff        TIME,
  ADD COLUMN IF NOT EXISTS laundry_return_time          TIME,
  ADD COLUMN IF NOT EXISTS laundry_express_enabled      BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS laundry_express_hours        SMALLINT,

  -- ── Maintenance ────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS maintenance_enabled          BOOLEAN   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS maintenance_start            TIME,
  ADD COLUMN IF NOT EXISTS maintenance_end              TIME,
  ADD COLUMN IF NOT EXISTS maintenance_emergency_24hr   BOOLEAN   NOT NULL DEFAULT false,

  -- ── Transport ──────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS transport_enabled            BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transport_hours_start        TIME,
  ADD COLUMN IF NOT EXISTS transport_hours_end          TIME,
  ADD COLUMN IF NOT EXISTS transport_advance_notice_mins SMALLINT,

  -- ── Luggage Pickup ─────────────────────────────────────
  ADD COLUMN IF NOT EXISTS luggage_pickup_enabled       BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS luggage_pickup_start         TIME,
  ADD COLUMN IF NOT EXISTS luggage_pickup_end           TIME,
  ADD COLUMN IF NOT EXISTS luggage_pickup_fee           TEXT,

  -- ── Late Checkout ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS late_checkout_enabled        BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_checkout_max_time       TIME,
  ADD COLUMN IF NOT EXISTS late_checkout_free_if_available BOOLEAN NOT NULL DEFAULT false,

  -- ── Restaurants & Bars ─────────────────────────────────
  ADD COLUMN IF NOT EXISTS restaurant_enabled           BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restaurant_reservation_enabled BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing JSONB laundry/late checkout text into new typed columns
-- (safe no-op if extra_policies is empty or keys don't exist)
UPDATE hotel_policies
SET
  laundry_enabled = true
WHERE extra_policies->>'laundry_policy' IS NOT NULL
  AND (extra_policies->>'laundry_policy') != '';

UPDATE hotel_policies
SET
  late_checkout_enabled = true
WHERE extra_policies->>'late_checkout_policy' IS NOT NULL
  AND (extra_policies->>'late_checkout_policy') != '';
