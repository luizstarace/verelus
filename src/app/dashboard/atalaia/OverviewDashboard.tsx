'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackMeta } from '@/lib/analytics/meta';
import WhatsAppBanWarning from '@/components/atalaia/WhatsAppBanWarning';
import { ATALAIA_VOICES, DEFAULT_VOICE_ID } from '@/lib/atalaia/voices';
import BusinessDataSection from '@/components/atalaia/sections/BusinessDataSection';
import ServicesSection from '@/components/atalaia/sections/ServicesSection';
import HoursSection from '@/components/atalaia/sections/HoursSection';
import FaqSection from '@/components/atalaia/sections/FaqSection';
import WidgetSection from '@/components/atalaia/sections/WidgetSection';
import NotificationsSection from '@/components/atalaia/sections/NotificationsSection';
import AtalaiaLogo from '@/components/atalaia/AtalaiaLogo';

interface OverviewStats {
  msgs_month: number;
  usage_percentage: number;
  has_active_subscription: boolean;
  plan: 'starter' | 'pro' | 'business';
  voice_used_seconds: number;
  voice_limit_seconds: number;
  voice_enabled: boolean;
}

interface Business {
  id: string;
  name: string;
  category?: string | null;
  phone?: string | null;
  address?: string | null;
  services?: any[];
  hours?: Record<string, { open?: string; close?: string }> | null;
  faq?: { question: string; answer: string }[];
  widget_config?: { color?: string; position?: 'bottom-right' | 'bottom-left'; greeting?: string };
  whatsapp_number: string | null;
  whatsapp_last_state?: string | null;
  whatsapp_state_changed_at?: string | null;
  voice_id: string | null;
  trial_ends_at: string | null;
  status: string;
  owner_whatsapp?: string | null;
  owner_notify_channel?: 'email' | 'whatsapp' | 'both' | null;
}

interface Conversation {
  id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  channel: string;
  message_count: number;
  status: string;
}

interface LogEntry {
  id: string;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  created_at: string;
  error?: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
};

