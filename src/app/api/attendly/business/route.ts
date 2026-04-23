export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { buildAiContext } from '@/lib/attendly/ai-context';
import { normalizeHours } from '@/lib/attendly/hours';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data, error } = await supabase
      .from('attendly_businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      return NextResponse.json({ business: null });
    }

    return NextResponse.json({ business: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await request.json();

    const { data: existing } = await supabase
      .from('attendly_businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Negócio não encontrado. Use POST /api/attendly/setup.' }, { status: 404 });
    }

    // Merge updates
    const updates: Record<string, unknown> = {};
    const fields = ['name', 'category', 'phone', 'address', 'services', 'hours', 'faq',
      'voice_id', 'widget_config', 'whatsapp_number', 'owner_whatsapp',
      'owner_notify_channel', 'onboarding_step', 'status',
      'whatsapp_whitelist_enabled', 'whatsapp_whitelist', 'whatsapp_hours_only'] as const;

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Normalize hours on write so downstream (ai-context, webhook filter) always
    // sees canonical Record<'mon'|..., {open, close}> shape.
    if (updates.hours !== undefined) {
      updates.hours = normalizeHours(updates.hours);
    }

    if (updates.name !== undefined && (typeof updates.name !== 'string' || (updates.name as string).length > 200)) {
      return NextResponse.json({ error: 'Nome deve ter no máximo 200 caracteres' }, { status: 400 });
    }
    if (updates.services !== undefined && (!Array.isArray(updates.services) || (updates.services as any[]).length > 50)) {
      return NextResponse.json({ error: 'Máximo de 50 serviços' }, { status: 400 });
    }
    if (updates.faq !== undefined && (!Array.isArray(updates.faq) || (updates.faq as any[]).length > 30)) {
      return NextResponse.json({ error: 'Máximo de 30 perguntas frequentes' }, { status: 400 });
    }
    if (updates.whatsapp_whitelist !== undefined) {
      if (!Array.isArray(updates.whatsapp_whitelist) || (updates.whatsapp_whitelist as any[]).length > 100) {
        return NextResponse.json({ error: 'Whitelist: no máximo 100 números' }, { status: 400 });
      }
      updates.whatsapp_whitelist = (updates.whatsapp_whitelist as any[])
        .map((n) => String(n).replace(/\D/g, ''))
        .filter((n) => n.length >= 10 && n.length <= 15);
    }

    // Regenerate ai_context if business data changed
    const dataFields = ['name', 'category', 'phone', 'address', 'services', 'hours', 'faq'];
    const dataChanged = dataFields.some(f => body[f] !== undefined);
    if (dataChanged) {
      const merged = { ...existing, ...updates };
      updates.ai_context = buildAiContext({
        name: merged.name,
        category: merged.category,
        phone: merged.phone,
        address: merged.address,
        services: merged.services,
        hours: merged.hours,
        faq: merged.faq,
      });
    }

    const { data, error } = await supabase
      .from('attendly_businesses')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ business: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
