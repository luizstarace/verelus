'use client';

import { useState, useEffect } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  business: { faq?: FaqItem[] };
  onSaved: () => void;
}

function fromApi(arr: FaqItem[] | undefined): FaqItem[] {
  if (!arr || arr.length === 0) return [{ question: '', answer: '' }];
  return arr.map((f) => ({ question: f.question || '', answer: f.answer || '' }));
}

export default function FaqSection({ business, onSaved }: Props) {
  const [faq, setFaq] = useState<FaqItem[]>(fromApi(business.faq));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setFaq(fromApi(business.faq));
  }, [business.faq]);

  function update(i: number, field: keyof FaqItem, value: string) {
    setFaq((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }

  function add() {
    setFaq((prev) => [...prev, { question: '', answer: '' }]);
  }

  function remove(i: number) {
    setFaq((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const valid = faq.filter((f) => f.question.trim() && f.answer.trim());
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq: valid }),
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
      <p className="text-xs text-brand-muted">
        Pergunta &amp; resposta — a IA usa isso pra responder dúvidas comuns. Quanto mais preciso, melhor.
      </p>
      {faq.map((f, i) => (
        <div key={i} className="space-y-2 p-3 bg-brand-surface rounded-lg">
          <input className={inputClass} placeholder="Pergunta (ex: Vocês atendem domingo?)" value={f.question} onChange={(e) => update(i, 'question', e.target.value)} />
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Resposta" value={f.answer} onChange={(e) => update(i, 'answer', e.target.value)} />
            {faq.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-brand-error text-xs font-medium shrink-0 hover:text-red-700">
                ×
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-brand-trust text-sm font-medium hover:underline">
        + Adicionar pergunta
      </button>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar FAQ'}
        </button>
        {savedAt && <span className="text-xs text-brand-success">Salvo ✓</span>}
        {error && <span className="text-xs text-brand-error">{error}</span>}
      </div>
    </div>
  );
}
