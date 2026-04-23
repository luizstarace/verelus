import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, supabase } = await requireUser();

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const { data: views } = await supabase
      .from('proposal_views')
      .select('*')
      .eq('proposal_id', proposal.id)
      .order('viewed_at', { ascending: false });

    const { data: accept } = await supabase
      .from('proposal_accepts')
      .select('*')
      .eq('proposal_id', proposal.id)
      .maybeSingle();

    return NextResponse.json({ proposal, views: views ?? [], accept: accept ?? null });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await req.json();

    // only allow certain fields
    const allowed: Record<string, unknown> = {};
    if (body.client_name != null) allowed.client_name = String(body.client_name).slice(0, 200);
    if (body.project_title != null) allowed.project_title = String(body.project_title).slice(0, 300);
    if (body.scope != null) allowed.scope = String(body.scope).slice(0, 5000);
    if (body.price_cents != null) {
      const pc = Number(body.price_cents);
      if (!Number.isFinite(pc) || pc < 100) {
        return NextResponse.json({ error: 'price_cents deve ser >= 100' }, { status: 400 });
      }
      allowed.price_cents = pc;
    }
    if (body.deadline_days != null) {
      const dd = Number(body.deadline_days);
      if (!Number.isInteger(dd) || dd < 1 || dd > 365) {
        return NextResponse.json({ error: 'deadline_days deve ser entre 1 e 365' }, { status: 400 });
      }
      allowed.deadline_days = dd;
    }
    if (body.valid_until != null) allowed.valid_until = new Date(body.valid_until).toISOString();
    if (body.payment_terms != null) allowed.payment_terms = String(body.payment_terms).slice(0, 1000);
    if (body.status != null) {
      if (!['draft', 'sent'].includes(body.status)) {
        return NextResponse.json({ error: 'Status so pode ser draft ou sent' }, { status: 400 });
      }
      allowed.status = body.status;
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    allowed.updated_at = new Date().toISOString();

    const { data: proposal, error: dbErr } = await supabase
      .from('proposals')
      .update(allowed)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (dbErr) throw dbErr;
    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId, supabase } = await requireUser();

    const { error: dbErr } = await supabase
      .from('proposals')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId);

    if (dbErr) throw dbErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
