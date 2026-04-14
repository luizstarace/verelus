import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

interface Tool {
  key: string;
  name: string;
  description: string;
  href: string | null;  // null = em breve
  tier: 1 | 2 | 3;
}

const TOOLS: Tool[] = [
  { key: 'bio', name: 'Bio Adaptativa', description: '4 bios profissionais nos tamanhos de Spotify, Instagram, EPK e Twitter', href: '/dashboard/bio', tier: 1 },
  { key: 'cache', name: 'Calculadora de Cache', description: 'Quanto cobrar por show e quanto sobra no bolso', href: null, tier: 1 },
  { key: 'rider', name: 'Rider Tecnico', description: 'PDF profissional com diagrama de palco', href: null, tier: 1 },
  { key: 'contract', name: 'Contrato de Show', description: 'Contrato juridico validado, pronto pra assinatura', href: null, tier: 1 },
  { key: 'pitch-kit', name: 'Pitch Kit', description: 'Email + 1-pager + release pra enviar a curador', href: null, tier: 2 },
  { key: 'release-timing', name: 'Quando Lancar', description: '3 datas ideais para seu proximo lancamento', href: null, tier: 2 },
  { key: 'launch-checklist', name: 'Checklist de Lancamento', description: 'Planejamento completo de 8 semanas antes ao pos', href: null, tier: 2 },
  { key: 'growth', name: 'Growth Tracker', description: 'Painel semanal do seu crescimento real', href: null, tier: 3 },
  { key: 'competitors', name: 'Comparador de Concorrentes', description: 'Voce vs 3 artistas similares, ao longo do tempo', href: null, tier: 3 },
  { key: 'goals', name: 'Meta Tracker', description: 'Defina e acompanhe metas de carreira', href: null, tier: 3 },
  { key: 'content-calendar', name: 'Cronograma de Posts', description: '30 dias de posts sugeridos pro seu lancamento', href: null, tier: 3 },
];

export default async function DashboardHome() {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-brand-dark text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Bem-vindo ao Verelus</h1>
          <p className="text-brand-muted">
            Caixa de ferramentas para musico independente. Cada uma faz uma coisa — muito bem feita.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const available = tool.href !== null;
            const card = (
              <div className={`h-full bg-brand-surface rounded-2xl p-6 border transition ${available ? 'border-white/10 hover:border-brand-green/40 hover:bg-white/[0.04] cursor-pointer' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                  {!available && (
                    <span className="text-[10px] uppercase tracking-wider bg-white/5 text-brand-muted px-2 py-0.5 rounded-full">
                      em breve
                    </span>
                  )}
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">{tool.description}</p>
              </div>
            );
            return available && tool.href ? (
              <Link key={tool.key} href={tool.href}>{card}</Link>
            ) : (
              <div key={tool.key}>{card}</div>
            );
          })}
        </div>

        <p className="text-xs text-brand-muted/60 mt-10 text-center">
          Mais ferramentas liberadas semana a semana. {user.email && `Conta: ${user.email}`}
        </p>
      </div>
    </div>
  );
}
