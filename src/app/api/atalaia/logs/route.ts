export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(request: Request) {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const url = new URL(request.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const statusCode = url.searchParams.get('status_code');
    const endpoint = url.searchParams.get('endpoint');
    const onlyErrors = url.searchParams.get('only_errors') === '1';

    let query = supabase
      .from('atalaia_logs')
      .select('id, endpoint, channel, tokens_used, latency_ms, status_code, error, created_at')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusCode) {
      const code = parseInt(statusCode, 10);
      if (Number.isFinite(code)) query = query.eq('status_code', code);
    }
    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }
    if (onlyErrors) {
      query = query.gte('status_code', 400);
    }

    const { data: logs, error } = await query;
    if (error) throw error;

    return NextResponse.json({ logs: logs || [] });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
