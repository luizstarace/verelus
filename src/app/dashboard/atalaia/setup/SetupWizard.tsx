'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackMeta } from '@/lib/analytics/meta';

// --- Types ---

interface Service {
  name: string;
  price: string;
  duration: string;
  description: string;
}

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface HoursEntry {
  key: DayKey;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
}

interface FaqEntry {
  question: string;
  answer: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CATEGORIES = [
  { value: 'clinica', label: 'Clínica' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'salao', label: 'Salão de beleza' },
  { value: 'loja', label: 'Loja' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outro', label: 'Outro' },
];

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

function hoursArrayToRecord(arr: HoursEntry[]): Record<string, { open: string; close: string }> {
  const result: Record<string, { open: string; close: string }> = {};
  for (const h of arr) {
    if (h.enabled && h.open && h.close) {
      result[h.key] = { open: h.open, close: h.close };
    }
  }
  return result;
}

const STEP_TITLES = [
  'Dados do negócio',
  'Serviços, Horários e FAQ',
  'Testar o atendente',
  'Instalar Widget',
  'Conectar WhatsApp',
];

const STEP_DESCRIPTIONS = [
  'Conte-nos sobre seu negócio para configurar o atendente.',
  'Adicione serviços, horários de funcionamento e perguntas frequentes.',
  'Teste o atendente com uma conversa simulada.',
  'Instale o widget no seu site para atender clientes automaticamente.',
  'Conecte o WhatsApp para atender pelo canal mais popular do Brasil.',
];

function defaultHours(): HoursEntry[] {
  return DAYS.map((d, i) => ({
    key: d.key,
    label: d.label,
    enabled: i < 5,
    open: '08:00',
    close: '18:00',
  }));
}

// --- Component ---

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 2
  const [services, setServices] = useState<Service[]>([
    { name: '', price: '', duration: '', description: '' },
  ]);
  const [hours, setHours] = useState<HoursEntry[]>(defaultHours());
  const [faq, setFaq] = useState<FaqEntry[]>([{ question: '', answer: '' }]);

  // Step 3
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Step 4
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- API helpers ---

  async function apiCall(url: string, method: string, body?: Record<string, unknown>) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro inesperado');
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  // --- Step handlers ---

  async function handleStep1Next() {
    if (!name.trim()) {
      setError('Nome do negócio é obrigatório.');
      return;
    }
    const payload = { name: name.trim(), category, phone, address };
    let data;
    if (businessId) {
      data = await apiCall('/api/atalaia/business', 'PATCH', { ...payload, onboarding_step: 2 });
    } else {
      data = await apiCall('/api/atalaia/setup', 'POST', payload);
    }
    if (data) {
      setBusinessId(data.business?.id || data.id || businessId);
      setStep(2);
    }
  }

  async function handleStep2Next() {
    const validServices = services.filter((s) => s.name.trim()).map((s) => ({
      name: s.name,
      price_cents: Math.round(parseFloat(s.price || '0') * 100),
      duration_min: parseInt(s.duration || '0', 10),
      description: s.description,
    }));
    const validFaq = faq.filter((f) => f.question.trim() && f.answer.trim());
    const data = await apiCall('/api/atalaia/business', 'PATCH', {
      services: validServices,
      hours: hoursArrayToRecord(hours),
      faq: validFaq,
      onboarding_step: 3,
    });
    if (data) setStep(3);
  }

  async function handleSendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/atalaia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          message: userMsg,
          channel: 'widget',
          preview: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao enviar mensagem');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming não suportado');

