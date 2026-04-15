import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { GrowthSource } from '@/lib/types/tools';

export const runtime = 'edge';

/**
 * User atualiza manualmente seguidores de Instagram ou TikTok (nao ha API OAuth-free).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { source?: string; value?: number };
    if (!body.source || !['instagram', 'tiktok'].includes(body.source)) {
      return NextResponse.json({ error: 'source deve ser instagram ou tiktok' }, { status: 400 });
    }
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: 'value invalido' }, { status: 400 });
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

    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from('growth_snapshots')
      .upsert(
        {
          user_id: dbUser.id,
          source: body.source as GrowthSource,
          metric_value: Math.round(value),
          snapshot_date: today,
        },
        { onConflict: 'user_id,source,snapshot_date' }
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('manual-update error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
