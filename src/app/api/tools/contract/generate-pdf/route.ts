import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { generateContractPDF } from '@/lib/contract-pdf';
import type { ContractInput, ContractParty } from '@/lib/types/tools';

export const runtime = 'edge';

function validateParty(raw: unknown, role: string): ContractParty | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: `${role}: dados invalidos` };
  const p = raw as Record<string, unknown>;
  if (!['pf', 'pj'].includes(p.type as string)) return { error: `${role}: tipo invalido` };
  for (const k of ['name', 'document', 'address_street', 'address_city', 'address_state', 'address_zip']) {
    if (typeof p[k] !== 'string' || !(p[k] as string).trim()) return { error: `${role}: ${k} obrigatorio` };
  }
  return {
    type: p.type as 'pf' | 'pj',
    name: String(p.name).trim(),
    document: String(p.document).trim(),
    address_street: String(p.address_street).trim(),
    address_city: String(p.address_city).trim(),
    address_state: String(p.address_state).trim(),
    address_zip: String(p.address_zip).trim(),
    representative: p.representative ? String(p.representative).trim() : undefined,
    representative_document: p.representative_document ? String(p.representative_document).trim() : undefined,
  };
}

function validateInput(raw: unknown): ContractInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Input invalido' };
  const r = raw as Record<string, unknown>;

  const contractor = validateParty(r.contractor, 'CONTRATANTE');
  if ('error' in contractor) return contractor;
  const artist = validateParty(r.artist, 'CONTRATADO');
  if ('error' in artist) return artist;

  if (typeof r.show_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.show_date)) return { error: 'show_date invalida (use YYYY-MM-DD)' };
  if (typeof r.show_time !== 'string' || !/^\d{2}:\d{2}$/.test(r.show_time)) return { error: 'show_time invalido (use HH:MM)' };
  const duration = Number(r.show_duration_min);
  if (!Number.isFinite(duration) || duration < 10 || duration > 480) return { error: 'show_duration_min fora de faixa' };

  for (const k of ['venue_name', 'venue_address', 'event_type', 'forum_city', 'forum_state']) {
    if (typeof r[k] !== 'string' || !(r[k] as string).trim()) return { error: `${k} obrigatorio` };
  }

  const cache = Number(r.cache_total);
  if (!Number.isFinite(cache) || cache < 100) return { error: 'cache_total invalido (minimo R$1,00 em centavos)' };

  if (!['pix', 'transfer', 'cash', 'boleto'].includes(r.payment_method as string)) return { error: 'payment_method invalido' };

  const deposit = Number(r.deposit_percent);
  if (!Number.isFinite(deposit) || deposit < 0 || deposit > 100) return { error: 'deposit_percent entre 0 e 100' };

  if (!['before_show', 'on_show_day', 'after_show'].includes(r.balance_due_timing as string)) return { error: 'balance_due_timing invalido' };

  const recording = r.recording_allowed as string;
  if (!['prohibited', 'personal_only', 'promo_with_credit', 'full_rights'].includes(recording)) return { error: 'recording_allowed invalido' };

  const cancelLt7 = Number(r.cancel_fee_less_7_days);
  const cancel7to30 = Number(r.cancel_fee_7_to_30_days);
  const cancelGt30 = Number(r.cancel_fee_more_30_days);
  for (const [name, v] of [['cancel_fee_less_7_days', cancelLt7], ['cancel_fee_7_to_30_days', cancel7to30], ['cancel_fee_more_30_days', cancelGt30]] as const) {
    if (!Number.isFinite(v) || v < 0 || v > 100) return { error: `${name} deve ser 0-100` };
  }

  return {
    contractor,
    artist,
    show_date: r.show_date,
    show_time: r.show_time,
    show_duration_min: duration,
    venue_name: String(r.venue_name).trim(),
    venue_address: String(r.venue_address).trim(),
    event_type: String(r.event_type).trim(),
    has_opening_act: Boolean(r.has_opening_act),
    opening_act_name: r.opening_act_name ? String(r.opening_act_name).trim() : undefined,
    cache_total: Math.round(cache),
    payment_method: r.payment_method as ContractInput['payment_method'],
    deposit_percent: deposit,
    deposit_due_date: r.deposit_due_date ? String(r.deposit_due_date) : undefined,
    balance_due_timing: r.balance_due_timing as ContractInput['balance_due_timing'],
    provides_accommodation: Boolean(r.provides_accommodation),
    provides_transport: Boolean(r.provides_transport),
    provides_meals: Boolean(r.provides_meals),
    provides_equipment: Boolean(r.provides_equipment),
    provides_security: Boolean(r.provides_security),
    provides_promotion: Boolean(r.provides_promotion),
    cancel_fee_less_7_days: cancelLt7,
    cancel_fee_7_to_30_days: cancel7to30,
    cancel_fee_more_30_days: cancelGt30,
    recording_allowed: recording as ContractInput['recording_allowed'],
    streaming_allowed: Boolean(r.streaming_allowed),
    image_rights_for_promo: Boolean(r.image_rights_for_promo),
    has_exclusivity: Boolean(r.has_exclusivity),
    exclusivity_radius_km: r.exclusivity_radius_km ? Number(r.exclusivity_radius_km) : undefined,
    exclusivity_days_before: r.exclusivity_days_before ? Number(r.exclusivity_days_before) : undefined,
    forum_city: String(r.forum_city).trim(),
    forum_state: String(r.forum_state).trim(),
    extra_clauses: r.extra_clauses ? String(r.extra_clauses).trim() : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const validated = validateInput(raw);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const pdfBytes = await generateContractPDF(validated);
    let binaryString = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binaryString += String.fromCharCode(pdfBytes[i]);
    }
    const pdfBase64 = btoa(binaryString);

    const { data: generation } = await supabase.from('tool_generations').insert({
      user_id: dbUser.id,
      tool_key: 'contract',
      input: validated,
      output: { pdf_base64: pdfBase64 },
    }).select('id').single();

    return NextResponse.json({
      pdf_base64: pdfBase64,
      share_id: generation?.id ?? null,
    });
  } catch (err) {
    console.error('contract generate error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
