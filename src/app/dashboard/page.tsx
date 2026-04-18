import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function DashboardHome() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cards = [
    {
      href: '/dashboard/proposals',
      title: 'Propostas',
      description: 'Veja todas as suas propostas, acompanhe visualizacoes e aceites.',
      icon: '\u{1F4E8}',
    },
    {
      href: '/dashboard/proposals/new',
      title: 'Nova proposta',
      description: 'Crie uma proposta profissional em menos de 2 minutos.',
      icon: '\u{2795}',
    },
    {
      href: '/dashboard/profile',
      title: 'Perfil',
      description: 'Configure seus dados que aparecem no cabecalho das propostas.',
      icon: '\u{1F464}',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 lg:py-16">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-brand-green to-brand-green/60 bg-clip-text text-transparent">
              Verelus
            </span>
          </h1>
          <p className="text-brand-muted leading-relaxed max-w-2xl">
            Propostas profissionais que fecham. Em 2 minutos.
          </p>
        </header>

        {/* Onboarding banner */}
        <div className="bg-gradient-to-r from-brand-green/15 to-brand-green/5 rounded-2xl p-6 border border-brand-green/20 mb-10">
          <h2 className="text-lg font-bold text-white mb-2">Comece aqui</h2>
          <p className="text-sm text-brand-muted leading-relaxed mb-4">
            Configure seu perfil e crie sua primeira proposta para comecar a fechar projetos.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/profile"
              className="px-4 py-2 bg-brand-green/15 text-brand-green text-sm font-semibold rounded-lg hover:bg-brand-green/25 transition"
            >
              Completar perfil
            </Link>
            <Link
              href="/dashboard/proposals/new"
              className="px-4 py-2 bg-white/5 text-white/70 text-sm rounded-lg hover:bg-white/10 transition"
            >
              Criar primeira proposta
            </Link>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group block bg-brand-surface rounded-2xl p-6 border border-white/10 hover:border-brand-green/40 transition-all duration-200 hover:bg-white/[0.04] hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-brand-muted group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
              <h3 className="font-bold text-white mb-1.5">{card.title}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/5 text-xs text-brand-muted/60">
          <span>Conta: {user.email}</span>
        </footer>
      </div>
    </div>
  );
}
