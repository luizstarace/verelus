'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/lib/use-toast';
import type { ProposalWithAnalytics, DashboardSummary } from '@/lib/types/proposals';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-white/10 text-white/60' },
  sent: { label: 'Enviada', cls: 'bg-blue-500/15 text-blue-400' },
  viewed: { label: 'Visualizada', cls: 'bg-yellow-500/15 text-yellow-400' },
  accepted: { label: 'Aceita', cls: 'bg-brand-green/15 text-brand-green' },
  expired: { label: 'Expirada', cls: 'bg-red-500/15 text-red-400' },
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `ha ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  return `ha ${days}d`;
}

export default function ProposalsDashboard() {
  const [proposals, setProposals] = useState<ProposalWithAnalytics[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/proposals/list');
      if (!res.ok) throw new Error('Erro ao carregar propostas');
      const data = await res.json();
      setProposals(data.proposals);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function handleCopyLink(slug: string) {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copiado!');
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" label="Carregando propostas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Propostas</h1>
        <Link
          href="/dashboard/proposals/new"
          className="px-4 py-2 rounded-xl bg-brand-green text-black text-sm font-bold hover:brightness-110 transition"
        >
          Nova proposta
        </Link>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
            <p className="text-xs text-brand-muted mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{summary.total_proposals}</p>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
            <p className="text-xs text-brand-muted mb-1">Abertas</p>
            <p className="text-2xl font-bold text-white">{summary.open_proposals}</p>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
            <p className="text-xs text-brand-muted mb-1">Pipeline</p>
            <p className="text-2xl font-bold text-brand-green">{formatCurrency(summary.pipeline_cents)}</p>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
            <p className="text-xs text-brand-muted mb-1">Taxa de aceite</p>
            <p className="text-2xl font-bold text-white">{summary.acceptance_rate}%</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {proposals.length === 0 && (
        <EmptyState
          title="Nenhuma proposta ainda"
          description="Crie sua primeira proposta profissional e comece a fechar projetos."
          action={{
            label: 'Criar primeira proposta',
            onClick: () => { window.location.href = '/dashboard/proposals/new'; },
          }}
        />
      )}

      {/* Proposals list */}
      {proposals.length > 0 && (
        <div className="space-y-3">
          {proposals.map((p) => {
            const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft;
            const totalMin = Math.round(p.total_duration_seconds / 60);
            return (
              <div
                key={p.id}
                className="bg-brand-surface rounded-xl p-5 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/dashboard/proposals/${p.id}`}
                        className="text-white font-bold hover:text-brand-green transition truncate"
                      >
                        {p.project_title}
                      </Link>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-brand-muted">
                      <span>{p.client_name}</span>
                      <span className="text-white/30">|</span>
                      <span className="text-brand-green font-medium">{formatCurrency(p.price_cents)}</span>
                    </div>
                    {p.view_count > 0 && (
                      <p className="text-[11px] text-brand-muted mt-1.5">
                        Visualizada {p.view_count}x &middot; {totalMin}min total
                        {p.last_viewed_at && ` \u00B7 ${timeAgo(p.last_viewed_at)}`}
                      </p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyLink(p.slug)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white hover:border-white/20 transition"
                      title="Copiar link"
                    >
                      Copiar link
                    </button>
                    <Link
                      href={`/dashboard/proposals/${p.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
