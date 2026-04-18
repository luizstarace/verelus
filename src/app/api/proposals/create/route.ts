import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { generateSlug } from '@/lib/proposal-slug';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await req.json();

    // --- validation ---
    const client_name = body.client_name?.trim();
    const project_title = body.project_title?.trim();
    const scope = body.scope?.trim();
    if (!client_name || !project_title || !scope) {
      return NextResponse.json(
        { error: 'client_name, project_title e scope sao obrigatorios' },
        { status: 400 },
      );
    }

    const price_cents = Number(body.price_cents);
    if (!Number.isFinite(price_cents) || price_cents < 100) {
      return NextResponse.json(
        { error: 'price_cents deve ser >= 100' },
        { status: 400 },
      );
    }

    const deadline_days = Number(body.deadline_days);
    if (!Number.isInteger(deadline_days) || deadline_days < 1 || deadline_days > 365) {
      return NextResponse.json(
        { error: 'deadline_days deve ser entre 1 e 365' },
        { status: 400 },
      );
    }

    // --- free tier check ---
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('plan', ['pro', 'business'])
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!sub) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth);

      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          { error: 'Limite de 3 propostas/mes no plano gratuito. Faca upgrade para Pro.' },
          { status: 403 },
        );
      }
    }

    // --- build row ---
    const slug = generateSlug();

    const valid_until = body.valid_until
      ? new Date(body.valid_until).toISOString()
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    const row = {
      user_id: userId,
      slug,
      client_name: client_name.slice(0, 200),
      client_email: (body.client_email ?? '').slice(0, 200),
      project_title: project_title.slice(0, 300),
      scope: scope.slice(0, 5000),
      price_cents,
      deadline_days,
      valid_until,
      payment_terms: (body.payment_terms ?? '').slice(0, 1000),
      status: 'draft' as const,
    };

    const { data: proposal, error: dbErr } = await supabase
      .from('proposals')
      .insert(row)
      .select('*')
      .single();

    if (dbErr) throw dbErr;

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
