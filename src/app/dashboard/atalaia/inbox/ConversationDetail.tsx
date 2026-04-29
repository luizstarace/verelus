'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  role: 'customer' | 'assistant' | 'human';
  content: string;
  created_at: string;
}

interface ConversationData {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  channel: 'widget' | 'whatsapp';
  status: 'active' | 'human_needed' | 'closed';
}

interface Props {
  conversationId: string;
  onBack?: () => void;
  onStatusChange?: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-brand-success/10 text-brand-success',
  human_needed: 'bg-brand-error/10 text-brand-error',
  closed: 'bg-brand-border text-brand-muted',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  human_needed: 'Precisa atenção',
  closed: 'Encerrada',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

function bubbleStyle(role: string): string {
  switch (role) {
    case 'customer':
      return 'bg-brand-border/50 text-brand-text';
    case 'assistant':
      return 'bg-brand-trust/10 text-brand-text';
    case 'human':
      return 'bg-brand-success/10 text-brand-text';
    default:
      return 'bg-brand-border/50 text-brand-text';
  }
}

function roleLabel(role: string): string | null {
  switch (role) {
    case 'assistant':
      return 'IA';
    case 'human':
      return 'Você';
    default:
      return null;
  }
}

export default function ConversationDetail({ conversationId, onBack, onStatusChange }: Props) {
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/atalaia/conversations/${conversationId}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    setReplyText('');
    fetchConversation();
  }, [fetchConversation]);

  // Auto-refresh every 5 seconds while active
  useEffect(() => {
    if (!conversation || conversation.status === 'closed') return;
    const interval = setInterval(fetchConversation, 5000);
    return () => clearInterval(interval);
  }, [fetchConversation, conversation?.status]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/atalaia/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (!res.ok) throw new Error('Reply failed');
      setReplyText('');
      await fetchConversation();
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/atalaia/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      const data = await res.json();
      setConversation(data.conversation);
      onStatusChange?.();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-brand-muted">
        Carregando conversa...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-brand-muted">
        Conversa não encontrada.
      </div>
    );
  }

  const isClosed = conversation.status === 'closed';
  const customerLabel = conversation.customer_name || conversation.customer_phone || 'Visitante';

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="md:hidden text-brand-muted hover:text-brand-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-sm font-bold text-brand-text">{customerLabel}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-brand-muted">
                {conversation.channel === 'whatsapp' ? 'WhatsApp' : 'Widget'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[conversation.status] || ''}`}>
                {STATUS_LABELS[conversation.status] || conversation.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status === 'human_needed' && (
            <button
              onClick={() => updateStatus('active')}
              disabled={updatingStatus}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-trust text-white hover:brightness-110 transition disabled:opacity-50"
            >
              Devolver pra IA
            </button>
          )}
          {!isClosed && (
            <button
              onClick={() => updateStatus('closed')}
              disabled={updatingStatus}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-border text-brand-text hover:bg-brand-border/80 transition disabled:opacity-50"
            >
              Encerrar
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-brand-muted text-sm py-8">Nenhuma mensagem ainda.</div>
        ) : (
          messages.map((msg) => {
            const isCustomer = msg.role === 'customer';
            const label = roleLabel(msg.role);
            return (
              <div key={msg.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${bubbleStyle(msg.role)}`}>
                  {label && (
                    <span className="block text-xs font-semibold mb-0.5 opacity-70">{label}</span>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className="block text-xs opacity-50 mt-1">{timeAgo(msg.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <form onSubmit={handleReply} className="p-4 border-t border-brand-border flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={isClosed ? 'Conversa encerrada' : 'Digite sua resposta...'}
          disabled={isClosed || sending}
          className="flex-1 text-sm border border-brand-border rounded-lg px-3 py-2 bg-white text-brand-text placeholder:text-brand-muted disabled:opacity-50 disabled:bg-brand-bg"
        />
        <button
          type="submit"
          disabled={isClosed || sending || !replyText.trim()}
          className="text-sm px-4 py-2 rounded-lg bg-brand-cta text-white font-medium hover:brightness-110 transition disabled:opacity-50"
        >
          {sending ? 'Enviando...' : 'Enviar como humano'}
        </button>
      </form>
    </div>
  );
}
