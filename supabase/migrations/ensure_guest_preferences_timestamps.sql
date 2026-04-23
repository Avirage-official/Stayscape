-- Migration: Ensure guest_preferences has created_at and updated_at
--
-- Context: The onboarding preferences upsert path writes to created_at / updated_at
-- on guest_preferences. If the columns were added after the table was initially
-- created they may be absent in some deployments, causing a Supabase schema-cache
-- error ("column updated_at of relation guest_preferences does not exist").
--
-- This migration adds both columns if they do not already exist.

ALTER TABLE guest_preferences
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
