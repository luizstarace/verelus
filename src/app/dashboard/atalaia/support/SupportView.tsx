'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Category = 'whatsapp_ban' | 'whatsapp_disconnect' | 'other';

interface Ticket {
  id: string;
  category: Category;
  message: string;
  status: 'open' | 'resolved' | 'closed';
  created_at: string;
  resolved_at: string | null;
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'whatsapp_disconnect', label: 'WhatsApp caiu / não conecta' },
  { value: 'whatsapp_ban', label: 'WhatsApp banido permanentemente' },
  { value: 'other', label: 'Outro assunto' },
];

const CATEGORY_LABEL: Record<Category, string> = {
  whatsapp_disconnect: 'WhatsApp caiu',
  whatsapp_ban: 'WhatsApp banido',
  other: 'Outro',
};

const PREFILL_MESSAGE: Record<Category, string> = {
  whatsapp_disconnect:
    'Meu WhatsApp caiu e não consigo reconectar. Já tentei [descreva o que tentou]. O número conectado é [número] e é [pessoal/dedicado, idade do chip].',
  whatsapp_ban:
    'Meu WhatsApp foi banido permanentemente. Quando: [data]. Número conectado: [número]. O que estava acontecendo: [descreva].',
  other: '',
};

const STATUS_LABEL: Record<Ticket['status'], string> = {
  open: 'Em aberto',
  resolved: 'Resolvido',
  closed: 'Encerrado',
};

const STATUS_COLOR: Record<Ticket['status'], string> = {
  open: 'bg-amber-100 text-amber-900',
  resolved: 'bg-brand-success/10 text-brand-success',
  closed: 'bg-brand-border text-brand-muted',
};

export default function SupportView() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<Category>('whatsapp_disconnect');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    const categoryParam = searchParams?.get('category') as Category | null;
    const prefill = searchParams?.get('prefill') === '1';
    if (categoryParam && CATEGORY_OPTIONS.some((c) => c.value === categoryParam)) {
      setCategory(categoryParam);
      if (prefill) {
        setMessage(PREFILL_MESSAGE[categoryParam] || '');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/atalaia/support');
        if (!res.ok) return;
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch {
        // silent
      } finally {
        setLoadingTickets(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/atalaia/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar pedido');
      }
      setSuccess(true);
      setMessage('');
      // refresh ticket list
      const ticketsRes = await fetch('/api/atalaia/support');
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData.tickets || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro de rede');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition text-sm';

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Pedir ajuda</h1>
        <p className="text-sm text-brand-muted mt-1">
          Descreva o que aconteceu e a gente responde no email cadastrado em até 24h. Use principalmente
          quando seu WhatsApp foi restringido ou banido pelo WhatsApp e você não consegue resolver
          sozinho.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Categoria</label>
          <select
            className={inputClass}
            value={category}
            onChange={(e) => {
              const next = e.target.value as Category;
              setCategory(next);
              if (!message.trim() && PREFILL_MESSAGE[next]) {
                setMessage(PREFILL_MESSAGE[next]);
              }
            }}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">
            Conte o que aconteceu
          </label>
          <textarea
            className={inputClass}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="Quanto mais detalhe, mais rápido conseguimos ajudar..."
          />
          <div className="text-xs text-brand-muted mt-1">{message.length}/2000 caracteres</div>
        </div>

        {error && (
          <p className="text-sm text-brand-error">{error}</p>
        )}
        {success && (
          <p className="text-sm text-brand-success">
            ✓ Pedido recebido. Você vai receber resposta no email cadastrado em até 24h.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="px-5 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar pedido'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6">
        <h2 className="text-base font-semibold text-brand-text mb-3">Seus pedidos anteriores</h2>
        {loadingTickets && <p className="text-sm text-brand-muted">Carregando...</p>}
        {!loadingTickets && tickets.length === 0 && (
          <p className="text-sm text-brand-muted">Nenhum pedido ainda.</p>
        )}
        {!loadingTickets && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="border border-brand-border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-brand-text">
                    {CATEGORY_LABEL[t.category] || t.category}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <p className="text-xs text-brand-muted line-clamp-2">{t.message}</p>
                <p className="text-[10px] text-brand-muted mt-1.5">
                  Aberto em {new Date(t.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
