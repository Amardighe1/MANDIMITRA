-- =============================================================================
-- MANDIMITRA - Veterinary Service System Migration
-- =============================================================================
-- Run this AFTER supabase_setup.sql in Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS verification_document_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Sync existing data: doctors without verification → pending
UPDATE public.profiles
  SET verification_status = CASE
    WHEN is_verified = true THEN 'active'
    ELSE 'pending_verification'
  END
  WHERE role = 'doctor';

UPDATE public.profiles
  SET verification_status = 'active'
  WHERE role IN ('farmer', 'admin');

-- Constraint on verification_status
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_status_check
  CHECK (verification_status IN ('pending_verification', 'active', 'rejected'));

-- 2. Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date    date NOT NULL,
  time_slot       text NOT NULL,
  animal_type     text,
  description     text,
  status          text DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  farmer_name     text,
  farmer_phone    text,
  doctor_name     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_full_access" ON public.bookings FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER on_booking_updated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_bookings_farmer  ON public.bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_doctor  ON public.bookings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date    ON public.bookings(booking_date);

-- 3. Emergency requests table
CREATE TABLE IF NOT EXISTS public.emergency_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_by     uuid REFERENCES public.profiles(id),
  animal_type     text NOT NULL,
  description     text NOT NULL,
  location        text,
  latitude        double precision,
  longitude       double precision,
  status          text DEFAULT 'active'
                    CHECK (status IN ('active', 'accepted', 'completed', 'cancelled')),
  farmer_name     text,
  farmer_phone    text,
  doctor_name     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergency_full_access" ON public.emergency_requests FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER on_emergency_updated
  BEFORE UPDATE ON public.emergency_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_emergency_status    ON public.emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_farmer    ON public.emergency_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_accepted  ON public.emergency_requests(accepted_by);

-- 4. Index for verification status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON public.profiles(verification_status);

-- 5. Create storage bucket for verification documents (run in SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow service role uploads / public reads
CREATE POLICY "verification_docs_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-docs');

CREATE POLICY "verification_docs_service_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs');

CREATE POLICY "verification_docs_service_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'verification-docs');

CREATE POLICY "verification_docs_service_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'verification-docs');

-- Done!  Run this once, then restart the backend.
