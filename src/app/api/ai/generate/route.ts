import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, sanitize, SYSTEM_PROMPTS, VALID_TYPES, generateFallback } from '@/lib/ai-helpers';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { type, context } = body;

    if (!type || typeof type !== 'string' || !VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
    }

    if (!context || typeof context !== 'object') {
      return NextResponse.json({ error: 'Context object is required' }, { status: 400 });
    }

    // Build artist profile context if provided
    const profile = context.artistProfile;
    let artistContext = '';
    if (profile && typeof profile === 'object') {
      const parts = [];
      if (profile.band_name) parts.push(`Artista: ${sanitize(profile.band_name, 200)}`);
      if (profile.genre) parts.push(`Genero: ${sanitize(profile.genre, 100)}`);
      if (profile.bio) parts.push(`Bio: ${sanitize(profile.bio, 500)}`);
      if (profile.city) parts.push(`Cidade: ${sanitize(profile.city, 100)}`);
      if (profile.country) parts.push(`Pais: ${sanitize(profile.country, 100)}`);
      if (profile.artist_type) parts.push(`Tipo: ${sanitize(profile.artist_type, 50)}`);
      if (parts.length > 0) {
        artistContext = `\n<artist_profile>\n${parts.join('\n')}\n</artist_profile>\n`;
      }
    }

    const systemPrompt = SYSTEM_PROMPTS[type] + (artistContext
      ? `\n\nVoce esta gerando conteudo para o seguinte artista. Use essas informacoes para personalizar o resultado:${artistContext}`
      : '');
    let userPrompt = '';

    switch (type) {
      case 'press_release':
        userPrompt = `Gere um press release para o artista a seguir sobre o tema indicado.\n<user_input>\nArtista: ${sanitize(context.artistName, 200) || 'Artista'}\nTema: ${sanitize(context.topic, 500) || 'novo lançamento'}\n</user_input>`;
        break;
      case 'social_post':
        userPrompt = `Crie um post para a plataforma e tema indicados.\n<user_input>\nPlataforma: ${sanitize(context.platform, 50) || 'Instagram'}\nTema: ${sanitize(context.theme, 500) || 'novo lançamento'}\n</user_input>`;
        break;
      case 'setlist':
        userPrompt = `Crie um setlist com as especificações a seguir.\n<user_input>\nTipo de evento: ${sanitize(context.eventType, 100) || 'Show'}\nDuração: ${Math.min(Math.max(Number(context.duration) || 60, 15), 360)} minutos\nNotas: ${sanitize(context.notes, 500)}\n</user_input>`;
        break;
      case 'budget_report': {
        const transactions = Array.isArray(context.transactions) ? context.transactions.slice(0, 200) : [];
        userPrompt = `Analise estas transações e gere um relatório financeiro:\n<user_input>\n${JSON.stringify(transactions, null, 2)}\n</user_input>`;
        break;
      }
      case 'contract':
        userPrompt = `Gere um documento contratual com as especificações a seguir.\n<user_input>\nTipo: ${sanitize(context.contractType, 200) || 'Contrato'}\nDetalhes: ${sanitize(context.details, 1000)}\n</user_input>`;
        break;
      case 'monthly_report':
        userPrompt = `Gere um relatório mensal completo para o período indicado.\n<user_input>\nPeríodo: ${sanitize(context.period, 100) || 'mês atual'}\n</user_input>`;
        break;
      case 'tour_plan':
        userPrompt = `Planeje uma turnê com as especificações a seguir.\n<user_input>\nRegião: ${sanitize(context.region, 200) || 'Brasil'}\nNúmero de datas: ${Math.min(Math.max(Number(context.numDates) || 5, 1), 30)}\n</user_input>`;
        break;
      default:
        userPrompt = `<user_input>\n${sanitize(JSON.stringify(context), 2000)}\n</user_input>`;
    }

    // Use Anthropic API if available, otherwise generate a structured template
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey) {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.content?.[0]?.text || 'Erro ao processar resposta da IA.';
        return NextResponse.json({ content });
      }
    }

    // Fallback: generate structured template without AI
    const content = generateFallback(type, context);
    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
