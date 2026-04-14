import type {
  SpotifyArtistData,
  SurveyResponse,
  DimensionScores,
  Stage,
  DiagnosticText,
  ActionPlanItem,
} from '@/lib/types/career';

const SYSTEM_PROMPT = `Voce e um especialista em carreira de musicos independentes brasileiros e latinos, com 15 anos de experiencia em A&R, management e desenvolvimento de artistas. Sua missao e analisar os dados fornecidos e entregar um diagnostico honesto e personalizado, seguido de um plano de acao concreto e realista para o artista avancar na sua carreira.

Voce fala em portugues brasileiro claro e direto, sem jargao corporativo vazio. Seus diagnosticos sao especificos aos dados — NUNCA genericos. Seus planos de acao sao acionaveis em 90 dias.

IMPORTANTE: Sua resposta deve ser APENAS um JSON valido seguindo exatamente a estrutura pedida. Nao adicione texto antes ou depois do JSON.`;

/**
 * Constroi o prompt para Claude gerar diagnostico + plano.
 */
export function buildDiagnosticPrompt(
  spotify: SpotifyArtistData,
  survey: SurveyResponse,
  stage: Stage,
  stageScore: number,
  dimensions: DimensionScores,
  socialUrls: Record<string, string | undefined>
): string {
  const socialList = Object.entries(socialUrls)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || '(nenhuma rede social informada)';

  return `Analise os dados deste artista e gere um diagnostico + plano de 90 dias.

## Dados do Spotify
- Nome: ${spotify.name}
- URL: ${spotify.spotify_url}
- Generos: ${spotify.genres.join(', ') || 'nao categorizado'}
- Followers: ${spotify.followers.toLocaleString('pt-BR')}
- Popularity score (Spotify, 0-100): ${spotify.popularity}
- Monthly listeners: ${spotify.monthly_listeners?.toLocaleString('pt-BR') ?? 'nao disponivel'}
- Top tracks: ${spotify.top_tracks.map((t) => `"${t.name}" (pop ${t.popularity})`).join(', ') || 'nenhuma'}

## Respostas do formulario guiado
- Lancando musica ha: ${survey.years_releasing}
- Shows realizados: ${survey.shows_performed}
- Vive de musica: ${survey.lives_from_music}
- Receita mensal: ${survey.monthly_revenue}
- Management: ${survey.has_management}
- Frequencia de lancamento: ${survey.release_frequency}
- Objetivo 12 meses: ${survey.main_goal_12m}
- Genero primario (informado): ${survey.primary_genre}
- Cidade: ${survey.city}
- Press kit: ${survey.has_press_kit}
- Qualidade de producao: ${survey.production_quality}
- Registro de direitos: ${survey.rights_registration}

## Redes sociais
${socialList}

## Classificacao calculada (pelo motor determinist)
- Estagio: **${stage}**
- Score geral: ${stageScore}/100
- Scores por dimensao:
  - audience_size: ${dimensions.audience_size}
  - growth_trajectory: ${dimensions.growth_trajectory}
  - release_consistency: ${dimensions.release_consistency}
  - professionalism: ${dimensions.professionalism}
  - revenue_business: ${dimensions.revenue_business}
  - multi_platform_presence: ${dimensions.multi_platform_presence}

## Tarefa

Gere a resposta APENAS no formato JSON abaixo:

\`\`\`json
{
  "diagnostic_text": {
    "summary": "Paragrafo de 2-4 frases explicando porque o artista esta neste estagio, baseado nos dados reais",
    "strengths": ["3 a 4 pontos fortes especificos (nao genericos)"],
    "weaknesses": ["3 a 4 pontos de atencao especificos"],
    "opportunities": ["3 a 4 oportunidades concretas no mercado indie BR/LATAM para o estagio atual"],
    "metric_readings": {
      "monthly_listeners": "1 frase contextualizando o numero de listeners comparado com o benchmark do estagio",
      "growth_rate": "1 frase sobre trajetoria de crescimento esperada",
      "release_consistency": "1 frase sobre a consistencia de lancamento",
      "engagement": "1 frase sobre engajamento (followers vs listeners)"
    }
  },
  "action_plan": [
    {
      "title": "Titulo curto da acao",
      "description": "2-3 frases explicando o que fazer, por que, e como",
      "impact_expected": "Impacto estimado (ex: +15% monthly listeners, entrar em X playlists, etc)",
      "deadline_days": 7,
      "priority": 1
    }
  ]
}
\`\`\`

Requisitos do plano:
- 5 a 7 acoes concretas
- deadline_days deve ser 7, 30, 60 ou 90
- priority: 1 (alta) / 2 (media) / 3 (baixa)
- Primeira acao deve ser algo executavel nos proximos 7 dias
- Acoes devem ser adaptadas ao estagio: Inicial foca em fundamentos; Referencia foca em escala
- Objetivos 12 meses do artista (${survey.main_goal_12m}) devem guiar a priorizacao`;
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Parseia a resposta do Claude extraindo o JSON e validando estrutura minima.
 */
export function parseDiagnosticResponse(raw: string): {
  diagnostic_text: DiagnosticText;
  action_plan: ActionPlanItem[];
} {
  // Remove markdown code fence se houver
  let clean = raw.trim();
  const fenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) clean = fenceMatch[1];

  const parsed = JSON.parse(clean) as {
    diagnostic_text: DiagnosticText;
    action_plan: ActionPlanItem[];
  };

  if (!parsed.diagnostic_text || !parsed.action_plan) {
    throw new Error('Invalid diagnostic response: missing diagnostic_text or action_plan');
  }
  if (!Array.isArray(parsed.action_plan)) {
    throw new Error('action_plan must be an array');
  }

  return parsed;
}
