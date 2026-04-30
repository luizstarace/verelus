export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const body = await req.json();
    const proposal_id = body.proposal_id;
    if (!proposal_id) {
      return NextResponse.json({ error: 'proposal_id obrigatorio' }, { status: 400 });
    }

    const viewer_ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';
    const user_agent = (req.headers.get('user-agent') ?? 'unknown').slice(0, 500);

    const { data: view, error: viewErr } = await supabase
      .from('proposal_views')
      .insert({
        proposal_id,
        viewer_ip,
        user_agent,
        duration_seconds: 0,
      })
      .select('id')
      .single();

    if (viewErr) throw viewErr;

    // update proposal status if draft or sent
    await supabase
      .from('proposals')
      .update({ status: 'viewed', updated_at: new Date().toISOString() })
      .eq('id', proposal_id)
      .in('status', ['draft', 'sent']);

    // fire-and-forget email notification
    (async () => {
      try {
        const { data: proposal } = await supabase
          .from('proposals')
          .select('user_id, project_title, client_name')
          .eq('id', proposal_id)
          .single();

        if (!proposal) return;

        const { data: owner } = await supabase
          .from('users')
          .select('email')
          .eq('id', proposal.user_id)
          .single();

        if (!owner?.email || !process.env.RESEND_API_KEY) return;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Atalaia <contato@atalaia.verelus.com>',
            to: [owner.email],
            subject: `Proposta visualizada: ${proposal.project_title}`,
            html: `<p>Sua proposta <strong>${proposal.project_title}</strong> para <strong>${proposal.client_name}</strong> foi visualizada.</p>`,
          }),
        });
      } catch {
        // silently ignore email errors
      }
    })();

    return NextResponse.json({ view_id: view.id });
  } catch (err) {
    console.error('track/view error:', err);
    // never fail visibly
    return NextResponse.json({ ok: true });
  }
}
