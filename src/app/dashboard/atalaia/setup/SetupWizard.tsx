'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trackMeta } from '@/lib/analytics/meta';
import TrainerChat from '@/components/atalaia/TrainerChat';
import WhatsAppBanWarning from '@/components/atalaia/WhatsAppBanWarning';

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

type SectionId = 1 | 2 | 3 | 4 | 5;

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

const SECTION_TITLES = [
  'Dados do negócio',
  'Serviços, horários e FAQ',
  'Treinar a IA',
  'Conectar WhatsApp',
  'Instalar widget no site',
];

const REQUIRED_SECTIONS: SectionId[] = [1, 2, 3];

function hoursArrayToRecord(arr: HoursEntry[]): Record<string, { open: string; close: string }> {
  const result: Record<string, { open: string; close: string }> = {};
  for (const h of arr) {
    if (h.enabled && h.open && h.close) {
      result[h.key] = { open: h.open, close: h.close };
    }
  }
  return result;
}

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
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<SectionId, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  // Section 1
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Section 2
  const [services, setServices] = useState<Service[]>([
    { name: '', price: '', duration: '', description: '' },
  ]);
  const [hours, setHours] = useState<HoursEntry[]>(defaultHours());
  const [faq, setFaq] = useState<FaqEntry[]>([{ question: '', answer: '' }]);

  // Section 5
  const [copied, setCopied] = useState(false);

  // Section refs for scroll-on-save
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  function setSectionRef(idx: number) {
    return (el: HTMLDivElement | null) => {
      sectionRefs.current[idx] = el;
    };
  }

  function scrollToSection(idx: number) {
    setTimeout(() => {
      sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  function markComplete(id: SectionId) {
    setCompleted((prev) => ({ ...prev, [id]: true }));
  }

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

  // --- Section actions ---

  async function saveSection1() {
    if (!name.trim()) {
      setError('Nome do negócio é obrigatório.');
      return;
    }
    const payload = { name: name.trim(), category, phone, address };
    let data;
    if (businessId) {
      data = await apiCall('/api/atalaia/business', 'PATCH', payload);
    } else {
      data = await apiCall('/api/atalaia/setup', 'POST', payload);
    }
    if (data) {
      setBusinessId(data.business?.id || data.id || businessId);
      markComplete(1);
      scrollToSection(1);
    }
  }

  async function saveSection2() {
    if (!businessId) {
      setError('Salve a seção 1 primeiro.');
      return;
    }
    const validServices = services
      .filter((s) => s.name.trim())
      .map((s) => ({
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
    });
    if (data) {
      markComplete(2);
      scrollToSection(2);
    }
  }

  function confirmSection3() {
    markComplete(3);
    scrollToSection(3);
  }

  async function handleActivate() {
    if (activating) return;
    setActivating(true);
    const data = await apiCall('/api/atalaia/business', 'PATCH', {
      status: 'active',
      onboarding_step: null,
    });
    setActivating(false);
    if (data) {
      trackMeta('StartTrial', {
        value: 0,
        currency: 'BRL',
        content_name: 'atalaia_trial',
      });
      router.push('/dashboard/atalaia');
    } else {
      setError((prev) => prev || 'Não conseguimos ativar o atendente. Tente novamente em alguns segundos.');
      if (typeof document !== 'undefined') {
        document.getElementById('wizard-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  async function copyWidgetCode() {
    const code = `<script src="https://verelus.com/widget.js" data-business="${businessId}" async></script>`;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    markComplete(5);
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

  // --- Shared classes ---

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition disabled:bg-brand-surface disabled:cursor-not-allowed';
  const btnPrimary =
    'px-6 py-2.5 rounded-lg bg-brand-trust text-white font-medium hover:bg-brand-primary transition disabled:opacity-50 disabled:cursor-not-allowed';
  const btnSecondary =
    'px-6 py-2.5 rounded-lg border border-brand-border text-brand-text font-medium hover:bg-brand-surface transition disabled:opacity-50';

  // --- Section renderers ---

  function renderSection1() {
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
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
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
        <div className="flex justify-end pt-2">
          <button type="button" onClick={saveSection1} disabled={loading} className={btnPrimary}>
            {loading ? 'Salvando...' : completed[1] ? 'Atualizar' : 'Salvar e continuar'}
          </button>
        </div>
      </div>
    );
  }

  function renderSection2() {
    const disabled = !businessId;
    return (
      <div className="space-y-6">
        {disabled && (
          <p className="text-xs text-brand-muted">
            Salve a seção 1 primeiro para liberar esta seção.
          </p>
        )}
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
                disabled={disabled}
              />
              <input
                className={inputClass}
                placeholder="Preço (R$)"
                value={s.price}
                onChange={(e) => updateService(i, 'price', e.target.value)}
                disabled={disabled}
              />
              <input
                className={inputClass}
                placeholder="Duração (min)"
                value={s.duration}
                onChange={(e) => updateService(i, 'duration', e.target.value)}
                disabled={disabled}
              />
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Descrição"
                  value={s.description}
                  onChange={(e) => updateService(i, 'description', e.target.value)}
                  disabled={disabled}
                />
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="text-brand-error hover:text-red-700 text-sm font-medium shrink-0"
                    disabled={disabled}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addService}
            className="text-brand-trust text-sm font-medium hover:underline disabled:opacity-50"
            disabled={disabled}
          >
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
                    disabled={disabled}
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
                      disabled={disabled}
                    />
                    <span className="text-brand-muted text-sm">até</span>
                    <input
                      type="time"
                      className={`${inputClass} w-28`}
                      value={h.close}
                      onChange={(e) => updateHour(i, 'close', e.target.value)}
                      disabled={disabled}
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
                disabled={disabled}
              />
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Resposta"
                  value={f.answer}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                  disabled={disabled}
                />
                {faq.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="text-brand-error hover:text-red-700 text-sm font-medium shrink-0"
                    disabled={disabled}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFaq}
            className="text-brand-trust text-sm font-medium hover:underline disabled:opacity-50"
            disabled={disabled}
          >
            + Adicionar pergunta
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button type="button" onClick={saveSection2} disabled={loading || disabled} className={btnPrimary}>
            {loading ? 'Salvando...' : completed[2] ? 'Atualizar' : 'Salvar e continuar'}
          </button>
        </div>
      </div>
    );
  }

  function renderSection3() {
    if (!businessId) {
      return (
        <p className="text-sm text-brand-muted">
          Salve a seção 1 primeiro para começar a treinar a IA.
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-muted">
          Mande mensagens de teste para ver como a IA responde. Nada daqui é cobrado nem aparece
          no inbox real. Se a resposta vier estranha, ajuste a seção 2 (FAQ, serviços) e volte
          para testar de novo.
        </p>
        <TrainerChat businessId={businessId} variant="whatsapp" height="h-80" />
        <div className="flex justify-end pt-2">
          <button type="button" onClick={confirmSection3} className={btnPrimary}>
            {completed[3] ? 'Marcado como pronto ✓' : 'Pronto, vi a IA responder'}
          </button>
        </div>
      </div>
    );
  }

  function renderSection4() {
    return (
      <div className="space-y-4">
        <WhatsAppBanWarning />
        <p className="text-sm text-brand-muted">
          A conexão é feita escaneando um QR code com o app do WhatsApp do número do negócio.
          Você também pode ativar o atendente sem WhatsApp e conectar depois.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/dashboard/atalaia/settings?tab=whatsapp"
            className="inline-block bg-brand-trust text-white font-medium px-5 py-2.5 rounded-lg hover:brightness-110 transition text-center"
          >
            Conectar agora →
          </a>
          <button type="button" onClick={() => markComplete(4)} className={btnSecondary}>
            {completed[4] ? 'Marcado como pulado ✓' : 'Pular por enquanto'}
          </button>
        </div>
      </div>
    );
  }

  function renderSection5() {
    if (!businessId) {
      return <p className="text-sm text-brand-muted">Salve a seção 1 primeiro.</p>;
    }
    const widgetCode = `<script src="https://verelus.com/widget.js" data-business="${businessId}" async></script>`;
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-muted">
          Cole este código no HTML do seu site, antes do fechamento de{' '}
          <code className="bg-brand-surface px-1 py-0.5 rounded text-brand-text font-mono text-xs">
            &lt;/body&gt;
          </code>
          . O widget abre uma janelinha de chat para visitantes.
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

  // --- Sidebar ---

  const canActivate = completed[1] && completed[2] && completed[3];

  function ProgressSidebar() {
    return (
      <aside className="hidden lg:block sticky top-12 self-start w-60 shrink-0">
        <p className="text-xs text-brand-muted uppercase font-semibold mb-3">Progresso</p>
        <ol className="space-y-1">
          {SECTION_TITLES.map((title, i) => {
            const id = (i + 1) as SectionId;
            const done = completed[id];
            const required = REQUIRED_SECTIONS.includes(id);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center gap-2 text-left w-full hover:bg-brand-surface px-2 py-1.5 rounded transition"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      done
                        ? 'bg-brand-success text-white'
                        : 'bg-brand-surface text-brand-muted border border-brand-border'
                    }`}
                  >
                    {done ? '✓' : id}
                  </span>
                  <span className="text-xs text-brand-text leading-tight">
                    {title}
                    {!required && <span className="text-brand-muted"> · opcional</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 pt-4 border-t border-brand-border space-y-2">
          <button
            type="button"
            onClick={handleActivate}
            disabled={!canActivate || activating}
            className="w-full px-3 py-2.5 rounded-lg bg-brand-cta text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating ? 'Ativando...' : 'Ativar atendente'}
          </button>
          {!canActivate && (
            <p className="text-xs text-brand-muted">
              Complete as seções 1, 2 e 3 para ativar.
            </p>
          )}
        </div>
      </aside>
    );
  }

  // --- Main render ---

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          <strong>Trial gratuito:</strong> você está testando o plano <strong>Starter</strong> por
          7 dias — 500 mensagens incluídas, sem cartão obrigatório. Depois, escolha seu plano.
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-1">Configurar Atalaia</h1>
          <p className="text-sm text-brand-muted">
            Preencha as 3 seções obrigatórias para ativar seu atendente. WhatsApp e widget são opcionais.
          </p>
        </div>

        {error && (
          <div
            id="wizard-error"
            className="mb-6 p-3 rounded-lg bg-red-50 border border-brand-error text-brand-error text-sm"
          >
            {error}
          </div>
        )}

        <div className="flex gap-8">
          <ProgressSidebar />

          <div className="flex-1 space-y-6 min-w-0">
            {SECTION_TITLES.map((title, i) => {
              const id = (i + 1) as SectionId;
              const done = completed[id];
              const required = REQUIRED_SECTIONS.includes(id);
              const renderers = [renderSection1, renderSection2, renderSection3, renderSection4, renderSection5];
              return (
                <div
                  key={i}
                  ref={setSectionRef(i)}
                  className="bg-white rounded-xl shadow-sm border border-brand-border p-6 sm:p-8 scroll-mt-6"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                        done ? 'bg-brand-success text-white' : 'bg-brand-trust text-white'
                      }`}
                    >
                      {done ? '✓' : id}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-brand-text">{title}</h3>
                      {!required && (
                        <span className="text-xs text-brand-muted">Opcional — pode ser feito depois</span>
                      )}
                    </div>
                  </div>
                  {renderers[i]()}
                </div>
              );
            })}

            {/* Footer CTA (mobile + desktop fallback) */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/dashboard/atalaia')}
                className={btnSecondary}
              >
                Salvar e sair
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={!canActivate || activating}
                className={`${btnPrimary} sm:min-w-[200px]`}
              >
                {activating ? 'Ativando...' : 'Ativar atendente'}
              </button>
            </div>
            {!canActivate && (
              <p className="text-xs text-brand-muted text-center sm:text-right">
                Complete as seções 1, 2 e 3 para ativar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
