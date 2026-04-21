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
