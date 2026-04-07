"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";

type PlanTier = "free" | "pro" | "business";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanTier;
  spotify_connected: boolean;
  onboarding_completed: boolean;
}

interface Module {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  tier: PlanTier;
  href: string;
  comingSoon?: boolean;
}

const MODULES: Module[] = [
  {
    id: "playlist_pitch",
    name: "Envio de Playlists",
    nameEn: "Playlist Pitching",
    description: "Encontre playlists compatíveis e envie pitches profissionais com IA",
    descriptionEn: "Find matching playlists and send professional AI-powered pitches",
    icon: "🎵",
    tier: "free",
    href: "/dashboard/pitching",
  },
  {
    id: "epk",
    name: "Kit de Imprensa (EPK)",
    nameEn: "Electronic Press Kit",
    description: "Gere EPKs profissionais automaticamente com seus dados do Spotify",
    descriptionEn: "Auto-generate professional EPKs with your Spotify data",
    icon: "📋",
    tier: "free",
    href: "/dashboard/epk",
  },
  {
    id: "artist_analysis",
    name: "Análise de Artista",
    nameEn: "Artist Analysis",
    description: "Insights detalhados sobre seu perfil, audiência e crescimento",
    descriptionEn: "Detailed insights about your profile, audience and growth",
    icon: "📊",
    tier: "free",
    href: "/dashboard/analysis",
  },
  {
    id: "press_release",
    name: "Comunicados de Imprensa",
    nameEn: "Press Releases",
    description: "Crie comunicados profissionais para lançamentos e eventos",
    descriptionEn: "Create professional releases for launches and events",
    icon: "📰",
    tier: "pro",
    href: "/dashboard/press",
  },
  {
    id: "social_calendar",
    name: "Calendário Social",
    nameEn: "Social Calendar",
    description: "Planeje suas redes sociais com sugestões de conteúdo por IA",
    descriptionEn: "Plan your social media with AI content suggestions",
    icon: "📅",
    tier: "pro",
    href: "/dashboard/social",
  },
  {
    id: "setlist",
    name: "Gestão de Setlists",
    nameEn: "Setlist Management",
    description: "Organize setlists inteligentes baseadas em dados de audiência",
    descriptionEn: "Organize smart setlists based on audience data",
    icon: "🎶",
    tier: "pro",
    href: "/dashboard/setlist",
  },
  {
    id: "budget",
    name: "Orçamento e Finanças",
    nameEn: "Budget & Finance",
    description: "Controle receitas, despesas e projeções financeiras",
    descriptionEn: "Track revenue, expenses and financial projections",
    icon: "💰",
    tier: "pro",
    href: "/dashboard/budget",
  },
  {
    id: "contract",
    name: "Contratos e Riders",
    nameEn: "Contracts & Riders",
    description: "Gere contratos e riders técnicos profissionais",
    descriptionEn: "Generate professional contracts and technical riders",
    icon: "📝",
    tier: "pro",
    href: "/dashboard/contracts",
  },
  {
    id: "monthly_report",
    name: "Relatórios Mensais",
    nameEn: "Monthly Reports",
    description: "Relatórios completos de performance e crescimento",
    descriptionEn: "Complete performance and growth reports",
    icon: "📈",
    tier: "pro",
    href: "/dashboard/reports",
  },
  {
    id: "tour_plan",
    name: "Planejamento de Turnês",
    nameEn: "Tour Planning",
    description: "Planeje rotas, logística e orçamento de turnês",
    descriptionEn: "Plan routes, logistics and tour budgets",
    icon: "🌍",
    tier: "business",
    href: "/dashboard/tours",
  },
];

