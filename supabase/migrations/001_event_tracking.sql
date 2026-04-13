-- Event tracking table for analytics
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'page_view', 'feature_use', 'ai_generation', 'payment', 'auth', 'error'
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_name ON events(event_name);
CREATE INDEX idx_events_category ON events(event_category);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Onboarding progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  profile_completed BOOLEAN DEFAULT FALSE,
  first_generation BOOLEAN DEFAULT FALSE,
  first_export BOOLEAN DEFAULT FALSE,
  spotify_connected BOOLEAN DEFAULT FALSE,
  first_pitch BOOLEAN DEFAULT FALSE,
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_user_id ON onboarding_progress(user_id);

-- Error log table for bug hunting
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL, -- 'api_error', 'client_error', 'webhook_error', 'auth_error'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  endpoint TEXT,
  user_id UUID,
  ip_address TEXT,
  request_body JSONB,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see their own events
CREATE POLICY "Users can insert own events" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own events" ON events FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for server-side tracking)
CREATE POLICY "Service role full access events" ON events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access onboarding" ON onboarding_progress FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access errors" ON error_logs FOR ALL USING (auth.role() = 'service_role');

-- Users can view own onboarding
CREATE POLICY "Users can view own onboarding" ON onboarding_progress FOR SELECT USING (auth.uid() = user_id);
