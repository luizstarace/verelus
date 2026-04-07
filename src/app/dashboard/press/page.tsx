'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

const NEWSPAPER_ICON = String.fromCodePoint(0x1F4F0);

interface PressRelease {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function PressPage() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<PressRelease | null>(null);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleases();
    loadArtist();
      setLoading(false);
  }, []);

  async function loadArtist() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('artist_profiles')
      .select('band_name')
      .eq('user_id', user.id)
      .single();
    if (data) setArtistName(data.band_name || '');
  }

  async function loadReleases() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('press_releases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setReleases(data);
  }

  async function generateRelease() {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'press_release',
          context: { topic, artistName }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar press release.');
    } catch {
      setGeneratedContent('Erro ao gerar press release. Tente novamente.');
    }
    setGenerating(false);
  }

  async function saveRelease() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !generatedContent) return;
    await supabase.from('press_releases').insert({
      user_id: user.id,
      title: topic,
      content: generatedContent
    });
    setTopic('');
    setGeneratedContent('');
    loadReleases();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent || selectedRelease?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#00f5a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-[#0d1018] border-r border-white/10 p-4">
          <a href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <span>&lt;-</span> Voltar ao Dashboard
          </a>
          <h2 className="text-lg font-bold mb-4 font-display">Press Releases</h2>
          <div className="space-y-2">
            {releases.length === 0 && (
              <p className="text-white/40 text-sm">Nenhum press release ainda.</p>
            )}
            {releases.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRelease(r); setGeneratedContent(''); }}
                className={`w-full text-left p-3 rounded-lg text-sm transition ${
                  selectedRelease?.id === r.id
                    ? 'bg-[#00f5a0]/20 text-[#00f5a0]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-white/40 mt-1">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">{NEWSPAPER_ICON}</span>
              <h1 className="text-3xl font-bold font-display">Press Releases</h1>
            </div>

            {/* Generator */}
            <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
              <h3 className="text-lg font-semibold mb-4">Gerar Press Release com IA</h3>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Assunto do press release (ex: lan\u00e7amento de single, show, parceria...)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 mb-4 focus:outline-none focus:border-[#00f5a0]/50"
              />
              <button
                onClick={generateRelease}
                disabled={generating || !topic.trim()}
                className="px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Gerando...' : 'Gerar Press Release'}
              </button>
            </div>

            {/* Content Display */}
            {(generatedContent || selectedRelease) && (
              <div className="bg-[#12151e] rounded-xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {generatedContent ? topic : selectedRelease?.title}
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
                        onClick={saveRelease}
                        className="px-4 py-2 bg-[#00f5a0]/20 text-[#00f5a0] rounded-lg text-sm hover:bg-[#00f5a0]/30 transition"
                      >
                        Salvar
                      </button>
                    )}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
                  {generatedContent || selectedRelease?.content}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
