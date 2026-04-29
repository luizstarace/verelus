-- Atalaia WhatsApp message filters
-- Safeguards so the AI does not reply to unintended contacts when the
-- connected number is shared with personal/family use.
--
-- whatsapp_whitelist_enabled: if true, only reply to numbers in whatsapp_whitelist
-- whatsapp_whitelist: array of E.164 phone numbers (e.g. "5511999999999")
-- whatsapp_hours_only: if true, only reply outside business hours (the `hours` JSON)

ALTER TABLE atalaia_businesses
  ADD COLUMN IF NOT EXISTS whatsapp_whitelist_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_whitelist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_hours_only boolean NOT NULL DEFAULT false;
