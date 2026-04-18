'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProposalSummary {
  project_title: string;
  client_name: string;
  price_cents: number;
  deadline_days: number;
  status: string;
}

interface Profile {
  display_name: string | null;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function AcceptForm({ slug }: { slug: string }) {
  const [proposal, setProposal] = useState<ProposalSummary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proposals/public/${slug}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Proposta nao encontrada');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProposal(data.proposal);
        setProfile(data.profile);
        setLoading(false);
      } catch {
        setError('Erro ao carregar proposta');
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/proposals/accept/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptor_name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? 'Erro ao aceitar proposta');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setSubmitError('Erro de conexao. Tente novamente.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <p className="text-gray-500 text-sm">{error ?? 'Proposta nao encontrada'}</p>
      </div>
    );
  }

  const freelancerName = profile?.display_name ?? 'o profissional';

  if (success) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-gray-900 flex items-center justify-center" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Proposta aceita!</h1>
          <p className="text-sm text-gray-500 mb-6">
            {freelancerName} entrara em contato.
          </p>
          <Link
            href={`/p/${slug}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Voltar a proposta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-md mx-auto px-6 py-12">
        <Link
          href={`/p/${slug}`}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-block mb-8"
        >
          &larr; Voltar a proposta
        </Link>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Aceitar proposta
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {proposal.project_title}
        </p>

        {/* Summary */}
        <div className="border border-gray-200 rounded-lg p-4 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Valor</span>
            <span className="font-medium text-gray-900">{formatCurrency(proposal.price_cents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Prazo</span>
            <span className="font-medium text-gray-900">{proposal.deadline_days} dias</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label htmlFor="acceptor-name" className="block text-sm font-medium text-gray-700 mb-2">
            Seu nome completo
          </label>
          <input
            id="acceptor-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maria Silva"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-4 bg-white"
          />

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : 'Confirmar aceite'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-10">
          <a
            href="https://verelus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
          >
            Feito com Verelus
          </a>
        </div>
      </div>
    </div>
  );
}
