'use client';

import { useState, useEffect } from 'react';

interface UsageData {
  plan: 'starter' | 'pro' | 'business';
  period: string;
  text: { used: number; limit: number; percentage: number };
  voice: { used_seconds: number; limit_seconds: number; percentage: number; enabled: boolean };
  overage_notified: boolean;
}

const PLAN_DISPLAY: Record<string, { name: string; priceLabel: string }> = {
  starter: { name: 'Starter', priceLabel: 'R$ 147/mes' },
  pro: { name: 'Pro', priceLabel: 'R$ 297/mes' },
  business: { name: 'Business', priceLabel: 'R$ 597/mes' },
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ['500 mensagens/mes', 'Widget de chat', 'Suporte por email'],
  pro: ['2.500 mensagens/mes', '30 min de voz/mes', 'Widget + WhatsApp', 'Suporte prioritario'],
  business: ['10.000 mensagens/mes', '120 min de voz/mes', 'Clonagem de voz', 'Suporte dedicado'],
};

function barColor(percentage: number): string {
  if (percentage > 80) return 'bg-brand-error';
  if (percentage > 60) return 'bg-brand-warning';
  return 'bg-brand-success';
}

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function BillingView() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/attendly/usage');
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setUsage(data);
      } catch (err) {
        console.error('Error fetching usage:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return <div className="p-6 text-brand-muted">Carregando...</div>;
  }

  if (!usage) {
    return <div className="p-6 text-brand-muted">Nao foi possivel carregar dados de uso.</div>;
  }

  const planInfo = PLAN_DISPLAY[usage.plan];
  const textPct = Math.min(usage.text.percentage, 100);
  const voicePct = Math.min(usage.voice.percentage, 100);
  const voiceLimitMin = Math.floor(usage.voice.limit_seconds / 60);
  const voiceUsedMin = Math.floor(usage.voice.used_seconds / 60);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">Faturamento e uso</h1>

      {/* Current Plan Card */}
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-brand-muted">Plano atual</p>
            <p className="text-xl font-bold text-brand-text">{planInfo.name}</p>
            <p className="text-sm text-brand-muted">{planInfo.priceLabel}</p>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-brand-success/10 text-brand-success">
            Ativo
          </span>
        </div>
        <p className="text-xs text-brand-muted mt-3">Periodo: {usage.period}</p>
      </div>

      {/* Usage Bars */}
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6 space-y-5">
        <h2 className="text-lg font-semibold text-brand-text">Uso do periodo</h2>

        {/* Text messages */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-brand-text">Mensagens de texto</span>
            <span className="text-sm text-brand-muted">
              {usage.text.used} / {usage.text.limit} mensagens
            </span>
          </div>
          <div className="w-full bg-brand-border rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${barColor(usage.text.percentage)}`}
              style={{ width: `${textPct}%` }}
            />
          </div>
          <p className="text-xs text-brand-muted mt-1">{usage.text.percentage}% utilizado</p>
        </div>

        {/* Voice minutes */}
        {usage.voice.enabled && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-brand-text">Minutos de voz</span>
              <span className="text-sm text-brand-muted">
                {formatSeconds(usage.voice.used_seconds)} / {voiceLimitMin} minutos
              </span>
            </div>
            <div className="w-full bg-brand-border rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${barColor(usage.voice.percentage)}`}
                style={{ width: `${voicePct}%` }}
              />
            </div>
            <p className="text-xs text-brand-muted mt-1">{usage.voice.percentage}% utilizado</p>
          </div>
        )}

        {usage.overage_notified && (
          <p className="text-xs text-brand-warning">
            Voce ultrapassou o limite do plano. Mensagens extras serao cobradas por excedente.
          </p>
        )}
      </div>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-brand-text mb-4">Comparar planos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['starter', 'pro', 'business'] as const).map((planKey) => {
            const info = PLAN_DISPLAY[planKey];
            const features = PLAN_FEATURES[planKey];
            const isCurrent = usage.plan === planKey;
            return (
              <div
                key={planKey}
                className={`border rounded-lg p-4 ${
                  isCurrent
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-brand-border bg-brand-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-brand-text">{info.name}</h3>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary text-white">Atual</span>
                  )}
                </div>
                <p className="text-sm font-medium text-brand-text mb-3">{info.priceLabel}</p>
                <ul className="space-y-1.5">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-brand-muted">
                      <span className="text-brand-success mt-0.5">&#10003;</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <a
          href="/attendly#pricing"
          className="inline-block bg-brand-cta text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          Fazer upgrade
        </a>
        <a
          href="/attendly#pricing"
          className="text-sm text-brand-trust hover:underline"
        >
          Ver planos e fazer upgrade →
        </a>
      </div>
    </div>
  );
}
