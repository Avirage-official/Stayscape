-- =============================================================
-- Migration: explore_properties + explore_property_tags
-- Created: 2026-05-21
--
-- Separate from the onboarded `properties` table intentionally:
-- explore_properties is seeded manually for Explore discovery;
-- it does NOT represent paying/onboarded hotel clients.
-- =============================================================

-- Main table
CREATE TABLE IF NOT EXISTS public.explore_properties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  region_id        UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  city             TEXT,
  country_code     CHAR(2),
  description      TEXT,
  editorial_summary TEXT,
  image_url        TEXT,
  image_urls       JSONB NOT NULL DEFAULT '[]',
  booking_url      TEXT,           -- external booking link only
  price_from       NUMERIC(10, 2),
  currency         CHAR(3) DEFAULT 'SGD',
  star_rating      SMALLINT CHECK (star_rating BETWEEN 1 AND 5),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.explore_properties IS
  'Manually seeded hotel/stay cards for the Explore discovery feed. Not linked to onboarded properties.';

-- Tags (mirrors place_tags / event_tags pattern exactly)
CREATE TABLE IF NOT EXISTS public.explore_property_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.explore_properties(id) ON DELETE CASCADE,
  tag_type    TEXT NOT NULL CHECK (tag_type IN ('vibe', 'general')),
  tag         TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.explore_property_tags IS
  'Vibe and general tags for explore_properties. Used for personalisation scoring.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_explore_properties_region
  ON public.explore_properties (region_id);
CREATE INDEX IF NOT EXISTS idx_explore_properties_active_featured
  ON public.explore_properties (is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_explore_property_tags_property
  ON public.explore_property_tags (property_id);
CREATE INDEX IF NOT EXISTS idx_explore_property_tags_type
  ON public.explore_property_tags (tag_type);

-- RLS: anon read-only (same as places / events)
ALTER TABLE public.explore_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explore_property_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read explore_properties"
  ON public.explore_properties FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Public read explore_property_tags"
  ON public.explore_property_tags FOR SELECT
  USING (TRUE);
