-- Evolution webhook idempotency — mirrors stripe_events_processed.
-- Evolution retries on transient failures; without this, a retry causes the
-- AI to respond twice to the same customer message.

CREATE TABLE IF NOT EXISTS attendly_evolution_events_processed (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evo_events_processed_at
  ON attendly_evolution_events_processed (processed_at);
