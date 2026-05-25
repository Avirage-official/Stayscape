-- Migration: itinerary_date_range
-- Adds trip date range to standalone itineraries.
-- Hotel-guest itineraries use stays.checkindate / stays.checkoutdate.
-- Standalone itineraries store their range directly on the itineraries row.

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS startdate date,
  ADD COLUMN IF NOT EXISTS enddate   date;
