import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: proposal } = await supabase
      .from('proposals')
      .select(
        'id, slug, client_name, project_title, scope, price_cents, deadline_days, valid_until, payment_terms, status, created_at, user_id',
      )
      .eq('slug', params.slug)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta nao encontrada' }, { status: 404 });
    }

    // fetch owner profile (do not expose user_id to the response)
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, title, email, phone, avatar_url, website')
      .eq('user_id', proposal.user_id)
      .maybeSingle();

    // fetch accept
    const { data: accept } = await supabase
      .from('proposal_accepts')
      .select('acceptor_name, accepted_at')
      .eq('proposal_id', proposal.id)
      .maybeSingle();

    // strip user_id from response
    const { user_id: _uid, ...publicProposal } = proposal;

    return NextResponse.json({
      proposal: publicProposal,
      profile: profile ?? null,
      accept: accept ?? null,
    });
  } catch (err) {
    console.error('public proposal GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
