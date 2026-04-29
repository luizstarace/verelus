-- Rename Attendly → Atalaia
-- Production carries the legacy names attendly_*; code (and migrations 004-011 after rename)
-- now references atalaia_*. This migration renames everything in-place.
-- Idempotent: safe to re-run.

BEGIN;

-- 1. Rename tables ----------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attendly_businesses') THEN
    ALTER TABLE attendly_businesses RENAME TO atalaia_businesses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attendly_conversations') THEN
    ALTER TABLE attendly_conversations RENAME TO atalaia_conversations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attendly_messages') THEN
    ALTER TABLE attendly_messages RENAME TO atalaia_messages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attendly_usage') THEN
    ALTER TABLE attendly_usage RENAME TO atalaia_usage;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attendly_logs') THEN
    ALTER TABLE attendly_logs RENAME TO atalaia_logs;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attendly_evolution_events_processed') THEN
    ALTER TABLE attendly_evolution_events_processed RENAME TO atalaia_evolution_events_processed;
  END IF;
END $$;

-- 2. Drop legacy functions; recreate under atalaia_* ------------------------
DROP FUNCTION IF EXISTS attendly_cleanup_old_rows();
DROP FUNCTION IF EXISTS attendly_cleanup_daily();

CREATE OR REPLACE FUNCTION atalaia_cleanup_old_rows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM atalaia_logs
  WHERE created_at < now() - interval '90 days';

  DELETE FROM atalaia_evolution_events_processed
  WHERE processed_at < now() - interval '7 days';

  DELETE FROM stripe_events_processed
  WHERE processed_at < now() - interval '7 days';
END;
$$;

-- 3. Cron: unschedule legacy job, schedule new ------------------------------
DO $$
DECLARE
  old_job_id bigint;
BEGIN
  SELECT jobid INTO old_job_id FROM cron.job WHERE jobname = 'attendly_cleanup_daily';
  IF old_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(old_job_id);
  END IF;
END $$;

DO $$
DECLARE
  new_job_id bigint;
BEGIN
  SELECT jobid INTO new_job_id FROM cron.job WHERE jobname = 'atalaia_cleanup_daily';
  IF new_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(new_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'atalaia_cleanup_daily',
  '15 3 * * *',
  $$ SELECT atalaia_cleanup_old_rows(); $$
);

-- 4. Rename RLS policies whose names still embed "attendly" -----------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename LIKE 'atalaia_%'
      AND policyname LIKE '%attendly%'
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I RENAME TO %I',
      pol.policyname,
      pol.schemaname,
      pol.tablename,
      replace(pol.policyname, 'attendly', 'atalaia')
    );
  END LOOP;
END $$;

COMMIT;
