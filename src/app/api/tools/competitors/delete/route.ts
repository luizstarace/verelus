import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { competitor_id?: string };
    if (!body.competitor_id) return NextResponse.json({ error: 'competitor_id obrigatorio' }, { status: 400 });

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

    const { error: delErr } = await supabase
      .from('competitors')
      .delete()
      .eq('id', body.competitor_id)
      .eq('user_id', dbUser.id);

    if (delErr) return NextResponse.json({ error: 'Falha ao deletar' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('delete competitor error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
