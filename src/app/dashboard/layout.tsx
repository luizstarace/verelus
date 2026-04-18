'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { UserTierContext, useUserTierFetch } from '@/lib/use-user-tier';
import ChatWidget from '@/components/chat-widget';
import { ToastContainer } from '@/components/ui/Toast';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  tier: 1 | 2 | 3;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Painel', icon: '\u{1F4CB}', tier: 1 },
  { href: '/dashboard/proposals', label: 'Propostas', icon: '\u{1F4E8}', tier: 1 },
  { href: '/dashboard/proposals/new', label: 'Nova proposta', icon: '\u{2795}', tier: 1 },
  { href: '/dashboard/profile', label: 'Perfil', icon: '\u{1F464}', tier: 1 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const tierData = useUserTierFetch();

  useEffect(() => {
    setCurrentPath(window.location.pathname);
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
      <div className="min-h-screen bg-brand-dark flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          ${sidebarOpen ? 'w-60 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'}
          bg-brand-card border-r border-white/5 flex flex-col
          transition-all duration-200 overflow-hidden shrink-0
        `}>
          <div className="p-4 border-b border-white/5">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full text-left">
              {sidebarOpen ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold font-display text-white tracking-wider">VERELUS</h1>
                    {!tierData.loading && (
                      <span className={`text-[10px] font-mono uppercase ${
                        tierData.tier === 'pro' ? 'text-brand-green' : 'text-white/30'
                      }`}>
                        {tierData.tier === 'free' ? 'Free' : 'Pro'}
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

          <nav className="flex-1 py-3 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href + '/'));

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </a>
              );
            })}
          </nav>

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

        <main className="flex-1 overflow-auto min-w-0">
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
            {!tierData.loading && tierData.tier === 'pro' && (
              <span className="text-[9px] font-mono uppercase ml-auto text-brand-green">Pro</span>
            )}
          </div>
          {children}
        </main>
      </div>
    <ChatWidget />
    <ToastContainer />
    </UserTierContext.Provider>
  );
}
