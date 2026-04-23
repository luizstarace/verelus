export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { buildAiContext } from '@/lib/attendly/ai-context';
import { normalizeHours } from '@/lib/attendly/hours';

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await request.json();

    const { name, category, phone, address, services, hours, faq } = body;
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 200) {
      return NextResponse.json({ error: 'Nome deve ter entre 1 e 200 caracteres' }, { status: 400 });
    }
    if (services && (!Array.isArray(services) || services.length > 50)) {
      return NextResponse.json({ error: 'Máximo de 50 serviços' }, { status: 400 });
    }
    if (faq && (!Array.isArray(faq) || faq.length > 30)) {
      return NextResponse.json({ error: 'Máximo de 30 perguntas frequentes' }, { status: 400 });
    }

    // Check if business already exists
    const { data: existing } = await supabase
      .from('attendly_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Negócio já cadastrado. Use PATCH para atualizar.' }, { status: 409 });
    }

    // Normalize hours to canonical Record<'mon'|...,{open,close}> on write.
    const normalizedHours = normalizeHours(hours);

    const businessData = { name, category, phone, address, services: services || [], hours: normalizedHours, faq: faq || [] };
    const ai_context = buildAiContext(businessData);

    const { data, error } = await supabase
      .from('attendly_businesses')
      .insert({
        user_id: userId,
        name,
        category: category || null,
        phone: phone || null,
        address: address || null,
        services: services || [],
        hours: normalizedHours,
        faq: faq || [],
        ai_context,
        onboarding_step: 2,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ business: data }, { status: 201 });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
