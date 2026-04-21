export const TRANSFER_KEYWORDS = [
  'humano', 'atendente', 'pessoa', 'gerente',
  'falar com alguem', 'falar com alguém',
  'atendimento humano', 'pessoa real',
];

const TRANSFER_TAG = '[TRANSFER]';

interface TransferInput {
  aiResponse: string;
  customerMessage: string;
}

interface TransferResult {
  shouldTransfer: boolean;
  reason: string;
  source: 'ai' | 'keyword' | 'none';
}

export function detectTransfer(input: TransferInput): TransferResult {
  // Check AI response for [TRANSFER] tag
  if (input.aiResponse.includes(TRANSFER_TAG)) {
    const reason = input.aiResponse
      .substring(input.aiResponse.indexOf(TRANSFER_TAG) + TRANSFER_TAG.length)
      .trim();
    return { shouldTransfer: true, reason, source: 'ai' };
  }

  // Check customer message for keywords
  const lowerMsg = input.customerMessage.toLowerCase();
  for (const keyword of TRANSFER_KEYWORDS) {
    if (lowerMsg.includes(keyword)) {
      return {
        shouldTransfer: true,
        reason: `Cliente usou palavra-chave: "${keyword}"`,
        source: 'keyword',
      };
    }
  }

  return { shouldTransfer: false, reason: '', source: 'none' };
}
