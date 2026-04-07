import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPTS: Record<string, string> = {
  press_release: `Voc\u00ea \u00e9 um assessor de imprensa especializado na ind\u00fastria musical brasileira.
Gere press releases profissionais, envolventes e otimizados para m\u00eddia.
Escreva em portugu\u00eas brasileiro, com tom profissional mas acess\u00edvel.
Inclua: t\u00edtulo chamativo, lead, corpo com cita\u00e7\u00f5es fict\u00edcias do artista, informa\u00e7\u00f5es de contato placeholder.`,

  social_post: `Voc\u00ea \u00e9 um social media manager especializado em m\u00fasica.
Crie posts envolventes, com hashtags relevantes e call-to-actions.
Adapte o tom e formato para a plataforma especificada.
Escreva em portugu\u00eas brasileiro.`,

  setlist: `Voc\u00ea \u00e9 um diretor musical experiente.
Crie setlists profissionais considerando din\u00e2mica do show, energia do p\u00fablico e transi\u00e7\u00f5es entre m\u00fasicas.
Sugira ordem de m\u00fasicas com tempos estimados e notas sobre transi\u00e7\u00f5es.
Escreva em portugu\u00eas brasileiro.`,

  budget_report: `Voc\u00ea \u00e9 um consultor financeiro especializado na ind\u00fastria musical.
Analise as transa\u00e7\u00f5es fornecidas e gere um relat\u00f3rio financeiro detalhado com:
- Resumo executivo
- An\u00e1lise de receitas por categoria
- An\u00e1lise de despesas por categoria
- Tend\u00eancias e padr\u00f5es
- Recomenda\u00e7\u00f5es para otimiza\u00e7\u00e3o financeira
Escreva em portugu\u00eas brasileiro. Use valores em R$.`,

  contract: `Voc\u00ea \u00e9 um advogado especializado em direito do entretenimento e ind\u00fastria musical brasileira.
Gere documentos contratuais profissionais e completos, adaptados ao tipo solicitado.
Inclua cl\u00e1usulas padr\u00e3o da ind\u00fastria, espa\u00e7os para preenchimento de dados espec\u00edficos.
Escreva em portugu\u00eas brasileiro. Use formata\u00e7\u00e3o clara com numera\u00e7\u00e3o de cl\u00e1usulas.`,

  monthly_report: `Voc\u00ea \u00e9 um gerente de carreira musical.
Gere um relat\u00f3rio mensal completo com:
- Resumo do per\u00edodo
- M\u00e9tricas de streaming (simuladas se n\u00e3o dispon\u00edveis)
- Atividades de pitching e resultados
- An\u00e1lise financeira
- Presen\u00e7a nas redes sociais
- Metas para o pr\u00f3ximo per\u00edodo
- Recomenda\u00e7\u00f5es estrat\u00e9gicas
Escreva em portugu\u00eas brasileiro.`,

  tour_plan: `Voc\u00ea \u00e9 um tour manager experiente no mercado musical brasileiro.
Crie um plano de turn\u00ea detalhado para a regi\u00e3o especificada, incluindo:
- Cidades sugeridas com justificativa
- Venues recomendados (nomes fict\u00edcios realistas)
- Datas sugeridas com espa\u00e7amento adequado
- Estimativa de cach\u00ea por data
- Log\u01edstica de transporte entre cidades
- Dicas espec\u00edficas para cada pra\u00e7a
Escreva em portugu\u00eas brasileiro. Use valores em R$.`,
};

