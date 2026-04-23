interface MessageForHistory {
  role: 'customer' | 'assistant' | 'human';
  content: string;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_HISTORY = 20;

export function buildMessageHistory(messages: MessageForHistory[]): MessageForHistory[] {
  const aiMessages = messages.filter(m => m.role !== 'human');
  return aiMessages.slice(-MAX_HISTORY);
}

export function toClaudeMessages(messages: MessageForHistory[]): ClaudeMessage[] {
  return messages
    .filter(m => m.role !== 'human')
    .map(m => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }));
}

export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

interface BusinessForAvailability {
  status: 'setup' | 'active' | 'paused';
  phone: string | null;
}

export type AvailabilityResult =
  | { allowed: true }
  | { allowed: false; response?: string; error?: string; status: number; paused?: boolean };

// Decides whether the business can receive a chat request based on its lifecycle
// status and the caller's preview intent. Kept pure and env-free so it is testable
// without mocking Supabase.
export function checkBusinessAvailability(
  business: BusinessForAvailability,
  preview: boolean
): AvailabilityResult {
  if (business.status === 'paused') {
    const contact = business.phone || 'sem telefone cadastrado';
    return {
      allowed: false,
      response: `Este atendente está temporariamente indisponível. Entre em contato diretamente: ${contact}`,
      paused: true,
      status: 503,
    };
  }
  if (business.status === 'setup' && !preview) {
    return {
      allowed: false,
      error: 'Atendente ainda não foi ativado',
      status: 403,
    };
  }
  // preview is only for owner testing in the wizard (status='setup'). An abuser with a
  // leaked business_id cannot use it to bypass usage on an active business.
  if (preview && business.status !== 'setup') {
    return {
      allowed: false,
      error: 'preview mode requires business.status=setup',
      status: 400,
    };
  }
  return { allowed: true };
}
