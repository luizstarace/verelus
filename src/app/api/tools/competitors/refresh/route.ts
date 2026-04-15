import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { captureCompetitorSnapshots } from '@/lib/competitor-aggregator';

export const runtime = 'edge';

export async function POST() {
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

    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('user_id', dbUser.id);

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    const results: Array<{ id: string; captured: string[]; errors: string[] }> = [];
    for (const comp of competitors) {
      const { captured, errors } = await captureCompetitorSnapshots(
        comp.id,
        comp.spotify_artist_id,
        comp.youtube_channel_url ?? comp.youtube_channel_id,
        supabase
      );
      results.push({ id: comp.id, captured: Object.keys(captured), errors });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error('refresh competitors error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
