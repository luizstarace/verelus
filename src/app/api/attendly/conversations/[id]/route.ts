export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await requireUser();
    const { id } = params;

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const { data: conversation, error: convErr } = await supabase
      .from('attendly_conversations')
      .select('*')
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const { data: messages, error: msgErr } = await supabase
      .from('attendly_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    return NextResponse.json({ conversation, messages: messages || [] });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
