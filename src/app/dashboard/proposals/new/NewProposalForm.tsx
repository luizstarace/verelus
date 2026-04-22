'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useUserTier, isPro } from '@/lib/use-user-tier';

export default function NewProposalForm() {
  const router = useRouter();
  const { tier } = useUserTier();
  const userIsPro = isPro(tier);

  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [scope, setScope] = useState('');
  const [priceReais, setPriceReais] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('');

  // optional fields
  const [showOptional, setShowOptional] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAISuggest() {
    if (!projectTitle.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_title: projectTitle, client_name: clientName }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setScope(data.suggestion);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Erro ao gerar sugestao com IA');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const priceCents = Math.round(parseFloat(priceReais) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 100) {
      setError('Preco deve ser pelo menos R$ 1,00');
      setSubmitting(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        client_name: clientName,
        project_title: projectTitle,
        scope,
        price_cents: priceCents,
        deadline_days: parseInt(deadlineDays, 10),
      };
      if (clientEmail) body.client_email = clientEmail;
      if (paymentTerms) body.payment_terms = paymentTerms;
      if (validUntil) body.valid_until = validUntil;

      const res = await fetch('/api/proposals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar proposta');
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/proposals/${data.proposal.id}`);
    } catch {
      setError('Erro de conexao. Tente novamente.');
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-text text-sm focus:outline-none focus:border-brand-trust/50 placeholder-brand-muted/50';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-text mb-2">Nova proposta</h1>
      <p className="text-sm text-brand-muted mb-8">
        Preencha os dados e envie uma proposta profissional ao seu cliente.
      </p>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client name */}
        <div>
          <label className="block text-sm text-brand-muted mb-1.5">Nome do cliente *</label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: Empresa XPTO"
            className={inputCls}
          />
        </div>

        {/* Project title */}
        <div>
          <label className="block text-sm text-brand-muted mb-1.5">Titulo do projeto *</label>
          <input
            type="text"
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Ex: Redesign do site institucional"
            className={inputCls}
          />
        </div>

        {/* Scope */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-brand-muted">Escopo / Entregaveis *</label>
            {userIsPro && (
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={aiLoading || !projectTitle.trim()}
                className="text-xs text-brand-trust hover:text-brand-trust/80 disabled:opacity-40 transition font-medium"
              >
                {aiLoading ? 'Gerando...' : '\u2728 Sugerir com IA'}
              </button>
            )}
          </div>
          <textarea
            required
            rows={6}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Descreva o que sera entregue..."
            className={inputCls + ' resize-none'}
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-brand-muted mb-1.5">Valor (R$) *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={priceReais}
              onChange={(e) => setPriceReais(e.target.value)}
              placeholder="5000"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm text-brand-muted mb-1.5">Prazo (dias) *</label>
            <input
              type="number"
              required
              min="1"
              max="365"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              placeholder="30"
              className={inputCls}
            />
          </div>
        </div>

        {/* Optional fields toggle */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="text-xs text-brand-muted hover:text-brand-text transition"
        >
          {showOptional ? '\u25B2 Ocultar campos opcionais' : '\u25BC Mais campos (email, pagamento, validade)'}
        </button>

        {showOptional && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Email do cliente</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Condicoes de pagamento</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ex: 50% na aprovacao, 50% na entrega"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Valida ate</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-brand-cta text-white font-bold text-sm hover:brightness-110 transition disabled:opacity-50"
        >
          {submitting ? 'Criando...' : 'Criar proposta'}
        </button>
      </form>
    </div>
  );
}
