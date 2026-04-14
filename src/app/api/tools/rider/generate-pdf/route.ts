import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { generateRiderPDF } from '@/lib/rider-pdf';
import type { RiderInput, MusicianSpec, StageTemplate } from '@/lib/types/tools';
import { STAGE_TEMPLATES } from '@/lib/types/tools';

// NOTA: Next.js edge runtime tem limites de tamanho de bundle.
// pdf-lib funciona em edge mas adiciona ~300kb. Funciona.
export const runtime = 'edge';

function validateMusician(raw: unknown, index: number): MusicianSpec | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: `Musico ${index + 1}: dados invalidos` };
  const m = raw as Record<string, unknown>;
  if (typeof m.role !== 'string' || !m.role.trim()) return { error: `Musico ${index + 1}: role obrigatorio` };
  if (typeof m.instrument !== 'string' || !m.instrument.trim()) return { error: `Musico ${index + 1}: instrument obrigatorio` };
  return {
    role: String(m.role).trim(),
    instrument: String(m.instrument).trim(),
    needs_mic: Boolean(m.needs_mic),
    needs_monitor: Boolean(m.needs_monitor),
    needs_di: Boolean(m.needs_di),
    notes: m.notes ? String(m.notes).trim() : undefined,
  };
}

function validateInput(raw: unknown): RiderInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Input invalido' };
  const r = raw as Record<string, unknown>;

  if (typeof r.artist_name !== 'string' || !r.artist_name.trim()) return { error: 'artist_name obrigatorio' };
  if (typeof r.contact_name !== 'string' || !r.contact_name.trim()) return { error: 'contact_name obrigatorio' };
  if (typeof r.contact_email !== 'string' || !r.contact_email.trim()) return { error: 'contact_email obrigatorio' };
  if (typeof r.contact_phone !== 'string' || !r.contact_phone.trim()) return { error: 'contact_phone obrigatorio' };

  if (typeof r.stage_template !== 'string' || !(r.stage_template in STAGE_TEMPLATES)) {
    return { error: 'stage_template invalido' };
  }

  if (!Array.isArray(r.musicians) || r.musicians.length === 0) return { error: 'Informe ao menos 1 musico' };
  const musicians: MusicianSpec[] = [];
  for (let i = 0; i < r.musicians.length; i++) {
    const validated = validateMusician(r.musicians[i], i);
    if ('error' in validated) return validated;
    musicians.push(validated);
  }

  const pa = Number(r.pa_minimum_watts);
  if (!Number.isFinite(pa) || pa <= 0) return { error: 'pa_minimum_watts deve ser > 0' };

  if (!['basic', 'scenic', 'custom'].includes(r.lighting as string)) return { error: 'lighting invalido' };

  const soundcheck = Number(r.soundcheck_minutes);
  if (![30, 60, 90, 120].includes(soundcheck)) return { error: 'soundcheck_minutes deve ser 30, 60, 90 ou 120' };

  const mealsCount = Number(r.meals_count ?? 0);

  return {
    artist_name: String(r.artist_name).trim(),
    contact_name: String(r.contact_name).trim(),
    contact_email: String(r.contact_email).trim(),
    contact_phone: String(r.contact_phone).trim(),
    stage_template: r.stage_template as StageTemplate,
    musicians,
    pa_minimum_watts: pa,
    lighting: r.lighting as RiderInput['lighting'],
    lighting_notes: r.lighting_notes ? String(r.lighting_notes).trim() : undefined,
    soundcheck_minutes: soundcheck as RiderInput['soundcheck_minutes'],
    dressing_room: Boolean(r.dressing_room),
    meals_needed: Boolean(r.meals_needed),
    meals_count: mealsCount,
    accommodation: Boolean(r.accommodation),
    accommodation_details: r.accommodation_details ? String(r.accommodation_details).trim() : undefined,
    transport_notes: r.transport_notes ? String(r.transport_notes).trim() : undefined,
    special_technical_notes: r.special_technical_notes ? String(r.special_technical_notes).trim() : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const validated = validateInput(raw);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    // Auth
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

    // Gerar PDF
    const pdfBytes = await generateRiderPDF(validated);
    // Encode base64 sem spread (edge runtime pode limitar stack com arrays grandes)
    let binaryString = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binaryString += String.fromCharCode(pdfBytes[i]);
    }
    const pdfBase64 = btoa(binaryString);

    // Salvar no historico (input + base64 do PDF)
    const { data: generation } = await supabase.from('tool_generations').insert({
      user_id: dbUser.id,
      tool_key: 'rider',
      input: validated,
      output: { pdf_base64: pdfBase64 },
    }).select('id').single();

    const shareId = generation?.id ?? null;

    return NextResponse.json({
      pdf_base64: pdfBase64,
      share_id: shareId,
    });
  } catch (err) {
    console.error('rider generate error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
