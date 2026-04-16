import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { goal_id?: string; status?: string; action?: 'delete' };
    if (!body.goal_id) return NextResponse.json({ error: 'goal_id obrigatorio' }, { status: 400 });

    const { userId, supabase } = await requireUser();

    if (body.action === 'delete') {
      await supabase.from('goals').delete().eq('id', body.goal_id).eq('user_id', userId);
      return NextResponse.json({ success: true });
    }

    if (body.status && ['active', 'achieved', 'abandoned'].includes(body.status)) {
      const update: Record<string, unknown> = { status: body.status };
      if (body.status === 'achieved') update.achieved_at = new Date().toISOString();
      await supabase.from('goals').update(update).eq('id', body.goal_id).eq('user_id', userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'action/status invalido' }, { status: 400 });
  } catch (err) {
    console.error('goal update error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
