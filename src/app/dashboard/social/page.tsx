'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { UpgradeGate } from '@/lib/upgrade-gate';
import { useArtistProfile } from '@/lib/use-artist-profile';
import { exportAsText, exportAsPDF } from '@/lib/export-content';
import { useAiLimit } from '@/lib/use-ai-limit';
import { UpgradeModal } from '@/lib/upgrade-modal';

const CALENDAR_ICON = String.fromCodePoint(0x1F4C5);

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  scheduled_for: string;
  status: string;
  created_at: string;
}

const PLATFORMS = ['Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'YouTube', 'LinkedIn'];

function SocialContent() {
  const { profile: artistProfile } = useArtistProfile();
  const { tryGenerate, showUpgrade, closeUpgrade, remaining } = useAiLimit();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform] = useState('Instagram');
  const [theme, setTheme] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('list');

  useEffect(() => {
    loadPosts();
      setLoading(false);
  }, []);

  async function loadPosts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true });
    if (data) setPosts(data);
  }

  async function generatePost() {
    if (!theme.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'social_post',
          context: { platform, theme, artistProfile }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar post.');
    } catch {
      setGeneratedContent('Erro ao gerar post. Tente novamente.');
    }
    setGenerating(false);
  }

  async function savePost() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !generatedContent) return;
    await supabase.from('social_posts').insert({
      user_id: user.id,
      platform: platform.toLowerCase().replace('twitter/x', 'twitter'),
      content: generatedContent,
      scheduled_for: new Date().toISOString(),
      status: 'draft'
    });
    setGeneratedContent('');
    setTheme('');
    loadPosts();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const platformColors: Record<string, string> = {
    'Instagram': '#E040FB',
    'TikTok': '#00f5a0',
    'Twitter/X': '#1DA1F2',
    'Facebook': '#4267B2',
    'YouTube': '#FF0000',
    'LinkedIn': '#0077B5'
  };


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
          <span className="text-3xl">{CALENDAR_ICON}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Calendário Social</h1>
        </div>

        {/* Generator */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold mb-4">Gerar Post com IA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Plataforma</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="bg-brand-surface">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Tema</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: novo single, bastidores, promoção..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
              />
            </div>
          </div>
          <button
            onClick={() => tryGenerate(generatePost)}
            disabled={generating || !theme.trim()}
            className="px-6 py-3 bg-brand-purple text-white font-bold rounded-lg hover:bg-brand-purple/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Gerando...' : 'Gerar Post'}
          </button>
          {remaining !== null && <span className="text-xs text-white/30 ml-3">{remaining} gerações restantes</span>}
        </div>

        {/* Saved posts list */}
        {posts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm text-white/40 uppercase tracking-wider">Salvos</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1 text-xs rounded-lg ${view === 'list' ? 'bg-brand-green/20 text-brand-green' : 'bg-white/5 text-white/60'}`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`px-3 py-1 text-xs rounded-lg ${view === 'calendar' ? 'bg-brand-green/20 text-brand-green' : 'bg-white/5 text-white/60'}`}
                >
                  Calendário
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: platformColors[p.platform] || '#fff' }}
                  />
                  <span className="text-white/70 truncate max-w-[200px]">{p.content}</span>
                  <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                    p.status === 'published' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Content */}
        {generatedContent && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: platformColors[platform] || '#fff' }}
                />
                <h3 className="text-lg font-semibold">{platform}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => exportAsText(generatedContent, `post-${platform}`)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  TXT
                </button>
                <button
                  onClick={() => exportAsPDF(generatedContent, `Post ${platform}`)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  PDF
                </button>
                <button
                  onClick={savePost}
                  className="px-4 py-2 bg-brand-purple/20 text-brand-purple rounded-lg text-sm hover:bg-brand-purple/30 transition"
                >
                  Salvar
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
              {generatedContent}
            </div>
          </div>
        )}
      </div>
      <UpgradeModal open={showUpgrade} onClose={closeUpgrade} feature="Geração com IA" />
    </div>
  );
}

export default function SocialPage() {
  return (
    <UpgradeGate module="social">
      <SocialContent />
    </UpgradeGate>
  );
}
