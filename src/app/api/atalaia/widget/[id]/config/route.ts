export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, corsResponse } from '@/lib/atalaia/cors';

export async function OPTIONS() { return corsResponse(); }

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: business } = await supabase
    .from('atalaia_businesses')
    .select('id, name, status, widget_config, hours')
    .eq('id', params.id)
    .single();

  if (!business || business.status !== 'active') {
    return NextResponse.json({ error: 'Widget not available' }, { status: 404, headers: corsHeaders() });
  }

  return NextResponse.json({
    business_id: business.id,
    name: business.name,
    greeting: business.widget_config?.greeting || 'Olá! Como posso ajudar?',
    color: business.widget_config?.color || '#1e3a5f',
    position: business.widget_config?.position || 'bottom-right',
    hours: business.hours,
  }, {
    headers: { 'Cache-Control': 'public, max-age=300', ...corsHeaders() },
  });
}