const TIER_ORDER: Record<PlanTier, number> = { free: 0, pro: 1, business: 2 };

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang] = useState<"pt" | "en">("pt");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .single();

    if (userData) {
      setUser(userData as UserData);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function canAccess(moduleTier: PlanTier): boolean {
    if (!user) return false;
    return TIER_ORDER[user.plan] >= TIER_ORDER[moduleTier];
  }

  function getTierBadge(tier: PlanTier) {
    const colors = {
      free: "bg-gray-500/20 text-gray-400",
      pro: "bg-brand-green/20 text-brand-green",
      business: "bg-brand-purple/20 text-brand-purple",
    };
    const labels = { free: "Free", pro: "Pro", business: "Business" };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[tier]}`}>
        {labels[tier]}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const accessibleModules = MODULES.filter((m) => canAccess(m.tier));
  const lockedModules = MODULES.filter((m) => !canAccess(m.tier));

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-white/10 bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-white tracking-wider">VERELUS</h1>
            {getTierBadge(user.plan)}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              {lang === "pt" ? "Sair" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-1">
            {lang === "pt" ? "Bem-vindo de volta" : "Welcome back"}{user.full_name ? `, ${user.full_name}` : ""}
          </h2>
          <p className="text-gray-400">
            {lang === "pt"
              ? "Acesse suas ferramentas de inteligência musical"
              : "Access your music intelligence tools"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{lang === "pt" ? "Plano" : "Plan"}</p>
            <p className="text-lg font-semibold text-white capitalize">{user.plan}</p>
          </div>
          <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{lang === "pt" ? "Módulos" : "Modules"}</p>
            <p className="text-lg font-semibold text-white">{accessibleModules.length}/{MODULES.length}</p>
          </div>
          <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Spotify</p>
            <p className="text-lg font-semibold text-white">
              {user.spotify_connected
                ? (lang === "pt" ? "Conectado" : "Connected")
                : (lang === "pt" ? "Não conectado" : "Not connected")}
            </p>
          </div>
          <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{lang === "pt" ? "Pitches este mês" : "Pitches this month"}</p>
            <p className="text-lg font-semibold text-white">{user.plan === "free" ? "0/3" : "∞"}</p>
          </div>
        </div>

        {/* Spotify Connection CTA */}
        {!user.spotify_connected && (
          <div className="mb-8 bg-gradient-to-r from-brand-green/10 to-brand-purple/10 border border-brand-green/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">
                  {lang === "pt" ? "Conecte seu Spotify" : "Connect your Spotify"}
                </h3>
                <p className="text-gray-400 text-sm">
                  {lang === "pt"
                    ? "Desbloqueie análises completas e matching inteligente de playlists"
                    : "Unlock full analytics and smart playlist matching"}
                </p>
              </div>
              <button className="px-4 py-2 bg-[#1DB954] text-white rounded-lg font-medium text-sm hover:bg-[#1ed760] transition-colors flex-shrink-0">
                {lang === "pt" ? "Conectar" : "Connect"}
              </button>
            </div>
          </div>
        )}

        {/* Accessible Modules */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            {lang === "pt" ? "Suas Ferramentas" : "Your Tools"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleModules.map((mod) => (
              <a
                key={mod.id}
                href={mod.href}
                className="group bg-bg-surface border border-white/10 rounded-xl p-5 hover:border-brand-green/30 hover:bg-bg-surface/80 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{mod.icon}</span>
                  {getTierBadge(mod.tier)}
                </div>
                <h4 className="text-white font-medium mb-1 group-hover:text-brand-green transition-colors">
                  {lang === "pt" ? mod.name : mod.nameEn}
                </h4>
                <p className="text-gray-400 text-sm">
                  {lang === "pt" ? mod.description : mod.descriptionEn}
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* Locked Modules */}
        {lockedModules.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-500 mb-4">
              {lang === "pt" ? "Desbloqueie com upgrade" : "Unlock with upgrade"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedModules.map((mod) => (
                <div
                  key={mod.id}
                  className="relative bg-bg-surface/50 border border-white/5 rounded-xl p-5 opacity-60"
                >
                  <div className="absolute top-3 right-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl grayscale">{mod.icon}</span>
                    {getTierBadge(mod.tier)}
                  </div>
                  <h4 className="text-gray-400 font-medium mb-1">
                    {lang === "pt" ? mod.name : mod.nameEn}
                  </h4>
                  <p className="text-gray-500 text-sm">
                    {lang === "pt" ? mod.description : mod.descriptionEn}
                  </p>
                </div>
              ))}
            </div>

            {/* Upgrade CTA */}
            <div className="mt-6 text-center">
              <a
                href="/#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-green to-brand-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-green/25 transition-all"
              >
                {lang === "pt" ? "Fazer upgrade agora" : "Upgrade now"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
