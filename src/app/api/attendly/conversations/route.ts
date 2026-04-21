export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const channel = url.searchParams.get('channel');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ conversations: [], total: 0 });
    }

    let query = supabase
      .from('attendly_conversations')
      .select('*', { count: 'exact' })
      .eq('business_id', business.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (channel) query = query.eq('channel', channel);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      conversations: data || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
