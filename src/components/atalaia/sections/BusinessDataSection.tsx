'use client';

import { useState, useEffect } from 'react';

interface Business {
  name?: string;
  category?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface Props {
  business: Business;
  onSaved: () => void;
}

const CATEGORIES = [
  { value: 'clinica', label: 'Clínica' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'salao', label: 'Salão de beleza' },
  { value: 'loja', label: 'Loja' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outro', label: 'Outro' },
];

export default function BusinessDataSection({ business, onSaved }: Props) {
  const [name, setName] = useState(business.name || '');
  const [category, setCategory] = useState(business.category || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(business.name || '');
    setCategory(business.category || '');
    setPhone(business.phone || '');
    setAddress(business.address || '');
  }, [business.name, business.category, business.phone, business.address]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category, phone, address }),
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
    'w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition';

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Nome do negócio</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Categoria</label>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Selecione...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Telefone</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Endereço</label>
          <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        {savedAt && <span className="text-xs text-brand-success">Salvo ✓</span>}
        {error && <span className="text-xs text-brand-error">{error}</span>}
      </div>
    </div>
  );
}
