-- supabase/migrations/003_proposals.sql
-- Verelus Proposals MVP: profiles, proposals, views, accepts

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner" ON profiles FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  project_title TEXT NOT NULL,
  scope TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  deadline_days INTEGER NOT NULL CHECK (deadline_days > 0),
  valid_until DATE NOT NULL,
  payment_terms TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_user_id ON proposals(user_id);
CREATE INDEX idx_proposals_slug ON proposals(slug);
CREATE INDEX idx_proposals_status ON proposals(status);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_owner" ON proposals FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS proposal_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  viewer_ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_proposal_views_proposal_id ON proposal_views(proposal_id);

ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views_read_owner" ON proposal_views FOR SELECT
  USING (proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS proposal_accepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE UNIQUE,
  acceptor_name TEXT NOT NULL,
  acceptor_ip TEXT DEFAULT '',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proposal_accepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accepts_read_owner" ON proposal_accepts FOR SELECT
  USING (proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid()));
