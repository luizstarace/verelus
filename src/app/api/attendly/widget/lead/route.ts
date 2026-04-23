export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, corsResponse } from '@/lib/attendly/cors';
import { rateLimit, getRateLimitHeaders } from '@/lib/attendly/rate-limit';

export async function OPTIONS() { return corsResponse(); }

export async function POST(request: Request) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(clientIp, 10, 60000); // 10 requests per minute per IP
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Limite de requisições excedido. Tente novamente em 1 minuto.' },
      { status: 429, headers: { ...corsHeaders(), ...getRateLimitHeaders(rl.remaining, 10) } }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders() });
  }
  const { business_id, customer_name, customer_phone } = body;

  // Strict input validation — public endpoint, assume hostile.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof business_id !== 'string' || !UUID_RE.test(business_id)) {
    return NextResponse.json({ error: 'Invalid business_id' }, { status: 400, headers: corsHeaders() });
  }
  if (typeof customer_name !== 'string' || customer_name.trim().length === 0 || customer_name.length > 120) {
    return NextResponse.json({ error: 'customer_name required (1-120 chars)' }, { status: 400, headers: corsHeaders() });
  }
  if (customer_phone !== undefined && customer_phone !== null) {
    if (typeof customer_phone !== 'string' || customer_phone.length > 30) {
      return NextResponse.json({ error: 'Invalid customer_phone' }, { status: 400, headers: corsHeaders() });
    }
  }

  // Block lead capture for inactive businesses to prevent orphan conversations
  // on paused/setup businesses + reconnaissance via 200-vs-404 timing.
  const { data: business } = await supabase
    .from('attendly_businesses')
    .select('status')
    .eq('id', business_id)
    .single();

  if (!business || business.status !== 'active') {
    return NextResponse.json({ error: 'Atendente indisponível' }, { status: 404, headers: corsHeaders() });
  }

  const { data, error } = await supabase
    .from('attendly_conversations')
    .insert({
      business_id,
      channel: 'widget',
      customer_name: customer_name.trim(),
      customer_phone: customer_phone || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500, headers: corsHeaders() });
  }

  return NextResponse.json({ conversation_id: data.id }, { status: 201, headers: corsHeaders() });
}
