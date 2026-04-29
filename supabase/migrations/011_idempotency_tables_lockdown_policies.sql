-- 011 Lock-down policies on idempotency tables
-- atalaia_evolution_events_processed and stripe_events_processed are written
-- and read exclusively by the service role (which bypasses RLS). RLS was
-- enabled but no policies existed, which the Supabase advisor flags as INFO
-- `rls_enabled_no_policy`. We add an explicit deny-all policy so the intent
-- ("no client access ever") is documented in the schema, not implicit.

CREATE POLICY no_client_access ON public.atalaia_evolution_events_processed
  FOR ALL TO public
  USING (false) WITH CHECK (false);

CREATE POLICY no_client_access ON public.stripe_events_processed
  FOR ALL TO public
  USING (false) WITH CHECK (false);
