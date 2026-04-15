import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { goal_id?: string; status?: string; action?: 'delete' };
    if (!body.goal_id) return NextResponse.json({ error: 'goal_id obrigatorio' }, { status: 400 });

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

    if (body.action === 'delete') {
      await supabase.from('goals').delete().eq('id', body.goal_id).eq('user_id', dbUser.id);
      return NextResponse.json({ success: true });
    }

    if (body.status && ['active', 'achieved', 'abandoned'].includes(body.status)) {
      const update: Record<string, unknown> = { status: body.status };
      if (body.status === 'achieved') update.achieved_at = new Date().toISOString();
      await supabase.from('goals').update(update).eq('id', body.goal_id).eq('user_id', dbUser.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'action/status invalido' }, { status: 400 });
  } catch (err) {
    console.error('goal update error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
