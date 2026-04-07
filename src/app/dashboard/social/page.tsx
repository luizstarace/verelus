'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  scheduled_date: string;
  status: string;
  created_at: string;
}

const PLATFORMS = ['Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'YouTube', 'LinkedIn'];

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform] = useState('Instagram');
  const [theme, setTheme] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('list');

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true });
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
          context: { platform, theme }
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
      platform,
      content: generatedContent,
      scheduled_date: new Date().toISOString(),
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

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-[#0d1018] border-r border-white/10 p-4">
          <a href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <span>←</span> Voltar ao Dashboard
          </a>
          <h2 className="text-lg font-bold mb-4 font-display">Calendário Social</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('list')}
              className={`flex-1 py-2 text-sm rounded-lg ${view === 'list' ? 'bg-[#00f5a0]/20 text-[#00f5a0]' : 'bg-white/5 text-white/60'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 py-2 text-sm rounded-lg ${view === 'calendar' ? 'bg-[#00f5a0]/20 text-[#00f5a0]' : 'bg-white/5 text-white/60'}`}
            >
              Calendário
            </button>
          </div>
          <div className="space-y-2">
            {posts.length === 0 && (
              <p className="text-white/40 text-sm">Nenhum post agendado.</p>
            )}
            {posts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg bg-white/5 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: platformColors[p.platform] || '#fff' }}
                  />
                  <span className="text-white/60 text-xs">{p.platform}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                    p.status === 'published' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-white/70 truncate">{p.content}</div>
                <div className="text-xs text-white/40 mt-1">
                  {new Date(p.scheduled_date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">📅</span>
              <h1 className="text-3xl font-bold font-display">Calendário Social</h1>
            </div>

            {/* Generator */}
            <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
              <h3 className="text-lg font-semibold mb-4">Gerar Post com IA</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Plataforma</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f5a0]/50"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p} className="bg-[#12151e]">{p}</option>
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50"
                  />
                </div>
              </div>
              <button
                onClick={generatePost}
                disabled={generating || !theme.trim()}
                className="px-6 py-3 bg-[#e040fb] text-white font-bold rounded-lg hover:bg-[#e040fb]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Gerando...' : 'Gerar Post'}
              </button>
            </div>

            {/* Generated Content */}
            {generatedContent && (
              <div className="bg-[#12151e] rounded-xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: platformColors[platform] || '#fff' }}
                    />
                    <h3 className="text-lg font-semibold">{platform}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                    <button
                      onClick={savePost}
                      className="px-4 py-2 bg-[#e040fb]/20 text-[#e040fb] rounded-lg text-sm hover:bg-[#e040fb]/30 transition"
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
        </div>
      </div>
    </div>
  );
}
