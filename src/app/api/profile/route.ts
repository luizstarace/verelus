import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ profile: profile ?? null });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await req.json();

    const display_name = body.display_name?.trim()?.slice(0, 100);
    if (!display_name) {
      return NextResponse.json({ error: 'display_name obrigatorio' }, { status: 400 });
    }

    const row = {
      user_id: userId,
      display_name,
      title: (body.title ?? '').slice(0, 100),
      email: (body.email ?? '').slice(0, 200),
      phone: (body.phone ?? '').slice(0, 30),
      avatar_url: (body.avatar_url ?? '').slice(0, 500),
      website: (body.website ?? '').slice(0, 300),
    };

    const { data: profile, error: dbErr } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (dbErr) throw dbErr;

    return NextResponse.json({ profile });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
