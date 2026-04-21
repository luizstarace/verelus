-- ============================================
-- Attendly: AI Customer Service Agent for SMBs
-- ============================================

-- Businesses
CREATE TABLE attendly_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  name text NOT NULL,
  category text,
  phone text,
  address text,
  services jsonb DEFAULT '[]',
  hours jsonb DEFAULT '{}',
  faq jsonb DEFAULT '[]',
  ai_context text,
  voice_id text DEFAULT 'default',
  widget_config jsonb DEFAULT '{}',
  whatsapp_number text,
  owner_whatsapp text,
  owner_notify_channel text DEFAULT 'email' CHECK (owner_notify_channel IN ('email', 'whatsapp', 'both')),
  onboarding_step int DEFAULT 1,
  status text DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON attendly_businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE attendly_businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_only" ON attendly_businesses
  FOR ALL USING (auth.uid() = user_id);

-- Conversations
CREATE TABLE attendly_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES attendly_businesses NOT NULL,
  channel text NOT NULL CHECK (channel IN ('widget', 'whatsapp', 'voice')),
  customer_name text,
  customer_phone text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'human_needed', 'closed')),
  message_count int DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  satisfaction smallint CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5)
);

CREATE INDEX idx_conv_business_date ON attendly_conversations (business_id, started_at DESC);
CREATE INDEX idx_conv_business_status ON attendly_conversations (business_id, status);

ALTER TABLE attendly_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_business" ON attendly_conversations
  FOR ALL USING (
    business_id IN (SELECT id FROM attendly_businesses WHERE user_id = auth.uid())
  );

-- Messages
CREATE TABLE attendly_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES attendly_conversations NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'assistant', 'human')),
  content text NOT NULL,
  audio_url text,
  tokens_used int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_msg_conv_date ON attendly_messages (conversation_id, created_at);

ALTER TABLE attendly_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_conversation" ON attendly_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT c.id FROM attendly_conversations c
      JOIN attendly_businesses b ON c.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Usage tracking
CREATE TABLE attendly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES attendly_businesses NOT NULL,
  period date NOT NULL,
  text_messages int DEFAULT 0,
  voice_seconds int DEFAULT 0,
  tokens_total int DEFAULT 0,
  cost_cents int DEFAULT 0,
  overage_notified boolean DEFAULT false,
  UNIQUE (business_id, period)
);

ALTER TABLE attendly_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_business" ON attendly_usage
  FOR ALL USING (
    business_id IN (SELECT id FROM attendly_businesses WHERE user_id = auth.uid())
  );

-- Logs (no RLS — internal observability)
CREATE TABLE attendly_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  endpoint text NOT NULL,
  channel text,
  tokens_used int DEFAULT 0,
  latency_ms int DEFAULT 0,
  status_code int,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_logs_date ON attendly_logs (created_at DESC);
CREATE INDEX idx_logs_business ON attendly_logs (business_id, created_at DESC);

-- RPC: increment message count (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_message_count(conv_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE attendly_conversations
  SET message_count = message_count + 1
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: atomic usage increment (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_usage(
  p_business_id uuid,
  p_tokens int
)
RETURNS void AS $$
BEGIN
  INSERT INTO attendly_usage (business_id, period, text_messages, tokens_total)
  VALUES (p_business_id, date_trunc('month', now())::date, 1, p_tokens)
  ON CONFLICT (business_id, period)
  DO UPDATE SET
    text_messages = attendly_usage.text_messages + 1,
    tokens_total = attendly_usage.tokens_total + p_tokens;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: atomic voice usage increment
CREATE OR REPLACE FUNCTION increment_voice_usage(biz_id uuid, period_date date, seconds_to_add int)
RETURNS void AS $$
BEGIN
  INSERT INTO attendly_usage (business_id, period, voice_seconds)
  VALUES (biz_id, period_date, seconds_to_add)
  ON CONFLICT (business_id, period)
  DO UPDATE SET voice_seconds = attendly_usage.voice_seconds + seconds_to_add;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
