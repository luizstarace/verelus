'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/lib/use-toast';
import type { Profile } from '@/lib/types/proposals';

export default function ProfileClient() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Erro ao carregar perfil');
        const data = await res.json();
        const p: Profile | null = data.profile;
        if (p) {
          setDisplayName(p.display_name || '');
          setTitle(p.title || '');
          setEmail(p.email || '');
          setPhone(p.phone || '');
          setWebsite(p.website || '');
          setAvatarUrl(p.avatar_url || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          title,
          email,
          phone,
          website,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar perfil');
      }

      toast.success('Perfil salvo!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" label="Carregando perfil..." />
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50 placeholder-white/30';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Seu perfil</h1>
      <p className="text-sm text-brand-muted mb-8">
        Esses dados aparecem no cabecalho de toda proposta que voce envia.
      </p>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm text-white/70 mb-1.5">Nome de exibicao *</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome ou nome da empresa"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1.5">Titulo / Cargo</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Designer Freelancer"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Email de contato</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@exemplo.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1.5">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://seusite.com"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1.5">URL do avatar</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-brand-green text-black font-bold text-sm hover:brightness-110 transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>
    </div>
  );
}
