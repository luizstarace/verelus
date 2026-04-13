'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { UserTierContext, useUserTierFetch, canAccess, MODULE_TIER_REQUIREMENT } from '@/lib/use-user-tier';
import type { PlanTier } from '@/lib/use-user-tier';
import { ArtistProfileCtx, useArtistProfileFetch } from '@/lib/use-artist-profile';
import ChatWidget from '@/components/chat-widget';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const NAV_ITEMS: { href: string; label: string; icon: string; module: string }[] = [
  { href: '/dashboard', label: 'Painel', icon: '\u{1F3AF}', module: 'dashboard' },
  { href: '/dashboard/analysis', label: 'Analise', icon: '\u{1F4CA}', module: 'analysis' },
  { href: '/dashboard/social', label: 'Social', icon: '\u{1F4F1}', module: 'social' },
  { href: '/dashboard/press', label: 'Imprensa', icon: '\u{1F4F0}', module: 'press' },
  { href: '/dashboard/setlist', label: 'Setlists', icon: '\u{1F3B5}', module: 'setlist' },
  { href: '/dashboard/budget', label: 'Financeiro', icon: '\u{1F4B0}', module: 'budget' },
  { href: '/dashboard/contracts', label: 'Contratos', icon: '\u{1F4DD}', module: 'contracts' },
  { href: '/dashboard/tours', label: 'Turnes', icon: '\u{1F30D}', module: 'tours' },
  { href: '/dashboard/reports', label: 'Relatorios', icon: '\u{1F4C8}', module: 'reports' },
  { href: '/dashboard/epk', label: 'EPK', icon: '\u{1F4BC}', module: 'epk' },
  { href: '/dashboard/pitching', label: 'Pitching', icon: '\u{1F3A4}', module: 'pitching' },
  { href: '/dashboard/profile', label: 'Perfil', icon: '\u{1F464}', module: 'profile' },
];

function TierBadge({ required }: { required: PlanTier }) {
  if (required === 'free') return null;
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
      required === 'business'
        ? 'bg-brand-purple/20 text-brand-purple'
        : 'bg-brand-green/20 text-brand-green'
    }`}>
      {required}
    </span>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const tierData = useUserTierFetch();
  const profileData = useArtistProfileFetch();

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    // Open sidebar by default on desktop
    if (window.innerWidth >= 1024) setSidebarOpen(true);

    const checkUser = async () => {
      const supabase = getSupabase();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);
      setLoading(false);
    };

    checkUser();

    const sub = getSupabase();
    const { data: { subscription } } = sub.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = '/login';
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <UserTierContext.Provider value={tierData}>
    <ArtistProfileCtx.Provider value={profileData}>
      <div className="min-h-screen bg-brand-dark flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          ${sidebarOpen ? 'w-60 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'}
          bg-brand-card border-r border-white/5 flex flex-col
          transition-all duration-200 overflow-hidden shrink-0
        `}>
          {/* Logo */}
          <div className="p-4 border-b border-white/5">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full text-left">
              {sidebarOpen ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold font-display text-white tracking-wider">VERELUS</h1>
                    {!tierData.loading && (
                      <span className={`text-[10px] font-mono uppercase ${
                        tierData.tier === 'business' ? 'text-brand-purple' :
                        tierData.tier === 'pro' ? 'text-brand-green' : 'text-white/30'
                      }`}>
                        {tierData.tier === 'free' ? 'Free' : tierData.tier}
                      </span>
                    )}
                  </div>
                  <span className="text-white/30 text-xs lg:hidden">&times;</span>
                </div>
              ) : (
                <span className="text-xl font-bold text-white block text-center">V</span>
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href));
              const required = MODULE_TIER_REQUIREMENT[item.module] || 'free';
              const hasAccess = item.module === 'dashboard' || item.module === 'profile' || canAccess(tierData.tier, item.module);

              return (
                <a
                  key={item.href}
                  href={hasAccess ? item.href : '#'}
                  onClick={(e) => {
                    if (!hasAccess) { e.preventDefault(); return; }
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                    !hasAccess
                      ? 'text-white/20 cursor-not-allowed'
                      : isActive
                        ? 'bg-brand-green/10 text-brand-green'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title={hasAccess ? item.label : `${item.label} (Plano ${required})`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {!hasAccess && <TierBadge required={required as PlanTier} />}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/5">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-sm font-bold shrink-0">
                  {(user?.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{user?.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-white/40 hover:text-red-400 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSignOut}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors mx-auto"
                title="Sair"
              >
                &#x23FB;
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto min-w-0">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-20 bg-brand-dark/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h12M3 9h12M3 13h12" />
              </svg>
            </button>
            <h1 className="text-sm font-display text-white tracking-wider">VERELUS</h1>
            {!tierData.loading && tierData.tier !== 'free' && (
              <span className={`text-[9px] font-mono uppercase ml-auto ${
                tierData.tier === 'business' ? 'text-brand-purple' : 'text-brand-green'
              }`}>
                {tierData.tier}
              </span>
            )}
          </div>
          {children}
        </main>
      </div>
    <ChatWidget />
    </ArtistProfileCtx.Provider>
    </UserTierContext.Provider>
  );
}
