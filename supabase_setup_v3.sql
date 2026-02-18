-- =============================================================================
-- MANDIMITRA - Emergency Proximity System Migration (v3)
-- =============================================================================
-- Run this AFTER supabase_setup_v2.sql in Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Add proximity columns to emergency_requests
ALTER TABLE public.emergency_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS assigned_doctor_name text,
  ADD COLUMN IF NOT EXISTS distance_km double precision,
  ADD COLUMN IF NOT EXISTS escalation_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejected_by uuid[] DEFAULT '{}';

-- 2. Index for fast assigned_to lookups
CREATE INDEX IF NOT EXISTS idx_emergency_assigned ON public.emergency_requests(assigned_to);

-- 3. Ensure doctor profiles can store location (columns already exist from v2,
--    but let's make sure)
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS latitude double precision,
--   ADD COLUMN IF NOT EXISTS longitude double precision;
-- (already added in v2)

-- 4. Spatial index hint: if PostGIS is available you could use geography types,
--    but Haversine in application code works fine for this scale.

-- Done! Restart backend after running this.
