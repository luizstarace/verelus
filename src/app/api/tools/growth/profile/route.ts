import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

async function getUserId(): Promise<{ userId: string } | { error: string; status: number }> {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { error: 'Nao autenticado', status: 401 };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
  if (!dbUser) return { error: 'Usuario nao encontrado', status: 404 };
  return { userId: dbUser.id };
}

export async function GET() {
  const auth = await getUserId();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.from('growth_profiles').select('*').eq('user_id', auth.userId).maybeSingle();
  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      spotify_artist_url?: string;
      youtube_channel_url?: string;
      instagram_handle?: string;
      tiktok_handle?: string;
      enabled?: boolean;
    };

    const auth = await getUserId();
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = {
      user_id: auth.userId,
      spotify_artist_url: body.spotify_artist_url?.trim() || null,
      youtube_channel_url: body.youtube_channel_url?.trim() || null,
      youtube_channel_id: null as string | null,
      instagram_handle: body.instagram_handle?.trim().replace(/^@/, '') || null,
      tiktok_handle: body.tiktok_handle?.trim().replace(/^@/, '') || null,
      enabled: body.enabled ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from('growth_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (upErr) {
      console.error('growth profile upsert error:', upErr);
      return NextResponse.json({ error: 'Falha ao salvar perfil' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('growth profile error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
