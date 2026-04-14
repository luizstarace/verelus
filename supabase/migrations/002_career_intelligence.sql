-- Verulus Career Intelligence Schema
-- Phase 1 MVP: artist_data, artist_survey, diagnostics, action_progress

-- Dados do artista capturados do Spotify
CREATE TABLE IF NOT EXISTS artist_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spotify_artist_id text NOT NULL,
  spotify_url text NOT NULL,
  name text NOT NULL,
  genres text[] DEFAULT '{}',
  followers integer DEFAULT 0,
  popularity integer DEFAULT 0,
  monthly_listeners integer,
  top_tracks jsonb DEFAULT '[]',
  audio_features_avg jsonb,
  social_urls jsonb DEFAULT '{}',
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, spotify_artist_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_data_user_id ON artist_data(user_id);

-- Respostas do formulario guiado
CREATE TABLE IF NOT EXISTS artist_survey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artist_survey_user_id ON artist_survey(user_id);

-- Diagnosticos gerados
CREATE TABLE IF NOT EXISTS diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_data_snapshot jsonb NOT NULL,
  survey_snapshot jsonb NOT NULL,
  stage text NOT NULL CHECK (stage IN ('Inicial','Emergente','Consolidado','Estabelecido','Referencia')),
  stage_score integer NOT NULL CHECK (stage_score >= 0 AND stage_score <= 100),
  dimension_scores jsonb NOT NULL,
  diagnostic_text jsonb NOT NULL,
  action_plan jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_user_id ON diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_created_at ON diagnostics(created_at DESC);

-- Progresso nas acoes do plano (checkboxes)
CREATE TABLE IF NOT EXISTS action_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagnostic_id uuid NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  action_index integer NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(diagnostic_id, action_index)
);

CREATE INDEX IF NOT EXISTS idx_action_progress_diagnostic_id ON action_progress(diagnostic_id);

-- RLS: usuarios so veem seus proprios dados
ALTER TABLE artist_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_artist_data" ON artist_data
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_see_own_survey" ON artist_survey
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_see_own_diagnostics" ON diagnostics
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_see_own_action_progress" ON action_progress
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_update_own_action_progress" ON action_progress
  FOR ALL USING (user_id = auth.uid());

-- Service role tem acesso total (para webhooks e API routes que escrevem)
CREATE POLICY "service_role_full_access_artist_data" ON artist_data
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_survey" ON artist_survey
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_diagnostics" ON diagnostics
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_progress" ON action_progress
  FOR ALL TO service_role USING (true);
