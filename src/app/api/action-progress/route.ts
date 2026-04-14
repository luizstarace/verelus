import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      diagnostic_id?: string;
      action_index?: number;
      completed?: boolean;
    };
    if (!body.diagnostic_id || typeof body.action_index !== 'number' || typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 });
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

    await supabase.from('action_progress').upsert(
      {
        user_id: dbUser.id,
        diagnostic_id: body.diagnostic_id,
        action_index: body.action_index,
        completed: body.completed,
        completed_at: body.completed ? new Date().toISOString() : null,
      },
      { onConflict: 'diagnostic_id,action_index' }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
