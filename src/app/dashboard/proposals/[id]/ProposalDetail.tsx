'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/lib/use-toast';
import type { Proposal, ProposalView, ProposalAccept } from '@/lib/types/proposals';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-brand-surface text-brand-muted' },
  sent: { label: 'Enviada', cls: 'bg-blue-500/15 text-blue-400' },
  viewed: { label: 'Visualizada', cls: 'bg-yellow-500/15 text-yellow-400' },
  accepted: { label: 'Aceita', cls: 'bg-brand-trust/15 text-brand-trust' },
  expired: { label: 'Expirada', cls: 'bg-red-500/15 text-red-400' },
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  id: string;
}

export default function ProposalDetail({ id }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [views, setViews] = useState<ProposalView[]>([]);
  const [accept, setAccept] = useState<ProposalAccept | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/proposals/${id}`);
      if (!res.ok) throw new Error('Proposta nao encontrada');
      const data = await res.json();
      setProposal(data.proposal);
      setViews(data.views ?? []);
      setAccept(data.accept ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [id]);

  function handleCopyLink() {
    if (!proposal) return;
    const url = `${window.location.origin}/p/${proposal.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copiado!');
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  }

  async function handleMarkSent() {
    if (!proposal) return;
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
      const data = await res.json();
      setProposal(data.proposal);
      toast.success('Status atualizado para Enviada');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      toast.success('Proposta excluida');
      router.push('/dashboard/proposals');
    } catch {
      toast.error('Erro ao excluir proposta');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" label="Carregando proposta..." />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorMessage message={error || 'Proposta nao encontrada'} onRetry={fetchData} />
      </div>
    );
  }

  const badge = STATUS_BADGE[proposal.status] ?? STATUS_BADGE.draft;
  const totalDuration = views.reduce((sum, v) => sum + (v.duration_seconds ?? 0), 0);
  const totalMin = Math.round(totalDuration / 60);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/dashboard/proposals"
        className="text-xs text-brand-muted hover:text-brand-text transition mb-6 inline-block"
      >
        &larr; Voltar para propostas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Proposal preview */}
        <div className="lg:col-span-2 bg-brand-surface rounded-2xl p-6 border border-brand-border">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-xl font-bold text-brand-text flex-1">{proposal.project_title}</h1>
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-brand-muted">Cliente:</span>{' '}
              <span className="text-brand-text">{proposal.client_name}</span>
              {proposal.client_email && (
                <span className="text-brand-muted ml-2">({proposal.client_email})</span>
              )}
            </div>

            <div>
              <span className="text-brand-muted">Valor:</span>{' '}
              <span className="text-brand-trust font-bold text-lg">{formatCurrency(proposal.price_cents)}</span>
            </div>

            <div>
              <span className="text-brand-muted">Prazo:</span>{' '}
              <span className="text-brand-text">{proposal.deadline_days} dias</span>
            </div>

            {proposal.valid_until && (
              <div>
                <span className="text-brand-muted">Valida ate:</span>{' '}
                <span className="text-brand-text">{new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</span>
              </div>
            )}

            {proposal.payment_terms && (
              <div>
                <span className="text-brand-muted">Pagamento:</span>{' '}
                <span className="text-brand-text">{proposal.payment_terms}</span>
              </div>
            )}

            <div>
              <p className="text-brand-muted mb-2">Escopo:</p>
              <div className="bg-brand-surface rounded-xl p-4 text-brand-muted whitespace-pre-wrap text-sm leading-relaxed">
                {proposal.scope}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-brand-border">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-muted hover:text-brand-text hover:border-brand-border transition"
            >
              Copiar link
            </button>
            {proposal.status === 'draft' && (
              <button
                onClick={handleMarkSent}
                className="px-4 py-2 rounded-lg bg-blue-500/15 text-blue-400 text-sm font-medium hover:bg-blue-500/25 transition"
              >
                Marcar como enviada
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-lg text-sm text-brand-error hover:bg-brand-error/10 transition ml-auto"
            >
              Excluir
            </button>
          </div>
        </div>

        {/* Right: Analytics panel */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-brand-surface rounded-2xl p-5 border border-brand-border">
            <h2 className="text-sm font-bold text-brand-text mb-4">Analytics</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Visualizacoes</span>
                <span className="text-brand-text font-medium">{views.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Tempo total</span>
                <span className="text-brand-text font-medium">{totalMin}min</span>
              </div>
              {views.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Ultima visualizacao</span>
                  <span className="text-brand-text font-medium text-xs">
                    {formatDate(views[0].viewed_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Accept info */}
          {accept && (
            <div className="bg-brand-trust/10 rounded-2xl p-5 border border-brand-trust/20">
              <h2 className="text-sm font-bold text-brand-trust mb-2">Aceita!</h2>
              <p className="text-sm text-brand-muted">
                Por: {accept.acceptor_name}
              </p>
              <p className="text-xs text-brand-muted mt-1">
                {formatDate(accept.accepted_at)}
              </p>
            </div>
          )}

          {/* Views list */}
          {views.length > 0 && (
            <div className="bg-brand-surface rounded-2xl p-5 border border-brand-border">
              <h2 className="text-sm font-bold text-brand-text mb-3">Visualizacoes</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {views.map((v) => (
                  <div key={v.id} className="text-xs text-brand-muted flex justify-between">
                    <span>{formatDate(v.viewed_at)}</span>
                    <span className="text-brand-muted">{Math.round(v.duration_seconds / 60)}min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmDelete}
        title="Excluir proposta"
        message={`Tem certeza que deseja excluir "${proposal.project_title}"? Esta acao nao pode ser desfeita.`}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
