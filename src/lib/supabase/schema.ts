/**
 * Supabase — Authoritative Table Schemas (Documentation)
 *
 * This file documents the REAL Supabase table schemas as they exist in the
 * production database. The application code (repositories, services) is
 * designed to work with these schemas.
 *
 * ──────────────────────────────────────────────────────────────
 * NOTE: This file is documentation only — it is NOT executed at
 *       runtime. It exists so the table structure is version-
 *       controlled alongside the application code.
 *
 * SOURCE OF TRUTH: The real Supabase database. If this file
 *   disagrees with the database, the database wins.
 * ──────────────────────────────────────────────────────────────
 */

export const SCHEMA_SQL = `
-- ═══════════════════════════════════════════════════════════
-- ENUMS (Supabase USER-DEFINED types)
-- ═══════════════════════════════════════════════════════════
-- These are the actual Postgres enums in the Supabase database.

CREATE TYPE IF NOT EXISTS userrole AS ENUM ('guest', 'admin');
CREATE TYPE IF NOT EXISTS staystatus AS ENUM ('upcoming', 'active', 'completed', 'cancelled', 'confirmed', 'checked_in', 'checked_out');
CREATE TYPE IF NOT EXISTS itinerarystatus AS ENUM ('active');
CREATE TYPE IF NOT EXISTS itineraryitemstatus AS ENUM ('planned');
CREATE TYPE IF NOT EXISTS itemsource AS ENUM ('discover');
CREATE TYPE IF NOT EXISTS contentstatus AS ENUM ('draft', 'published', 'archived');
CREATE TYPE IF NOT EXISTS roomstatus AS ENUM ('vacant_clean', 'vacant_dirty', 'occupied', 'out_of_order');
CREATE TYPE IF NOT EXISTS servicetaskstatus AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

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
-- USERS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY,
  firstname   VARCHAR,
  lastname    VARCHAR,
  email       VARCHAR UNIQUE,
  phone       VARCHAR,
  role        userrole NOT NULL DEFAULT 'guest',
  createdat   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_auth FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ═══════════════════════════════════════════════════════════
-- PROPERTIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR NOT NULL,
  slug            VARCHAR DEFAULT gen_random_uuid()::text,
  city            VARCHAR NOT NULL,
  country         VARCHAR NOT NULL,
  timezone        VARCHAR NOT NULL DEFAULT 'UTC',
  address         TEXT,
  createdat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  image_url       TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  region_id       UUID REFERENCES regions(id),
  pms_property_id TEXT
);

-- ═══════════════════════════════════════════════════════════
-- PROPERTY_ROOMS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propertyid   UUID NOT NULL REFERENCES properties(id),
  room_number  TEXT NOT NULL,
  floor        TEXT,
  room_type    TEXT,
  bed_config   TEXT,
  max_occupancy INTEGER,
  status       roomstatus NOT NULL DEFAULT 'vacant_clean',
  notes        TEXT,
  createdat    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- STAYS
-- ═══════════════════════════════════════════════════════════
-- Note on booking reference fields:
--   bookingreference (VARCHAR) — original/legacy column
--   booking_reference (TEXT)   — newer column used by all runtime code
-- The runtime code reads/writes booking_reference exclusively.
-- The legacy bookingreference column exists in the schema but is not
-- used by the application. Do not insert into bookingreference.
CREATE TABLE IF NOT EXISTS stays (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid            UUID NOT NULL REFERENCES users(id),
  propertyid        UUID NOT NULL REFERENCES properties(id),
  bookingreference  VARCHAR,              -- legacy column, not used by app
  checkindate       DATE NOT NULL,
  checkoutdate      DATE NOT NULL,
  roomlabel         VARCHAR,
  guestcount        INTEGER NOT NULL DEFAULT 1 CHECK (guestcount > 0),
  status            staystatus NOT NULL DEFAULT 'upcoming',
  createdat         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  booking_reference TEXT,                 -- active booking reference column
  trip_type         TEXT,
  notes             TEXT,
  pms_callback_url  TEXT
);

CREATE INDEX IF NOT EXISTS idx_stays_userid ON stays(userid);
CREATE INDEX IF NOT EXISTS idx_stays_booking_ref ON stays(booking_reference);

-- ═══════════════════════════════════════════════════════════
-- STAY_CURATIONS (AI-generated curated content per stay)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stay_curations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id         UUID REFERENCES stays(id),
  curation_type   TEXT NOT NULL,
  content         JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stay_curations_stay ON stay_curations(stay_id);

-- ═══════════════════════════════════════════════════════════
-- GUEST_PREFERENCES (concierge/map selections to push to PMS)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS guest_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id           UUID REFERENCES stays(id),
  preference_type   TEXT NOT NULL,
  preference_data   JSONB NOT NULL,
  synced_to_pms     BOOLEAN DEFAULT false,
  synced_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_preferences_stay ON guest_preferences(stay_id);
CREATE INDEX IF NOT EXISTS idx_guest_preferences_unsynced ON guest_preferences(stay_id) WHERE synced_to_pms = false;

-- ═══════════════════════════════════════════════════════════
-- STAY_ROOM_PREFERENCES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stay_room_preferences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stayid                UUID NOT NULL UNIQUE REFERENCES stays(id),
  roomid                UUID REFERENCES property_rooms(id),
  prefers_late_clean    BOOLEAN NOT NULL DEFAULT false,
  prefers_morning_clean BOOLEAN NOT NULL DEFAULT false,
  do_not_disturb        BOOLEAN NOT NULL DEFAULT false,
  notes_to_housekeeping TEXT,
  createdat             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- STAY_BREAKFAST_PREFERENCES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stay_breakfast_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stayid              UUID NOT NULL UNIQUE REFERENCES stays(id),
  breakfast_included  BOOLEAN NOT NULL DEFAULT false,
  preferred_slot      TEXT,
  in_room_breakfast   BOOLEAN NOT NULL DEFAULT false,
  notes_to_kitchen    TEXT,
  createdat           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- STAFF_PROFILES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS staff_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid      UUID NOT NULL REFERENCES users(id),
  propertyid  UUID NOT NULL REFERENCES properties(id),
  role        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  createdat   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- SERVICE_TASKS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS service_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propertyid        UUID NOT NULL REFERENCES properties(id),
  roomid            UUID REFERENCES property_rooms(id),
  stayid            UUID REFERENCES stays(id),
  task_type         USER-DEFINED NOT NULL,
  status            servicetaskstatus NOT NULL DEFAULT 'pending',
  priority          INTEGER NOT NULL DEFAULT 0,
  title             TEXT NOT NULL,
  description       TEXT,
  breakfast_required BOOLEAN NOT NULL DEFAULT false,
  created_by        UUID REFERENCES staff_profiles(id),
  assigned_to       UUID REFERENCES staff_profiles(id),
  scheduled_for     TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancel_reason     TEXT,
  createdat         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- SERVICE_TASK_EVENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS service_task_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taskid       UUID NOT NULL REFERENCES service_tasks(id),
  event_type   TEXT NOT NULL,
  old_status   servicetaskstatus,
  new_status   servicetaskstatus,
  old_assignee UUID REFERENCES staff_profiles(id),
  new_assignee UUID REFERENCES staff_profiles(id),
  notes        TEXT,
  created_by   UUID REFERENCES staff_profiles(id),
  createdat    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERCATEGORIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS discovercategories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propertyid   UUID REFERENCES properties(id),
  slug         VARCHAR NOT NULL,
  name         VARCHAR NOT NULL,
  categorytype USER-DEFINED NOT NULL,
  iconname     VARCHAR,
  imageurl     TEXT,
  sortorder    INTEGER NOT NULL DEFAULT 0,
  isactive     BOOLEAN NOT NULL DEFAULT true,
  createdat    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtitle     VARCHAR DEFAULT ''
);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERITEMS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS discoveritems (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propertyid                UUID REFERENCES properties(id),
  categoryid                UUID NOT NULL REFERENCES discovercategories(id),
  itemtype                  USER-DEFINED NOT NULL,
  title                     VARCHAR NOT NULL,
  shortdescription          VARCHAR NOT NULL,
  fulldescription           TEXT,
  locationname              VARCHAR,
  address                   TEXT,
  latitude                  NUMERIC,
  longitude                 NUMERIC,
  location                  USER-DEFINED,
  distancekm                NUMERIC,
  ratingvalue               NUMERIC CHECK (ratingvalue IS NULL OR ratingvalue >= 0 AND ratingvalue <= 5),
  ratingcount               INTEGER CHECK (ratingcount IS NULL OR ratingcount >= 0),
  recommendeddurationhours  NUMERIC CHECK (recommendeddurationhours IS NULL OR recommendeddurationhours > 0),
  besttimetogo              VARCHAR,
  imageurl                  TEXT,
  thumbnailurl              TEXT,
  websiteurl                TEXT,
  isfeatured                BOOLEAN NOT NULL DEFAULT false,
  isbookable                BOOLEAN NOT NULL DEFAULT true,
  status                    contentstatus NOT NULL DEFAULT 'draft',
  sortorder                 INTEGER NOT NULL DEFAULT 0,
  sourceprovider            VARCHAR,
  sourceid                  VARCHAR,
  sourcesyncedat            TIMESTAMPTZ,
  createdat                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  gradient                  TEXT
);

CREATE INDEX IF NOT EXISTS idx_discoveritems_category ON discoveritems(categoryid);
CREATE INDEX IF NOT EXISTS idx_discoveritems_status ON discoveritems(status);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERITEMTIPS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS discoveritemtips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discoveritemid  UUID NOT NULL REFERENCES discoveritems(id),
  tiptype         USER-DEFINED NOT NULL,
  content         TEXT NOT NULL,
  sortorder       INTEGER NOT NULL DEFAULT 0,
  createdat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discoveritemtips_item ON discoveritemtips(discoveritemid);

-- ═══════════════════════════════════════════════════════════
-- DISCOVERITEMLINKS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS discoveritemlinks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discoveritemid  UUID NOT NULL REFERENCES discoveritems(id),
  linktype        USER-DEFINED NOT NULL,
  label           VARCHAR NOT NULL,
  url             TEXT NOT NULL,
  sortorder       INTEGER NOT NULL DEFAULT 0,
  createdat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discoveritemlinks_item ON discoveritemlinks(discoveritemid);

-- ═══════════════════════════════════════════════════════════
-- LOCALINSIGHTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS localinsights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propertyid  UUID REFERENCES properties(id),
  categoryid  UUID REFERENCES discovercategories(id),
  title       VARCHAR NOT NULL,
  insighttype USER-DEFINED NOT NULL,
  summary     VARCHAR NOT NULL,
  body        TEXT NOT NULL,
  iconname    VARCHAR,
  imageurl    TEXT,
  sortorder   INTEGER NOT NULL DEFAULT 0,
  status      contentstatus NOT NULL DEFAULT 'draft',
  createdat   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_localinsights_status ON localinsights(status);

-- ═══════════════════════════════════════════════════════════
-- ITINERARIES
-- ═══════════════════════════════════════════════════════════
-- Note: stayid is NOT NULL and UNIQUE — one itinerary per stay.
CREATE TABLE IF NOT EXISTS itineraries (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stayid    UUID NOT NULL UNIQUE REFERENCES stays(id),
  userid    UUID NOT NULL REFERENCES users(id),
  title     VARCHAR,
  status    itinerarystatus NOT NULL DEFAULT 'active',
  createdat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_itineraries_stayid ON itineraries(stayid);

-- ═══════════════════════════════════════════════════════════
-- ITINERARYITEMS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS itineraryitems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itineraryid     UUID NOT NULL REFERENCES itineraries(id),
  discoveritemid  UUID REFERENCES discoveritems(id),
  scheduleddate   DATE NOT NULL,
  starttime       TIME,
  durationhours   NUMERIC CHECK (durationhours IS NULL OR durationhours > 0),
  endtime         TIME,
  titleoverride   VARCHAR,
  notes           TEXT,
  status          itineraryitemstatus NOT NULL DEFAULT 'planned',
  source          itemsource NOT NULL DEFAULT 'discover',
  createdat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name            VARCHAR,
  category        VARCHAR,
  image           TEXT
);

CREATE INDEX IF NOT EXISTS idx_itineraryitems_itinerary ON itineraryitems(itineraryid);

-- ═══════════════════════════════════════════════════════════
-- ITINERARYITEMSNAPSHOTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS itineraryitemsnapshots (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itineraryitemid          UUID NOT NULL UNIQUE REFERENCES itineraryitems(id),
  title                    VARCHAR NOT NULL,
  shortdescription         VARCHAR,
  imageurl                 TEXT,
  locationname             VARCHAR,
  websiteurl               TEXT,
  recommendeddurationhours NUMERIC,
  createdat                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  price_level         INTEGER CHECK (price_level >= 1 AND price_level <= 4),
  opening_hours       JSONB,
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  external_source     TEXT NOT NULL DEFAULT 'manual',
  external_id         TEXT,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
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
  place_id    UUID NOT NULL REFERENCES places(id),
  tag         TEXT NOT NULL,
  tag_type    TEXT NOT NULL DEFAULT 'general',
  source      TEXT NOT NULL DEFAULT 'manual',
  confidence  DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
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
  start_date          TIMESTAMPTZ NOT NULL DEFAULT now(),
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
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
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
  event_id    UUID NOT NULL REFERENCES events(id),
  tag         TEXT NOT NULL,
  tag_type    TEXT NOT NULL DEFAULT 'general',
  source      TEXT NOT NULL DEFAULT 'manual',
  confidence  DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
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
