-- =============================================================================
-- Stayscape — Row Level Security (RLS) Policies
-- =============================================================================
--
-- This file is documentation-only (like schema.ts).  Run these statements
-- once against your Supabase project to enforce per-user data isolation.
--
-- Assumptions:
--   • auth.uid() returns the authenticated user's UUID (Supabase Auth).
--   • The service role key bypasses RLS for admin/server-side operations.
--   • Public anon key is used for read-only public content tables.
--
-- Order: enable RLS on each table first, then add policies.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile row.
CREATE POLICY "users: self read"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile row.
CREATE POLICY "users: self update"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);


-- ---------------------------------------------------------------------------
-- stays
-- ---------------------------------------------------------------------------
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;

-- Guests can read their own stays.
CREATE POLICY "stays: owner read"
  ON public.stays
  FOR SELECT
  USING (auth.uid() = userid);

-- Only the service role (server-side admin key) may insert stays.
-- No INSERT policy is created here — inserts are performed via
-- the Supabase service role key which bypasses RLS.


-- ---------------------------------------------------------------------------
-- itineraries
-- ---------------------------------------------------------------------------
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Users can read itineraries that belong to them.
CREATE POLICY "itineraries: owner read"
  ON public.itineraries
  FOR SELECT
  USING (auth.uid() = userid);

-- Users can create itineraries for themselves.
CREATE POLICY "itineraries: owner insert"
  ON public.itineraries
  FOR INSERT
  WITH CHECK (auth.uid() = userid);

-- Users can update their own itineraries.
CREATE POLICY "itineraries: owner update"
  ON public.itineraries
  FOR UPDATE
  USING (auth.uid() = userid);


-- ---------------------------------------------------------------------------
-- itineraryitems
-- ---------------------------------------------------------------------------
ALTER TABLE public.itineraryitems ENABLE ROW LEVEL SECURITY;

-- Users can read items belonging to their own itineraries.
CREATE POLICY "itineraryitems: owner read"
  ON public.itineraryitems
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itineraryitems.itineraryid
        AND itineraries.userid = auth.uid()
    )
  );

-- Users can insert items into their own itineraries.
CREATE POLICY "itineraryitems: owner insert"
  ON public.itineraryitems
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itineraryitems.itineraryid
        AND itineraries.userid = auth.uid()
    )
  );

-- Users can update items in their own itineraries.
CREATE POLICY "itineraryitems: owner update"
  ON public.itineraryitems
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itineraryitems.itineraryid
        AND itineraries.userid = auth.uid()
    )
  );

-- Users can delete items from their own itineraries.
CREATE POLICY "itineraryitems: owner delete"
  ON public.itineraryitems
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itineraryitems.itineraryid
        AND itineraries.userid = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- stay_room_preferences
-- ---------------------------------------------------------------------------
ALTER TABLE public.stay_room_preferences ENABLE ROW LEVEL SECURITY;

-- Guests can read preferences for their own stays.
CREATE POLICY "stay_room_preferences: owner read"
  ON public.stay_room_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stays
      WHERE stays.id = stay_room_preferences.stayid
        AND stays.userid = auth.uid()
    )
  );

-- Guests can insert preferences for their own stays.
CREATE POLICY "stay_room_preferences: owner insert"
  ON public.stay_room_preferences
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stays
      WHERE stays.id = stay_room_preferences.stayid
        AND stays.userid = auth.uid()
    )
  );

-- Guests can update preferences for their own stays.
CREATE POLICY "stay_room_preferences: owner update"
  ON public.stay_room_preferences
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stays
      WHERE stays.id = stay_room_preferences.stayid
        AND stays.userid = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- stay_breakfast_preferences
-- ---------------------------------------------------------------------------
ALTER TABLE public.stay_breakfast_preferences ENABLE ROW LEVEL SECURITY;

-- Guests can read breakfast preferences for their own stays.
CREATE POLICY "stay_breakfast_preferences: owner read"
  ON public.stay_breakfast_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stays
      WHERE stays.id = stay_breakfast_preferences.stayid
        AND stays.userid = auth.uid()
    )
  );

-- Guests can insert breakfast preferences for their own stays.
CREATE POLICY "stay_breakfast_preferences: owner insert"
  ON public.stay_breakfast_preferences
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stays
      WHERE stays.id = stay_breakfast_preferences.stayid
        AND stays.userid = auth.uid()
    )
  );

-- Guests can update breakfast preferences for their own stays.
CREATE POLICY "stay_breakfast_preferences: owner update"
  ON public.stay_breakfast_preferences
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stays
      WHERE stays.id = stay_breakfast_preferences.stayid
        AND stays.userid = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- service_tasks
-- ---------------------------------------------------------------------------
ALTER TABLE public.service_tasks ENABLE ROW LEVEL SECURITY;

-- Staff can read tasks for properties they are assigned to.
CREATE POLICY "service_tasks: staff read"
  ON public.service_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE staff_profiles.userid = auth.uid()
        AND staff_profiles.propertyid = service_tasks.propertyid
    )
  );

-- Guests can read tasks that belong to their own stays.
CREATE POLICY "service_tasks: guest read"
  ON public.service_tasks
  FOR SELECT
  USING (
    stayid IN (
      SELECT id FROM public.stays WHERE userid = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- Read-only public content tables
-- (No RLS needed — anon key has SELECT access by default in Supabase.)
-- ---------------------------------------------------------------------------
--
-- The tables below contain public editorial/geo content and are intentionally
-- readable by all users (including unauthenticated requests via the anon key).
-- RLS is NOT enabled on these tables so they remain fully public:
--
--   regions
--   places
--   place_tags
--   events
--   event_tags
--   discovercategories
--   discoveritems
--   discoveritemtips
--   discoveritemlinks
--   localinsights
--
-- If stricter access is needed in the future, enable RLS and add a policy
-- such as: FOR SELECT USING (true)


-- ---------------------------------------------------------------------------
-- Admin-only tables
-- (writes restricted to service role; no user-facing INSERT/UPDATE/DELETE)
-- ---------------------------------------------------------------------------
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role key (which bypasses RLS) may write.
-- Reads are also admin-only; no SELECT policy is created for anon/authed users.

ALTER TABLE public.provider_raw_payloads ENABLE ROW LEVEL SECURITY;
-- No policies: service role only.

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
-- No policies for end users: managed exclusively via the service role / admin UI.

ALTER TABLE public.property_rooms ENABLE ROW LEVEL SECURITY;
-- No policies for end users: managed via service role / admin UI.