export default function OverviewDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // Voice picker state
  const [voiceText, setVoiceText] = useState('Olá! Posso te ajudar?');
  const [voiceTesting, setVoiceTesting] = useState<string | null>(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceJustSaved, setVoiceJustSaved] = useState(false);

  // Logs section
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // Config accordions state
  const [openConfig, setOpenConfig] = useState<Set<string>>(new Set(['data']));
  function toggleConfig(id: string) {
    setOpenConfig((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const reloadBusiness = useCallback(async () => {
    try {
      const res = await fetch('/api/atalaia/business');
      const data = await res.json();
      if (data.business) setBusiness(data.business);
    } catch (err) {
      console.error('reloadBusiness', err);
    }
  }, []);

  useEffect(() => {
    if (searchParams?.get('checkout') !== 'success') return;
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem('atalaia_subscribe_tracked') === '1') return;
    trackMeta('Subscribe', { currency: 'BRL' });
    window.sessionStorage.setItem('atalaia_subscribe_tracked', '1');
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      try {
        const [bizRes, usageRes, convRes] = await Promise.all([
          fetch('/api/atalaia/business'),
          fetch('/api/atalaia/usage'),
          fetch('/api/atalaia/conversations?limit=5'),
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
          plan: usageData.plan || 'starter',
          voice_used_seconds: usageData.voice?.used_seconds || 0,
          voice_limit_seconds: usageData.voice?.limit_seconds || 0,
          voice_enabled: Boolean(usageData.voice?.enabled),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleTestVoice(voiceId: string) {
    if (!voiceText.trim()) return;
    setVoiceTesting(voiceId);
    setVoiceError(null);
    setVoiceAudioUrl(null);
    try {
      const res = await fetch('/api/atalaia/voice/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voiceText, voice_id: voiceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVoiceError(data.error || 'Erro ao gerar áudio');
        return;
      }
      const blob = await res.blob();
      setVoiceAudioUrl(URL.createObjectURL(blob));
    } catch {
      setVoiceError('Erro de rede');
    } finally {
      setVoiceTesting(null);
    }
  }

  async function handleSaveVoice(voiceId: string) {
    setVoiceSaving(true);
    setVoiceError(null);
    setVoiceJustSaved(false);
    try {
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voiceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVoiceError(data.error || 'Erro ao salvar voz');
        return;
      }
      setBusiness((prev) => (prev ? { ...prev, voice_id: voiceId } : prev));
      setVoiceJustSaved(true);
      setTimeout(() => setVoiceJustSaved(false), 2500);
    } catch {
      setVoiceError('Erro de rede');
    } finally {
      setVoiceSaving(false);
    }
  }

  async function toggleLogs() {
    const next = !logsOpen;
    setLogsOpen(next);
    if (next && logs === null) {
      setLogsLoading(true);
      try {
        const res = await fetch('/api/atalaia/logs?limit=10');
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    }
  }

  if (loading) {
    return <div className="p-8 text-brand-muted">Carregando...</div>;
  }

  if (!business) {
    return (
      <div className="p-8 text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-brand-text mb-4">Bem-vindo ao Atalaia!</h2>
        <p className="text-brand-muted mb-6">
          Configure seu atendente IA em poucos minutos. Tudo ficará nesta única tela depois.
        </p>
        <a
          href="/dashboard/atalaia/setup"
          className="inline-block bg-brand-cta text-white font-bold px-6 py-3 rounded-lg hover:brightness-110 transition-all"
        >
          Começar configuração →
        </a>
      </div>
    );
  }

  const trialInfo = getTrialInfo(business?.trial_ends_at, stats?.has_active_subscription);
  const currentVoiceId =
    business.voice_id && business.voice_id !== 'default' ? business.voice_id : DEFAULT_VOICE_ID;
  const currentVoice = ATALAIA_VOICES.find((v) => v.id === currentVoiceId);
  const planLabel = stats?.plan ? PLAN_LABELS[stats.plan] : 'Starter';
  const isWaConnected = !!business.whatsapp_number;
  const waLastState = business.whatsapp_last_state || null;
  const waDisconnected =
    isWaConnected && waLastState !== null && waLastState !== 'open' && waLastState !== 'connecting';
  const waDisconnectedSince = (() => {
    if (!waDisconnected || !business.whatsapp_state_changed_at) return null;
    const ms = Date.now() - new Date(business.whatsapp_state_changed_at).getTime();
    if (ms < 0) return null;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    if (hours < 1) return 'há menos de 1 hora';
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  })();
  const usagePct = stats?.usage_percentage || 0;
  const voicePct =
    stats && stats.voice_limit_seconds > 0
      ? Math.round((stats.voice_used_seconds / stats.voice_limit_seconds) * 100)
      : 0;

  return (
    <div className="relative p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Subtle ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/40 via-transparent to-blue-50/30"
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <AtalaiaLogo size={56} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text leading-tight">
            Painel do {business.name}
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            A torre que vigia seu WhatsApp. Tudo numa tela só.
          </p>
        </div>
      </div>

      {/* Trial banner */}
      {trialInfo && (
        <div
          className={`rounded-lg p-4 text-sm flex items-center justify-between gap-4 ${
            trialInfo.expired
              ? 'bg-brand-error/10 border border-brand-error/30'
              : 'bg-brand-trust/10 border border-brand-trust/30'
          }`}
        >
          <span
            className={
              trialInfo.expired ? 'text-brand-error font-medium' : 'text-brand-trust font-medium'
            }
          >
            {trialInfo.expired
              ? 'Seu período de teste expirou. Assine um plano para continuar atendendo.'
              : `${trialInfo.daysLeft} ${trialInfo.daysLeft === 1 ? 'dia restante' : 'dias restantes'} no trial — plano Starter (500 mensagens).`}
          </span>
          <a
            href="/dashboard/atalaia/billing"
            className="shrink-0 bg-brand-cta text-white font-medium px-4 py-1.5 rounded-md hover:brightness-110 transition"
          >
            {trialInfo.expired ? 'Assinar agora' : 'Ver planos'}
          </a>
        </div>
      )}

      {/* High-usage warning */}
      {stats && stats.usage_percentage >= 80 && (
        <div className="bg-brand-cta/10 border border-brand-cta/30 rounded-lg p-4 text-sm">
          <span className="text-brand-cta font-medium">
            ⚠️ Uso em {stats.usage_percentage}% do limite mensal.
          </span>{' '}
          <a href="/dashboard/atalaia/billing" className="underline font-bold text-brand-cta">
            Ver plano
          </a>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Mensagens no mês" value={stats?.msgs_month ?? 0} hint={`${planLabel} · ${usagePct}% usado`} />
        <KpiCard
          label="WhatsApp"
          value={waDisconnected ? 'Caiu' : isWaConnected ? 'Conectado' : 'Desconectado'}
          hint={
            waDisconnected
              ? waDisconnectedSince || 'Verificar Painel'
              : isWaConnected
              ? business.whatsapp_number || ''
              : 'Conecte para atender por WhatsApp'
          }
          tone={waDisconnected || !isWaConnected ? 'warning' : 'success'}
        />
        <KpiCard
          label="Voz do atendente"
          value={currentVoice?.name || 'Padrão'}
          hint={currentVoice?.gender === 'masculine' ? 'Masculina' : 'Feminina'}
        />
        <KpiCard
          label="Conversas (5 últimas)"
          value={conversations.length}
          hint="Veja abaixo"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Conversations */}
        <PanelCard title="Conversas recentes" linkHref="/dashboard/atalaia/inbox" linkLabel="Ver todas">
          {conversations.length === 0 ? (
            <p className="text-brand-muted text-sm">
              Nenhuma conversa ainda. Quando chegarem mensagens, elas aparecem aqui.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <a
                  key={conv.id}
                  href={`/dashboard/atalaia/inbox?id=${conv.id}`}
                  className="block p-3 bg-brand-surface rounded-lg hover:bg-brand-border/50 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-brand-text text-sm font-medium truncate">
                      {conv.customer_name || conv.customer_phone || 'Visitante'}
                    </span>
                    <span className="text-brand-muted text-xs ml-2 shrink-0">{conv.channel}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-brand-muted text-xs">{conv.message_count} msgs</span>
                    <StatusBadge status={conv.status} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </PanelCard>

        {/* Train */}
        <PanelCard title="Treinar a IA" linkHref="/dashboard/atalaia/playground" linkLabel="Abrir treino completo →">
          <p className="text-sm text-brand-muted mb-3">
            Converse com o atendente como se fosse um cliente. Não é cobrado, não vai pro inbox real.
          </p>
          <div className="bg-brand-surface rounded-lg p-4 text-sm text-brand-text space-y-2">
            <p>Quando usar:</p>
            <ul className="list-disc pl-5 space-y-1 text-brand-muted text-xs">
              <li>Antes de conectar o WhatsApp pra ver se a IA acerta</li>
              <li>Depois de mudar serviços, FAQ ou preço</li>
              <li>Pra testar perguntas absurdas (ver se a IA recusa educadamente)</li>
            </ul>
          </div>
          <a
            href="/dashboard/atalaia/playground"
            className="mt-3 inline-block bg-brand-trust text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-primary transition"
          >
            Abrir chat de teste
          </a>
        </PanelCard>

        {/* Voice picker */}
        <PanelCard title="Voz do atendente" wide>
          <p className="text-sm text-brand-muted mb-3">
            Escolha entre 6 vozes em português brasileiro. O preview funciona em qualquer plano.
            O envio automático em conversas reais requer plano Pro ou Business.
          </p>
          <div className="mb-3">
            <label className="block text-xs font-medium text-brand-muted mb-1">
              Texto para o teste
            </label>
            <input
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              maxLength={250}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm bg-white"
              placeholder="Olá! Posso te ajudar?"
            />
          </div>
          {(['feminine', 'masculine'] as const).map((gender) => (
            <div key={gender} className="mb-3">
              <p className="text-xs font-semibold text-brand-text uppercase tracking-wide mb-2">
                {gender === 'feminine' ? 'Femininas' : 'Masculinas'}
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                {ATALAIA_VOICES.filter((v) => v.gender === gender).map((v) => {
                  const isSelected = currentVoiceId === v.id;
                  const isPreviewing = voiceTesting === v.id;
                  return (
                    <div
                      key={v.id}
                      className={`rounded-lg border p-3 bg-white space-y-1.5 transition ${
                        isSelected
                          ? 'border-brand-trust ring-2 ring-brand-trust/20'
                          : 'border-brand-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-brand-text">{v.name}</p>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-success/10 text-brand-success font-medium">
                            Em uso
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-brand-muted leading-snug">{v.hint}</p>
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => handleTestVoice(v.id)}
                          disabled={voiceTesting !== null || !voiceText.trim()}
                          className="text-xs px-2.5 py-1 rounded border border-brand-border text-brand-text font-medium hover:bg-brand-surface disabled:opacity-50 transition"
                        >
                          {isPreviewing ? '...' : 'Testar'}
                        </button>
                        <button
                          onClick={() => handleSaveVoice(v.id)}
                          disabled={voiceSaving || isSelected}
                          className="text-xs px-2.5 py-1 rounded bg-brand-cta text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {isSelected ? '✓' : voiceSaving ? '...' : 'Usar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {voiceJustSaved && (
            <p className="text-xs text-brand-success">Voz atualizada ✓</p>
          )}
          {voiceError && <p className="text-xs text-brand-error">{voiceError}</p>}
          {voiceAudioUrl && (
            <div className="mt-2">
              <p className="text-xs text-brand-muted mb-1">Última amostra:</p>
              <audio controls autoPlay src={voiceAudioUrl} className="w-full" />
            </div>
          )}
        </PanelCard>

        {/* WhatsApp */}
        <PanelCard title="WhatsApp" linkHref="/dashboard/atalaia/settings?tab=whatsapp" linkLabel="Abrir ajustes completos →">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`w-3 h-3 rounded-full ${
                waDisconnected ? 'bg-brand-error animate-pulse' : isWaConnected ? 'bg-brand-success' : 'bg-brand-error'
              }`}
            />
            <span className="text-sm font-medium text-brand-text">
              {waDisconnected
                ? `Conexão caiu ${waDisconnectedSince || ''}`.trim()
                : isWaConnected
                ? `Conectado (${business.whatsapp_number})`
                : 'Não conectado'}
            </span>
          </div>

          {waDisconnected && (
            <div className="border border-red-300 bg-red-50 rounded-lg p-3 text-sm text-red-900 space-y-2 mb-3">
              <p>
                <strong>Sua conexão com o WhatsApp caiu.</strong> Pode ser uma restrição temporária
                do WhatsApp (timelock — costuma sumir em 24-72h). A IA não responde até reconectar.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href="/dashboard/atalaia/settings?tab=whatsapp"
                  className="inline-block bg-brand-cta text-white font-medium px-3 py-1.5 rounded text-xs hover:brightness-110 transition text-center"
                >
                  Tentar reconectar
                </a>
                <a
                  href="/dashboard/atalaia/support?category=whatsapp_disconnect&prefill=1"
                  className="inline-block border border-red-300 text-red-900 font-medium px-3 py-1.5 rounded text-xs hover:bg-red-100 transition text-center"
                >
                  Pedir ajuda
                </a>
              </div>
            </div>
          )}

          {!isWaConnected && (
            <>
              <WhatsAppBanWarning />
              <a
                href="/dashboard/atalaia/settings?tab=whatsapp"
                className="mt-3 inline-block bg-brand-cta text-white font-medium px-4 py-2 rounded-lg text-sm hover:brightness-110 transition"
              >
                Conectar agora →
              </a>
            </>
          )}
          {isWaConnected && !waDisconnected && (
            <p className="text-xs text-brand-muted">
              Filtros de horário e whitelist ficam em Ajustes &gt; WhatsApp.
            </p>
          )}
        </PanelCard>

        {/* Plan */}
        <PanelCard title="Plano e uso" linkHref="/dashboard/atalaia/billing" linkLabel="Ver detalhes →">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-brand-text">Plano atual</span>
                <span className="font-semibold text-brand-text">{planLabel}</span>
              </div>
              {!stats?.has_active_subscription && (
                <p className="text-xs text-brand-muted">
                  Em trial gratuito. Faça upgrade quando estiver pronto.
                </p>
              )}
            </div>
            <UsageBar label="Mensagens" pct={usagePct} caption={`${stats?.msgs_month || 0} mensagens`} />
            {stats?.voice_enabled && stats.voice_limit_seconds > 0 && (
              <UsageBar
                label="Voz"
                pct={voicePct}
                caption={`${formatSeconds(stats.voice_used_seconds)} de ${formatSeconds(stats.voice_limit_seconds)}`}
              />
            )}
            {!stats?.voice_enabled && (
              <p className="text-xs text-brand-muted">
                Voz não disponível no plano atual. Upgrade pra Pro ou Business pra liberar.
              </p>
            )}
          </div>
        </PanelCard>

      </div>

      {/* Configurar negócio — accordions inline */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-brand-border">
          <h2 className="text-base sm:text-lg font-semibold text-brand-text">Configurar atendente</h2>
          <p className="text-xs text-brand-muted mt-1">
            Tudo que a IA usa pra responder seus clientes. Clique numa seção para abrir e editar.
          </p>
        </div>
        <div className="divide-y divide-brand-border">
          {[
            { id: 'data', title: 'Dados do negócio', render: () => <BusinessDataSection business={business} onSaved={reloadBusiness} /> },
            { id: 'services', title: 'Serviços e preços', render: () => <ServicesSection business={business} onSaved={reloadBusiness} /> },
            { id: 'hours', title: 'Horários de funcionamento', render: () => <HoursSection business={business} onSaved={reloadBusiness} /> },
            { id: 'faq', title: 'Perguntas frequentes (FAQ)', render: () => <FaqSection business={business} onSaved={reloadBusiness} /> },
            { id: 'widget', title: 'Widget no site', render: () => <WidgetSection business={business} onSaved={reloadBusiness} /> },
            { id: 'notify', title: 'Notificações para você', render: () => <NotificationsSection business={business} onSaved={reloadBusiness} /> },
          ].map((sec) => {
            const isOpen = openConfig.has(sec.id);
            return (
              <div key={sec.id}>
                <button
                  type="button"
                  onClick={() => toggleConfig(sec.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-brand-surface transition text-left"
                >
                  <span className="text-sm sm:text-base font-medium text-brand-text">{sec.title}</span>
                  <span className="text-brand-muted text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5">
                    {sec.render()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logs (collapsed) */}
      <div className="bg-white rounded-xl border border-brand-border">
        <button
          type="button"
          onClick={toggleLogs}
          className="w-full flex items-center justify-between p-4 hover:bg-brand-surface transition"
        >
          <span className="text-sm font-semibold text-brand-text">
            Atividade recente (logs técnicos)
          </span>
          <span className="text-brand-muted text-xs">{logsOpen ? '▲ Recolher' : '▼ Expandir'}</span>
        </button>
        {logsOpen && (
          <div className="border-t border-brand-border p-4">
            {logsLoading && <p className="text-sm text-brand-muted">Carregando...</p>}
            {!logsLoading && logs && logs.length === 0 && (
              <p className="text-sm text-brand-muted">Sem atividade recente.</p>
            )}
            {!logsLoading && logs && logs.length > 0 && (
              <div className="space-y-1 text-xs font-mono">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded ${
                      log.status_code >= 500
                        ? 'bg-brand-error/5 text-brand-error'
                        : log.status_code >= 400
                        ? 'bg-brand-warning/10 text-brand-warning'
                        : 'bg-brand-surface text-brand-muted'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>
                        [{log.status_code}] {log.endpoint}
                      </span>
                      <span>{log.latency_ms}ms</span>
                    </div>
                    {log.error && <div className="mt-0.5 text-brand-error">{log.error}</div>}
                  </div>
                ))}
              </div>
            )}
            <a
              href="/dashboard/atalaia/logs"
              className="text-xs text-brand-trust hover:underline mt-3 inline-block"
            >
              Ver todos os logs →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Subcomponents ---

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'success' | 'warning';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-brand-success'
      : tone === 'warning'
      ? 'text-brand-error'
      : 'text-brand-text';
  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 border border-brand-border">
      <p className="text-brand-muted text-[10px] sm:text-xs uppercase font-semibold tracking-wide">
        {label}
      </p>
      <p className={`text-lg sm:text-xl font-bold ${valueColor} mt-1 truncate`}>{value}</p>
      {hint && <p className="text-[11px] sm:text-xs text-brand-muted mt-0.5 truncate">{hint}</p>}
    </div>
  );
}

function PanelCard({
  title,
  children,
  linkHref,
  linkLabel,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  linkHref?: string;
  linkLabel?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-brand-border p-4 sm:p-6 ${
        wide ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-brand-text">{title}</h2>
        {linkHref && linkLabel && (
          <a
            href={linkHref}
            className="text-xs text-brand-trust hover:underline whitespace-nowrap"
          >
            {linkLabel}
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

function UsageBar({ label, pct, caption }: { label: string; pct: number; caption: string }) {
  const color = pct > 80 ? 'bg-brand-error' : pct > 60 ? 'bg-brand-warning' : 'bg-brand-success';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-brand-text">{label}</span>
        <span className="text-brand-muted">{caption}</span>
      </div>
      <div className="w-full bg-brand-border rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
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

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
}
