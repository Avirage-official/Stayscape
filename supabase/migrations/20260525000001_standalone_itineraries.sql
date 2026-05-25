-- Migration: standalone_itineraries
-- Enables itinerary and saved-places features for users without a hotel booking.
--
-- Changes:
--   1. itineraries.stayid  — drop NOT NULL (UNIQUE + FK preserved)
--   2. itinerary_notes.stayid — drop NOT NULL (userid already identifies ownership)
--   3. saved_places        — new table (user wishlist)
--   4. users.aria_credits  — new column (free Aria quota for standalone users)

-- 1. Standalone itineraries: stayid = NULL for non-hotel users
ALTER TABLE public.itineraries
  ALTER COLUMN stayid DROP NOT NULL;

-- 2. Itinerary notes: stayid = NULL for standalone itinerary items
--    userid + itinerary_item_id already provide full context.
ALTER TABLE public.itinerary_notes
  ALTER COLUMN stayid DROP NOT NULL;

-- 3. Saved places (wishlist — no scheduling, just "I want to go here")
CREATE TABLE public.saved_places (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  place_id   uuid        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_places_pkey             PRIMARY KEY (id),
  CONSTRAINT saved_places_user_id_fkey     FOREIGN KEY (user_id)  REFERENCES public.users(id)  ON DELETE CASCADE,
  CONSTRAINT saved_places_place_id_fkey    FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE,
  CONSTRAINT saved_places_user_place_unique UNIQUE (user_id, place_id)
);

CREATE INDEX idx_saved_places_user ON public.saved_places(user_id);

-- 4. Aria credits — hotel guests bypass this entirely (they have a stay context).
--    New standalone users get 3 free requests. Paid users get -1 (unlimited).
ALTER TABLE public.users
  ADD COLUMN aria_credits integer NOT NULL DEFAULT 3;
