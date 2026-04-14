import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { generateOnePagerPDF } from '@/lib/one-pager-pdf';
import type { PitchInput, PitchOutput } from '@/lib/types/tools';

export const runtime = 'edge';

/**
 * Recebe input + output previamente gerado e retorna PDF do 1-pager.
 * Nao chama Claude novamente — usa o texto que o usuario ja aprovou/editou.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { input?: PitchInput; output?: PitchOutput };
    if (!body.input || !body.output) {
      return NextResponse.json({ error: 'input e output obrigatorios' }, { status: 400 });
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

    const pdfBytes = await generateOnePagerPDF(body.input, body.output);
    let binaryString = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binaryString += String.fromCharCode(pdfBytes[i]);
    }
    const pdfBase64 = btoa(binaryString);

    return NextResponse.json({ pdf_base64: pdfBase64 });
  } catch (err) {
    console.error('one-pager pdf error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
