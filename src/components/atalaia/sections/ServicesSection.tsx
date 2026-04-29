'use client';

import { useState, useEffect } from 'react';

interface ServiceItem {
  name: string;
  price_cents?: number;
  duration_min?: number;
  description?: string;
}

interface Props {
  business: { services?: ServiceItem[] };
  onSaved: () => void;
}

interface ServiceForm {
  name: string;
  price: string;
  duration: string;
  description: string;
}

function fromApi(arr: ServiceItem[] | undefined): ServiceForm[] {
  if (!arr || arr.length === 0) return [{ name: '', price: '', duration: '', description: '' }];
  return arr.map((s) => ({
    name: s.name || '',
    price: s.price_cents ? (s.price_cents / 100).toFixed(2) : '',
    duration: s.duration_min ? String(s.duration_min) : '',
    description: s.description || '',
  }));
}

export default function ServicesSection({ business, onSaved }: Props) {
  const [services, setServices] = useState<ServiceForm[]>(fromApi(business.services));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setServices(fromApi(business.services));
  }, [business.services]);

  function update(i: number, field: keyof ServiceForm, value: string) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function add() {
    setServices((prev) => [...prev, { name: '', price: '', duration: '', description: '' }]);
  }

  function remove(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const valid = services
        .filter((s) => s.name.trim())
        .map((s) => ({
          name: s.name.trim(),
          price_cents: Math.round(parseFloat(s.price || '0') * 100),
          duration_min: parseInt(s.duration || '0', 10) || 0,
          description: s.description,
        }));
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: valid }),
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

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition text-sm';

  return (
    <div className="space-y-3">
      {services.map((s, i) => (
        <div key={i} className="grid sm:grid-cols-4 gap-2 p-3 bg-brand-surface rounded-lg">
          <input className={inputClass} placeholder="Nome" value={s.name} onChange={(e) => update(i, 'name', e.target.value)} />
          <input className={inputClass} placeholder="Preço (R$)" value={s.price} onChange={(e) => update(i, 'price', e.target.value)} />
          <input className={inputClass} placeholder="Duração (min)" value={s.duration} onChange={(e) => update(i, 'duration', e.target.value)} />
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Descrição" value={s.description} onChange={(e) => update(i, 'description', e.target.value)} />
            {services.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-brand-error text-xs font-medium shrink-0 hover:text-red-700">
                ×
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-brand-trust text-sm font-medium hover:underline">
        + Adicionar serviço
      </button>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar serviços'}
        </button>
        {savedAt && <span className="text-xs text-brand-success">Salvo ✓</span>}
        {error && <span className="text-xs text-brand-error">{error}</span>}
      </div>
    </div>
  );
}
