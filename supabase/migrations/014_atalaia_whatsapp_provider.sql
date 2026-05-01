-- 014: WhatsApp provider abstraction (Evolution + Zenvia BSP)
--
-- Adds a provider column to distinguish Evolution (self-hosted, BYO) from
-- Zenvia (BSP, official Meta) and the BSP lifecycle state needed for the
-- KYC → provisioning → migration flow.
--
-- Default provider stays 'evolution' so every existing business keeps
-- working unchanged — this migration is purely additive.

-- 1) Provider + BSP lifecycle on businesses
ALTER TABLE atalaia_businesses
  ADD COLUMN IF NOT EXISTS whatsapp_provider TEXT NOT NULL DEFAULT 'evolution'
    CHECK (whatsapp_provider IN ('evolution', 'zenvia')),
  ADD COLUMN IF NOT EXISTS whatsapp_byo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bsp_kyc_status TEXT
    CHECK (bsp_kyc_status IS NULL OR bsp_kyc_status IN ('not_started','pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS bsp_kyc_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bsp_kyc_decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bsp_kyc_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS bsp_waba_id TEXT,
  ADD COLUMN IF NOT EXISTS bsp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS bsp_subaccount_id TEXT,
  ADD COLUMN IF NOT EXISTS bsp_provisioned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bsp_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bsp_evolution_bridge_until TIMESTAMPTZ;

-- Partial index — KYC poll cron walks only pending rows.
CREATE INDEX IF NOT EXISTS idx_biz_kyc_pending
  ON atalaia_businesses (bsp_kyc_status)
  WHERE bsp_kyc_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_biz_provider
  ON atalaia_businesses (whatsapp_provider);

-- One-to-one mapping: a Zenvia phone_number_id belongs to exactly one business.
CREATE UNIQUE INDEX IF NOT EXISTS uq_biz_bsp_phone_number_id
  ON atalaia_businesses (bsp_phone_number_id)
  WHERE bsp_phone_number_id IS NOT NULL;

-- 2) Idempotency for Zenvia inbound webhooks (mirrors atalaia_evolution_events_processed)
CREATE TABLE IF NOT EXISTS atalaia_zenvia_events_processed (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zenvia_events_processed_at
  ON atalaia_zenvia_events_processed (processed_at);

-- Enable RLS but provide no policies — only service_role can read/write,
-- consistent with atalaia_evolution_events_processed.
ALTER TABLE atalaia_zenvia_events_processed ENABLE ROW LEVEL SECURITY;

-- 3) Audit log for BSP lifecycle (founder-only via service_role)
CREATE TABLE IF NOT EXISTS atalaia_bsp_provisioning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES atalaia_businesses(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN (
    'subaccount_created',
    'kyc_submitted',
    'kyc_approved',
    'kyc_rejected',
    'phone_provisioned',
    'migrated_from_evolution',
    'evolution_bridge_started',
    'evolution_bridge_cleaned'
  )),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bsp_log_biz
  ON atalaia_bsp_provisioning_log (business_id, created_at DESC);

ALTER TABLE atalaia_bsp_provisioning_log ENABLE ROW LEVEL SECURITY;
-- No policies — service_role only. Owners see aggregated state via atalaia_businesses.
