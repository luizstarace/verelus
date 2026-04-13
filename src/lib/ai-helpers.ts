// AI generation helpers extracted for testability

// Simple in-memory rate limiter (edge-compatible)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/** Reset rate limiter state (for testing) */
export function resetRateLimiter(): void {
  rateLimitMap.clear();
}

// Sanitize user input to prevent prompt injection
export function sanitize(value: unknown, maxLength = 500): string {
  if (value == null) return '';
  const str = String(value).slice(0, maxLength);
  // Remove characters that could be used to break out of prompt context
  return str.replace(/[<>]/g, '');
}

export const SYSTEM_PROMPTS: Record<string, string> = {
  press_release: `Você é um assessor de imprensa especializado na indústria musical brasileira.
Gere press releases profissionais, envolventes e otimizados para mídia.
Escreva em português brasileiro, com tom profissional mas acessível.
Inclua: título chamativo, lead, corpo com citações fictícias do artista, informações de contato placeholder.`,

  social_post: `Você é um social media manager especializado em música.
Crie posts envolventes, com hashtags relevantes e call-to-actions.
Adapte o tom e formato para a plataforma especificada.
Escreva em português brasileiro.`,

  setlist: `Você é um diretor musical experiente.
Crie setlists profissionais considerando dinâmica do show, energia do público e transições entre músicas.
Sugira ordem de músicas com tempos estimados e notas sobre transições.
Escreva em português brasileiro.`,

  budget_report: `Você é um consultor financeiro especializado na indústria musical.
Analise as transações fornecidas e gere um relatório financeiro detalhado com:
- Resumo executivo
- Análise de receitas por categoria
- Análise de despesas por categoria
- Tendências e padrões
- Recomendações para otimização financeira
Escreva em português brasileiro. Use valores em R$.`,

  contract: `Você é um advogado especializado em direito do entretenimento e indústria musical brasileira.
Gere documentos contratuais profissionais e completos, adaptados ao tipo solicitado.
Inclua cláusulas padrão da indústria, espaços para preenchimento de dados específicos.
Escreva em português brasileiro. Use formatação clara com numeração de cláusulas.`,

  monthly_report: `Você é um gerente de carreira musical.
Gere um relatório mensal completo com:
- Resumo do período
- Métricas de streaming (simuladas se não disponíveis)
- Atividades de pitching e resultados
- Análise financeira
- Presença nas redes sociais
- Metas para o próximo período
- Recomendações estratégicas
Escreva em português brasileiro.`,

  tour_plan: `Você é um tour manager experiente no mercado musical brasileiro.
Crie um plano de turnê detalhado para a região especificada, incluindo:
- Cidades sugeridas com justificativa
- Venues recomendados (nomes fictícios realistas)
- Datas sugeridas com espaçamento adequado
- Estimativa de cachê por data
- Logística de transporte entre cidades
- Dicas específicas para cada praça
Escreva em português brasileiro. Use valores em R$.`,
};

export const VALID_TYPES = new Set(Object.keys(SYSTEM_PROMPTS));

export function generateFallback(type: string, context: Record<string, unknown>): string {
  const now = new Date().toLocaleDateString('pt-BR');

  switch (type) {
    case 'press_release':
      return `PRESS RELEASE
Data: ${now}

${sanitize(context.artistName, 200) || 'Artista'} anuncia ${sanitize(context.topic, 200) || 'novo lançamento'}

[Cidade, Estado] - ${sanitize(context.artistName, 200) || 'O artista'} acaba de anunciar ${sanitize(context.topic, 200) || 'um novo projeto'}.

O projeto marca uma nova fase na carreira, trazendo sonoridades inovadoras e colaborações inéditas.

"Estou muito empolgado(a) com esse novo momento. É um trabalho que representa muito do que eu acredito musicalmente", afirma ${sanitize(context.artistName, 200) || 'o artista'}.

Para mais informações:
Assessoria de Imprensa: [Nome]
Email: [email@exemplo.com]
Telefone: [+55 11 99999-9999]

---
Configure sua chave ANTHROPIC_API_KEY para gerar conteúdo personalizado com IA.`;

    case 'social_post':
      return `[Post para ${sanitize(context.platform, 50) || 'Instagram'}]

${sanitize(context.theme, 200) || 'Novidades vindo aí!'}

Fiquem ligados que tem muita coisa boa chegando!

#Música #NovoProjeto #Arte #Brasil

---
Configure sua chave ANTHROPIC_API_KEY para gerar conteúdo personalizado com IA.`;

    case 'setlist':
      return `SETLIST - ${sanitize(context.eventType, 100) || 'Show'}
Duração: ${Math.min(Math.max(Number(context.duration) || 60, 15), 360)} minutos

1. [Abertura / Intro] - 3 min
2. [Música Energética] - 4 min
3. [Hit Principal] - 4 min
4. [Música Nova] - 4 min
5. [Momento Acústico] - 5 min
6. [Música Animada] - 4 min
7. [Participação Especial] - 5 min
8. [Bloco de Hits] - 12 min
9. [Música Emotiva] - 5 min
10. [Encerramento / Bis] - 5 min

Notas: Adicione suas músicas aos slots acima.

---
Configure sua chave ANTHROPIC_API_KEY para gerar setlists personalizados com IA.`;

    case 'tour_plan':
      return `PLANO DE TURNÊ - ${sanitize(context.region, 200) || 'Brasil'}
${Math.min(Math.max(Number(context.numDates) || 5, 1), 30)} datas sugeridas

Data 1: [Cidade Principal] - Venue Grande - R$ 5.000
Data 2: [Cidade Secundária] - Bar/Casa de Shows - R$ 2.500
Data 3: [Capital Regional] - Teatro - R$ 3.500
Data 4: [Cidade Universitária] - Pub/Festival - R$ 2.000
Data 5: [Cidade Turística] - Venue Médio - R$ 3.000

Total Estimado: R$ 16.000

Logística:
- Transporte entre cidades: van ou carro
- Hospedagem: 2 diárias estimadas por data
- Alimentação: rider hospitality

---
Configure sua chave ANTHROPIC_API_KEY para gerar planos de turnê detalhados com IA.`;

    default:
      return `Conteúdo gerado em ${now}.

Configure sua chave ANTHROPIC_API_KEY nas variáveis de ambiente para ativar a geração de conteúdo com IA.`;
  }
}
