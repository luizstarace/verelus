-- 013: WhatsApp connection-state tracking + support tickets
--
-- Sprint B+ (post-PR21) adds two surfaces to handle WhatsApp ban/timelock:
--   1) atalaia_businesses.whatsapp_last_state captures the most recent
--      `connection.update` event from Evolution. The Painel reads this to show
--      a red alert when the number was previously connected but is now closed
--      (typical signal of timelock or ban).
--   2) atalaia_support_tickets stores rescue requests from owners whose number
--      got restricted. Owner submits via /dashboard/atalaia/support; founder
--      gets an email with the ticket details.

-- 1) Connection-state tracking on businesses
ALTER TABLE atalaia_businesses
  ADD COLUMN IF NOT EXISTS whatsapp_last_state TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_state_changed_at TIMESTAMPTZ;

-- 2) Support tickets
CREATE TABLE IF NOT EXISTS atalaia_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES atalaia_businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('whatsapp_ban', 'whatsapp_disconnect', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_atalaia_support_tickets_business ON atalaia_support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_atalaia_support_tickets_user ON atalaia_support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_atalaia_support_tickets_status ON atalaia_support_tickets(status);

ALTER TABLE atalaia_support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop policies if reapplying (idempotent migration)
DROP POLICY IF EXISTS "users see own support tickets" ON atalaia_support_tickets;
DROP POLICY IF EXISTS "users create own support tickets" ON atalaia_support_tickets;

CREATE POLICY "users see own support tickets" ON atalaia_support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users create own support tickets" ON atalaia_support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Updates restricted to service role (founder resolves via Supabase dashboard or backend tooling).
