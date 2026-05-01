export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { rateLimit } from '@/lib/atalaia/rate-limit';
import { notifyOwnerEmail, buildSupportTicketEmail } from '@/lib/atalaia/notifications';

const ALLOWED_CATEGORIES = ['whatsapp_ban', 'whatsapp_disconnect', 'other'] as const;

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();
    const { data: tickets, error } = await supabase
      .from('atalaia_support_tickets')
      .select('id, category, message, status, created_at, resolved_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json({ tickets: tickets || [] });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, email, supabase } = await requireUser();

    // Rate-limit: 5 tickets per hour per user. Real support traffic is sparse;
    // this caps spam without blocking legitimate use.
    const rl = rateLimit(`support:${userId}`, 5, 3600_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitos pedidos seguidos. Tente novamente em 1 hora.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const category: string = typeof body.category === 'string' ? body.category : '';
    const message: string = typeof body.message === 'string' ? body.message.trim() : '';

    if (!ALLOWED_CATEGORIES.includes(category as typeof ALLOWED_CATEGORIES[number])) {
      return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Mensagem muito longa (máximo 2000 caracteres)' }, { status: 400 });
    }

    const { data: business, error: bizErr } = await supabase
      .from('atalaia_businesses')
      .select('id, name')
      .eq('user_id', userId)
      .maybeSingle();
    if (bizErr) throw bizErr;
    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const { data: ticket, error: insertErr } = await supabase
      .from('atalaia_support_tickets')
      .insert({
        business_id: business.id,
        user_id: userId,
        category,
        message,
      })
      .select('id, created_at')
      .single();

    if (insertErr) throw insertErr;

    const founderEmail = process.env.FOUNDER_EMAIL;
    if (founderEmail) {
      const emailData = buildSupportTicketEmail(
        business.name,
        email,
        category,
        message,
        ticket.id
      );
      emailData.to = founderEmail;
      notifyOwnerEmail(emailData).catch(() => {});
    }

    return NextResponse.json({ ticket_id: ticket.id, created_at: ticket.created_at });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
