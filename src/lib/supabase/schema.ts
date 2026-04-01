/**
 * Supabase — Recommended Table Schemas
 *
 * This file documents the Supabase table schemas that the application
 * expects. Run these SQL statements in the Supabase SQL editor to
 * create the tables. The application code (repositories, services)
 * is designed to work with these schemas without rewriting.
 *
 * ──────────────────────────────────────────────────────────────
 * NOTE: This file is documentation only — it is NOT executed at
 *       runtime. It exists so the table structure is version-
 *       controlled alongside the application code.
 * ──────────────────────────────────────────────────────────────
 */

export const SCHEMA_SQL = `
-- ═══════════════════════════════════════════════════════════
-- REGIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS regions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  radius_km     DOUBLE PRECISION NOT NULL DEFAULT 10,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  country_code  TEXT NOT NULL DEFAULT 'US',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PLACES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS places (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id           UUID REFERENCES regions(id),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  category            TEXT NOT NULL,
  subcategory         TEXT,
  description         TEXT NOT NULL DEFAULT '',
  editorial_summary   TEXT,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  address             TEXT NOT NULL DEFAULT '',
  address_line2       TEXT,
  city                TEXT NOT NULL DEFAULT '',
  country_code        TEXT NOT NULL DEFAULT 'US',
  phone               TEXT,
  website             TEXT,
  booking_url         TEXT,
  image_url           TEXT,
  image_urls          JSONB NOT NULL DEFAULT '[]',
  rating              DOUBLE PRECISION,
  rating_count        INTEGER,
  price_level         INTEGER CHECK (price_level BETWEEN 1 AND 4),
  opening_hours       JSONB,
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  external_source     TEXT NOT NULL DEFAULT 'manual',
  external_id         TEXT,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (external_source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_places_region ON places(region_id);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_active ON places(is_active);
CREATE INDEX IF NOT EXISTS idx_places_external ON places(external_source, external_id);

-- ═══════════════════════════════════════════════════════════
-- PLACE_TAGS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS place_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  tag_type    TEXT NOT NULL DEFAULT 'general',
  source      TEXT NOT NULL DEFAULT 'manual',
  confidence  DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (place_id, tag, tag_type)
);

CREATE INDEX IF NOT EXISTS idx_place_tags_place ON place_tags(place_id);

-- ═══════════════════════════════════════════════════════════
-- EVENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id           UUID REFERENCES regions(id),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  editorial_summary   TEXT,
  category            TEXT NOT NULL DEFAULT 'general',
  subcategory         TEXT,
  venue_name          TEXT,
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  address             TEXT,
  city                TEXT,
  country_code        TEXT,
  image_url           TEXT,
  image_urls          JSONB NOT NULL DEFAULT '[]',
  ticket_url          TEXT,
  price_min           DOUBLE PRECISION,
  price_max           DOUBLE PRECISION,
  currency            TEXT DEFAULT 'USD',
  start_date          TIMESTAMPTZ NOT NULL,
  end_date            TIMESTAMPTZ,
  start_time          TEXT,
  end_time            TEXT,
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  external_source     TEXT NOT NULL DEFAULT 'manual',
  external_id         TEXT,
  last_synced_at      TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (external_source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_events_region ON events(region_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_external ON events(external_source, external_id);

-- ═══════════════════════════════════════════════════════════
-- EVENT_TAGS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS event_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  tag_type    TEXT NOT NULL DEFAULT 'general',
  source      TEXT NOT NULL DEFAULT 'manual',
  confidence  DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (event_id, tag, tag_type)
);

CREATE INDEX IF NOT EXISTS idx_event_tags_event ON event_tags(event_id);

-- ═══════════════════════════════════════════════════════════
-- SAVED_ITEMS (user bookmarks / itinerary)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS saved_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  item_type        TEXT NOT NULL CHECK (item_type IN ('place', 'event')),
  item_id          UUID NOT NULL,
  scheduled_date   DATE,
  scheduled_time   TIME,
  duration_minutes INTEGER,
  notes            TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);

-- ═══════════════════════════════════════════════════════════
-- USER_PREFERENCES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_preferences (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL UNIQUE,
  preferred_categories   JSONB NOT NULL DEFAULT '[]',
  preferred_vibes        JSONB NOT NULL DEFAULT '[]',
  preferred_price_levels JSONB NOT NULL DEFAULT '[]',
  dietary_restrictions   JSONB NOT NULL DEFAULT '[]',
  accessibility_needs    JSONB NOT NULL DEFAULT '[]',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- SYNC_RUNS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sync_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type             TEXT NOT NULL CHECK (sync_type IN ('places', 'events')),
  provider              TEXT NOT NULL,
  region_id             UUID REFERENCES regions(id),
  category              TEXT,
  status                TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  records_fetched       INTEGER NOT NULL DEFAULT 0,
  records_created       INTEGER NOT NULL DEFAULT 0,
  records_updated       INTEGER NOT NULL DEFAULT 0,
  records_deactivated   INTEGER NOT NULL DEFAULT 0,
  error_message         TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_type ON sync_runs(sync_type, provider);

-- ═══════════════════════════════════════════════════════════
-- PROVIDER_RAW_PAYLOADS (optional audit table)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS provider_raw_payloads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT NOT NULL,
  external_id   TEXT NOT NULL,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('place', 'event')),
  raw_data      JSONB NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_payloads_provider ON provider_raw_payloads(provider, external_id);

-- ═══════════════════════════════════════════════════════════
-- CURATED_COLLECTIONS (optional editorial grouping)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS curated_collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id   UUID REFERENCES regions(id),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curated_collection_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id   UUID NOT NULL REFERENCES curated_collections(id) ON DELETE CASCADE,
  item_type       TEXT NOT NULL CHECK (item_type IN ('place', 'event')),
  item_id         UUID NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0
);
`;
