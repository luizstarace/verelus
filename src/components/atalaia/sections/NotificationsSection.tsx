'use client';

import { useState, useEffect } from 'react';

interface Props {
  business: {
    owner_whatsapp?: string | null;
    owner_notify_channel?: 'email' | 'whatsapp' | 'both' | null;
  };
  onSaved: () => void;
}

export default function NotificationsSection({ business, onSaved }: Props) {
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'both'>(
    (business.owner_notify_channel as 'email' | 'whatsapp' | 'both') || 'email'
  );
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(business.owner_whatsapp || '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setChannel((business.owner_notify_channel as 'email' | 'whatsapp' | 'both') || 'email');
    setOwnerWhatsapp(business.owner_whatsapp || '');
  }, [business.owner_notify_channel, business.owner_whatsapp]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/atalaia/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_notify_channel: channel,
          owner_whatsapp: ownerWhatsapp,
        }),
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
        Quando a IA precisar transferir uma conversa pra você, te avisamos por aqui:
      </p>
      <div>
        <label className="block text-xs font-medium text-brand-muted mb-1">Canal</label>
        <select
          className={`${inputClass} max-w-xs`}
          value={channel}
          onChange={(e) => setChannel(e.target.value as 'email' | 'whatsapp' | 'both')}
        >
          <option value="email">Apenas email</option>
          <option value="whatsapp">Apenas WhatsApp</option>
          <option value="both">Email e WhatsApp</option>
        </select>
      </div>
      {(channel === 'whatsapp' || channel === 'both') && (
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">
            Seu WhatsApp pessoal (recebe alertas de transferência)
          </label>
          <input
            className={`${inputClass} max-w-xs`}
            value={ownerWhatsapp}
            onChange={(e) => setOwnerWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
      )}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-trust text-white text-sm font-medium hover:bg-brand-primary transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar notificações'}
        </button>
        {savedAt && <span className="text-xs text-brand-success">Salvo ✓</span>}
        {error && <span className="text-xs text-brand-error">{error}</span>}
      </div>
    </div>
  );
}
