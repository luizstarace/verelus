'use client';

import { useState, useEffect } from 'react';

interface OverviewStats {
  msgs_today: number;
  msgs_month: number;
  usage_percentage: number;
  avg_satisfaction: number;
}

export default function OverviewDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          msgs_today: 0,
          msgs_month: usageData.text?.used || 0,
          usage_percentage: usageData.text?.percentage || 0,
          avg_satisfaction: 0,
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

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">Visão Geral</h1>

      {stats && stats.usage_percentage >= 80 && (
        <div className="bg-brand-cta/10 border border-brand-cta/30 rounded-lg p-4 text-sm">
          <span className="text-brand-cta font-medium">⚠️ Uso em {stats.usage_percentage}% do limite.</span>{' '}
          <a href="/dashboard/attendly/billing" className="underline font-bold text-brand-cta">Ver plano</a>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Msgs hoje" value={stats?.msgs_today || 0} />
        <StatCard label="Msgs este mês" value={stats?.msgs_month || 0} />
        <StatCard label="Uso do plano" value={`${stats?.usage_percentage || 0}%`} />
        <StatCard label="Satisfação" value={stats?.avg_satisfaction ? `${stats.avg_satisfaction}/5` : '—'} />
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
