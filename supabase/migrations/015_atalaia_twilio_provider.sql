-- 015: Twilio WhatsApp Sender provider + onboarding email tracking
--
-- Extends the provider enum (text CHECK) added in migration 014 to include
-- 'twilio'. Adds Twilio-specific identifier columns and tracks the two
-- onboarding emails sent during the 3-5 day Meta approval window.
--
-- Purely additive — businesses with provider='evolution' or 'zenvia' keep
-- working unchanged.

-- 1) Replace provider CHECK constraint to allow 'twilio'
ALTER TABLE atalaia_businesses
  DROP CONSTRAINT IF EXISTS atalaia_businesses_whatsapp_provider_check;

ALTER TABLE atalaia_businesses
  ADD CONSTRAINT atalaia_businesses_whatsapp_provider_check
  CHECK (whatsapp_provider IN ('evolution', 'zenvia', 'twilio'));

-- 2) Twilio-specific identifiers
ALTER TABLE atalaia_businesses
  ADD COLUMN IF NOT EXISTS twilio_phone_sid TEXT,
  ADD COLUMN IF NOT EXISTS twilio_sender_sid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_biz_twilio_phone_sid
  ON atalaia_businesses (twilio_phone_sid)
  WHERE twilio_phone_sid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_biz_twilio_sender_sid
  ON atalaia_businesses (twilio_sender_sid)
  WHERE twilio_sender_sid IS NOT NULL;

-- 3) Onboarding email tracking — used by /provision idempotency to avoid
-- resending the same email when /provision is retried.
ALTER TABLE atalaia_businesses
  ADD COLUMN IF NOT EXISTS onboarding_email_1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_email_2_scheduled_at TIMESTAMPTZ;

-- 4) Idempotency for Twilio inbound webhooks (mirrors zenvia/evolution pattern)
CREATE TABLE IF NOT EXISTS atalaia_twilio_events_processed (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_twilio_events_processed_at
  ON atalaia_twilio_events_processed (processed_at);

ALTER TABLE atalaia_twilio_events_processed ENABLE ROW LEVEL SECURITY;
-- No policies — service_role only, consistent with the other event tables.

-- 5) Extend the bsp_provisioning_log event whitelist with Twilio-specific events
ALTER TABLE atalaia_bsp_provisioning_log
  DROP CONSTRAINT IF EXISTS atalaia_bsp_provisioning_log_event_check;

ALTER TABLE atalaia_bsp_provisioning_log
  ADD CONSTRAINT atalaia_bsp_provisioning_log_event_check
  CHECK (event IN (
    -- Phase 1 Zenvia events (kept for compatibility):
    'subaccount_created',
    'kyc_submitted',
    'kyc_approved',
    'kyc_rejected',
    'phone_provisioned',
    'migrated_from_evolution',
    'evolution_bridge_started',
    'evolution_bridge_cleaned',
    -- Twilio-specific events:
    'twilio_number_rented',
    'twilio_sender_submitted',
    'twilio_sender_approved',
    'twilio_sender_rejected',
    'twilio_sender_deregistered',
    'twilio_number_released',
    'onboarding_email_1_sent',
    'onboarding_email_2_scheduled'
  ));
