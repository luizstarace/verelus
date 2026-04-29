-- Enable RLS on atalaia_logs as defense-in-depth.
--
-- Today /api/atalaia/logs already filters by business_id server-side with a
-- service-role client, so there's no live leak. But if anyone ever queries
-- atalaia_logs from a client-side Supabase client (anon key / user JWT), the
-- table currently returns rows for every tenant.
--
-- Inserts still work from backend routes because service role bypasses RLS.
-- Reads via anon/user JWT will now be scoped to the caller's business.

ALTER TABLE atalaia_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_via_business" ON atalaia_logs
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM atalaia_businesses WHERE user_id = auth.uid()
    )
  );
