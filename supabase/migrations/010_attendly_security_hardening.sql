-- 010 Attendly security hardening
-- Two separate fixes called out by Supabase advisors:
-- 1) attendly-audio storage bucket was left public (`public=true` + broad
--    SELECT policy `public_read_audio`). Conversation audio is customer PII
--    under LGPD. Signed URLs bypass RLS cryptographically, so closing the
--    bucket does not break the voice endpoint (see
--    src/app/api/attendly/voice/route.ts which uses createSignedUrl).
-- 2) Six functions had a mutable search_path, which is flagged as a
--    search-path-injection risk. Pinning to `public, pg_temp` is the standard
--    remediation.

-- 1) Lock down attendly-audio
UPDATE storage.buckets SET public = false WHERE id = 'attendly-audio';
DROP POLICY IF EXISTS public_read_audio ON storage.objects;

-- 2) Pin search_path on the six flagged functions
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_message_count(conv_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_usage(p_business_id uuid, p_tokens integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_voice_usage(biz_id uuid, period_date date, seconds_to_add integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.attendly_cleanup_old_rows() SET search_path = public, pg_temp;