export async function POST(request: NextRequest) {
  try {
    const { type, context } = await request.json();

    const systemPrompt = SYSTEM_PROMPTS[type];
    if (!systemPrompt) {
      return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
    }

    let userPrompt = '';

    switch (type) {
      case 'press_release':
        userPrompt = `Gere um press release para o artista "${context.artistName || 'Artista'}" sobre o tema: ${context.topic || 'novo lan\u00e7amento'}`;
        break;\n      case 'social_post':
        userPrompt = `Crie um post para ${context.platform || 'Instagram'} sobre: ${context.theme || 'novo lan\u00e7amento'}`;
        break;
      case 'setlist':
        userPrompt = `Crie um setlist para um ${context.eventType || 'Show'} com dura\u00e7\u00e3o de ${context.duration || 60} minutos${context.notes ? '. Notas adicionais: ' + context.notes : ''}`;
        break;
      case 'budget_report':
        userPrompt = `Analise estas transa\u00e7\u00f5es e gere um relat\u00f3rio financeiro:\n${JSON.stringify(context.transactions || [], null, 2)}`;
        break;
      case 'contract':
        userPrompt = `Gere um documento do tipo "${context.contractType || 'Contrato'}"${context.details ? '. Detalhes: ' + context.details : ''}`;
        break;
      case 'monthly_report':
        userPrompt = `Gere um relat\u00f3rio mensal completo para o per\u00edodo: ${context.period || 'm\u00eas atual'}`;
        break;
      case 'tour_plan':
        userPrompt = `Planeje uma turn\u00ea pela regi\u00e3o "${context.region || 'Brasil'}" com ${context.numDates || 5} datas`;
        break;
      default:
        userPrompt = JSON.stringify(context);
    }

    // Use Anthropic API if available, otherwise generate a structured template
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey) {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'z-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body:  JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
        if (agRes.ok) {
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

function generateFallback(type: string, context: Record<string, unknown>): string {
  const now = new Date().toLocaleDateString('pt-BR');

  switch (type) {
    case 'press_release':
      return `PRESS RELEASE
Data: ${now}

${(context.artistName as string) || 'Artista'} anuncia ${(context.topic as string) || 'novo lan\u00e7amento'}

[Cidade, Estado] - ${(context.artistName as string) || 'O artista'} acaba de anunciar ${(context.topic as string) || 'um novo projeto'}.

O projeto marca uma nova fase na carreira, trazendo sonoridades inovadoras e colabora\u00e7\u00f5es in\u00e9ditas.

"Estou muito empolgado(a) com esse novo momento. \u00c9 um trabalho que representa muito do que eu acredito musicalmente", afirma ${(context.artistName as string) || 'o artista'}.

Para mais informa\u00e7\u00f5es:
Assessoria de Imprensa: [Nome]
Email: [email@exemplo.com]
Telefone: [+55 11 99999-9999]

---
Configure sua chave ANTHROPIC_API_KEY para gerar conte\u00fado personalizado com IA.`;

    case 'social_post':
      return `[Post para ${(context.platform as string) || 'Instagram'}]

${(context.theme as string) || 'Novidades vindo a\u00ed!'}

Fiquem ligados que tem muita coisa boa chegando!

#M\u00fasica #NovoProjeto #Arte #Brasil

---
Configure sua chave ANTHROPIC_API_KEY para gerar conte\u00fado personalizado com IA.`;

    case 'setlist':
      return `SETLIST - ${(context.eventType as string) || 'Show'}
Dura\u00e7\u00e3o: ${(context.duration as number) || 60} minutos

1. [Abertura / Intro] - 3 min
2. [M\u00fasica Energ\u00e9tica] - 4 min
3. [Hit Principal] - 4 min
4. [M\u00fasica Nova] - 4 min
5. [Momento Ac\u00fastico] - 5 min
6. [M\u00fasica Animada] - 4 min
7. [Participa\u00e7\u00e3o Especial] - 5 min
8. [Bloco de Hits] - 12 min
9. [M\u00fasica Emotiva] - 5 min
10. [Encerramento / Bis= - 5 min

Notas: Adicione suas m\u00fasicas aos slots acima.

---
Configure sua chave ANTHROPIC_API_KEY para gerar setlists personalizados com IA.`;

    case 'tour_plan':
      return `PLANO DE TURN\u00c9 - ${(context.region as string) || 'Brasil'}
${(context.numDates as number) || 5} datas sugeridas

Data 1: [Cidade Principal] - Venue Grande - R$ 5.000
Data 2: [Cidade Secund\u00e1ria] - Bar/Casa de Shows - R$ 2.500
Data 3: [Capital Regional] - Teatro - R$ 3.500
Data 4: [Cidade Universit\u00e1ria] - Pub/Festival - R$ 2.000
Data 5: [Cidade Tur\u00edstica] - Venue M\u00e9dio - R$ 3.000

Total Estimado: R$ 16.000

Log\u00edstica:
- Transporte entre cidades: van ou carro
- Hospedagem: 2 di\u00e1rias estimadas por data
- Alimenta\u00e7\u00e3o: rider hospitality

---
Configure sua chave ANTHROPIC_API_KEY para gerar planos de turn\u00ea detalhados com IA.`;

    default:
      return `Conte\u00fado gerado em ${now}.

Configure sua chave ANTHROPIC_API_KEY nas vari\u00e1veis de ambiente para ativar a gera\u00e7\u00e3o de conte\u00fado com IA.`;
  }
}
