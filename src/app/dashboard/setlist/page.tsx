'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { UpgradeGate } from '@/lib/upgrade-gate';
import { useArtistProfile } from '@/lib/use-artist-profile';
import { exportAsText, exportAsPDF } from '@/lib/export-content';
import { useAiLimit } from '@/lib/use-ai-limit';
import { UpgradeModal } from '@/lib/upgrade-modal';

const MUSIC_NOTE_ICON = String.fromCodePoint(0x1F3B5);

interface Setlist {
  id: string;
  name: string;
  songs: string[];
  duration_minutes: number;
  event_type: string;
  created_at: string;
}

const EVENT_TYPES = ['Show', 'Festival', 'Acústico', 'Live Stream', 'Ensaio', 'Evento Corporativo'];

function SetlistContent() {
  const { profile: artistProfile } = useArtistProfile();
  const { tryGenerate, showUpgrade, closeUpgrade, remaining } = useAiLimit();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [generating, setGenerating] = useState(false);
  const [eventType, setEventType] = useState('Show');
  const [duration, setDuration] = useState('60');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSetlists();
      setLoading(false);
  }, []);

  async function loadSetlists() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('setlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSetlists(data);
  }

  async function generateSetlist() {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'setlist',
          context: { eventType, duration: parseInt(duration), artistProfile }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar setlist.');
    } catch {
      setGeneratedContent('Erro ao gerar setlist. Tente novamente.');
    }
    setGenerating(false);
  }

  async function saveSetlist() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !generatedContent) return;
    await supabase.from('setlists').insert({
      user_id: user.id,
      name: `${eventType} - ${duration}min`,
      songs: generatedContent.split('\n').filter(l => l.trim()),
      duration_minutes: parseInt(duration),
      event_type: eventType
    });
    setGeneratedContent('');
    loadSetlists();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent || selectedSetlist?.songs?.join('\n') || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{MUSIC_NOTE_ICON}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Setlists</h1>
        </div>

        {/* Generator */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold mb-4">Gerar Setlist com IA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Tipo de Evento</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-brand-surface">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Duração (minutos)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
              />
            </div>
          </div>
          <button
            onClick={() => tryGenerate(generateSetlist)}
            disabled={generating}
            className="px-6 py-3 bg-brand-green text-black font-bold rounded-lg hover:bg-brand-green/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Gerando...' : 'Gerar Setlist'}
          </button>
          {remaining !== null && <span className="text-xs text-white/30 ml-3">{remaining} gerações restantes</span>}
        </div>

        {/* Saved items list */}
        {setlists.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-white/40 uppercase tracking-wider mb-3">Salvos</h3>
            <div className="flex flex-wrap gap-2">
              {setlists.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSetlist(s); setGeneratedContent(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    selectedSetlist?.id === s.id
                      ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Display */}
        {(generatedContent || selectedSetlist) && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">
                {generatedContent ? `${eventType} - ${duration}min` : selectedSetlist?.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => exportAsText(generatedContent || selectedSetlist?.songs?.join('\n') || '', selectedSetlist?.name || 'setlist')}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  TXT
                </button>
                <button
                  onClick={() => exportAsPDF(generatedContent || selectedSetlist?.songs?.join('\n') || '', selectedSetlist?.name || 'Setlist')}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  PDF
                </button>
                {generatedContent && (
                  <button
                    onClick={saveSetlist}
                    className="px-4 py-2 bg-brand-green/20 text-brand-green rounded-lg text-sm hover:bg-brand-green/30 transition"
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
              {generatedContent || selectedSetlist?.songs?.join('\n')}
            </div>
          </div>
        )}
      </div>
      <UpgradeModal open={showUpgrade} onClose={closeUpgrade} feature="Geração com IA" />
    </div>
  );
}

export default function SetlistPage() {
  return (
    <UpgradeGate module="setlist">
      <SetlistContent />
    </UpgradeGate>
  );
}
