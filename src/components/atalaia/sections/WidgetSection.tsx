'use client';

import { useState, useEffect } from 'react';

interface Props {
  business: {
    id: string;
    widget_config?: { color?: string; position?: 'bottom-right' | 'bottom-left'; greeting?: string };
  };
  onSaved: () => void;
}

export default function WidgetSection({ business, onSaved }: Props) {
  const [color, setColor] = useState(business.widget_config?.color || '#1e3a5f');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>(
    business.widget_config?.position || 'bottom-right'
  );
  const [greeting, setGreeting] = useState(business.widget_config?.greeting || 'Olá! Como posso ajudar?');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setColor(business.widget_config?.color || '#1e3a5f');
    setPosition(business.widget_config?.position || 'bottom-right');
    setGreeting(business.widget_config?.greeting || 'Olá! Como posso ajudar?');
  }, [business.widget_config?.color, business.widget_config?.position, business.widget_config?.greeting]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widget_config: { color, position, greeting } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao salvar');
      }
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSaving(false);
    }
  }

  async function copyCode() {
    const code = `<script src="https://verelus.com/widget.js" data-business="${business.id}" async></script>`;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition text-sm';

  const widgetCode = `<script src="https://verelus.com/widget.js" data-business="${business.id}" async></script>`;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Cor principal</label>
          <input type="color" className="w-full h-10 rounded border border-brand-border" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Posição na tela</label>
          <select
            className={inputClass}
            value={position}
            onChange={(e) => setPosition(e.target.value as 'bottom-right' | 'bottom-left')}
          >
            <option value="bottom-right">Canto inferior direito</option>
            <option value="bottom-left">Canto inferior esquerdo</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Saudação inicial</label>
          <input className={inputClass} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar widget'}
        </button>
        {savedAt && <span className="text-xs text-brand-success">Salvo ✓</span>}
        {error && <span className="text-xs text-brand-error">{error}</span>}
      </div>
      <div>
        <label className="block text-xs font-medium text-brand-muted mb-1">
          Código pra colar no seu site (antes de <code className="text-[11px]">&lt;/body&gt;</code>)
        </label>
        <div className="relative">
          <pre className="bg-brand-surface border border-brand-border rounded-lg p-3 text-xs font-mono text-brand-text overflow-x-auto">
            {widgetCode}
          </pre>
          <button
            type="button"
            onClick={copyCode}
            className="absolute top-1.5 right-1.5 px-2 py-0.5 text-[11px] rounded bg-brand-trust text-white hover:bg-brand-primary transition"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
}
