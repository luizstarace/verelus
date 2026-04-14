import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ToolIcon } from '@/components/ToolIcon';

export const runtime = 'edge';

interface Tool {
  key: string;
  name: string;
  description: string;
  href: string | null;
  tier: 1 | 2 | 3;
  accent: 'green' | 'purple' | 'orange' | 'blue';
}

const TOOLS: Tool[] = [
  // Tier 1 — disponiveis
  { key: 'bio', name: 'Bio Adaptativa', description: '4 bios profissionais nos tamanhos de Spotify, Instagram, EPK e Twitter', href: '/dashboard/bio', tier: 1, accent: 'green' },
  { key: 'cache', name: 'Calculadora de Cache', description: 'Quanto cobrar por show e quanto sobra no bolso de verdade', href: '/dashboard/cache-calculator', tier: 1, accent: 'green' },
  { key: 'rider', name: 'Rider Tecnico', description: 'PDF profissional com diagrama de palco editavel', href: '/dashboard/rider', tier: 1, accent: 'green' },
  { key: 'contract', name: 'Contrato de Show', description: 'Contrato juridico BR pronto pra assinatura', href: '/dashboard/contract', tier: 1, accent: 'green' },
  // Tier 2 — em breve
  { key: 'pitch-kit', name: 'Pitch Kit', description: 'Email + 1-pager + press release pra enviar a curador', href: '/dashboard/pitch-kit', tier: 2, accent: 'purple' },
  { key: 'release-timing', name: 'Quando Lancar', description: '3 datas ideais para o seu proximo lancamento', href: null, tier: 2, accent: 'purple' },
  { key: 'launch-checklist', name: 'Checklist de Lancamento', description: 'Planejamento de 8 semanas antes ao pos-release', href: null, tier: 2, accent: 'purple' },
  // Tier 3 — em breve
  { key: 'growth', name: 'Growth Tracker', description: 'Painel semanal do seu crescimento real nas plataformas', href: null, tier: 3, accent: 'orange' },
  { key: 'competitors', name: 'Comparador de Concorrentes', description: 'Voce vs 3 artistas similares, ao longo do tempo', href: null, tier: 3, accent: 'orange' },
  { key: 'goals', name: 'Meta Tracker', description: 'Defina e acompanhe metas concretas de carreira', href: null, tier: 3, accent: 'orange' },
  { key: 'content-calendar', name: 'Cronograma de Posts', description: '30 dias de posts sugeridos pro seu lancamento', href: null, tier: 3, accent: 'orange' },
];

const ACCENT_BG: Record<Tool['accent'], string> = {
  green: 'group-hover:text-brand-green',
  purple: 'group-hover:text-brand-purple',
  orange: 'group-hover:text-brand-orange',
  blue: 'group-hover:text-blue-400',
};

const ACCENT_BORDER: Record<Tool['accent'], string> = {
  green: 'hover:border-brand-green/40',
  purple: 'hover:border-brand-purple/40',
  orange: 'hover:border-brand-orange/40',
  blue: 'hover:border-blue-400/40',
};

export default async function DashboardHome() {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login');

  const availableCount = TOOLS.filter((t) => t.href).length;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Background subtle glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 lg:py-16">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-brand-muted">
              {availableCount} de {TOOLS.length} ferramentas disponiveis
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Caixa de ferramentas <span className="bg-gradient-to-r from-brand-green to-brand-green/60 bg-clip-text text-transparent">Verelus</span>
          </h1>
          <p className="text-brand-muted leading-relaxed max-w-2xl">
            Cada ferramenta resolve uma dor especifica do musico independente. Bem feita. Direta. Sem firulas.
          </p>
        </header>

        {/* Grid */}
        <div className="space-y-10">
          {([1, 2, 3] as const).map((tier) => {
            const tools = TOOLS.filter((t) => t.tier === tier);
            const tierLabels: Record<typeof tier, string> = {
              1: 'Disponiveis',
              2: 'Tier 2 — em breve',
              3: 'Tier 3 — em breve',
            };
            return (
              <section key={tier}>
                <h2 className="text-xs font-mono uppercase tracking-wider text-brand-muted mb-4 flex items-center gap-2">
                  {tierLabels[tier]}
                  {tier === 1 && <span className="px-1.5 py-0.5 bg-brand-green/10 text-brand-green rounded text-[10px] font-bold">{tools.filter((t) => t.href).length}</span>}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tools.map((tool) => {
                    const available = tool.href !== null;
                    const card = (
                      <div className={`group relative h-full bg-brand-surface rounded-2xl p-5 border transition-all duration-200 ${
                        available
                          ? `border-white/10 ${ACCENT_BORDER[tool.accent]} cursor-pointer hover:bg-white/[0.04] hover:-translate-y-0.5`
                          : 'border-white/5 opacity-50'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 transition-colors ${available ? ACCENT_BG[tool.accent] : ''}`}>
                            <ToolIcon tool={tool.key} size={20} />
                          </div>
                          {!available && (
                            <span className="text-[9px] uppercase tracking-wider bg-white/5 text-brand-muted px-2 py-0.5 rounded-full font-mono">
                              em breve
                            </span>
                          )}
                          {available && (
                            <span className="text-brand-muted group-hover:text-white group-hover:translate-x-0.5 transition-all">
                              →
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-white mb-1.5 leading-snug">{tool.name}</h3>
                        <p className="text-xs text-brand-muted leading-relaxed">{tool.description}</p>
                      </div>
                    );
                    return available && tool.href ? (
                      <Link key={tool.key} href={tool.href} className="block h-full">{card}</Link>
                    ) : (
                      <div key={tool.key}>{card}</div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-brand-muted/60">
          <span>Conta: {user.email}</span>
          <span>Mais ferramentas semana a semana.</span>
        </footer>
      </div>
    </div>
  );
}
