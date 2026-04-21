export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await requireUser();
    const { id } = params;
    const body = await request.json();

    if (!body.content) {
      return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const { data: conv } = await supabase
      .from('attendly_conversations')
      .select('id, business_id')
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const { data: msg, error } = await supabase
      .from('attendly_messages')
      .insert({
        conversation_id: id,
        role: 'human',
        content: body.content,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.rpc('increment_message_count', { conv_id: id });

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
