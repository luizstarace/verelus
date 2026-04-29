'use client';

import { useEffect, useState } from 'react';
import TrainerChat from '@/components/atalaia/TrainerChat';

interface Business {
  id: string;
  name: string;
  status: string;
}

export default function PlaygroundView() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedFaqCount, setSavedFaqCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/atalaia/business');
        const data = await res.json();
        setBusiness(data.business || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveAsFaq(question: string, answer: string) {
    if (!business) return;
    setSaveError('');
    setSaving(true);
    try {
      const bizRes = await fetch('/api/atalaia/business');
      const bizData = await bizRes.json();
      const currentFaq: { question: string; answer: string }[] = bizData.business?.faq || [];
      const updatedFaq = [...currentFaq, { question, answer }];
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq: updatedFaq }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar');
      }
      setSavedFaqCount((n) => n + 1);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar FAQ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-brand-muted">Carregando...</div>;
  }

  if (!business) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-brand-text mb-4">Configure o atendente primeiro</h2>
        <p className="text-brand-muted mb-6">
          Você precisa criar seu negócio antes de treinar a IA.
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

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Treinar atendente</h1>
        <p className="text-sm text-brand-muted mt-1">
          Converse com a IA do <strong>{business.name}</strong> como se fosse um cliente. Nada
          daqui é cobrado, salvo no inbox, ou enviado para clientes reais.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-brand-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-brand-text">Chat de teste</h2>
              <span className="text-xs text-brand-muted">Modo treinamento · não consome plano</span>
            </div>
            <TrainerChat
              businessId={business.id}
              variant="whatsapp"
              height="h-[500px]"
              emptyHint="Mande uma mensagem como se fosse um cliente. Tente perguntas comuns: horário, preço, agendamento."
              onSaveAsFaq={handleSaveAsFaq}
            />
            {saving && (
              <p className="text-xs text-brand-muted mt-2">Salvando como FAQ...</p>
            )}
            {savedFaqCount > 0 && !saving && (
              <p className="text-xs text-brand-success mt-2">
                {savedFaqCount} {savedFaqCount === 1 ? 'troca salva' : 'trocas salvas'} no FAQ ✓
              </p>
            )}
            {saveError && <p className="text-xs text-brand-error mt-2">{saveError}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-brand-border p-5">
            <h3 className="text-sm font-semibold text-brand-text mb-2">Como usar</h3>
            <ul className="text-xs text-brand-muted space-y-2">
              <li>
                <strong className="text-brand-text">1.</strong> Mande mensagens como se fosse um
                cliente real (saudações, perguntas, dúvidas).
              </li>
              <li>
                <strong className="text-brand-text">2.</strong> Se a IA errar, ajuste o FAQ ou os
                serviços nas Configurações.
              </li>
              <li>
                <strong className="text-brand-text">3.</strong> Volte aqui e teste de novo até
                ficar satisfeito antes de deixar atender clientes reais.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-brand-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-brand-text">Ajustar respostas</h3>
            <p className="text-xs text-brand-muted">
              A IA usa as informações cadastradas em Configurar para responder.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="/dashboard/atalaia/setup"
                className="text-sm text-brand-trust hover:underline"
              >
                → Editar serviços, horários e FAQ
              </a>
              <a
                href="/dashboard/atalaia/settings"
                className="text-sm text-brand-trust hover:underline"
              >
                → Tom de voz e configurações avançadas
              </a>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
            <p className="font-semibold mb-1">Dica</p>
            <p className="text-xs">
              Teste perguntas absurdas também (ex: &quot;vocês vendem foguete?&quot;). Veja se a
              IA recusa educadamente sem inventar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
