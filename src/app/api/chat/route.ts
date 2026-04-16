import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Rate limit: 20 messages/minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 100) {
    Array.from(rateLimitMap.entries()).forEach(([k, v]) => {
      if (now > v.resetAt) rateLimitMap.delete(k);
    });
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `Voce e o assistente virtual do Verelus, uma caixa de ferramentas para musicos independentes brasileiros.

Seu nome e "Vee" e voce ajuda os usuarios a entenderem e usarem as ferramentas.

## As 11 ferramentas do Verelus
1. **Bio Adaptativa** - 4 bios profissionais (Spotify, Instagram, EPK, Twitter)
2. **Calculadora de Cache** - Quanto cobrar por show + break-even
3. **Rider Tecnico** - PDF com diagrama de palco editavel
4. **Contrato de Show** - Contrato juridico BR pronto pra assinatura
5. **Pitch Kit** - Email + 1-pager + press release pra curador
6. **Quando Lancar** - 3 datas ideais pro proximo lancamento
7. **Checklist de Lancamento** - 27 itens em 6 fases (8 sem antes ao pos-release)
8. **Growth Tracker** - Painel semanal Spotify/YouTube/IG/TikTok + email com insights IA
9. **Comparador de Concorrentes** - Voce vs ate 10 artistas similares
10. **Meta Tracker** - Metas com projecao de ritmo e ETA
11. **Cronograma de Posts** - 30 dias de posts coordenados pro lancamento

## Planos
- **Free** (R$0): Todas as 11 ferramentas, 1 geracao por ferramenta por mes
- **Pro** (R$29/mes): Tudo ilimitado + email semanal + ate 10 competidores

## Regras
1. Responda SEMPRE em portugues brasileiro
2. Seja amigavel, direto e util
3. Se nao souber algo, sugira contatar suporte@verelus.com
4. Nao invente funcionalidades que nao existem
5. Limite suas respostas a 200 palavras quando possivel`;

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
