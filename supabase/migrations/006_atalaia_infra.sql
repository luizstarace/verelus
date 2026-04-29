-- Atalaia infra hardening
-- 1. stripe_events_processed: idempotency for Stripe webhook retries
-- 2. trial_ends_at on atalaia_businesses: enforce "7 dias grátis sem cartão" promise
-- 3. atalaia-audio storage bucket (private; voice endpoint uses signed URLs)

-- 1. Idempotency table ---------------------------------------------------

CREATE TABLE IF NOT EXISTS stripe_events_processed (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-prune old dedup rows (Stripe only retries within days, not weeks)
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at ON stripe_events_processed (processed_at);

-- 2. Trial tracking ------------------------------------------------------

ALTER TABLE atalaia_businesses
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Backfill existing active businesses created without trial tracking:
-- give them a 7-day grace period from now so nobody is locked out by the migration.
UPDATE atalaia_businesses
SET trial_ends_at = now() + interval '7 days'
WHERE trial_ends_at IS NULL AND status = 'active';

-- 3. Storage bucket ------------------------------------------------------

-- Private bucket (voice endpoint issues signed URLs with TTL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('atalaia-audio', 'atalaia-audio', false, 5242880, ARRAY['audio/mpeg', 'audio/mp3'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket:
-- - Service role (voice endpoint server-side) has full access by default via supabase_admin bypass
-- - Public: no access (signed URLs handle reads)
-- - No user-level client uploads allowed
