'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { UpgradeGate } from '@/lib/upgrade-gate';
import { useArtistProfile } from '@/lib/use-artist-profile';
import { exportAsText, exportAsPDF } from '@/lib/export-content';
import { useAiLimit } from '@/lib/use-ai-limit';
import { UpgradeModal } from '@/lib/upgrade-modal';

const NEWSPAPER_ICON = String.fromCodePoint(0x1F4F0);

interface PressRelease {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

function PressContent() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<PressRelease | null>(null);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile: artistProfile } = useArtistProfile();
  const { tryGenerate, showUpgrade, closeUpgrade, remaining } = useAiLimit();

  useEffect(() => {
    loadReleases();
      setLoading(false);
  }, []);

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
          context: { topic, artistName: artistProfile?.band_name || '', artistProfile }
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
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{NEWSPAPER_ICON}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Press Releases</h1>
        </div>

        {/* Generator */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold mb-4">Gerar Press Release com IA</h3>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Assunto do press release (ex: lançamento de single, show, parceria...)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 mb-4 focus:outline-none focus:border-brand-green/50"
          />
          <button
            onClick={() => tryGenerate(generateRelease)}
            disabled={generating || !topic.trim()}
            className="px-6 py-3 bg-brand-green text-black font-bold rounded-lg hover:bg-brand-green/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Gerando...' : 'Gerar Press Release'}
          </button>
          {remaining !== null && <span className="text-xs text-white/30 ml-3">{remaining} gerações restantes</span>}
        </div>

        {/* Saved items list */}
        {releases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-white/40 uppercase tracking-wider mb-3">Salvos</h3>
            <div className="flex flex-wrap gap-2">
              {releases.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRelease(r); setGeneratedContent(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    selectedRelease?.id === r.id
                      ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Display */}
        {(generatedContent || selectedRelease) && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">
                {generatedContent ? topic : selectedRelease?.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => exportAsText(generatedContent || selectedRelease?.content || '', topic || selectedRelease?.title || 'press-release')}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  TXT
                </button>
                <button
                  onClick={() => exportAsPDF(generatedContent || selectedRelease?.content || '', topic || selectedRelease?.title || 'Press Release')}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  PDF
                </button>
                {generatedContent && (
                  <button
                    onClick={saveRelease}
                    className="px-4 py-2 bg-brand-green/20 text-brand-green rounded-lg text-sm hover:bg-brand-green/30 transition"
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
      <UpgradeModal open={showUpgrade} onClose={closeUpgrade} feature="Geração com IA" />
    </div>
  );
}

export default function PressPage() {
  return (
    <UpgradeGate module="press">
      <PressContent />
    </UpgradeGate>
  );
}
