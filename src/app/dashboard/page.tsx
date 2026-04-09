"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ModuleId = "calendar" | "press" | "setlist" | "pitch" | "report";

interface ModuleConfig {
  id: ModuleId;
  icon: string;
  title: string;
  desc: string;
  prompt: string;
  tier: "starter" | "pro";
  contextLabel: string;
  contextPlaceholder: string;
}

const modules: ModuleConfig[] = [
  { id: "calendar", icon: "\u{1F4C5}", title: "Calend\u00e1rio de Redes Sociais", desc: "Calend\u00e1rio de 30 dias com legendas, hashtags e hor\u00e1rios", prompt: "social_calendar", tier: "starter", contextLabel: "O que est\u00e1 acontecendo com sua banda?", contextPlaceholder: "Ex: Estamos lan\u00e7ando um single novo..." },
  { id: "press", icon: "\u{1F4F0}", title: "Press Release", desc: "Press release profissional pronto para enviar", prompt: "press_release", tier: "starter", contextLabel: "Sobre o que \u00e9 esse press release?", contextPlaceholder: "Ex: Novo \u00e1lbum saindo dia 15..." },
  { id: "setlist", icon: "\u{1F3B5}", title: "Estrat\u00e9gia de Setlist", desc: "3 setlists inteligentes com mapa de energia", prompt: "setlist", tier: "pro", contextLabel: "Conte sobre o show", contextPlaceholder: "Ex: Set de 45 min abrindo pra banda X..." },
  { id: "pitch", icon: "\u{2709}\u{FE0F}", title: "Kit de Pitch para Playlists", desc: "Kit completo com emails, DMs e curadores-alvo", prompt: "playlist_pitch", tier: "starter", contextLabel: "O que voc\u00ea est\u00e1 pitchando?", contextPlaceholder: "Ex: Single novo indie pop..." },
  { id: "report", icon: "\u{1F4CA}", title: "Relat\u00f3rio Mensal", desc: "Relat\u00f3rio completo com m\u00e9tricas, metas e a\u00e7\u00f5es", prompt: "monthly_report", tier: "pro", contextLabel: "Compartilhe m\u00e9tricas ou contexto", contextPlaceholder: "Ex: 5k ouvintes mensais..." },
];

