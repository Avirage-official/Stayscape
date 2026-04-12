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
-- USERS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  firstname   TEXT,
  lastname    TEXT,
  phone       TEXT,
  createdat   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PROPERTIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS properties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  image_url   TEXT,
  address     TEXT
);

-- ═══════════════════════════════════════════════════════════
-- PROPERTY_ROOMS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propertyid   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  roomlabel    TEXT NOT NULL,
  description  TEXT,
  maxguests    INTEGER
);

-- ═══════════════════════════════════════════════════════════
-- STAYS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stays (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid       UUID NOT NULL REFERENCES users(id),
  propertyid   UUID NOT NULL REFERENCES properties(id),
  checkindate  DATE NOT NULL,
  checkoutdate DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'confirmed',
  roomlabel    TEXT,
  guestcount   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_stays_userid ON stays(userid);

-- ═══════════════════════════════════════════════════════════
-- STAY_ROOM_PREFERENCES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stay_room_preferences (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stayid    UUID NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  preference TEXT NOT NULL
);

-- ═══════════════════════════════════════════════════════════
-- STAY_BREAKFAST_PREFERENCES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stay_breakfast_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stayid     UUID NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  preference TEXT NOT NULL
);

-- ═══════════════════════════════════════════════════════════
-- STAFF_PROFILES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS staff_profiles (
  id          UUID PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  firstname   TEXT,
  lastname    TEXT,
  role        TEXT NOT NULL DEFAULT 'staff',
  createdat   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- SERVICE_TASKS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS service_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stayid      UUID REFERENCES stays(id),
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  createdat   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- SERVICE_TASK_EVENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS service_task_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taskid      UUID NOT NULL REFERENCES service_tasks(id) ON DELETE CASCADE,
  staffid     UUID REFERENCES staff_profiles(id),
  eventtype   TEXT NOT NULL,
  notes       TEXT,
  createdat   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERCATEGORIES
-- ═══════════════════════════════════════════════════════════
CREATE TYPE IF NOT EXISTS contentstatus AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS discovercategories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL,
  iconname  TEXT NOT NULL,
  imageurl  TEXT NOT NULL,
  subtitle  TEXT NOT NULL DEFAULT '',
  sortorder INTEGER NOT NULL DEFAULT 0,
  isactive  BOOLEAN NOT NULL DEFAULT true
);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERITEMS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS discoveritems (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoryid                UUID NOT NULL REFERENCES discovercategories(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  shortdescription          TEXT NOT NULL DEFAULT '',
  fulldescription           TEXT,
  locationname              TEXT,
  distancekm                DOUBLE PRECISION,
  ratingvalue               DOUBLE PRECISION,
  recommendeddurationhours  TEXT,
  besttimetogo              TEXT,
  imageurl                  TEXT,
  websiteurl                TEXT,
  gradient                  TEXT,
  latitude                  DOUBLE PRECISION,
  longitude                 DOUBLE PRECISION,
  status                    contentstatus NOT NULL DEFAULT 'draft'
);

CREATE INDEX IF NOT EXISTS idx_discoveritems_category ON discoveritems(categoryid);
CREATE INDEX IF NOT EXISTS idx_discoveritems_status ON discoveritems(status);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERITEMTIPS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS discoveritemtips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discoveritemid  UUID NOT NULL REFERENCES discoveritems(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  tiptype         TEXT NOT NULL DEFAULT 'things_to_do',
  sortorder       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_discoveritemtips_item ON discoveritemtips(discoveritemid);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERITEMLINKS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS discoveritemlinks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discoveritemid  UUID NOT NULL REFERENCES discoveritems(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  url             TEXT NOT NULL,
  sortorder       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_discoveritemlinks_item ON discoveritemlinks(discoveritemid);

-- ═══════════════════════════════════════════════════════════
-- LOCALINSIGHTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS localinsights (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title     TEXT NOT NULL,
  summary   TEXT NOT NULL DEFAULT '',
  iconname  TEXT NOT NULL DEFAULT '',
  body      TEXT NOT NULL DEFAULT '',
  sortorder INTEGER NOT NULL DEFAULT 0,
  status    contentstatus NOT NULL DEFAULT 'draft'
);

CREATE INDEX IF NOT EXISTS idx_localinsights_status ON localinsights(status);

-- ═══════════════════════════════════════════════════════════
-- ITINERARIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS itineraries (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stayid    UUID REFERENCES stays(id),
  userid    UUID REFERENCES users(id),
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itineraries_stayid ON itineraries(stayid);

-- ═══════════════════════════════════════════════════════════
-- ITINERARYITEMS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS itineraryitems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itineraryid     UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  discoveritemid  UUID REFERENCES discoveritems(id),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT '',
  image           TEXT NOT NULL DEFAULT '',
  scheduleddate   DATE NOT NULL,
  starttime       TIME NOT NULL,
  durationhours   DOUBLE PRECISION NOT NULL DEFAULT 1,
  createdat       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itineraryitems_itinerary ON itineraryitems(itineraryid);

-- ═══════════════════════════════════════════════════════════
-- ITINERARYITEMSNAPSHOTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS itineraryitemsnapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itineraryitemid UUID NOT NULL REFERENCES itineraryitems(id) ON DELETE CASCADE,
  snapshotdata    JSONB NOT NULL,
  createdat       TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
`;
