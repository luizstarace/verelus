'use client';

import { useState, useEffect, useCallback } from 'react';
import ConversationDetail from './ConversationDetail';

interface Conversation {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  channel: 'widget' | 'whatsapp';
  status: 'active' | 'human_needed' | 'closed';
  message_count: number;
  started_at: string;
  ended_at: string | null;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'active', label: 'Ativas' },
  { value: 'human_needed', label: 'Precisa atenção' },
  { value: 'closed', label: 'Encerradas' },
];

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Todos os canais' },
  { value: 'widget', label: 'Widget' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

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

export default function InboxView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      const res = await fetch(`/api/attendly/conversations?${params}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, channelFilter]);

  useEffect(() => {
    setLoading(true);
    fetchConversations();
  }, [fetchConversations]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setShowDetail(true);
  }

  function handleBack() {
    setShowDetail(false);
    setSelectedId(null);
  }

  function handleStatusChange(conversationId: string) {
    fetchConversations();
  }

  const listPanel = (
    <div className={`w-full md:w-[350px] md:min-w-[350px] border-r border-brand-border bg-brand-surface flex flex-col h-full ${showDetail ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-brand-border space-y-3">
        <h1 className="text-lg font-bold text-brand-text">Conversas</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="flex-1 text-sm border border-brand-border rounded-lg px-2 py-1.5 bg-white text-brand-text"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="flex-1 text-sm border border-brand-border rounded-lg px-2 py-1.5 bg-white text-brand-text"
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-brand-muted text-sm">Carregando...</div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-brand-text text-sm font-medium">Seu atendente ainda não recebeu mensagens.</p>
            <p className="text-brand-muted text-xs">
              Teste o widget no seu site ou conecte o WhatsApp para começar a atender.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/dashboard/attendly/settings?tab=whatsapp"
                className="text-sm bg-brand-trust text-white font-medium px-3 py-1.5 rounded-md hover:brightness-110 transition"
              >
                Conectar WhatsApp
              </a>
              <a
                href="/dashboard/attendly/settings?tab=widget"
                className="text-xs text-brand-trust hover:underline"
              >
                ou instalar o widget →
              </a>
            </div>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`w-full text-left p-4 border-b border-brand-border hover:bg-brand-bg transition ${selectedId === conv.id ? 'bg-brand-bg' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {conv.status === 'human_needed' && (
                    <span className="w-2 h-2 rounded-full bg-brand-error flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-brand-text truncate">
                    {conv.customer_name || conv.customer_phone || 'Visitante'}
                  </span>
                </div>
                <span className="text-xs text-brand-muted flex-shrink-0 ml-2">
                  {timeAgo(conv.started_at)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-brand-border/50 text-brand-muted">
                    {conv.channel === 'whatsapp' ? 'WhatsApp' : 'Widget'}
                  </span>
                  <span className="text-xs text-brand-muted">{conv.message_count} msgs</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[conv.status] || ''}`}>
                  {STATUS_LABELS[conv.status] || conv.status}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="p-3 border-t border-brand-border flex items-center justify-between text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded bg-brand-border text-brand-text disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-brand-muted">{page} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="px-3 py-1 rounded bg-brand-border text-brand-text disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );

  const detailPanel = (
    <div className={`flex-1 bg-white h-full ${!showDetail ? 'hidden md:flex' : 'flex'}`}>
      {selectedId ? (
        <ConversationDetail
          conversationId={selectedId}
          onBack={handleBack}
          onStatusChange={() => handleStatusChange(selectedId)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-brand-muted">
          Selecione uma conversa
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {listPanel}
      {detailPanel}
    </div>
  );
}
