import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireUser();

    // check pro tier
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('plan', ['pro', 'business'])
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: 'Recurso disponível apenas para assinantes Pro ou Business.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const project_title = body.project_title?.trim();
    const client_name = body.client_name?.trim();

    if (!project_title) {
      return NextResponse.json({ error: 'project_title obrigatório' }, { status: 400 });
    }

    const prompt = `Você é um consultor de projetos para freelancers brasileiros.
Com base no título do projeto "${project_title}"${client_name ? ` para o cliente "${client_name}"` : ''},
sugira de 4 a 6 entregáveis (deliverables) claros e objetivos para o escopo da proposta.
Responda em português brasileiro, em formato de lista com marcadores.
Seja conciso e profissional.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Claude API error:', errBody);
      return NextResponse.json({ error: 'Erro ao gerar sugestão' }, { status: 502 });
    }

    const data = await response.json();
    const suggestion =
      data.content?.[0]?.text ?? 'Não foi possível gerar sugestão.';

    return NextResponse.json({ suggestion });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
