import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getComparisonDashboard, generateComparisonInsight } from '@/lib/competitor-aggregator';

export const runtime = 'edge';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const dashboard = await getComparisonDashboard(dbUser.id, supabase);

    // Gera insight se ha pelo menos 1 competidor
    if (dashboard.competitors.length > 0) {
      try {
        dashboard.insight = await generateComparisonInsight(dashboard);
      } catch {
        // insight opcional
      }
    }

    return NextResponse.json({ dashboard });
  } catch (err) {
    console.error('competitors list error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
