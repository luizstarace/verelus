'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Painel', icon: '\u{1F3AF}' },
  { href: '/dashboard/analysis', label: 'An\u00e1lise', icon: '\u{1F4CA}' },
  { href: '/dashboard/social', label: 'Social', icon: '\u{1F4F1}' },
  { href: '/dashboard/press', label: 'Imprensa', icon: '\u{1F4F0}' },
  { href: '/dashboard/setlist', label: 'Setlists', icon: '\u{1F3B5}' },
  { href: '/dashboard/budget', label: 'Financeiro', icon: '\u{1F4B0}' },
  { href: '/dashboard/contracts', label: 'Contratos', icon: '\u{1F4DD}' },
  { href: '/dashboard/tours', label: 'Turn\u00eas', icon: '\u{1F30D}' },
  { href: '/dashboard/reports', label: 'Relat\u00f3rios', icon: '\u{1F4C8}' },
  { href: '/dashboard/epk', label: 'EPK', icon: '\u{1F4BC}' },
  { href: '/dashboard/pitching', label: 'Pitching', icon: '\u{1F3A4}' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);

    const checkUser = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = '/login';
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00f5a0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-[#0c0e15] border-r border-white/5 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full text-left">
            {sidebarOpen ? (
              <h1 className="text-xl font-bold font-display text-white tracking-wider">VERELUS</h1>
            ) : (
              <span className="text-xl font-bold text-white block text-center">V</span>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-[#00f5a0]/10 text-[#00f5a0]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00f5a0]/20 flex items-center justify-center text-[#00f5a0] text-sm font-bold shrink-0">
                {(user?.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{user?.email}</p>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-white/40 hover:text-red-400 transition"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 transition mx-auto"
              title="Sair"
            >
              \u23FB
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
