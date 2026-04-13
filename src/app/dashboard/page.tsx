'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('welcome=true')) {
      setShowWelcome(true);
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => setShowWelcome(false), 8000);
    }
    const load = async () => {
      const supabase = getSupabase();
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
    { label: 'Turnês', value: stats.tours, icon: '\u{1F30D}', color: '#00f5a0', href: '/dashboard/tours' },
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
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Welcome Banner */}
        {showWelcome && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#00f5a0]/20 to-purple-500/20 border border-brand-green/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Bem-vindo ao Verelus! 🎉</h2>
                <p className="text-sm text-white/60 mt-1">Sua assinatura foi ativada. Explore os modulos e comece a criar conteudo com IA.</p>
              </div>
              <button onClick={() => setShowWelcome(false)} className="text-white/40 hover:text-white text-xl">×</button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white">
            {greeting()}, {userName}!
          </h1>
          <p className="text-white/50 mt-1">Aqui está o resumo da sua carreira musical.</p>
        </div>

        {/* Finance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-brand-surface rounded-xl p-5 border border-white/10">
            <p className="text-white/50 text-sm mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-brand-green">{formatBRL(stats.totalIncome)}</p>
          </div>
          <div className="bg-brand-surface rounded-xl p-5 border border-white/10">
            <p className="text-white/50 text-sm mb-1">Despesa Total</p>
            <p className="text-2xl font-bold text-red-400">{formatBRL(stats.totalExpense)}</p>
          </div>
          <div className="bg-brand-surface rounded-xl p-5 border border-white/10">
            <p className="text-white/50 text-sm mb-1">Balanço</p>
            <p className={`text-2xl font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
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
              className="bg-brand-surface rounded-xl p-5 border border-white/10 hover:border-white/20 transition group"
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
        <div className="bg-brand-surface rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Novo Press Release', href: '/dashboard/press', color: 'bg-brand-green/10 text-brand-green' },
              { label: 'Agendar Post', href: '/dashboard/social', color: 'bg-brand-purple/10 text-brand-purple' },
              { label: 'Criar Setlist', href: '/dashboard/setlist', color: 'bg-brand-orange/10 text-brand-orange' },
              { label: 'Nova Turnê', href: '/dashboard/tours', color: 'bg-brand-green/10 text-brand-green' },
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
