import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// GET publico pro link compartilhavel — retorna o PDF binario
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: generation } = await supabase
      .from('tool_generations')
      .select('input, output, tool_key')
      .eq('id', params.id)
      .eq('tool_key', 'rider')
      .single();

    if (!generation) {
      return new NextResponse('Rider nao encontrado', { status: 404 });
    }

    const pdfBase64 = (generation.output as { pdf_base64?: string })?.pdf_base64;
    if (!pdfBase64) {
      return new NextResponse('PDF nao disponivel', { status: 404 });
    }

    // Decodifica base64 para binario
    const binary = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));

    const artistName = (generation.input as { artist_name?: string })?.artist_name ?? 'rider';
    const safeFilename = artistName.replace(/[^a-zA-Z0-9\-_]/g, '_');

    return new NextResponse(binary, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="rider-${safeFilename}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('rider GET error:', err);
    return new NextResponse('Erro interno', { status: 500 });
  }
}
