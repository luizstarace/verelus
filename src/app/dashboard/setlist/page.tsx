'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

const MUSIC_NOTE_ICON = String.fromCodePoint(0x1F3B5);

interface Setlist {
  id: string;
  name: string;
  songs: string[];
  duration_minutes: number;
  event_type: string;
  created_at: string;
}

const EVENT_TYPES = ['Show', 'Festival', 'Acýastico', 'Live Stream', 'Ensaio', 'Evento Corporativo'];

export default function SetlistPage() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [generating, setGenerating] = useState(false);
  const [eventType, setEventType] = useState('Show');
  const [duration, setDuration] = useState('60');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSetlists();
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
          context: { eventType, duration: parseInt(duration) }
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

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-[#0d1018] border-r border-white/10 p-4">
          <a href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <span>&lt;-</span> Voltar ao Dashboard
          </a>
          <h2 className="text-lg font-bold mb-4 font-display">Setlists</h2>
          <div className="space-y-2">
            {setlists.length === 0 && (
              <p className="text-white/40 text-sm">Nenhuma setlist ainda.</p>
            )}
            {setlists.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedSetlist(s); setGeneratedContent(''); }}
                className={`w-full text-left p-3 rounded-lg text-sm transition ${
                  selectedSetlist?.id === s.id
                    ? 'bg-[#00f5a0]/20 text-[#00f5a0]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <div className="font-medium truncate">{s.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/40">{s.event_type}</span>
                  <span className="text-xs text-white/40">{s.duration_minutes}min</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">{MUSIC_NOTE_ICON}</span>
              <h1 className="text-3xl font-bold font-display">Setlists</h1>
            </div>

            {/* Generator */}
            <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
              <h3 className="text-lg font-semibold mb-4">Gerar Setlist com IA</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Tipo de Evento</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f5a0]/50"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#12151e]">{t}</option>
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50"
                  />
                </div>
              </div>
              <button
                onClick={generateSetlist}
                disabled={generating}
                className="px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Gerando...' : 'Gerar Setlist'}
              </button>
            </div>

            {/* Content Display */}
            {(generatedContent || selectedSetlist) && (
              <div className="bg-[#12151e] rounded-xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {generatedContent ? `${eventType} - ${duration}min` : selectedSetlist?.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                    {generatedContent && (
                      <button
                        onClick={saveSetlist}
                        className="px-4 py-2 bg-[#00f5a0]/20 text-[#00f5a0] rounded-lg text-sm hover:bg-[#00f5a0]/30 transition"
                      >
                        Salvar
                      </button>
                    )}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
                  {generatedContent || selectedSetlist?.songs/.join('\n')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
