'use client';

import { useState, useEffect } from 'react';

interface Service {
  name: string;
  price_cents: number;
  duration_min: number;
  description: string;
}

interface Faq {
  question: string;
  answer: string;
}

interface WidgetConfig {
  color?: string;
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;
}

interface Business {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  services: Service[];
  hours: Record<string, { open: string; close: string }>;
  faq: Faq[];
  widget_config: WidgetConfig;
  whatsapp_number: string | null;
  owner_whatsapp: string | null;
  owner_notify_channel: 'email' | 'whatsapp' | 'both';
}

const TABS = [
  { id: 'business', label: 'Dados do negocio' },
  { id: 'widget', label: 'Widget' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'notifications', label: 'Notificacoes' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const DAYS = [
  { key: 'mon', label: 'Seg' },
  { key: 'tue', label: 'Ter' },
  { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' },
  { key: 'fri', label: 'Sex' },
  { key: 'sat', label: 'Sab' },
  { key: 'sun', label: 'Dom' },
];

export default function SettingsView() {
  const [tab, setTab] = useState<TabId>('business');
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Business form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>({});
  const [faq, setFaq] = useState<Faq[]>([]);

  // Widget state
  const [widgetColor, setWidgetColor] = useState('#2563eb');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [widgetGreeting, setWidgetGreeting] = useState('Ola! Como posso ajudar?');

  // Notifications state
  const [notifyChannel, setNotifyChannel] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('');

  useEffect(() => {
    fetchBusiness();
  }, []);

  async function fetchBusiness() {
    try {
      const res = await fetch('/api/attendly/business');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const b = data.business as Business | null;
      if (b) {
        setBusiness(b);
        setName(b.name || '');
        setCategory(b.category || '');
        setPhone(b.phone || '');
        setAddress(b.address || '');
        setServices(b.services || []);
        setHours(b.hours || {});
        setFaq(b.faq || []);
        setWidgetColor(b.widget_config?.color || '#2563eb');
        setWidgetPosition(b.widget_config?.position || 'bottom-right');
        setWidgetGreeting(b.widget_config?.greeting || 'Ola! Como posso ajudar?');
        setNotifyChannel(b.owner_notify_channel || 'email');
        setOwnerWhatsapp(b.owner_whatsapp || '');
      }
    } catch (err) {
      console.error('Error fetching business:', err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function saveBusiness(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch('/api/attendly/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setBusiness(data.business);
      showToast('Salvo com sucesso!');
    } catch (err) {
      console.error('Error saving:', err);
      showToast('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBusiness() {
    await saveBusiness({ name, category, phone, address, services, hours, faq });
  }

  async function handleSaveWidget() {
    await saveBusiness({ widget_config: { color: widgetColor, position: widgetPosition, greeting: widgetGreeting } });
  }

  async function handleSaveNotifications() {
    await saveBusiness({ owner_notify_channel: notifyChannel, owner_whatsapp: ownerWhatsapp });
  }

  // Service helpers
  function addService() {
    setServices([...services, { name: '', price_cents: 0, duration_min: 30, description: '' }]);
  }
  function removeService(idx: number) {
    setServices(services.filter((_, i) => i !== idx));
  }
  function updateService(idx: number, field: keyof Service, value: string | number) {
    setServices(services.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  // FAQ helpers
  function addFaq() {
    setFaq([...faq, { question: '', answer: '' }]);
  }
  function removeFaq(idx: number) {
    setFaq(faq.filter((_, i) => i !== idx));
  }
  function updateFaq(idx: number, field: keyof Faq, value: string) {
    setFaq(faq.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  }

  // Hours helpers
  function toggleDay(dayKey: string) {
    if (hours[dayKey]) {
      const next = { ...hours };
      delete next[dayKey];
      setHours(next);
    } else {
      setHours({ ...hours, [dayKey]: { open: '09:00', close: '18:00' } });
    }
  }
  function updateHour(dayKey: string, field: 'open' | 'close', value: string) {
    setHours({ ...hours, [dayKey]: { ...hours[dayKey], [field]: value } });
  }

  if (loading) {
    return <div className="p-6 text-brand-muted">Carregando...</div>;
  }

  if (!business) {
    return <div className="p-6 text-brand-muted">Nenhum negocio configurado. Complete o setup primeiro.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-brand-success text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-pulse">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold text-brand-text mb-6">Configuracoes</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-border mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Dados do negocio */}
      {tab === 'business' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Categoria</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white"
                placeholder="Ex: Barbearia, Clinica, Restaurante"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Telefone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Endereco</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white"
              />
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-brand-text">Servicos</h3>
              <button onClick={addService} className="text-sm text-brand-primary hover:underline">+ Adicionar</button>
            </div>
            {services.length === 0 && <p className="text-sm text-brand-muted">Nenhum servico cadastrado.</p>}
            {services.map((s, idx) => (
              <div key={idx} className="border border-brand-border rounded-lg p-3 mb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    value={s.name}
                    onChange={(e) => updateService(idx, 'name', e.target.value)}
                    placeholder="Nome do servico"
                    className="flex-1 border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white"
                  />
                  <button onClick={() => removeService(idx)} className="ml-2 text-brand-error text-sm hover:underline">Remover</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={s.price_cents}
                    onChange={(e) => updateService(idx, 'price_cents', Number(e.target.value))}
                    placeholder="Preco (centavos)"
                    className="border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white"
                  />
                  <input
                    type="number"
                    value={s.duration_min}
                    onChange={(e) => updateService(idx, 'duration_min', Number(e.target.value))}
                    placeholder="Duracao (min)"
                    className="border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white"
                  />
                </div>
                <input
                  value={s.description}
                  onChange={(e) => updateService(idx, 'description', e.target.value)}
                  placeholder="Descricao"
                  className="w-full border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white"
                />
              </div>
            ))}
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-sm font-medium text-brand-text mb-2">Horario de funcionamento</h3>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div key={day.key} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-16">
                    <input
                      type="checkbox"
                      checked={!!hours[day.key]}
                      onChange={() => toggleDay(day.key)}
                      className="rounded border-brand-border"
                    />
                    <span className="text-sm text-brand-text">{day.label}</span>
                  </label>
                  {hours[day.key] && (
                    <>
                      <input
                        type="time"
                        value={hours[day.key].open}
                        onChange={(e) => updateHour(day.key, 'open', e.target.value)}
                        className="border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white"
                      />
                      <span className="text-brand-muted text-sm">ate</span>
                      <input
                        type="time"
                        value={hours[day.key].close}
                        onChange={(e) => updateHour(day.key, 'close', e.target.value)}
                        className="border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-brand-text">Perguntas frequentes</h3>
              <button onClick={addFaq} className="text-sm text-brand-primary hover:underline">+ Adicionar</button>
            </div>
            {faq.length === 0 && <p className="text-sm text-brand-muted">Nenhuma FAQ cadastrada.</p>}
            {faq.map((f, idx) => (
              <div key={idx} className="border border-brand-border rounded-lg p-3 mb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    value={f.question}
                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                    placeholder="Pergunta"
                    className="flex-1 border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white"
                  />
                  <button onClick={() => removeFaq(idx)} className="ml-2 text-brand-error text-sm hover:underline">Remover</button>
                </div>
                <textarea
                  value={f.answer}
                  onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                  placeholder="Resposta"
                  rows={2}
                  className="w-full border border-brand-border rounded px-2 py-1 text-sm text-brand-text bg-white resize-y"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveBusiness}
            disabled={saving}
            className="bg-brand-cta text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Tab: Widget */}
      {tab === 'widget' && (
        <div className="space-y-6">
          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-brand-text mb-2">Preview do widget</h3>
            <div className="relative bg-brand-bg border border-brand-border rounded-lg p-6 h-48">
              <div
                className={`absolute bottom-4 ${widgetPosition === 'bottom-right' ? 'right-4' : 'left-4'}`}
              >
                <div className="bg-white border border-brand-border rounded-lg shadow-lg p-3 mb-2 max-w-[200px]">
                  <p className="text-xs text-brand-text">{widgetGreeting}</p>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                  style={{ backgroundColor: widgetColor }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Cor do widget</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={widgetColor}
                  onChange={(e) => setWidgetColor(e.target.value)}
                  className="w-10 h-10 border border-brand-border rounded cursor-pointer"
                />
                <input
                  value={widgetColor}
                  onChange={(e) => setWidgetColor(e.target.value)}
                  className="flex-1 border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Posicao</label>
              <select
                value={widgetPosition}
                onChange={(e) => setWidgetPosition(e.target.value as 'bottom-right' | 'bottom-left')}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white"
              >
                <option value="bottom-right">Inferior direito</option>
                <option value="bottom-left">Inferior esquerdo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Mensagem de saudacao</label>
            <input
              value={widgetGreeting}
              onChange={(e) => setWidgetGreeting(e.target.value)}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white"
            />
          </div>

          {/* Code snippet */}
          <div>
            <h3 className="text-sm font-medium text-brand-text mb-2">Codigo de instalacao</h3>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono relative">
              <code>{`<script src="https://verelus.com/widget.js" data-business="${business.id}" async></script>`}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<script src="https://verelus.com/widget.js" data-business="${business.id}" async></script>`);
                  showToast('Codigo copiado!');
                }}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded transition"
              >
                Copiar codigo
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveWidget}
            disabled={saving}
            className="bg-brand-cta text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Tab: WhatsApp */}
      {tab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`w-3 h-3 rounded-full ${business.whatsapp_number ? 'bg-brand-success' : 'bg-brand-error'}`}
              />
              <span className="text-sm font-medium text-brand-text">
                {business.whatsapp_number ? 'Conectado' : 'Desconectado'}
              </span>
              {business.whatsapp_number && (
                <span className="text-sm text-brand-muted">({business.whatsapp_number})</span>
              )}
            </div>
            <button
              onClick={() => showToast('Integracao WhatsApp em breve!')}
              className="bg-brand-cta text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              {business.whatsapp_number ? 'Reconectar WhatsApp' : 'Conectar WhatsApp'}
            </button>
            <p className="text-xs text-brand-muted mt-3">
              A integracao com WhatsApp Business API sera disponibilizada em breve.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Notificacoes */}
      {tab === 'notifications' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Canal de notificacao</label>
            <select
              value={notifyChannel}
              onChange={(e) => setNotifyChannel(e.target.value as 'email' | 'whatsapp' | 'both')}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white max-w-sm"
            >
              <option value="email">E-mail</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="both">Ambos</option>
            </select>
          </div>

          {(notifyChannel === 'whatsapp' || notifyChannel === 'both') && (
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">WhatsApp do proprietario</label>
              <input
                value={ownerWhatsapp}
                onChange={(e) => setOwnerWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text bg-white max-w-sm"
              />
              <p className="text-xs text-brand-muted mt-1">
                Numero para receber notificacoes de conversas que precisam de atencao humana.
              </p>
            </div>
          )}

          <button
            onClick={handleSaveNotifications}
            disabled={saving}
            className="bg-brand-cta text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}
    </div>
  );
}