      const decoder = new TextDecoder();
      let assistantText = '';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              const token = parsed.choices?.[0]?.delta?.content || parsed.token || parsed.text || '';
              assistantText += token;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            } catch {
              assistantText += payload;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleStep4Next() {
    const data = await apiCall('/api/atalaia/business', 'PATCH', { onboarding_step: 5 });
    if (data) setStep(5);
  }

  async function handleFinalize() {
    const data = await apiCall('/api/atalaia/business', 'PATCH', {
      status: 'active',
      onboarding_step: null,
    });
    if (data) {
      trackMeta('StartTrial', {
        value: 0,
        currency: 'BRL',
        content_name: 'atalaia_trial',
      });
      router.push('/dashboard/atalaia');
    } else {
      // apiCall already populated `error` from the response. The error block
      // is rendered at the top of the wizard card; on a long step 5 (QR + tips)
      // it can be off-screen, so scroll it into view + give a nudge to retry.
      setError((prev) => prev || 'Não conseguimos finalizar a configuração. Tente novamente em alguns segundos.');
      if (typeof document !== 'undefined') {
        document.getElementById('wizard-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  async function copyWidgetCode() {
    const code = `<script src="https://verelus.com/widget.js" data-business="${businessId}" async></script>`;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- Service / FAQ helpers ---

  function updateService(index: number, field: keyof Service, value: string) {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addService() {
    setServices((prev) => [...prev, { name: '', price: '', duration: '', description: '' }]);
  }

  function removeService(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHour(index: number, field: keyof HoursEntry, value: string | boolean) {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }

  function updateFaq(index: number, field: keyof FaqEntry, value: string) {
    setFaq((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  function addFaq() {
    setFaq((prev) => [...prev, { question: '', answer: '' }]);
  }

  function removeFaq(index: number) {
    setFaq((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Shared UI ---

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition';
  const btnPrimary =
    'px-6 py-2.5 rounded-lg bg-brand-trust text-white font-medium hover:bg-brand-primary transition disabled:opacity-50 disabled:cursor-not-allowed';
  const btnSecondary =
    'px-6 py-2.5 rounded-lg border border-brand-border text-brand-text font-medium hover:bg-brand-surface transition disabled:opacity-50';

  // --- Render steps ---

  function renderStep1() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">
            Nome do negócio <span className="text-brand-error">*</span>
          </label>
          <input
            className={inputClass}
            placeholder="Ex: Clínica Vida"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">Categoria</label>
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Selecione...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">Telefone</label>
          <input
            className={inputClass}
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">Endereço</label>
          <input
            className={inputClass}
            placeholder="Rua, número, cidade"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-6">
        {/* Services */}
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-3">Serviços</h3>
          {services.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 mb-3 p-3 bg-brand-surface rounded-lg">
              <input
                className={inputClass}
                placeholder="Nome do serviço"
                value={s.name}
                onChange={(e) => updateService(i, 'name', e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Preço (R$)"
                value={s.price}
                onChange={(e) => updateService(i, 'price', e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Duração (min)"
                value={s.duration}
                onChange={(e) => updateService(i, 'duration', e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Descrição"
                  value={s.description}
                  onChange={(e) => updateService(i, 'description', e.target.value)}
                />
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="text-brand-error hover:text-red-700 text-sm font-medium shrink-0"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addService} className="text-brand-trust text-sm font-medium hover:underline">
            + Adicionar serviço
          </button>
        </div>

        {/* Hours */}
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-3">Horários de funcionamento</h3>
          <div className="space-y-2">
            {hours.map((h, i) => (
              <div key={h.key} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-28 shrink-0">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => updateHour(i, 'enabled', e.target.checked)}
                    className="rounded border-brand-border text-brand-trust focus:ring-brand-trust"
                  />
                  <span className="text-sm text-brand-text">{h.label}</span>
                </label>
                {h.enabled && (
                  <>
                    <input
                      type="time"
                      className={`${inputClass} w-28`}
                      value={h.open}
                      onChange={(e) => updateHour(i, 'open', e.target.value)}
                    />
                    <span className="text-brand-muted text-sm">até</span>
                    <input
                      type="time"
                      className={`${inputClass} w-28`}
                      value={h.close}
                      onChange={(e) => updateHour(i, 'close', e.target.value)}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-3">Perguntas frequentes</h3>
          {faq.map((f, i) => (
            <div key={i} className="mb-3 p-3 bg-brand-surface rounded-lg space-y-2">
              <input
                className={inputClass}
                placeholder="Pergunta"
                value={f.question}
                onChange={(e) => updateFaq(i, 'question', e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Resposta"
                  value={f.answer}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                />
                {faq.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="text-brand-error hover:text-red-700 text-sm font-medium shrink-0"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addFaq} className="text-brand-trust text-sm font-medium hover:underline">
            + Adicionar pergunta
          </button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        <div className="border border-brand-border rounded-lg bg-white h-72 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 && (
            <p className="text-brand-muted text-sm text-center mt-8">
              Envie uma mensagem para testar o atendente.
            </p>
          )}
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'ml-auto bg-brand-trust text-white'
                  : 'mr-auto bg-brand-surface text-brand-text'
              }`}
            >
              {msg.content || (chatLoading && i === chatMessages.length - 1 ? '...' : '')}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="Digite uma mensagem..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            disabled={chatLoading}
          />
          <button
            type="button"
            onClick={handleSendChat}
            disabled={chatLoading || !chatInput.trim()}
            className={btnPrimary}
          >
            Enviar
          </button>
        </div>
      </div>
    );
  }

  function renderStep4() {
    const widgetCode = `<script src="https://verelus.com/widget.js" data-business="${businessId}" async></script>`;
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-muted">
          Cole o código abaixo no HTML do seu site, antes do fechamento da tag{' '}
          <code className="bg-brand-surface px-1 py-0.5 rounded text-brand-text font-mono text-xs">&lt;/body&gt;</code>.
        </p>
        <div className="relative">
          <pre className="bg-brand-surface border border-brand-border rounded-lg p-4 text-sm font-mono text-brand-text overflow-x-auto">
            {widgetCode}
          </pre>
          <button
            type="button"
            onClick={copyWidgetCode}
            className="absolute top-2 right-2 px-3 py-1 text-xs rounded bg-brand-trust text-white hover:bg-brand-primary transition"
          >
            {copied ? 'Copiado!' : 'Copiar código'}
          </button>
        </div>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-brand-surface flex items-center justify-center">
          <svg className="w-10 h-10 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-brand-text">Conectar WhatsApp</h3>
        <p className="text-sm text-brand-muted max-w-md mx-auto">
          A conexão é feita escaneando um QR code com o app do seu celular. Você pode fazer isso agora nas configurações ou deixar para depois.
        </p>
        <div className="flex justify-center pt-2">
          <a
            href="/dashboard/atalaia/settings?tab=whatsapp"
            className="inline-block bg-brand-trust text-white font-medium px-5 py-2.5 rounded-lg hover:brightness-110 transition"
          >
            Conectar agora →
          </a>
        </div>
        <p className="text-xs text-brand-muted pt-2 max-w-md mx-auto">
          Dica: recomendamos um número dedicado (não o pessoal).
        </p>
      </div>
    );
  }

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  // --- Navigation ---

  function renderNavButtons() {
    const showBack = step > 1;
    const isLast = step === 5;
    const isStep3 = step === 3;
    const isStep4 = step === 4;

    let nextLabel = 'Próximo';
    let nextAction: () => void;

    if (step === 1) nextAction = handleStep1Next;
    else if (step === 2) nextAction = handleStep2Next;
    else if (isStep3) {
      nextLabel = 'Tudo certo, próximo';
      nextAction = () => setStep(4);
    } else if (isStep4) {
      nextLabel = 'Próximo';
      nextAction = handleStep4Next;
    } else {
      nextLabel = 'Finalizar';
      nextAction = handleFinalize;
    }

    return (
      <div className="flex items-center justify-between pt-6 border-t border-brand-border">
        <div>
          {showBack && (
            <button type="button" onClick={() => setStep(step - 1)} className={btnSecondary} disabled={loading}>
              Voltar
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {(isStep4 || isLast) && !isLast && (
            <button type="button" onClick={() => setStep(step + 1)} className={btnSecondary} disabled={loading}>
              Pular
            </button>
          )}
          {isLast && (
            <button type="button" onClick={() => router.push('/dashboard/atalaia')} className={btnSecondary} disabled={loading}>
              Pular
            </button>
          )}
          <button type="button" onClick={nextAction} className={btnPrimary} disabled={loading}>
            {loading ? 'Aguarde...' : nextLabel}
          </button>
        </div>
      </div>
    );
  }

  // --- Progress bar ---

  function renderProgress() {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: 5 }, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isComplete = stepNum < step;
            return (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                    isComplete
                      ? 'bg-brand-success text-white'
                      : isActive
                        ? 'bg-brand-trust text-white'
                        : 'bg-brand-surface text-brand-muted border border-brand-border'
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < 5 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-1 transition ${
                      stepNum < step ? 'bg-brand-success' : 'bg-brand-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Main render ---

  return (
    <div className="min-h-screen bg-brand-bg flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {renderProgress()}
        <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-brand-text mb-1">{STEP_TITLES[step - 1]}</h2>
          <p className="text-sm text-brand-muted mb-6">{STEP_DESCRIPTIONS[step - 1]}</p>

          {error && (
            <div id="wizard-error" className="mb-4 p-3 rounded-lg bg-red-50 border border-brand-error text-brand-error text-sm">
              {error}
            </div>
          )}

          {stepRenderers[step - 1]()}
          {renderNavButtons()}
        </div>
      </div>
    </div>
  );
}
