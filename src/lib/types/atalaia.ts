export interface AtalaiaBusiness {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  services: AtalaiaService[];
  hours: Record<string, { open: string; close: string }>;
  faq: AtalaiaFaq[];
  ai_context: string | null;
  voice_id: string;
  widget_config: WidgetConfig;
  whatsapp_number: string | null;
  whatsapp_whitelist_enabled: boolean;
  whatsapp_whitelist: string[];
  whatsapp_hours_only: boolean;
  owner_whatsapp: string | null;
  owner_notify_channel: 'email' | 'whatsapp' | 'both';
  onboarding_step: number | null;
  status: 'setup' | 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface AtalaiaService {
  name: string;
  price_cents: number;
  duration_min: number;
  description: string;
}

export interface AtalaiaFaq {
  question: string;
  answer: string;
}

export interface WidgetConfig {
  color?: string;
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;
}

export interface AtalaiaConversation {
  id: string;
  business_id: string;
  channel: 'widget' | 'whatsapp' | 'voice';
  customer_name: string | null;
  customer_phone: string | null;
  status: 'active' | 'human_needed' | 'closed';
  message_count: number;
  started_at: string;
  ended_at: string | null;
  satisfaction: number | null;
}

export interface AtalaiaMessage {
  id: string;
  conversation_id: string;
  role: 'customer' | 'assistant' | 'human';
  content: string;
  audio_url: string | null;
  tokens_used: number;
  created_at: string;
}

export interface AtalaiaUsage {
  id: string;
  business_id: string;
  period: string;
  text_messages: number;
  voice_seconds: number;
  tokens_total: number;
  cost_cents: number;
  overage_notified: boolean;
}

export type AtalaiaPlan = 'starter' | 'pro' | 'business';

export interface AtalaiaPlanLimits {
  text_messages: number;
  voice_seconds: number;
  voice_enabled: boolean;
  voice_clone: boolean;
  overage_text_cents: number;
  overage_voice_cents: number;
}

export interface ChatRequest {
  business_id: string;
  conversation_id?: string;
  message: string;
  channel: 'widget' | 'whatsapp';
  customer_name?: string;
  customer_phone?: string;
  preview?: boolean;
}
