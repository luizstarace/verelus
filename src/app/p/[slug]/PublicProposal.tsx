'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Proposal {
  id: string;
  slug: string;
  client_name: string;
  project_title: string;
  scope: string;
  price_cents: number;
  deadline_days: number;
  valid_until: string;
  payment_terms: string | null;
  status: string;
  created_at: string;
}

interface Profile {
  display_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  website: string | null;
}

interface Accept {
  acceptor_name: string;
  accepted_at: string;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

function isExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date();
}

export function PublicProposal({ slug }: { slug: string }) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accept, setAccept] = useState<Accept | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewIdRef = useRef<string | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    let heartbeatInterval: ReturnType<typeof setInterval>;

    async function init() {
      try {
        const res = await fetch(`/api/proposals/public/${slug}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Proposta não encontrada');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setProposal(data.proposal);
        setProfile(data.profile);
        setAccept(data.accept);
        setLoading(false);

        // register view
        try {
          const viewRes = await fetch('/api/track/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposal_id: data.proposal.id }),
          });
          const viewData = await viewRes.json();
          if (viewData.view_id) {
            viewIdRef.current = viewData.view_id;
          }
        } catch {
          // ignore tracking errors
        }

        // heartbeat every 30s
        heartbeatInterval = setInterval(() => {
          secondsRef.current += 30;
          if (viewIdRef.current) {
            const body = JSON.stringify({
              view_id: viewIdRef.current,
              duration_seconds: secondsRef.current,
            });
            if (navigator.sendBeacon) {
              navigator.sendBeacon('/api/track/heartbeat', new Blob([body], { type: 'application/json' }));
            } else {
              fetch('/api/track/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
              }).catch(() => {});
            }
          }
        }, 30000);
      } catch {
        setError('Erro ao carregar proposta');
        setLoading(false);
      }
    }

    init();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      // send final heartbeat on unmount
      if (viewIdRef.current && secondsRef.current > 0) {
        const body = JSON.stringify({
          view_id: viewIdRef.current,
          duration_seconds: secondsRef.current,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/track/heartbeat', new Blob([body], { type: 'application/json' }));
        }
      }
    };
  }, [slug]);

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
        <p className="text-gray-500 text-sm">{error ?? 'Proposta não encontrada'}</p>
      </div>
    );
  }

  const freelancerName = profile?.display_name ?? 'Profissional';
  const freelancerEmail = profile?.email ?? '';
  const initial = freelancerName.charAt(0).toUpperCase();
  const expired = isExpired(proposal.valid_until);
  const accepted = proposal.status === 'accepted' || !!accept;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
            {initial}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{freelancerName}</p>
            {freelancerEmail && (
              <p className="text-xs text-gray-500">{freelancerEmail}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-300 mb-8" />

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Proposta: {proposal.project_title}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Para {proposal.client_name}
        </p>

        {/* Metric boxes */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Investimento</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(proposal.price_cents)}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prazo</p>
            <p className="text-lg font-semibold text-gray-900">{proposal.deadline_days} dias</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Validade</p>
            <p className="text-lg font-semibold text-gray-900">{formatDate(proposal.valid_until)}</p>
          </div>
        </div>

        {/* Scope */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            O que está incluído
          </h2>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {proposal.scope}
          </div>
        </div>

        {/* Payment terms */}
        {proposal.payment_terms && (
          <div className="mb-10">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Condicoes de pagamento
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {proposal.payment_terms}
            </div>
          </div>
        )}

        {/* Status banners */}
        {accepted && accept && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-green-800 font-medium">
              Proposta aceita por {accept.acceptor_name}
            </p>
          </div>
        )}

        {!accepted && expired && (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-500 font-medium">
              Esta proposta expirou
            </p>
          </div>
        )}

        {!accepted && !expired && (
          <Link
            href={`/p/${slug}/accept`}
            className="block w-full text-center bg-gray-900 text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors mb-8"
          >
            Aceitar proposta
          </Link>
        )}

      </div>
    </div>
  );
}
