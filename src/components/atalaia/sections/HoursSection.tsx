'use client';

import { useState, useEffect } from 'react';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface HoursEntry {
  key: DayKey;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
}

interface Props {
  business: { hours?: Record<string, { open?: string; close?: string }> | null };
  onSaved: () => void;
}

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

function fromApi(record: Record<string, { open?: string; close?: string }> | null | undefined): HoursEntry[] {
  return DAYS.map((d, i) => {
    const entry = record?.[d.key];
    if (entry && entry.open && entry.close) {
      return { key: d.key, label: d.label, enabled: true, open: entry.open, close: entry.close };
    }
    return { key: d.key, label: d.label, enabled: i < 5, open: '08:00', close: '18:00' };
  });
}

function toApi(arr: HoursEntry[]): Record<string, { open: string; close: string }> {
  const out: Record<string, { open: string; close: string }> = {};
  for (const h of arr) {
    if (h.enabled && h.open && h.close) {
      out[h.key] = { open: h.open, close: h.close };
    }
  }
  return out;
}

export default function HoursSection({ business, onSaved }: Props) {
  const [hours, setHours] = useState<HoursEntry[]>(fromApi(business.hours));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setHours(fromApi(business.hours));
  }, [business.hours]);

  function update(i: number, field: keyof HoursEntry, value: string | boolean) {
    setHours((prev) => prev.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: toApi(hours) }),
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
    'px-2 py-1.5 rounded border border-brand-border bg-white text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-trust focus:border-transparent transition';

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {hours.map((h, i) => (
          <div key={h.key} className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 w-28 shrink-0">
              <input
                type="checkbox"
                checked={h.enabled}
                onChange={(e) => update(i, 'enabled', e.target.checked)}
                className="rounded border-brand-border text-brand-trust focus:ring-brand-trust"
              />
              <span className="text-sm text-brand-text">{h.label}</span>
            </label>
            {h.enabled && (
              <>
                <input type="time" className={`${inputClass} w-24`} value={h.open} onChange={(e) => update(i, 'open', e.target.value)} />
                <span className="text-brand-muted text-xs">até</span>
                <input type="time" className={`${inputClass} w-24`} value={h.close} onChange={(e) => update(i, 'close', e.target.value)} />
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar horários'}
        </button>
        {savedAt && <span className="text-xs text-brand-success">Salvo ✓</span>}
        {error && <span className="text-xs text-brand-error">{error}</span>}
      </div>
    </div>
  );
}
