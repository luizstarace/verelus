export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, corsResponse } from '@/lib/attendly/cors';

export async function OPTIONS() { return corsResponse(); }

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { business_id, customer_name, customer_phone } = body;

  if (!business_id || !customer_name) {
    return NextResponse.json({ error: 'business_id and customer_name required' }, { status: 400, headers: corsHeaders() });
  }

  const { data, error } = await supabase
    .from('attendly_conversations')
    .insert({
      business_id,
      channel: 'widget',
      customer_name,
      customer_phone: customer_phone || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500, headers: corsHeaders() });
  }

  return NextResponse.json({ conversation_id: data.id }, { status: 201, headers: corsHeaders() });
}
