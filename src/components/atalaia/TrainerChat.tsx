'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  businessId: string | null;
  variant?: 'plain' | 'whatsapp';
  height?: string;
  emptyHint?: string;
  onSaveAsFaq?: (question: string, answer: string) => void;
}

export default function TrainerChat({
  businessId,
  variant = 'plain',
  height = 'h-72',
  emptyHint = 'Envie uma mensagem para testar o atendente.',
  onSaveAsFaq,
}: Props) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function handleSendChat() {
    if (!chatInput.trim() || chatLoading || !businessId) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/atalaia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          message: userMsg,
          channel: 'widget',
          preview: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao enviar mensagem');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming não suportado');

      const decoder = new TextDecoder();
      let assistantText = '';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              const token = parsed.choices?.[0]?.delta?.content || parsed.token || parsed.text || '';
              assistantText += token;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            } catch {
              assistantText += payload;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleReset() {
    setChatMessages([]);
    setChatInput('');
  }

  function handleSaveLastTurn() {
    if (chatMessages.length < 2 || !onSaveAsFaq) return;
    const last = chatMessages[chatMessages.length - 1];
    const prev = chatMessages[chatMessages.length - 2];
    if (last.role === 'assistant' && prev.role === 'user') {
      onSaveAsFaq(prev.content, last.content);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition';
  const btnPrimary =
    'px-6 py-2.5 rounded-lg bg-brand-trust text-white font-medium hover:bg-brand-primary transition disabled:opacity-50 disabled:cursor-not-allowed';

  const isWA = variant === 'whatsapp';
  const containerClass = isWA
    ? `border border-brand-border rounded-lg bg-[#e5ddd5] ${height} overflow-y-auto p-4 space-y-2`
    : `border border-brand-border rounded-lg bg-white ${height} overflow-y-auto p-4 space-y-3`;

  function messageClass(role: 'user' | 'assistant') {
    if (isWA) {
      return role === 'user'
        ? 'ml-auto bg-[#dcf8c6] text-brand-text rounded-lg rounded-br-sm shadow-sm'
        : 'mr-auto bg-white text-brand-text rounded-lg rounded-bl-sm shadow-sm';
    }
    return role === 'user'
      ? 'ml-auto bg-brand-trust text-white'
      : 'mr-auto bg-brand-surface text-brand-text';
  }

  return (
    <div className="space-y-4">
      <div className={containerClass}>
        {chatMessages.length === 0 && (
          <p className="text-brand-muted text-sm text-center mt-8">{emptyHint}</p>
        )}
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-3 py-2 text-sm ${messageClass(msg.role)} ${isWA ? '' : 'rounded-lg'}`}
          >
            {msg.content || (chatLoading && i === chatMessages.length - 1 ? '...' : '')}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Digite uma mensagem..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
          disabled={chatLoading || !businessId}
        />
        <button
          type="button"
          onClick={handleSendChat}
          disabled={chatLoading || !chatInput.trim() || !businessId}
          className={btnPrimary}
        >
          Enviar
        </button>
      </div>
      {(onSaveAsFaq || chatMessages.length > 0) && (
        <div className="flex gap-3 text-xs">
          {chatMessages.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-brand-muted hover:text-brand-text underline"
            >
              Limpar conversa
            </button>
          )}
          {onSaveAsFaq && chatMessages.length >= 2 && (
            <button
              type="button"
              onClick={handleSaveLastTurn}
              className="text-brand-trust hover:underline"
            >
              Salvar última troca como FAQ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
