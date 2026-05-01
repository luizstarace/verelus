import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const body = await req.json();
    const acceptor_name = body.acceptor_name?.trim();

    if (!acceptor_name) {
      return NextResponse.json({ error: 'acceptor_name obrigatorio' }, { status: 400 });
    }

    // fetch proposal
    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, user_id, project_title, client_name, price_cents, status')
      .eq('slug', params.slug)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    if (proposal.status === 'accepted') {
      return NextResponse.json({ error: 'Proposta ja foi aceita' }, { status: 409 });
    }

    const acceptor_ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    // insert accept
    const { error: acceptErr } = await supabase
      .from('proposal_accepts')
      .insert({
        proposal_id: proposal.id,
        acceptor_name: acceptor_name.slice(0, 200),
        acceptor_ip,
      });

    if (acceptErr) throw acceptErr;

    // update proposal status
    await supabase
      .from('proposals')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', proposal.id);

    // send email to owner
    (async () => {
      try {
        const { data: owner } = await supabase
          .from('users')
          .select('email')
          .eq('id', proposal.user_id)
          .single();

        if (!owner?.email || !process.env.RESEND_API_KEY) return;

        const priceBRL = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(proposal.price_cents / 100);

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Atalaia <atalaia@verelus.com>',
            to: [owner.email],
            subject: `Proposta aceita: ${proposal.project_title}`,
            html: `<p>Sua proposta <strong>${proposal.project_title}</strong> para <strong>${proposal.client_name}</strong> foi aceita por <strong>${acceptor_name}</strong>.</p><p>Valor: <strong>${priceBRL}</strong></p>`,
          }),
        });
      } catch {
        // silently ignore
      }
    })();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('accept error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
