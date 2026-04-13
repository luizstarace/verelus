import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Rate limit: 20 messages/minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `Voce e o assistente virtual do Verelus, uma plataforma de inteligencia musical para artistas independentes.

Seu nome e "Vee" e voce ajuda os usuarios a entenderem e usarem a plataforma.

## Sobre o Verelus
O Verelus oferece ferramentas de IA para artistas independentes:
- **Analise** - Analise de perfil do artista e metricas do Spotify
- **Pitching** - Recomendacao de playlists e geracao de pitch com IA
- **EPK** - Kit de imprensa eletronico profissional
- **Imprensa** - Geracao de press releases com IA
- **Social** - Calendario e geracao de posts para redes sociais
- **Setlists** - Criacao de setlists com sugestoes de IA
- **Financeiro** - Controle de receitas e despesas
- **Contratos** - Geracao de contratos e riders tecnicos
- **Turnes** - Planejamento de turnes (plano Business)
- **Relatorios** - Relatorios mensais de performance

## Planos
- **Free** (R$0): Analise, Pitching (3/mes), EPK basico
- **Pro** (R$97/mes): Tudo do Free + Social, Imprensa, Setlists, Financeiro, Contratos, Relatorios, geracao ilimitada
- **Business** (R$297/mes): Tudo do Pro + Turnes, gestao multi-artista, suporte prioritario

## Regras
1. Responda SEMPRE em portugues brasileiro
2. Seja amigavel, direto e util
3. Se nao souber algo, admita e sugira contatar suporte em suporte@verelus.com
4. Nao invente funcionalidades que nao existem
5. Para problemas tecnicos, colete detalhes e sugira contato com suporte
6. Quando o usuario perguntar sobre funcionalidades de planos superiores, explique os beneficios e como fazer upgrade
7. Limite suas respostas a 200 palavras quando possivel`;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Muitas mensagens. Aguarde um momento.' }, { status: 429 });
  }

  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Limit conversation history to last 20 messages
    const recentMessages = messages.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 1000),
    }));

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({
        reply: 'Desculpe, o chat esta temporariamente indisponivel. Entre em contato pelo suporte@verelus.com.',
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: recentMessages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        reply: 'Desculpe, estou com dificuldades tecnicas no momento. Tente novamente em alguns instantes.',
      });
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text || 'Desculpe, nao consegui processar sua mensagem.';

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({
      reply: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    });
  }
}
