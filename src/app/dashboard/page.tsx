import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function DashboardHome() {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email!.toLowerCase().trim())
    .single();
  if (!dbUser) redirect('/login');

  const { data: latest } = await supabase
    .from('diagnostics')
    .select('id, stage, stage_score, created_at')
    .eq('user_id', dbUser.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-brand-dark text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Bem-vindo ao Verelus</h1>
        {latest ? (
          <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
            <p className="text-brand-muted text-sm mb-2">Seu diagnostico mais recente</p>
            <h2 className="text-2xl font-bold mb-2">Estagio {latest.stage}</h2>
            <p className="text-brand-muted mb-4">
              Score: {latest.stage_score}/100 — criado em {new Date(latest.created_at).toLocaleDateString('pt-BR')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/diagnostic/${latest.id}`}
                className="px-5 py-2.5 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-semibold rounded-xl"
              >
                Ver diagnostico
              </Link>
              <Link
                href="/dashboard/onboarding"
                className="px-5 py-2.5 border border-white/10 text-white rounded-xl"
              >
                Refazer analise
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">Comece sua analise</h2>
            <p className="text-brand-muted mb-6">
              Em ~8 minutos voce tera um diagnostico completo da sua carreira musical e um plano de 90 dias.
            </p>
            <Link
              href="/dashboard/onboarding"
              className="inline-block px-6 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl"
            >
              Comecar agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
