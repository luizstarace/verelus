import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: diagnostic } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', dbUser.id)
      .single();

    if (!diagnostic) return NextResponse.json({ error: 'Diagnostico nao encontrado' }, { status: 404 });

    // Fetch action progress
    const { data: progress } = await supabase
      .from('action_progress')
      .select('action_index, completed')
      .eq('diagnostic_id', params.id);

    const progressMap: Record<number, boolean> = {};
    (progress ?? []).forEach((p: { action_index: number; completed: boolean }) => {
      progressMap[p.action_index] = p.completed;
    });

    return NextResponse.json({ diagnostic, progress: progressMap });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
