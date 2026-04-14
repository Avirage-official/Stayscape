-- Migration: Add PMS webhook status values to staystatus enum
--
-- Context: The hotel Property Management System (PMS) webhook sends booking
-- status payloads using these values: 'confirmed', 'checked_in', 'checked_out'.
-- The existing enum only contains: 'upcoming', 'active', 'completed', 'cancelled'.
-- This migration adds the missing PMS values so that webhook-created stays are
-- accepted by the database without an invalid-enum-value error.
--
-- Mapping (for reference):
--   PMS 'confirmed'   → guest has a confirmed upcoming reservation
--   PMS 'checked_in'  → guest has physically checked in at the property
--   PMS 'checked_out' → guest has checked out of the property
--
-- IF NOT EXISTS prevents failure if this migration is run more than once.

ALTER TYPE staystatus ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE staystatus ADD VALUE IF NOT EXISTS 'checked_in';
ALTER TYPE staystatus ADD VALUE IF NOT EXISTS 'checked_out';
