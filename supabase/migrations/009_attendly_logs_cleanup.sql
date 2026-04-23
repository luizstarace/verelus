-- Daily cleanup of attendly_logs + attendly_evolution_events_processed.
-- Without this, tables grow unbounded with every inbound message and webhook retry.
--
-- - attendly_logs: keep 90 days (enough for debugging + regulatory window)
-- - attendly_evolution_events_processed: keep 7 days (Evolution retries within minutes)

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION attendly_cleanup_old_rows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM attendly_logs
  WHERE created_at < now() - interval '90 days';

  DELETE FROM attendly_evolution_events_processed
  WHERE processed_at < now() - interval '7 days';

  DELETE FROM stripe_events_processed
  WHERE processed_at < now() - interval '7 days';
END;
$$;

-- Unschedule any existing job of the same name (idempotent reruns).
DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'attendly_cleanup_daily';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

-- Run daily at 03:15 UTC (midnight in America/Sao_Paulo, low traffic window).
SELECT cron.schedule(
  'attendly_cleanup_daily',
  '15 3 * * *',
  $$ SELECT attendly_cleanup_old_rows(); $$
);