function renderMarkdown(text: string): string {
  let html = text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-[#00f5a0] mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-[#00f5a0] mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black text-white mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-[#00f5a0]">\u2022</span><span class="text-zinc-300 text-sm">$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-[#00f5a0] font-mono text-sm min-w-[1.5rem]">$1.</span><span class="text-zinc-300 text-sm">$2</span></div>')
    .replace(/^---$/gm, '<hr class="border-zinc-700/50 my-6" />')
    .replace(/^(?!<[hdt]|<div|<hr)(.+)$/gm, '<p class="text-zinc-300 text-sm leading-relaxed my-1">$1</p>');
  return html;
}

export default function DashboardPage() {
  const [bandName, setBandName] = useState("");
  const [genre, setGenre] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedBand = localStorage.getItem("verelus_band");
    const savedGenre = localStorage.getItem("verelus_genre");
    if (savedBand && savedGenre) {
      setBandName(savedBand);
      setGenre(savedGenre);
      setSetupDone(true);
    }
  }, []);

  function handleSetup() {
    if (bandName && genre) {
      localStorage.setItem("verelus_band", bandName);
      localStorage.setItem("verelus_genre", genre);
      setSetupDone(true);
    }
  }

  async function handleGenerate(mod: ModuleConfig) {
    setActiveModule(mod.id);
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mod.prompt, bandName, genre, context, lang: "pt" }),
      });
      const data = await res.json();
      setOutput(data.content || "Erro ao gerar conte\u00fado.");
    } catch {
      setOutput("Erro de conex\u00e3o. Tente novamente.");
    }
    setLoading(false);
  }

  if (!setupDone) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <div className="bg-[#12151e] rounded-2xl p-8 border border-white/10 max-w-lg w-full">
          <h2 className="text-xl font-bold text-white mb-6">Configure seu perfil</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Nome da Banda / Artista</label>
              <input type="text" value={bandName} onChange={(e) => setBandName(e.target.value)} placeholder="Ex: Os Sinais" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50" />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">G\u00eanero Musical</label>
              <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Ex: Indie Rock, MPB" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50" />
            </div>
            <button onClick={handleSetup} disabled={!bandName || !genre} className="w-full py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition disabled:opacity-30">Começar</button>
          </div>
        </div>
      </div>
    );
  }

  const currentModule = modules.find((m) => m.id === activeModule);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-2">
          <h2 className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">M\u00f3dulos IA</h2>
          {modules.map((mod) => (
            <button key={mod.id} onClick={() => { setActiveModule(mod.id); setContext(""); }} disabled={loading}
              className={"w-full text-left p-3 rounded-lg border transition-all " + (activeModule === mod.id ? "border-[#00f5a0]/50 bg-[#00f5a0]/10" : "border-white/10 bg-[#12151e] hover:border-[#00f5a0]/30") + " disabled:opacity-50"}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{mod.icon}</span>
                <div><h3 className="font-semibold text-white text-sm">{mod.title}</h3><p className="text-xs text-zinc-500">{mod.desc}</p></div>
              </div>
            </button>
          ))}
          {activeModule && currentModule && (
            <div className="mt-4 space-y-3">
              <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder={currentModule.contextPlaceholder} rows={4} className="w-full px-3 py-2 bg-[#0c0e15] border border-white/10 rounded-lg text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#00f5a0]/50 resize-none" />
              <button onClick={() => handleGenerate(currentModule)} disabled={loading} className="w-full py-2.5 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition disabled:opacity-30 text-sm">
                {loading ? "Gerando..." : "Gerar Conte\u00fado"}
              </button>
            </div>
          )}
        </div>
        <div className="lg:col-span-9">
          {loading ? (
            <div className="bg-[#12151e] rounded-2xl border border-white/10 p-12 flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-8 h-8 border-2 border-[#00f5a0] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white/50 text-sm">Gerando conte\u00fado...</p>
            </div>
          ) : output ? (
            <div className="bg-[#12151e] rounded-2xl border border-white/10 min-h-[500px]">
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
                <span className="text-sm font-bold text-white">{currentModule?.icon} {currentModule?.title}</span>
                <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-3 py-1 text-xs border border-white/10 rounded-md text-zinc-400 hover:text-white transition">{copied ? "Copiado!" : "Copiar"}</button>
              </div>
              <div className="px-6 py-6 overflow-auto max-h-[70vh]" dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }} />
            </div>
          ) : (
            <div className="bg-[#12151e] rounded-2xl border border-white/10 p-12 flex flex-col items-center justify-center min-h-[500px] text-center">
              <span className="text-6xl mb-4">\u{1F9E0}</span>
              <h3 className="text-xl font-bold text-white mb-2">Pronto para criar</h3>
              <p className="text-zinc-500 max-w-md text-sm">Selecione um m\u00f3dulo para gerar conte\u00fado profissional para <span className="text-[#00f5a0] font-semibold">{bandName}</span>.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Stats {
  pressReleases: number;
  socialPosts: number;
  setlists: number;
  tours: number;
  contracts: number;
  totalIncome: number;
  totalExpense: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    pressReleases: 0, socialPosts: 0, setlists: 0,
    tours: 0, contracts: 0, totalIncome: 0, totalExpense: 0,
  });
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email?.split('@')[0] || 'artista');
      }

      const [pr, sp, sl, tr, ct, inc, exp] = await Promise.all([
        supabase.from('press_releases').select('id', { count: 'exact', head: true }),
        supabase.from('social_posts').select('id', { count: 'exact', head: true }),
        supabase.from('setlists').select('id', { count: 'exact', head: true }),
        supabase.from('tours').select('id', { count: 'exact', head: true }),
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
        supabase.from('budget_transactions').select('amount').eq('type', 'income'),
        supabase.from('budget_transactions').select('amount').eq('type', 'expense'),
      ]);

      const sumAmounts = (rows: { amount: number }[] | null) =>
        (rows || []).reduce((s, r) => s + (r.amount || 0), 0);

      setStats({
        pressReleases: pr.count || 0,
        socialPosts: sp.count || 0,
        setlists: sl.count || 0,
        tours: tr.count || 0,
        contracts: ct.count || 0,
        totalIncome: sumAmounts(inc.data as { amount: number }[] | null),
        totalExpense: sumAmounts(exp.data as { amount: number }[] | null),
      });
      setLoading(false);
    };

    load();
  }, []);

  const formatBRL = (v: number) =>
    'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const CARDS = [
    { label: 'Press Releases', value: stats.pressReleases, icon: '\u{1F4F0}', color: '#00f5a0', href: '/dashboard/press' },
    { label: 'Posts Agendados', value: stats.socialPosts, icon: '\u{1F4F1}', color: '#e040fb', href: '/dashboard/social' },
    { label: 'Setlists', value: stats.setlists, icon: '\u{1F3B5}', color: '#f5a623', href: '/dashboard/setlist' },
    { label: 'Turn\u00eas', value: stats.tours, icon: '\u{1F30D}', color: '#00f5a0', href: '/dashboard/tours' },
    { label: 'Contratos', value: stats.contracts, icon: '\u{1F4DD}', color: '#e040fb', href: '/dashboard/contracts' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#00f5a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white">
            {greeting()}, {userName}!
          </h1>
          <p className="text-white/50 mt-1">Aqui est\u00e1 o resumo da sua carreira musical.</p>
        </div>

        {/* Finance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#12151e] rounded-xl p-5 border border-white/10">
            <p className="text-white/50 text-sm mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-[#00f5a0]">{formatBRL(stats.totalIncome)}</p>
          </div>
          <div className="bg-[#12151e] rounded-xl p-5 border border-white/10">
            <p className="text-white/50 text-sm mb-1">Despesa Total</p>
            <p className="text-2xl font-bold text-red-400">{formatBRL(stats.totalExpense)}</p>
          </div>
          <div className="bg-[#12151e] rounded-xl p-5 border border-white/10">
            <p className="text-white/50 text-sm mb-1">Balan\u00e7o</p>
            <p className={`text-2xl font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-[#00f5a0]' : 'text-red-400'}`}>
              {formatBRL(stats.totalIncome - stats.totalExpense)}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {CARDS.map((card) => (
            <a
              key={card.label}
              href={card.href}
              className="bg-[#12151e] rounded-xl p-5 border border-white/10 hover:border-white/20 transition group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{card.icon}</span>
                <span className="text-xs text-white/40 group-hover:text-white/60 transition">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </a>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#12151e] rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">A\u00e7\u00f5es R\u00e1pidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Novo Press Release', href: '/dashboard/press', color: 'bg-[#00f5a0]/10 text-[#00f5a0]' },
              { label: 'Agendar Post', href: '/dashboard/social', color: 'bg-[#e040fb]/10 text-[#e040fb]' },
              { label: 'Criar Setlist', href: '/dashboard/setlist', color: 'bg-[#f5a623]/10 text-[#f5a623]' },
              { label: 'Nova Turn\u00ea', href: '/dashboard/tours', color: 'bg-[#00f5a0]/10 text-[#00f5a0]' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`${action.color} rounded-lg px-4 py-3 text-sm font-medium hover:opacity-80 transition text-center`}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
