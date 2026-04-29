export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await requireUser();
    const { id } = params;
    const body = await request.json();

    const validStatuses = ['active', 'human_needed', 'closed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `Status inválido. Use: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { status: body.status };
    if (body.status === 'closed') {
      updates.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('atalaia_conversations')
      .update(updates)
      .eq('id', id)
      .eq('business_id', business.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ conversation: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
