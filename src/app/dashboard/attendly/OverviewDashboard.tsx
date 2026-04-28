'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackMeta } from '@/lib/analytics/meta';

interface OverviewStats {
  msgs_month: number;
  usage_percentage: number;
  has_active_subscription: boolean;
}

export default function OverviewDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // Stripe redirects back to /dashboard/attendly?checkout=success after a paid
  // checkout. Fire the Subscribe pixel event once per session (sessionStorage
  // dedup) so a refresh or back-navigation doesn't double-count.
  useEffect(() => {
    if (searchParams?.get('checkout') !== 'success') return;
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem('attendly_subscribe_tracked') === '1') return;
    trackMeta('Subscribe', { currency: 'BRL' });
    window.sessionStorage.setItem('attendly_subscribe_tracked', '1');
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      try {
        const [bizRes, usageRes, convRes] = await Promise.all([
          fetch('/api/attendly/business'),
          fetch('/api/attendly/usage'),
          fetch('/api/attendly/conversations?limit=5'),
        ]);

        const bizData = await bizRes.json();
        const usageData = await usageRes.json();
        const convData = await convRes.json();

        setBusiness(bizData.business);
        setConversations(convData.conversations || []);
        setStats({
          msgs_month: usageData.text?.used || 0,
          usage_percentage: usageData.text?.percentage || 0,
          has_active_subscription: Boolean(usageData.has_active_subscription),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-brand-muted">Carregando...</div>;

  if (!business) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-brand-text mb-4">Bem-vindo ao Attendly!</h2>
        <p className="text-brand-muted mb-6">Configure seu atendente IA em poucos minutos.</p>
        <a href="/dashboard/attendly/setup" className="inline-block bg-brand-cta text-white font-bold px-6 py-3 rounded-lg hover:brightness-110 transition-all">
          Começar configuração →
        </a>
      </div>
    );
  }

  const trialInfo = getTrialInfo(business?.trial_ends_at, stats?.has_active_subscription);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">Visão Geral</h1>

      {trialInfo && (
        <div className={`rounded-lg p-4 text-sm flex items-center justify-between gap-4 ${
          trialInfo.expired
            ? 'bg-brand-error/10 border border-brand-error/30'
            : 'bg-brand-trust/10 border border-brand-trust/30'
        }`}>
          <span className={trialInfo.expired ? 'text-brand-error font-medium' : 'text-brand-trust font-medium'}>
            {trialInfo.expired
              ? 'Seu período de teste expirou. Assine um plano para continuar atendendo.'
              : `${trialInfo.daysLeft} ${trialInfo.daysLeft === 1 ? 'dia restante' : 'dias restantes'} no teste grátis.`}
          </span>
          <a href="/dashboard/attendly/billing" className="shrink-0 bg-brand-cta text-white font-medium px-4 py-1.5 rounded-md hover:brightness-110 transition">
            {trialInfo.expired ? 'Assinar agora' : 'Ver planos'}
          </a>
        </div>
      )}

      {stats && stats.usage_percentage >= 80 && (
        <div className="bg-brand-cta/10 border border-brand-cta/30 rounded-lg p-4 text-sm">
          <span className="text-brand-cta font-medium">⚠️ Uso em {stats.usage_percentage}% do limite.</span>{' '}
          <a href="/dashboard/attendly/billing" className="underline font-bold text-brand-cta">Ver plano</a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Mensagens este mês" value={stats?.msgs_month || 0} />
        <StatCard label="Uso do plano" value={`${stats?.usage_percentage || 0}%`} />
        <StatCard label="Conversas recentes" value={conversations.length} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-brand-text mb-3">Últimas conversas</h2>
        {conversations.length === 0 ? (
          <p className="text-brand-muted text-sm">Nenhuma conversa ainda. Seu atendente está pronto!</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv: any) => (
              <a key={conv.id} href={`/dashboard/attendly/inbox?id=${conv.id}`}
                className="block p-4 bg-brand-surface rounded-lg hover:bg-brand-border/50 transition">
                <div className="flex justify-between items-center">
                  <span className="text-brand-text text-sm font-medium">
                    {conv.customer_name || conv.customer_phone || 'Visitante'}
                  </span>
                  <span className="text-brand-muted text-xs">{conv.channel}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-brand-muted text-xs">{conv.message_count} msgs</span>
                  <StatusBadge status={conv.status} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTrialInfo(
  trialEndsAt: string | null | undefined,
  hasActiveSubscription: boolean | undefined
): { daysLeft: number; expired: boolean } | null {
  if (hasActiveSubscription) return null;
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  if (end <= now) return { daysLeft: 0, expired: true };
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return { daysLeft, expired: false };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-brand-border">
      <p className="text-brand-muted text-xs uppercase">{label}</p>
      <p className="text-2xl font-bold text-brand-text mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-brand-success/10 text-brand-success',
    human_needed: 'bg-brand-error/10 text-brand-error',
    closed: 'bg-brand-border text-brand-muted',
  };
  const labels: Record<string, string> = {
    active: 'Ativa',
    human_needed: 'Precisa atenção',
    closed: 'Encerrada',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}
