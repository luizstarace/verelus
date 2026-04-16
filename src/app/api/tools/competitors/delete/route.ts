import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { competitor_id?: string };
    if (!body.competitor_id) return NextResponse.json({ error: 'competitor_id obrigatorio' }, { status: 400 });

    const { userId, supabase } = await requireUser();

    const { error: delErr } = await supabase
      .from('competitors')
      .delete()
      .eq('id', body.competitor_id)
      .eq('user_id', userId);

    if (delErr) return NextResponse.json({ error: 'Falha ao deletar' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('delete competitor error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
