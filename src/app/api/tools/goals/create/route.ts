import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getCurrentMetricValue } from '@/lib/goal-calculator';
import type { GoalMetric } from '@/lib/types/tools';

export const runtime = 'edge';

const VALID_METRICS: GoalMetric[] = ['spotify_listeners', 'youtube_subscribers', 'instagram_followers', 'tiktok_followers'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      title?: string;
      metric?: string;
      target_value?: number;
      target_date?: string;
    };

    if (!body.title?.trim()) return NextResponse.json({ error: 'title obrigatorio' }, { status: 400 });
    if (!body.metric || !VALID_METRICS.includes(body.metric as GoalMetric)) {
      return NextResponse.json({ error: 'metric invalido' }, { status: 400 });
    }
    const target = Number(body.target_value);
    if (!Number.isFinite(target) || target <= 0) {
      return NextResponse.json({ error: 'target_value deve ser > 0' }, { status: 400 });
    }
    if (!body.target_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.target_date)) {
      return NextResponse.json({ error: 'target_date invalido (YYYY-MM-DD)' }, { status: 400 });
    }
    const targetDate = new Date(body.target_date + 'T12:00:00');
    if (targetDate <= new Date()) {
      return NextResponse.json({ error: 'target_date deve ser no futuro' }, { status: 400 });
    }

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

    // Valor atual para registrar start_value
    const startValue = await getCurrentMetricValue(dbUser.id, body.metric as GoalMetric, supabase);

    const { data: goal, error: insErr } = await supabase
      .from('goals')
      .insert({
        user_id: dbUser.id,
        title: body.title.trim(),
        metric: body.metric,
        target_value: Math.round(target),
        start_value: startValue ?? 0,
        target_date: body.target_date,
        status: 'active',
      })
      .select()
      .single();

    if (insErr) return NextResponse.json({ error: 'Falha ao criar meta' }, { status: 500 });
    return NextResponse.json({ goal });
  } catch (err) {
    console.error('goal create error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
